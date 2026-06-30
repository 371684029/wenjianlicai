import axios from 'axios';

const http = axios.create({ baseURL: '/api', timeout: 15000 });

export interface Product {
  id: number;
  bank: string;
  category: string;
  name: string;
  code: string | null;
  riskLevel: string;
  yieldType: string;
  yieldMin: number;
  yieldMax: number;
  termDays: number;
  minAmount: number;
  startDate: string | null;
  principalSecured: 0 | 1;
  sourceName: string;
  sourceUrl: string | null;
  isSample: 0 | 1;
  updatedAt: string;
  score: number;
}

export interface Meta {
  banks: string[];
  categories: string[];
  riskLevels: string[];
  total: number;
  sampleCount: number;
  lastUpdated: string | null;
}

export interface ProductQuery {
  bank?: string;
  category?: string;
  riskLevel?: string;
  stableOnly?: boolean;
  sort?: 'score' | 'yield' | 'risk' | 'term';
  limit?: number;
}

export async function fetchMeta(): Promise<Meta> {
  const { data } = await http.get<Meta>('/meta');
  return data;
}

export async function fetchProducts(params: ProductQuery): Promise<Product[]> {
  const { data } = await http.get<{ items: Product[] }>('/products', { params });
  return data.items;
}

export async function fetchRecommend(limit = 10): Promise<Product[]> {
  const { data } = await http.get<{ items: Product[] }>('/recommend', { params: { limit } });
  return data.items;
}

export interface RateCell {
  yieldMin: number;
  yieldMax: number;
}

export interface RateRow {
  bank: string;
  rates: Record<number, RateCell>;
  isSample: 0 | 1;
  sourceName: string;
}

export interface RateMatrix {
  terms: number[];
  rows: RateRow[];
  updatedAt: string | null;
}

export interface RatesResponse {
  deposit: RateMatrix;
  cd: RateMatrix;
}

export async function fetchRates(): Promise<RatesResponse> {
  const { data } = await http.get<RatesResponse>('/rates');
  return data;
}
