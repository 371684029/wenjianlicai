import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

/**
 * 建设银行 大额存单 硬编码适配器
 *
 * 建设银行不公开发布大额存单当前利率页面，仅在手机银行 App 内查询。
 * 本适配器以公开可查的挂牌参考利率填充，可靠等级标为「中」。
 * 数据来源：银行网点公告 / 财经媒体公开报道 / 中国货币网已发行存单汇总。
 *
 * 更新时间：2026-07-01
 */

const SOURCE_URL = 'https://www.ccb.com/cn/personal/deposit/noticedeposit.html';

/** 建设银行大额存单公开参考利率（2025-2026 最新一期） */
const CD_PRODUCTS: RawProduct[] = [
  { bank: '建设', category: '大额存单', name: '建设银行 大额存单 1个月',  code: 'CCB-CD-30',   riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.15, yieldMax: 1.15, termDays: 30,   minAmount: 200000, startDate: '2025-12-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-12-01', sourceName: '建设银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '建设', category: '大额存单', name: '建设银行 大额存单 3个月',  code: 'CCB-CD-90',   riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.15, yieldMax: 1.15, termDays: 90,   minAmount: 200000, startDate: '2025-12-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-12-01', sourceName: '建设银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '建设', category: '大额存单', name: '建设银行 大额存单 6个月',  code: 'CCB-CD-180',  riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.35, yieldMax: 1.35, termDays: 180,  minAmount: 200000, startDate: '2025-12-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-12-01', sourceName: '建设银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '建设', category: '大额存单', name: '建设银行 大额存单 1年',    code: 'CCB-CD-365',  riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.45, yieldMax: 1.45, termDays: 365,  minAmount: 200000, startDate: '2025-12-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-12-01', sourceName: '建设银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '建设', category: '大额存单', name: '建设银行 大额存单 2年',    code: 'CCB-CD-730',  riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.45, yieldMax: 1.45, termDays: 730,  minAmount: 200000, startDate: '2025-12-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-12-01', sourceName: '建设银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
  { bank: '建设', category: '大额存单', name: '建设银行 大额存单 3年',    code: 'CCB-CD-1095', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.90, yieldMax: 1.90, termDays: 1095, minAmount: 200000, startDate: '2025-12-01', principalSecured: 1, status: '在售', reliability: '中', dataDate: '2025-12-01', sourceName: '建设银行(公开参考)', sourceUrl: SOURCE_URL, isSample: 0 },
];

export const ccbCDManualAdapter: SourceAdapter = {
  name: '建设银行 大额存单(参考)',
  async fetch(): Promise<RawProduct[]> {
    console.log(`[crawler] 建设银行大额存单 使用公开参考利率 ${CD_PRODUCTS.length} 条`);
    return CD_PRODUCTS;
  },
};
