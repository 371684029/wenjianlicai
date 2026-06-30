import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

// 平安银行个人存款利率页
const PAGE = 'https://bank.pingan.com/geren/cunkuanlilv/index.shtml';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const TERM_DAYS: Record<string, number> = { 一年: 365, 二年: 730, 三年: 1095, 五年: 1825 };

/**
 * 平安银行 存款挂牌利率（best-effort）。
 * 平安官网利率页为动态渲染（请求易超时/反爬），静态抓取通常拿不到表格；
 * 当前实现尝试静态解析，失败则返回空数组（由 run.ts 回退示例），不阻断整体流程。
 * 后续完善：定位其数据接口或用 Playwright 渲染后解析。
 */
export const pinganAdapter: SourceAdapter = {
  name: '平安银行官网',
  async fetch(): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    try {
      const { data } = await axios.get<string>(PAGE, {
        timeout: 10000,
        headers: { 'User-Agent': UA },
      });
      const $ = cheerio.load(data);
      const cells: string[] = [];
      $('td, th').each((_i, el) => {
        const t = $(el).text().replace(/\u00a0/g, '').trim();
        if (t) cells.push(t);
      });
      const start = cells.findIndex((c) => c.includes('整存整取'));
      const isNum = (s: string) => /^\d+(\.\d+)?$/.test(s);
      if (start >= 0) {
        for (const [term, termDays] of Object.entries(TERM_DAYS)) {
          const ti = cells.indexOf(term, start);
          if (ti < 0) continue;
          const rateStr = cells.slice(ti + 1).find(isNum);
          const rate = rateStr ? Number(rateStr) : NaN;
          if (!Number.isFinite(rate)) continue;
          products.push({
            bank: '平安',
            category: '定期存款',
            name: `平安银行 整存整取 ${term}`,
            code: `PA-DEP-${termDays}`,
            riskLevel: '存款保险',
            yieldType: '存款利率',
            yieldMin: rate,
            yieldMax: rate,
            termDays,
            minAmount: 50,
            startDate: null,
            principalSecured: 1,
            status: '在售',
            reliability: '高',
            dataDate: new Date().toISOString().slice(0, 10),
            sourceName: '平安银行官网',
            sourceUrl: PAGE,
            isSample: 0,
          });
        }
      }
      console.log(`[crawler] 平安银行 解析到 ${products.length} 条（动态页静态抓取通常为 0）`);
    } catch (err) {
      console.warn(`[crawler] 平安银行 抓取失败：${(err as Error).message}`);
    }
    return products;
  },
};
