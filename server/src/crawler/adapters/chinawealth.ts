import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

const BANK_MANAGERS = ['平安理财', '招银理财', '建信理财'] as const;

/**
 * 中国理财网（银行业理财登记托管中心）best-effort 适配器。
 *
 * 该站点无稳定公开 JSON 接口、部分内容动态渲染且有反爬，这里做「尽力而为」抓取：
 * - 拉取公开页面，尝试解析产品条目；
 * - 解析不到时返回空数组（由 run.ts 决定是否回退到示例数据），不抛错阻断整体流程。
 *
 * 后续完善方向：定位真实查询接口或改用 Playwright 渲染，并按管理人筛选上述理财子公司。
 */
export const chinawealthAdapter: SourceAdapter = {
  name: '中国理财网',
  async fetch(): Promise<RawProduct[]> {
    const url = 'https://www.chinawealth.com.cn/';
    const products: RawProduct[] = [];
    try {
      const { data } = await axios.get<string>(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LicaiBot/0.1)' },
      });
      const $ = cheerio.load(data);
      // 占位解析：真实选择器需结合站点结构确定。当前页面无静态产品列表时结果为空。
      $('[data-product], .product-item, .lc-item').each((_i, el) => {
        const name = $(el).find('.name, .product-name').first().text().trim();
        if (!name) return;
        products.push({
          bank: '平安',
          category: '定期理财',
          name,
          code: null,
          riskLevel: 'R2',
          yieldType: '业绩比较基准',
          yieldMin: 0,
          yieldMax: 0,
          termDays: 0,
          minAmount: 0,
          startDate: null,
          principalSecured: 0,
          sourceName: '中国理财网',
          sourceUrl: url,
          isSample: 0,
        });
      });
      void BANK_MANAGERS;
      console.log(`[crawler] 中国理财网 解析到 ${products.length} 条（静态页通常为 0，需逐步完善）`);
    } catch (err) {
      console.warn(`[crawler] 中国理财网 抓取失败：${(err as Error).message}`);
    }
    return products;
  },
};
