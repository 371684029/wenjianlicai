import axios from 'axios';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

const PAGE = 'https://www.webank.com/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * 微众银行 存款利率（best-effort）。
 * 微众银行为互联网银行，官网是 SPA、存款产品主要在 App 内，公开页无静态利率表；
 * 当前返回空数组（由 run.ts 回退示例），保留适配器以便后续接入真实数据源。
 * 后续完善：定位其公开数据接口或合规的数据来源。
 */
export const webankAdapter: SourceAdapter = {
  name: '微众银行官网',
  async fetch(): Promise<RawProduct[]> {
    try {
      await axios.get<string>(PAGE, { timeout: 10000, headers: { 'User-Agent': UA } });
      console.log('[crawler] 微众银行 为 SPA，公开页无静态利率，返回 0 条');
    } catch (err) {
      console.warn(`[crawler] 微众银行 抓取失败：${(err as Error).message}`);
    }
    return [];
  },
};
