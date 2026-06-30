import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

// 平安银行个人存款挂牌利率页（服务端渲染，利率表为静态 HTML）
const PAGE = 'https://bank.pingan.com/geren/cunkuanlilv/index.shtml';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const TERM_DAYS: Record<string, number> = { 一年: 365, 二年: 730, 三年: 1095, 五年: 1825 };

function extractDate(text: string): string | null {
  // 锚定「自…YYYY年M月D日」（页面如「自2025年5月21日起执行」），人民币行在前，避免误匹配历史日期
  const m = text.match(/自[^，。；\s年]{0,6}(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/**
 * 平安银行 储蓄存款挂牌利率（整存整取 1/2/3/5 年）。
 * 利率页为服务端渲染静态表；期限文字（如一年/二年）之间可能含全角空格，需规整后匹配。
 * 数据来自平安银行官网公开页面，可靠等级「高」。
 */
export const pinganAdapter: SourceAdapter = {
  name: '平安银行官网',
  async fetch(): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    try {
      const { data } = await axios.get<string>(PAGE, {
        timeout: 15000,
        headers: { 'User-Agent': UA },
      });
      const $ = cheerio.load(data);

      // 规整单元格文本：去掉普通与全角空格
      const cells: string[] = [];
      $('td, th').each((_i, el) => {
        const t = $(el).text().replace(/[\s\u3000]/g, '');
        if (t) cells.push(t);
      });

      const dataDate = extractDate($.root().text());

      // 定位「（二）定期存款」整存整取区块（到「零存整取/（三）」为止）
      const start = cells.findIndex((c) => c.includes('定期存款'));
      if (start < 0) {
        console.warn('[crawler] 平安银行 未解析到定期存款区块（页面结构可能变化）');
        return products;
      }
      let end = cells.findIndex((c, i) => i > start && (c.includes('零存整取') || c.includes('（三）')));
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
          startDate: dataDate,
          principalSecured: 1,
          status: '在售',
          reliability: '高',
          dataDate,
          sourceName: '平安银行官网',
          sourceUrl: PAGE,
          isSample: 0,
        });
      }
      console.log(`[crawler] 平安银行 解析到 ${products.length} 条真实挂牌利率（日期 ${dataDate}）`);
    } catch (err) {
      console.warn(`[crawler] 平安银行 抓取失败：${(err as Error).message}`);
    }
    return products;
  },
};
