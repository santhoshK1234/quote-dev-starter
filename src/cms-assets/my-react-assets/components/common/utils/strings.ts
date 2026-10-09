import type { CrmValue } from '../types';

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// Returns the first value that isn't null/undefined/blank, as a string.
export function firstFilled(...values: CrmValue[]): string {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return '';
}

export function fullName(first: CrmValue, last: CrmValue): string {
  return [first, last].map((v) => firstFilled(v)).filter(Boolean).join(' ');
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

// "a", "a and b", "a, b and c"
export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// "630.0" -> "630", "96096.0" -> "96096"; anything else is left alone.
// The sync script writes whole numbers as floats.
export function cleanNumber(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return /^-?\d+\.0+$/.test(s) ? s.replace(/\.0+$/, '') : s;
}
