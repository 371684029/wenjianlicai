import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

// 网商银行人民币储蓄存款利率表（公开页，静态 HTML，表头为期限、另一行为利率，需对齐）
const PAGE = 'https://render.mybank.cn/p/c/186k3uyyqpeo';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// 网商表用「两年」（非「二年」）；该页无五年与生效日期
const TERM_DAYS: Record<string, number> = { 一年: 365, 两年: 730, 三年: 1095 };

/**
 * 网商银行 储蓄存款挂牌利率（整存整取 1/2/3 年）。
 * 注意：该公开页未标注生效日期，且互联网银行实时利率以 App 为准，公开页可能滞后；
 * 数据按真实解析入库（可靠「高」、数据日期留空），推荐排序由打分的新鲜度因子兜底。
 */
export const mybankAdapter: SourceAdapter = {
  name: '网商银行官网',
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

      // 表头「存期」后是各期限，「年利率(%)」后是对应利率，按下标对齐
      const termIdx = cells.findIndex((c) => c === '存期');
      const rateIdx = cells.findIndex((c, i) => i > termIdx && c.startsWith('年利率'));
      if (termIdx < 0 || rateIdx < 0) {
        console.warn('[crawler] 网商银行 未解析到利率表结构');
        return products;
      }
      const terms = cells.slice(termIdx + 1, rateIdx);
      const rates = cells.slice(rateIdx + 1, rateIdx + 1 + terms.length);

      for (const [term, termDays] of Object.entries(TERM_DAYS)) {
        const i = terms.indexOf(term);
        if (i < 0) continue;
        const rate = Number(rates[i]);
        if (!Number.isFinite(rate)) continue;
        products.push({
          bank: '网商',
          category: '定期存款',
          name: `网商银行 整存整取 ${term}`,
          code: `MYB-DEP-${termDays}`,
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
          dataDate: null,
          sourceName: '网商银行官网',
          sourceUrl: PAGE,
          isSample: 0,
        });
      }
      console.log(`[crawler] 网商银行 解析到 ${products.length} 条真实挂牌利率（公开页无日期）`);
    } catch (err) {
      console.warn(`[crawler] 网商银行 抓取失败：${(err as Error).message}`);
    }
    return products;
  },
};
