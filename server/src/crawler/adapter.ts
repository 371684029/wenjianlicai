import type { RawProduct } from '../types.js';

/** 数据源适配器统一接口：每个数据源实现 fetch() 返回标准化产品 */
export interface SourceAdapter {
  /** 数据源名称，用于日志与展示 */
  name: string;
  /** 抓取并返回标准化后的产品列表；失败应抛出异常由调用方处理 */
  fetch(): Promise<RawProduct[]>;
}
