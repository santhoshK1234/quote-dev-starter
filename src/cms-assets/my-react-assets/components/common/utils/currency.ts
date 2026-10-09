import { round2 } from './numbers';

export function formatCurrency(value: number, dropZeroCents = false): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  const whole = dropZeroCents && Number.isInteger(round2(n));
  return n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
}

// "$4,000.00"; missing -> "—"
export const money = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : formatCurrency(n);

// "–$4,000.00"; missing -> "—"
export const negativeMoney = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `–${formatCurrency(Math.abs(n))}`;
