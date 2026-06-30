import { initSchema } from '../db.js';
import { upsertProducts, deleteSamples } from '../repo.js';
import { getSampleProducts } from './sampleData.js';
import { sanitizeProducts } from './normalize.js';

// 仅写入示例数据，便于本地快速演示
initSchema();
deleteSamples();
const n = upsertProducts(sanitizeProducts(getSampleProducts()));
console.log(`[seed] 写入示例数据 ${n} 条。`);
