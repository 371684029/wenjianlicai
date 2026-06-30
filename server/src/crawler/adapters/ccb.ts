import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

// 建设银行城乡居民存款挂牌利率：fund.ccb.com 页面用日期下拉，各日期对应一篇 article 利率页
// 注意：HTTPS 子域在部分网络不可达，这里用 HTTP；利率页为静态 HTML 表格
const INDEX = 'http://fund.ccb.com/chn/personal/interestv3/rmbdeposit.shtml';
const ORIGIN = 'http://fund.ccb.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const TERM_DAYS: Record<string, number> = { 一年: 365, 二年: 730, 三年: 1095, 五年: 1825 };

function parseRateTable(html: string, dataDate: string | null): RawProduct[] {
  const $ = cheerio.load(html);
  const cells: string[] = [];
  $('td, th').each((_i, el) => {
    const t = $(el).text().replace(/[\s\u3000]/g, '');
    if (t) cells.push(t);
  });
  const start = cells.findIndex((c) => c.includes('整存整取'));
  if (start < 0) return [];
  let end = cells.findIndex((c, i) => i > start && (c.includes('零存整取') || c.includes('（二）')));
  if (end < 0) end = cells.length;
  const block = cells.slice(start, end);
  const isNum = (s: string) => /^\d+(\.\d+)?$/.test(s);

  const out: RawProduct[] = [];
  for (const [term, termDays] of Object.entries(TERM_DAYS)) {
    const ti = block.indexOf(term);
    if (ti < 0) continue;
    const rateStr = block.slice(ti + 1).find(isNum);
    const rate = rateStr ? Number(rateStr) : NaN;
    if (!Number.isFinite(rate)) continue;
    out.push({
      bank: '建设',
      category: '定期存款',
      name: `建设银行 整存整取 ${term}`,
      code: `CCB-DEP-${termDays}`,
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
      sourceName: '建设银行官网',
      sourceUrl: INDEX,
      isSample: 0,
    });
  }
  return out;
}

/**
 * 建设银行 城乡居民存款挂牌利率（整存整取 1/2/3/5 年）。
 * 流程：抓 fund.ccb 利率页 → 取「当前生效日期」对应的利率 article 链接 → 抓该静态表格解析。
 */
export const ccbAdapter: SourceAdapter = {
  name: '建设银行官网',
  async fetch(): Promise<RawProduct[]> {
    try {
      const { data: indexHtml } = await axios.get<string>(INDEX, {
        timeout: 15000,
        headers: { 'User-Agent': UA },
      });

      // 日期下拉项形如 <li name="/chn/2025-05/19/article_xxx.shtml">2025-05-20</li>
      const m = indexHtml.match(/<li\s+name="(\/chn\/[^"]*article_\d+\.shtml)"[^>]*>\s*(\d{4}-\d{2}-\d{2})/);
      if (!m) {
        console.warn('[crawler] 建设银行 未找到利率日期链接');
        return [];
      }
      const articleUrl = ORIGIN + m[1];
      const dataDate = m[2];

      const { data: articleHtml } = await axios.get<string>(articleUrl, {
        timeout: 15000,
        headers: { 'User-Agent': UA, Referer: INDEX },
      });
      const products = parseRateTable(articleHtml, dataDate);
      console.log(`[crawler] 建设银行 解析到 ${products.length} 条真实挂牌利率（日期 ${dataDate}）`);
      return products;
    } catch (err) {
      console.warn(`[crawler] 建设银行 抓取失败：${(err as Error).message}`);
      return [];
    }
  },
};
