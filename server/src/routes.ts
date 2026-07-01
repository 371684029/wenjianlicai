import { Router } from 'express';
import { queryProducts, getProductById, getMeta, getRateMatrix, getCoverage, addManualProducts, type QueryParams, type ManualRow } from './repo.js';
import { BANKS, CATEGORIES, RISK_LEVELS, type Bank, type Category, type RiskLevel } from './types.js';

export const api = Router();

api.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

api.get('/meta', (_req, res) => {
  res.json(getMeta());
});

// 数据覆盖报告：5 家银行 × 4 类产品，哪些格缺失数据，由前端高亮提示用户手动补录
api.get('/coverage', (_req, res) => {
  res.json(getCoverage());
});

// 手工补录批量入库：前端把粘贴文本解析为 ManualRow[] 后 POST 上来
api.post('/manual/import', (req, res) => {
  const body = req.body as { rows?: unknown } | undefined;
  if (!body || !Array.isArray(body.rows)) {
    res.status(400).json({ ok: 0, failed: [], error: 'body.rows 必须是数组' });
    return;
  }
  const result = addManualProducts(body.rows as ManualRow[]);
  res.json(result);
});

// 利率矩阵：定期存款（1/2/3/5年）与大额存单
api.get('/rates', (_req, res) => {
  res.json({
    deposit: getRateMatrix('定期存款'),
    cd: getRateMatrix('大额存单'),
  });
});

// 把查询参数安全转为有限数字，非法返回 null（避免 NaN 进入 SQL 绑定导致异常）
function toFiniteNum(v: unknown): number | null {
  if (typeof v !== 'string' || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseQuery(q: Record<string, unknown>): QueryParams {
  const params: QueryParams = {};
  if (typeof q.bank === 'string' && BANKS.includes(q.bank as Bank)) params.bank = q.bank as Bank;
  if (typeof q.category === 'string' && CATEGORIES.includes(q.category as Category))
    params.category = q.category as Category;
  if (typeof q.riskLevel === 'string' && RISK_LEVELS.includes(q.riskLevel as RiskLevel))
    params.riskLevel = q.riskLevel as RiskLevel;
  if (q.stableOnly === 'true' || q.stableOnly === '1') params.stableOnly = true;
  if (q.availableOnly === 'true' || q.availableOnly === '1') params.availableOnly = true;
  const minTerm = toFiniteNum(q.minTerm);
  if (minTerm !== null) params.minTerm = minTerm;
  const maxTerm = toFiniteNum(q.maxTerm);
  if (maxTerm !== null) params.maxTerm = maxTerm;
  if (q.sort === 'score' || q.sort === 'yield' || q.sort === 'risk' || q.sort === 'term')
    params.sort = q.sort;
  const limit = toFiniteNum(q.limit);
  if (limit !== null && limit > 0) params.limit = limit;
  return params;
}

api.get('/products', (req, res) => {
  const params = parseQuery(req.query as Record<string, unknown>);
  res.json({ items: queryProducts(params) });
});

// 推荐榜单：默认稳健优先（仅 存款保险/R1/R2），按 score 倒序
api.get('/recommend', (req, res) => {
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 10;
  const items = queryProducts({ stableOnly: true, sort: 'score', limit });
  res.json({ items });
});

api.get('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  const product = getProductById(id);
  if (!product) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json(product);
});
