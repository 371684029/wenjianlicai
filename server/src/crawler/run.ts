import { initSchema } from '../db.js';
import { upsertProducts, deleteSamples } from '../repo.js';
import type { SourceAdapter } from './adapter.js';
import { chinawealthAdapter } from './adapters/chinawealth.js';
import { getSampleProducts } from './sampleData.js';
import { sanitizeProducts } from './normalize.js';

const ADAPTERS: SourceAdapter[] = [chinawealthAdapter];

/**
 * 抓取主流程：依次运行各真实适配器；若真实数据为空（受反爬/动态渲染限制），
 * 回退写入「示例数据」以保证平台端到端可用。示例数据在界面明确标注。
 */
async function main(): Promise<void> {
  initSchema();
  let realCount = 0;

  for (const adapter of ADAPTERS) {
    try {
      const fetched = await adapter.fetch();
      const items = sanitizeProducts(Array.isArray(fetched) ? fetched : []);
      if (items.length > 0) {
        const n = upsertProducts(items);
        realCount += n;
        console.log(`[crawler] ${adapter.name}: 入库 ${n} 条真实数据`);
      } else {
        console.log(`[crawler] ${adapter.name}: 无有效数据`);
      }
    } catch (err) {
      // 单个数据源异常不影响整体流程
      console.warn(`[crawler] ${adapter.name} 异常：${(err as Error).message}`);
    }
  }

  if (realCount === 0) {
    try {
      deleteSamples(); // 清除旧示例，避免残留
      const samples = sanitizeProducts(getSampleProducts());
      const n = upsertProducts(samples);
      console.log(`[crawler] 真实数据为空，回退写入示例数据 ${n} 条（界面标注「示例」）`);
    } catch (err) {
      console.warn(`[crawler] 写入示例数据失败：${(err as Error).message}`);
    }
  }

  console.log('[crawler] 完成。');
}

main().catch((err) => {
  console.error('[crawler] 运行失败：', err);
  process.exit(1);
});
