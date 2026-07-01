import { chromium } from 'playwright';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

/**
 * 招商银行 大额存单 适配器（Playwright）
 *
 * 招商银行 CD 产品列表页（/cfweb/CDeposit/）为 umi SPA，
 * 必须用浏览器渲染后从 DOM 提取产品数据。
 *
 * 页面结构（纯文本提取）：
 *   招商银行个人大额存单2026年第十二期
 *   产品代码：CMBR20260012
 *   利率：1.05%
 *   发售起始日：2026-07-01
 *   发售截止日：2027-01-01
 *   产品到期日：2027-02-01（期限：1）
 *   ...
 *   购买        ← 有「购买」按钮 = 可售，否则 = 已售罄/已截止
 */

const CD_LIST_URL = 'https://www.cmbchina.com/cfweb/CDeposit/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** 解析单个产品文本块 */
function parseBlock(text: string): RawProduct | null {
  // 产品名：招商银行...大额存单...第X期
  const nameMatch = text.match(/^招商银行个人大额存单[^\n]+/m);
  if (!nameMatch) return null;
  const name = nameMatch[0].trim();

  // 产品代码
  const codeMatch = text.match(/产品代码[：:]\s*(CMBR\d+)/);
  if (!codeMatch) return null;
  const code = codeMatch[1];

  // 利率
  const rateMatch = text.match(/利率[：:]\s*(\d+\.?\d*)\s*%/);
  if (!rateMatch) return null;
  const rate = parseFloat(rateMatch[1]);

  // 期限（月数）：从 "产品到期日：2027-02-01（期限：1）" 提取
  const termMatch = text.match(/期限[：:]\s*(\d+)/);
  const termMonths = termMatch ? parseInt(termMatch[1], 10) : 0;
  const termDays = termMonths * 30;

  // 发售起始日
  const startMatch = text.match(/发售起始日[：:]\s*(\d{4}-\d{2}-\d{2})/);

  // 发售截止日
  const endMatch = text.match(/发售截止日[：:]\s*(\d{4}-\d{2}-\d{2})/);

  // 是否可购买：有 "购买" 按钮且非 "查看更多"
  const hasBuy = /^购买\s*$/m.test(text);

  // 仅取可购买的（在售）产品
  if (!hasBuy) return null;

  const today = new Date().toISOString().slice(0, 10);
  const startDate = startMatch?.[1] || null;

  return {
    bank: '招商',
    category: '大额存单',
    name,
    code,
    riskLevel: '存款保险',
    yieldType: '存款利率',
    yieldMin: rate,
    yieldMax: rate,
    termDays,
    minAmount: 200000, // 招商大额存单标准起购 20 万
    startDate,
    principalSecured: 1,
    status: '在售',
    reliability: '高',
    dataDate: today,
    sourceName: '招商银行官网',
    sourceUrl: CD_LIST_URL,
    isSample: 0,
  };
}

export const cmbCDAdapter: SourceAdapter = {
  name: '招商银行 大额存单',

  async fetch(): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    let browser: any;

    try {
      browser = await chromium.launch({ headless: true });
      const ctx = await browser.newContext({
        userAgent: UA,
        extraHTTPHeaders: { 'Accept-Language': 'zh-CN,zh;q=0.9' },
      });
      const page = await ctx.newPage();

      await page.goto(CD_LIST_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000);

      const bodyText = await page.evaluate(() => document.body?.innerText || '');

      // 按产品名分割文本块
      const blocks = bodyText.split(/\n(?=招商银行个人大额存单)/);

      for (const block of blocks) {
        const product = parseBlock(block);
        if (product) {
          products.push(product);
        }
      }

      console.log(
        `[crawler] 招商银行大额存单 从 DOM 解析到 ${products.length} 条在售产品（共 ${blocks.length - 1} 条展示）`,
      );
    } catch (err) {
      console.warn(`[crawler] 招商银行大额存单 抓取失败：${(err as Error).message}`);
    } finally {
      if (browser) await browser.close();
    }

    return products;
  },
};
