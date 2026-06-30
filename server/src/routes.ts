import { Router } from 'express';
import { queryProducts, getProductById, getMeta, getRateMatrix, type QueryParams } from './repo.js';
import { BANKS, CATEGORIES, RISK_LEVELS, type Bank, type Category, type RiskLevel } from './types.js';

export const api = Router();

api.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

api.get('/meta', (_req, res) => {
  res.json(getMeta());
});

// 利率矩阵：定期存款（1/2/3/5年）与大额存单
api.get('/rates', (_req, res) => {
  res.json({
    deposit: getRateMatrix('定期存款'),
    cd: getRateMatrix('大额存单'),
  });
});

function parseQuery(q: Record<string, unknown>): QueryParams {
  const params: QueryParams = {};
  if (typeof q.bank === 'string' && BANKS.includes(q.bank as Bank)) params.bank = q.bank as Bank;
  if (typeof q.category === 'string' && CATEGORIES.includes(q.category as Category))
    params.category = q.category as Category;
  if (typeof q.riskLevel === 'string' && RISK_LEVELS.includes(q.riskLevel as RiskLevel))
    params.riskLevel = q.riskLevel as RiskLevel;
  if (q.stableOnly === 'true' || q.stableOnly === '1') params.stableOnly = true;
  if (typeof q.minTerm === 'string' && q.minTerm !== '') params.minTerm = Number(q.minTerm);
  if (typeof q.maxTerm === 'string' && q.maxTerm !== '') params.maxTerm = Number(q.maxTerm);
  if (q.sort === 'score' || q.sort === 'yield' || q.sort === 'risk' || q.sort === 'term')
    params.sort = q.sort;
  if (typeof q.limit === 'string' && q.limit !== '') params.limit = Number(q.limit);
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
