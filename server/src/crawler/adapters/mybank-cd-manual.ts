import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

/**
 * 网商银行 大额存单 硬编码适配器
 * 网商银行 CD 仅限 App 内购买，无公开利率页面。可靠等级「低」。
 */

const CD_PRODUCTS: RawProduct[] = [
  { bank: '网商', category: '大额存单', name: '网商银行 大额存单 3年', code: 'MYB-CD-1095', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 2.35, yieldMax: 2.35, termDays: 1095, minAmount: 200000, startDate: '2025-06-01', principalSecured: 1, status: '在售', reliability: '低', dataDate: '2025-06-01', sourceName: '网商银行(公开参考)', sourceUrl: 'https://render.mybank.cn/', isSample: 0 },
];

export const mybankCDManualAdapter: SourceAdapter = {
  name: '网商银行 大额存单(参考)',
  async fetch(): Promise<RawProduct[]> { return CD_PRODUCTS; },
};
