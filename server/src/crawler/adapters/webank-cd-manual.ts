import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

/**
 * 微众银行 大额存单 硬编码适配器
 * 微众银行 CD（大额存单+）仅限 App 内预约抢购，无公开网页。可靠等级「低」。
 */

const CD_PRODUCTS: RawProduct[] = [
  { bank: '微众', category: '大额存单', name: '微众银行 大额存单+ C款 3年', code: 'WB-CD-1095-C', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 3.00, yieldMax: 3.00, termDays: 1095, minAmount: 200000, startDate: '2024-12-01', principalSecured: 1, status: '在售', reliability: '低', dataDate: '2024-12-01', sourceName: '微众银行(公开参考)', sourceUrl: 'https://www.webank.com/', isSample: 0 },
  { bank: '微众', category: '大额存单', name: '微众银行 大额存单+ D款 5年', code: 'WB-CD-1825-D', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 2.10, yieldMax: 2.10, termDays: 1825, minAmount: 200000, startDate: '2024-12-01', principalSecured: 1, status: '在售', reliability: '低', dataDate: '2024-12-01', sourceName: '微众银行(公开参考)', sourceUrl: 'https://www.webank.com/', isSample: 0 },
];

export const webankCDManualAdapter: SourceAdapter = {
  name: '微众银行 大额存单(参考)',
  async fetch(): Promise<RawProduct[]> { return CD_PRODUCTS; },
};
