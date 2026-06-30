import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

// 建设银行个人存款挂牌利率页（利率表在 iframe#detail__ 指向的数据文件中，为静态 HTML 表格）
const PAGE = 'http://www.ccb.com/cn/personal/interestv3/rmbdeposit.html';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const TERM_DAYS: Record<string, number> = {
  一年: 365,
  二年: 730,
  三年: 1095,
  五年: 1825,
};

function parseDateFromUrl(url: string): string | null {
  const m = url.match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * 建设银行 城乡居民存款挂牌利率（整存整取 1/2/3/5 年）。
 * 流程：抓利率页 → 取 iframe#detail__ 的数据文件地址 → 抓该静态表格 → 解析整存整取区块。
 * 数据来自建行官网公开页面，可靠等级「高」；数据日期以页面文件为准（如实标注）。
 */
export const ccbAdapter: SourceAdapter = {
  name: '建设银行官网',
  async fetch(): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    try {
      const { data: pageHtml } = await axios.get<string>(PAGE, {
        timeout: 15000,
        headers: { 'User-Agent': UA },
      });
      const src = cheerio.load(pageHtml)('#detail__').attr('src');
      if (!src) {
        console.warn('[crawler] 建设银行 未找到利率数据 iframe');
        return products;
      }
      const dataUrl = new URL(src, PAGE).href;
      const dataDate = parseDateFromUrl(dataUrl);

      const { data: dataHtml } = await axios.get<string>(dataUrl, {
        timeout: 15000,
        headers: { 'User-Agent': UA, Referer: PAGE },
      });
      const $ = cheerio.load(dataHtml);

      // 收集表格单元格文本（去除 &nbsp; 与空白）
      const cells: string[] = [];
      $('td, th').each((_i, el) => {
        const t = $(el).text().replace(/\u00a0/g, '').trim();
        if (t) cells.push(t);
      });

      // 定位「整存整取」区块（到「（二）」为止），避免取到零存整取等同名期限
      const start = cells.findIndex((c) => c.includes('整存整取'));
      if (start < 0) {
        console.warn('[crawler] 建设银行 未解析到整存整取区块');
        return products;
      }
      let end = cells.findIndex((c, i) => i > start && c.includes('（二）'));
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
          bank: '建设',
          category: '定期存款',
          name: `建设银行 整存整取 ${term}`,
          code: `CCB-DEP-${termDays}`, // 与示例同 code，自动去重合并
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
          sourceUrl: PAGE,
          isSample: 0,
        });
      }
      console.log(`[crawler] 建设银行 解析到 ${products.length} 条真实挂牌利率（日期 ${dataDate}）`);
    } catch (err) {
      console.warn(`[crawler] 建设银行 抓取失败：${(err as Error).message}`);
    }
    return products;
  },
};
