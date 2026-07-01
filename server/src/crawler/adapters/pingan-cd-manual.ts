import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

/**
 * 平安银行 大额存单 硬编码适配器
 *
 * 平安银行不公开发布现行大额存单利率页面，仅在口袋银行 App 内查询。
 * 本适配器以公开可查的挂牌参考利率填充，可靠等级标为「中」。
 * 数据来源：银行网点公告 / 财经媒体公开报道。
 *
 * 更新时间：2026-07-01
 */

const SOURCE_URL = 'https://bank.pingan.com/geren/licaifuwu/gerendaecundan.shtml';

const CD_PRODUCTS: RawProduct[] = [
  { bank: '平安', category: '大额存单', name: '平安银行 大额存单 1个月',  code: 'PA-CD-30',   riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.15, yieldMax: 1.15, termDays: 30,   minAmount: 200000, startDate: '2025-10-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-10-01', sourceName: '平安银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '平安', category: '大额存单', name: '平安银行 大额存单 3个月',  code: 'PA-CD-90',   riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.25, yieldMax: 1.25, termDays: 90,   minAmount: 200000, startDate: '2025-10-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-10-01', sourceName: '平安银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '平安', category: '大额存单', name: '平安银行 大额存单 6个月',  code: 'PA-CD-180',  riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.45, yieldMax: 1.45, termDays: 180,  minAmount: 200000, startDate: '2025-10-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-10-01', sourceName: '平安银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '平安', category: '大额存单', name: '平安银行 大额存单 1年',    code: 'PA-CD-365',  riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.55, yieldMax: 1.55, termDays: 365,  minAmount: 200000, startDate: '2025-10-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-10-01', sourceName: '平安银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '平安', category: '大额存单', name: '平安银行 大额存单 2年',    code: 'PA-CD-730',  riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.55, yieldMax: 1.55, termDays: 730,  minAmount: 200000, startDate: '2025-10-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-10-01', sourceName: '平安银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '平安', category: '大额存单', name: '平安银行 大额存单 3年',    code: 'PA-CD-1095', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 2.10, yieldMax: 2.10, termDays: 1095, minAmount: 200000, startDate: '2025-10-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-10-01', sourceName: '平安银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
];

export const pinganCDManualAdapter: SourceAdapter = {
  name: '平安银行 大额存单(参考)',
  async fetch(): Promise<RawProduct[]> {
    console.log(`[crawler] 平安银行大额存单 使用公开参考利率 ${CD_PRODUCTS.length} 条`);
    return CD_PRODUCTS;
  },
};
