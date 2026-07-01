import { initSchema } from '../db.js';
import { upsertProducts } from '../repo.js';
import type { SourceAdapter } from './adapter.js';
import { chinawealthPlaywrightAdapter } from './adapters/chinawealthPlaywright.js';
import { cmbAdapter } from './adapters/cmb.js';
import { ccbAdapter } from './adapters/ccb.js';
import { ccbWealthAdapter } from './adapters/ccb-wealth.js';
import { ccbCDManualAdapter } from './adapters/ccb-cd-manual.js';
import { cmbCDAdapter } from './adapters/cmb-cd-playwright.js';
import { pinganAdapter } from './adapters/pingan.js';
import { pinganCDManualAdapter } from './adapters/pingan-cd-manual.js';
import { mybankAdapter } from './adapters/mybank.js';
import { mybankCDManualAdapter } from './adapters/mybank-cd-manual.js';
import { webankAdapter } from './adapters/webank.js';
import { webankCDManualAdapter } from './adapters/webank-cd-manual.js';
import { extraWealthManualAdapter } from './adapters/extra-wealth-manual.js';
import { sanitizeProducts } from './normalize.js';
import type { RawProduct } from '../types.js';

// 真实数据源适配器（逐家银行 + 建信理财）。
// 中国理财网(Playwright) 因 captcha 拦截暂时停用，注释保留以便后续恢复。
// 不再回退示例数据——未覆盖到的银行/产品类型由前端 /api/coverage 接口报告，
// 让用户看到「哪些银行缺哪些产品类型」的明确提示，由人工补录。
const ADAPTERS: SourceAdapter[] = [
  cmbAdapter,
  ccbAdapter,
  ccbWealthAdapter,
  ccbCDManualAdapter,
  cmbCDAdapter,
  pinganAdapter,
  pinganCDManualAdapter,
  mybankAdapter,
  mybankCDManualAdapter,
  webankAdapter,
  webankCDManualAdapter,
  extraWealthManualAdapter,
  chinawealthPlaywrightAdapter,
];

/**
 * 抓取主流程：依次运行各真实适配器，只入库真实数据（isSample=0）。
 * 数据只增不减：upsert 按 dedupeKey 去重更新，新数据覆盖旧字段，
 * 未被任何适配器返回的历史数据保留在库（过时数据在后续爬取中会被更新或降低权重）。
 * 缺失覆盖由 /api/coverage 接口暴露给前端。
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
      p.reliability = '中';
      continue;
    }
    const ageDays = (now - new Date(p.dataDate).getTime()) / 86_40_000;
    if (!Number.isFinite(ageDays)) p.reliability = '中';
    else if (ageDays > 730) p.reliability = '低';
    else if (ageDays > 540) p.reliability = '中';
  }

  try {
    // 只增不减：upsert 按 dedupeKey 去重，新数据覆盖，历史数据保留
    const nReal = upsertProducts(realProducts);
    console.log(`[crawler] 入库完成：本轮 ${nReal} 条。缺数据请通过前端 /api/coverage 查看。`);
  } catch (err) {
    console.warn(`[crawler] 入库失败：${(err as Error).message}`);
  }

  console.log('[crawler] 完成。');
}

main().catch((err) => {
  console.error('[crawler] 运行失败：', err);
  process.exit(1);
});
