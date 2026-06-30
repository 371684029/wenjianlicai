import { chromium } from 'playwright';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct, Bank, RiskLevel } from '../../types.js';

/**
 * 中国理财网（chinawealth.com.cn）Playwright 适配器
 *
 * 静态 axios 抓不到（页面是 SPA + 反爬 + 请求 body 加密），但是用真浏览器
 * 跑可以：浏览器自动加密 req body、带 cookie/header 通过，从 /prod/search 接口
 * 拿到明文 JSON。第一次访问 fresh session 通常能成；同一 IP 短期内多次访问会
 * 触发滑块验证码 (verifybox)，跑爬虫不要高频，crontab 自然爬一次即可。
 *
 * 限制：
 * - 只取 page=1 的 20 条（共 832 条，但本项目只关心五大行理财子公司，20 条够用）
 * - 没有 benchmark 或没在中意银行的产品会跳过
 * - 失败（网络/captcha）返回空数组，让 run.ts 回退到示例
 *
 * 字段对照（API 返回字段 -> RawProduct 字段）：
 * - prodName -> name
 * - prodRegCode -> code
 * - orgName -> bank (按关键词映射：含"招银"→招商，含"平安理财"→平安，含"建信"→建设)
 * - prodRiskLevelName -> riskLevel ("一级(低)"→R1, "二级(中低)"→R2, "三级(中)"→R3, ...)
 * - benchmark -> yieldMin=yieldMax （空时跳过）
 * - prodSDate/prodEDate -> termDays 由产品募集结束日-成立日推算，或 0（活期）
 * - prodSDate -> startDate
 * - 实时在售（prodStatus="02" 募集）-> status="在售"
 */

const ORG_NAME_TO_BANK: { keyword: string; bank: Bank }[] = [
  { keyword: '招银理财', bank: '招商' },
  { keyword: '招银', bank: '招商' },
  { keyword: '平安理财', bank: '平安' },
  { keyword: '建信理财', bank: '建设' },
  { keyword: '网商', bank: '网商' },
  { keyword: '微众', bank: '微众' },
];

function mapRisk(name: string): RiskLevel | null {
  if (!name) return null;
  if (name.includes('一级')) return 'R1';
  if (name.includes('二级')) return 'R2';
  if (name.includes('三级')) return 'R3';
  if (name.includes('四级')) return 'R4';
  if (name.includes('五级')) return 'R5';
  return null;
}

function mapBank(orgName: string): Bank | null {
  for (const m of ORG_NAME_TO_BANK) {
    if (orgName.includes(m.keyword)) return m.bank;
  }
  return null;
}

// 把 "1-3年(含)" / "6-12个月(含)" / "3年以上" / "每日" 这种描述天为整数。
// "每日" -> 0 (活期)。其它无法解析时返回 null。
function parseTermDays(termName: string, prodSDate: string, prodEDate: string): number {
  if (!termName) return 0;
  if (termName.includes('每日') || termName.includes('活期') || termName.includes('现金')) return 0;
  // 优先用 prodSDate/prodEDate 算
  if (prodSDate && prodEDate && prodSDate !== '1970-01-01' && prodEDate !== '1970-01-01') {
    const diff = (new Date(prodEDate).getTime() - new Date(prodSDate).getTime()) / 86400000;
    if (diff > 0 && diff < 365 * 30) return Math.round(diff);
  }
  // 再用 termName 区间上界估
  const m = termName.match(/(\d+)\s*-\s*(\d+)\s*(年|个月)/);
  if (m) {
    const hi = parseInt(m[2], 10);
    return m[3] === '年' ? hi * 365 : hi * 30;
  }
  const m2 = termName.match(/(\d+)\s*(年|个月)/);
  if (m2) {
    const v = parseInt(m2[1], 10);
    return m2[2] === '年' ? v * 365 : v * 30;
  }
  if (termName.includes('3年以上')) return 365 * 5;
  return 0;
}

// benchmark 可能是数字 (如 2.3) 也可能是空字符串或文字
function parseBenchmark(b: any): { yieldMin: number; yieldMax: number } | null {
  if (typeof b === 'number' && b > 0) return { yieldMin: b, yieldMax: b };
  if (typeof b === 'string' && b.length > 0) {
    // 例如 "2.0%-3.0%" 或 "2.5%" 或 "年化 2.3%"
    const nums = b.match(/(\d+\.?\d*)/g);
    if (!nums || nums.length === 0) return null;
    const list = nums.map(Number).filter((n) => n > 0 && n < 20);
    if (list.length === 0) return null;
    if (list.length === 1) return { yieldMin: list[0], yieldMax: list[0] };
    return { yieldMin: Math.min(...list), yieldMax: Math.max(...list) };
  }
  return null;
}

async function tryCapture(chinawealthUrl = 'https://www.chinawealth.com.cn/lcweb/management/proScreen'): Promise<any | null> {
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'Accept-Language': 'zh-CN,zh;q=0.9' },
    });
    const page = await ctx.newPage();

    let captured: any = null;
    page.on('response', async (resp) => {
      if (resp.url().includes('/lcw-fe-service/prod/search')) {
        try {
          captured = JSON.parse(await resp.text());
        } catch {
          /* 忽略解析失败 */
        }
      }
    });

    await page.goto(chinawealthUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    return captured;
  } finally {
    await browser.close();
  }
}

export const chinawealthPlaywrightAdapter: SourceAdapter = {
  name: '中国理财网(Playwright)',
  async fetch(): Promise<RawProduct[]> {
    let searchResult: any;
    try {
      searchResult = await tryCapture();
    } catch (err) {
      console.warn(`[crawler] 中国理财网(Playwright) 启动失败：${(err as Error).message}`);
      return [];
    }
    if (!searchResult || !searchResult.data || !Array.isArray(searchResult.data.data)) {
      console.log('[crawler] 中国理财网(Playwright) 未拿到 search JSON（可能被 captcha 限流），返回空');
      return [];
    }

    const items = searchResult.data.data as any[];
    const today = new Date().toISOString().slice(0, 10);
    const out: RawProduct[] = [];

    for (const it of items) {
      const bank = mapBank(it.orgName || '');
      if (!bank) continue;
      const risk = mapRisk(it.prodRiskLevelName || '');
      if (!risk) continue;
      const yieldPair = parseBenchmark(it.benchmark);
      if (!yieldPair) continue; // 没业绩基准的就跳过
      const termDays = parseTermDays(it.prodTermName || '', it.prodSDate, it.prodEDate);
      const category = termDays === 0 ? '活期理财' : '定期理财';
      const yieldType = '业绩比较基准';

      out.push({
        bank,
        category,
        name: (it.prodName || '').trim() || '(未命名)',
        code: (it.prodRegCode || '').trim() || null,
        riskLevel: risk,
        yieldType,
        yieldMin: yieldPair.yieldMin,
        yieldMax: yieldPair.yieldMax,
        termDays,
        minAmount: bank === '网商' || bank === '微众' ? 1 : 10000,
        startDate: it.prodSDate || null,
        principalSecured: 0,
        status: it.prodStatus === '02' ? '在售' : '在售',
        reliability: '高',
        dataDate: today,
        sourceName: '中国理财网',
        sourceUrl: 'https://www.chinawealth.com.cn/lcweb/management/proScreen',
        isSample: 0,
      });
    }

    console.log(`[crawler] 中国理财网(Playwright) 解析 ${items.length} 条,五家理财匹配 ${out.length} 条`);
    return out;
  },
};