import { initSchema } from '../db.js';
import { upsertProducts, deleteSamples, deleteRealData, dedupeKey } from '../repo.js';
import type { SourceAdapter } from './adapter.js';
import { chinawealthAdapter } from './adapters/chinawealth.js';
import { cmbAdapter } from './adapters/cmb.js';
import { ccbAdapter } from './adapters/ccb.js';
import { pinganAdapter } from './adapters/pingan.js';
import { mybankAdapter } from './adapters/mybank.js';
import { webankAdapter } from './adapters/webank.js';
import { getSampleProducts } from './sampleData.js';
import { sanitizeProducts } from './normalize.js';
import type { RawProduct } from '../types.js';

// 真实数据源适配器（逐家银行 + 中国理财网）。已写进脚本，逐家攻克真实接口：
// - 招商/建设：已接入官网真实挂牌利率
// - 平安/网商/微众：best-effort（官网 SPA/反爬，暂回退示例，框架就绪待完善）
const ADAPTERS: SourceAdapter[] = [
  cmbAdapter,
  ccbAdapter,
  pinganAdapter,
  mybankAdapter,
  webankAdapter,
  chinawealthAdapter,
];

/**
 * 抓取主流程：
 * 1. 依次运行各真实适配器，汇总真实数据（单个源异常不影响整体）；
 * 2. 用「示例数据」补齐真实数据未覆盖的产品（按 dedupeKey 去重）——
 *    已有真实数据的产品用真实值，其余用示例值，保证五家银行都有内容且不重复。
 */
async function main(): Promise<void> {
  initSchema();

  const realProducts: RawProduct[] = [];
  for (const adapter of ADAPTERS) {
    try {
      const fetched = await adapter.fetch();
      const items = sanitizeProducts(Array.isArray(fetched) ? fetched : []);
      realProducts.push(...items);
      console.log(`[crawler] ${adapter.name}: 有效 ${items.length} 条`);
    } catch (err) {
      console.warn(`[crawler] ${adapter.name} 异常：${(err as Error).message}`);
    }
  }

  // 按数据时效校准可靠等级：避免把过时挂牌（如官网长期未更新）当作「高」可靠呈现
  const now = Date.now();
  for (const p of realProducts) {
    if (!p.dataDate) {
      p.reliability = '中'; // 无生效日期，时效不可校验
      continue;
    }
    const ageDays = (now - new Date(p.dataDate).getTime()) / 86_400_000;
    if (!Number.isFinite(ageDays)) p.reliability = '中';
    else if (ageDays > 730) p.reliability = '低'; // 超 2 年视为过时
    else if (ageDays > 540) p.reliability = '中';
  }

  const realKeys = new Set(realProducts.map((p) => dedupeKey(p)));
  // 示例数据中，仅保留「真实数据未覆盖」的产品
  const fillSamples = sanitizeProducts(getSampleProducts()).filter((s) => !realKeys.has(dedupeKey(s)));

  try {
    // 全量刷新：清掉上轮的真实与示例数据，避免下架/改版后残留
    deleteRealData();
    deleteSamples();
    const nReal = upsertProducts(realProducts);
    const nSample = upsertProducts(fillSamples);
    console.log(`[crawler] 入库完成：真实 ${nReal} 条 + 示例补齐 ${nSample} 条，合计 ${nReal + nSample} 条。`);
  } catch (err) {
    console.warn(`[crawler] 入库失败：${(err as Error).message}`);
  }

  console.log('[crawler] 完成。');
}

main().catch((err) => {
  console.error('[crawler] 运行失败：', err);
  process.exit(1);
});
