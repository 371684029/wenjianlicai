import axios from 'axios';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

/**
 * 建信理财（wealthccb.com）公募理财产品适配器。
 * 调用官方 POST API（/webqueryapp/product/list）获取产品列表，JSON 格式，
 * 无需 Playwright / cheerio。
 *
 * 产品映射：
 * - 按日开放式（含「按日」「日申」等关键词）→ 活期理财
 * - 封闭式 + 周期型 + 最低持有N天 → 定期理财
 */

const API = 'https://www.wealthccb.com/webqueryapp/product/list';
const PAGE = 'https://www.wealthccb.com/productList.html';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ── API 类型 ──

interface ProductItem {
  fndNm: string;
  ivsmpdEcd: string;
  rsrvFld1: number | null; // 累计年化收益率（十进制，如 0.0281 = 2.81%）
  fndPerfcmprbssAmt: string; // 业绩比较基准
  pertxnNumLwrlmtVal: number; // 起购金额（元）
  csdcFndRskGrdCd: string; // R1~R5
  pdTrm: string | number; // 0=无固定期限, >0=封闭天数
  mopr: string; // 运作方式 0=封闭式 1/2/99=开放式/周期型
  drivDt: string; // 数据日期 YYYY-MM-DD
  exdt: string; // 到期日 YYYY-MM-DD
  indHot: boolean;
}

interface ApiResp {
  success: boolean;
  data: {
    list: ProductItem[];
    total: number;
    pages: number;
    pageNum: number;
  };
}

// ── 辅助函数 ──

/** 从产品名中提取周期/锁定期天数。如 "（30天）" → 30，"最低持有180天" → 180，"按日" → 0 */
function parseNamedDays(name: string): number | null {
  const m = name.match(/[（(](\d+)天[）)]/);
  if (m) return parseInt(m[1], 10);
  const h = name.match(/最低持有(\d+)天/);
  if (h) return parseInt(h[1], 10);
  if (name.includes('按日') || name.includes('日申')) return 0;
  return null;
}

/** 产品是否为每日灵活申赎型 */
function isDailyFlexible(name: string): boolean {
  return name.includes('按日') || name.includes('日申') || name.includes('日赎');
}

/** 提取收益率（百分比）及类型 */
function extractYield(item: ProductItem): { rate: number | null; yieldType: '业绩比较基准' } {
  // 优先累计年化收益率
  if (item.rsrvFld1 != null && item.rsrvFld1 > 0) {
    return { rate: Math.round(item.rsrvFld1 * 100 * 100) / 100, yieldType: '业绩比较基准' };
  }
  // 回退业绩比较基准
  const bench = parseFloat(item.fndPerfcmprbssAmt);
  if (Number.isFinite(bench) && bench > 0) {
    return { rate: Math.round(bench * 100 * 100) / 100, yieldType: '业绩比较基准' };
  }
  return { rate: null, yieldType: '业绩比较基准' };
}

// ── 适配器 ──

export const ccbWealthAdapter: SourceAdapter = {
  name: '建信理财官网',

  async fetch(): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    const seen = new Set<string>();

    try {
      const allItems: ProductItem[] = [];

      // 取前 5 页（每页 100 条），覆盖主要产品类型
      for (let page = 1; page <= 5; page++) {
        const { data } = await axios.post<ApiResp>(
          API,
          {
            page,
            pageSize: 100,
            mopr: '',
            pdTrm: '',
            csdcFndRskGrdCd: '',
            pertxnNumLwrlmtVal: '',
            findIvsDrcCd: '',
            idins: '',
            pdCodeOrName: '',
          },
          {
            timeout: 15000,
            headers: {
              'User-Agent': UA,
              'Content-Type': 'application/json;charset=UTF-8',
              Referer: PAGE,
            },
          },
        );

        if (data?.data?.list?.length) {
          allItems.push(...data.data.list);
        }
        if (data?.data && data.data.pageNum * 100 >= data.data.total) break;
      }

      console.log(`[crawler] 建信理财 API 返回 ${allItems.length} 条产品`);

      for (const item of allItems) {
        const name = item.fndNm?.trim();
        const code = item.ivsmpdEcd?.trim();
        if (!name || !code || seen.has(code)) continue;
        seen.add(code);

        // 跳过已到期产品（exdt < 今天）
        if (item.exdt && item.exdt !== '2999-12-31' && item.exdt !== '2099-12-31') {
          const ex = new Date(item.exdt).getTime();
          if (Number.isFinite(ex) && ex < Date.now()) continue;
        }

        // 收益率提取
        const { rate, yieldType } = extractYield(item);
        if (rate === null) continue; // 无收益数据则跳过

        // 风险等级
        const riskLevel = item.csdcFndRskGrdCd as 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

        // 期限 & 分类
        const rawTerm = parseInt(String(item.pdTrm), 10) || 0;
        let category: '活期理财' | '定期理财';
        let termDays: number;

        if (rawTerm > 0) {
          // 封闭式 → 定期理财
          category = '定期理财';
          termDays = rawTerm;
        } else {
          // 开放式，从名称判断是否为灵活申赎
          const namedDays = parseNamedDays(name);
          if (namedDays === 0 || isDailyFlexible(name)) {
            category = '活期理财';
            termDays = 0;
          } else if (namedDays != null && namedDays > 0) {
            category = '定期理财'; // 有明确锁定期
            termDays = namedDays;
          } else {
            category = '活期理财'; // 名字不带周期 → 默认活期
            termDays = 0;
          }
        }

        // 排除人民币以外的产品（美元等收益率口径不一致）
        if (name.includes('美元') || name.includes('港币')) continue;

        products.push({
          bank: '建设',
          category,
          name,
          code,
          riskLevel,
          yieldType,
          yieldMin: rate,
          yieldMax: rate,
          termDays,
          minAmount: item.pertxnNumLwrlmtVal ?? 1,
          startDate: item.drivDt || null,
          principalSecured: 0, // 理财 ≠ 保本
          status: '在售',
          reliability: '高',
          dataDate: item.drivDt || null,
          sourceName: '建信理财官网',
          sourceUrl: PAGE,
          isSample: 0,
        });
      }

      console.log(
        `[crawler] 建信理财 有效 ${products.length} 条（活期 ${
          products.filter((p) => p.category === '活期理财').length
        } / 定期 ${products.filter((p) => p.category === '定期理财').length}）`,
      );
    } catch (err) {
      console.warn(`[crawler] 建信理财 抓取失败：${(err as Error).message}`);
    }

    return products;
  },
};
