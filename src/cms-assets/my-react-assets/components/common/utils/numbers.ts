import type { CrmValue } from '../types';

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// "4000", "4,000.00", "$4,000.00", 4000 -> 4000; blank/unreadable -> null.
export function toAmount(value: CrmValue): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/[^0-9.-]/g, '');
  if (s === '' || s === '-' || s === '.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// "0.3", "30", "30%" -> 0.3. Values above 1 are read as a percentage.
export function toRate(value: CrmValue): number | null {
  const n = toAmount(value);
  if (n === null || n < 0) return null;
  return n > 1 ? n / 100 : n;
}

// 0.3 -> "30%", 0.1111 -> "11.11%"
export function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}
