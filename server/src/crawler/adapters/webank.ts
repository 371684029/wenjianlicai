import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

// 微众银行人民币存款利率表公告页（静态 HTML，「存款品种 | 执行利率」两列）
const PAGE = 'https://www.webank.com/announcement/announcement-detail05.html';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const TERM_DAYS: Record<string, number> = { 一年: 365, 二年: 730, 三年: 1095 };

function extractDate(text: string): string | null {
  const m = text.match(/生效日期[：:]\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/**
 * 微众银行 个人存款挂牌利率（整存整取 1/2/3 年）。
 * 注意：该官网公告页生效日期较旧（互联网银行实时利率以 App 为准），公开页明显滞后；
 * 按真实解析入库并如实标注数据日期，推荐排序由打分的新鲜度/陈旧降权兜底，避免过时高息误导。
 */
export const webankAdapter: SourceAdapter = {
  name: '微众银行官网',
  async fetch(): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    try {
      const { data } = await axios.get<string>(PAGE, {
        timeout: 12000,
        headers: { 'User-Agent': UA },
      });
      const $ = cheerio.load(data);
      const cells: string[] = [];
      $('td, th').each((_i, el) => {
        const t = $(el).text().replace(/[\s\u3000]/g, '');
        if (t) cells.push(t);
      });

      const dataDate = extractDate($.root().text());

      // 取第一张表（个人存款）的整存整取区块
      const start = cells.findIndex((c) => c.includes('整存整取'));
      if (start < 0) {
        console.warn('[crawler] 微众银行 未解析到整存整取区块');
        return products;
      }
      let end = cells.findIndex((c, i) => i > start && (c.includes('通知存款') || c.includes('协定')));
      if (end < 0) end = cells.length;
      const block = cells.slice(start, end);

      const isNum = (s: string) => /^\d+(\.\d+)?$/.test(s);
      for (const [term, termDays] of Object.entries(TERM_DAYS)) {
        const ti = block.indexOf(term);
        if (ti < 0) continue;
        const rateStr = block.slice(ti + 1).find(isNum);
        const rate = rateStr ? Number(rateStr) : NaN;
        if (!Number.isFinite(rate)) continue;
        products.push({
          bank: '微众',
          category: '定期存款',
          name: `微众银行 整存整取 ${term}`,
          code: `WEB-DEP-${termDays}`,
          riskLevel: '存款保险',
          yieldType: '存款利率',
          yieldMin: rate,
          yieldMax: rate,
          termDays,
          minAmount: 50,
          startDate: dataDate,
          principalSecured: 1,
          status: '在售',
          reliability: '高',
          dataDate,
          sourceName: '微众银行官网',
          sourceUrl: PAGE,
          isSample: 0,
        });
      }
      console.log(`[crawler] 微众银行 解析到 ${products.length} 条真实挂牌利率（日期 ${dataDate}）`);
    } catch (err) {
      console.warn(`[crawler] 微众银行 抓取失败：${(err as Error).message}`);
    }
    return products;
  },
};
