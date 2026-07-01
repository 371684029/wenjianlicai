import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

/**
 * 各银行活期理财/定期理财 公开标杆产品硬编码适配器。
 *
 * 招商（招银理财/朝朝宝）、平安（天天成长）、网商（余利宝）、
 * 微众（活期+）等银行的活期/定期理财产品大多仅在 App 内展示，
 * 无公开网页可爬。本适配器以公开已知的标杆产品填充覆盖率矩阵，
 * 可靠等级标为「中」（非直采，来自公开报道/银行公告）。
 *
 * 更新时间：2026-07-01
 */

const PRODUCTS: RawProduct[] = [
  // ── 平安银行 活期理财 ──
  { bank: '平安', category: '活期理财', name: '平安银行 天天成长C',    code: 'PA-TTC-C',    riskLevel: 'R1', yieldType: '7日年化', yieldMin: 2.05, yieldMax: 2.05, termDays: 0, minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '平安银行(公开参考)', sourceUrl: 'https://bank.pingan.com/', isSample: 0 },
  { bank: '平安', category: '活期理财', name: '平安银行 灵活宝',        code: 'PA-LHB',      riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.90, yieldMax: 1.90, termDays: 0, minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '平安银行(公开参考)', sourceUrl: 'https://bank.pingan.com/', isSample: 0 },

  // ── 招商银行 活期理财 ──
  { bank: '招商', category: '活期理财', name: '招商银行 朝朝宝',        code: 'CMB-ZZB',     riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.85, yieldMax: 1.85, termDays: 0, minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '招商银行(公开参考)', sourceUrl: 'https://www.cmbchina.com/', isSample: 0 },
  { bank: '招商', category: '活期理财', name: '招商银行 日日鑫',        code: 'CMB-RRX',     riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.75, yieldMax: 1.75, termDays: 0, minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '招商银行(公开参考)', sourceUrl: 'https://www.cmbchina.com/', isSample: 0 },

  // ── 招商银行 定期理财（招银理财代表产品） ──
  { bank: '招商', category: '定期理财', name: '招银理财 招睿添鑫 3个月',  code: 'CMB-ZRTX-90',  riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.30, yieldMax: 2.50, termDays: 90,  minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '招银理财(公开参考)', sourceUrl: 'https://www.cmbchina.com/', isSample: 0 },
  { bank: '招商', category: '定期理财', name: '招银理财 招睿添鑫 6个月',  code: 'CMB-ZRTX-180', riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.50, yieldMax: 2.70, termDays: 180, minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '招银理财(公开参考)', sourceUrl: 'https://www.cmbchina.com/', isSample: 0 },
  { bank: '招商', category: '定期理财', name: '招银理财 招睿添鑫 1年',    code: 'CMB-ZRTX-365', riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.70, yieldMax: 2.90, termDays: 365, minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '招银理财(公开参考)', sourceUrl: 'https://www.cmbchina.com/', isSample: 0 },

  // ── 网商银行 活期理财 ──
  { bank: '网商', category: '活期理财', name: '网商银行 余利宝',        code: 'MYB-YLB',     riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.50, yieldMax: 1.50, termDays: 0, minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '网商银行(公开参考)', sourceUrl: 'https://render.mybank.cn/', isSample: 0 },

  // ── 微众银行 活期理财 ──
  { bank: '微众', category: '活期理财', name: '微众银行 活期+',         code: 'WB-HQ+',      riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.80, yieldMax: 1.80, termDays: 0, minAmount: 1, startDate: null, principalSecured: 0, status: '在售', reliability: '中', dataDate: '2026-07-01', sourceName: '微众银行(公开参考)', sourceUrl: 'https://www.webank.com/', isSample: 0 },

  // ── 网商银行 定期理财 ──
  { bank: '网商', category: '定期理财', name: '网商银行 定活宝 3个月',   code: 'MYB-DHB-90',  riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 1.80, yieldMax: 1.80, termDays: 90,  minAmount: 50, startDate: null, principalSecured: 0, status: '在售', reliability: '低', dataDate: '2025-06-01', sourceName: '网商银行(公开参考)', sourceUrl: 'https://render.mybank.cn/', isSample: 0 },

  // ── 微众银行 定期理财 ──
  { bank: '微众', category: '定期理财', name: '微众银行 定期+ 3个月',    code: 'WB-DQ+-90',   riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.00, yieldMax: 2.00, termDays: 90,  minAmount: 50, startDate: null, principalSecured: 0, status: '在售', reliability: '低', dataDate: '2025-06-01', sourceName: '微众银行(公开参考)', sourceUrl: 'https://www.webank.com/', isSample: 0 },
];

export const extraWealthManualAdapter: SourceAdapter = {
  name: '各银行活期/定期理财(参考)',
  async fetch(): Promise<RawProduct[]> {
    console.log(`[crawler] 各银行活期/定期理财 补充公开参考产品 ${PRODUCTS.length} 条`);
    return PRODUCTS;
  },
};
