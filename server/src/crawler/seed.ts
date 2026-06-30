import { initSchema } from '../db.js';
import { upsertProducts } from '../repo.js';
import { getSampleProducts } from './sampleData.js';

// 仅写入示例数据，便于本地快速演示
initSchema();
const n = upsertProducts(getSampleProducts());
console.log(`[seed] 写入示例数据 ${n} 条。`);
