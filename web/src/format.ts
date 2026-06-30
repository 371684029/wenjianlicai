import type { Product } from './api';

export function formatYield(p: Product): string {
  const min = p.yieldMin.toFixed(2);
  const max = p.yieldMax.toFixed(2);
  return min === max ? `${min}%` : `${min}%~${max}%`;
}

export function formatTerm(termDays: number): string {
  if (termDays <= 0) return '活期';
  if (termDays % 365 === 0) return `${termDays / 365} 年`;
  if (termDays % 30 === 0) return `${termDays / 30} 个月`;
  return `${termDays} 天`;
}

export function formatAmount(amount: number): string {
  if (amount >= 10000) return `${amount / 10000} 万元起`;
  return `${amount} 元起`;
}

const RISK_TAG: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  存款保险: 'success',
  R1: 'success',
  R2: '',
  R3: 'warning',
  R4: 'danger',
  R5: 'danger',
};

export function riskTagType(risk: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  return RISK_TAG[risk] ?? 'info';
}
