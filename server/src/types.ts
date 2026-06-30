// 领域类型与枚举：字段命名贴合「计划文档」数据模型，避免随意延伸

/** 支持的银行 */
export const BANKS = ['平安', '招商', '建设', '网商', '微众'] as const;
export type Bank = (typeof BANKS)[number];

/** 产品类型 */
export const CATEGORIES = ['活期理财', '定期理财', '定期存款', '大额存单'] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * 风险等级：理财用 R1~R5；存款类用「存款保险」表示受《存款保险条例》保障。
 * 越靠前越稳健。
 */
export const RISK_LEVELS = ['存款保险', 'R1', 'R2', 'R3', 'R4', 'R5'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** 收益口径 */
export const YIELD_TYPES = ['业绩比较基准', '7日年化', '存款利率'] as const;
export type YieldType = (typeof YIELD_TYPES)[number];

/** 在售状态：仅「在售」可当前购买，其余视为不可买 */
export const STATUSES = ['在售', '售罄', '已下架', '待售'] as const;
export type Status = (typeof STATUSES)[number];

/**
 * 数据可靠等级（按来源可信度）：
 * 高=官方权威源（中国理财网/银行官网）；中=第三方聚合；低=示例/参考数据。
 */
export const RELIABILITY_LEVELS = ['高', '中', '低'] as const;
export type Reliability = (typeof RELIABILITY_LEVELS)[number];

/** 某状态是否可当前购买 */
export function isAvailable(status: Status): boolean {
  return status === '在售';
}

/** 入库后的产品记录 */
export interface Product {
  id: number;
  bank: Bank;
  category: Category;
  name: string;
  code: string | null;
  riskLevel: RiskLevel;
  yieldType: YieldType;
  yieldMin: number;
  yieldMax: number;
  termDays: number; // 活期记 0
  minAmount: number;
  startDate: string | null;
  principalSecured: 0 | 1;
  status: Status; // 在售状态
  reliability: Reliability; // 数据可靠等级
  dataDate: string | null; // 数据有效/采集日期（YYYY-MM-DD）
  sourceName: string;
  sourceUrl: string | null;
  isSample: 0 | 1; // 是否示例/参考数据
  updatedAt: string; // 入库/最近更新时间（ISO）
}

/** 爬虫适配器统一产出的原始产品（未入库，无 id/updatedAt） */
export type RawProduct = Omit<Product, 'id' | 'updatedAt'>;
