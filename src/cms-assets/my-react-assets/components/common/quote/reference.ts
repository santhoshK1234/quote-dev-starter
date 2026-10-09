import type { CrmValue } from '../types';
import { firstFilled } from '../utils/strings';

// Reference ID: incrementing number from the deal, zero-padded to 7 digits.
//   1 -> "AOS-0000001", "42" -> "AOS-0000042", "AOS-0000042" -> as-is.
export function formatReferenceId(value: CrmValue): string {
  const raw = firstFilled(value);
  if (!raw) return '';
  if (/^AOS-\d+$/i.test(raw)) return raw.toUpperCase();
  const digits = raw.replace(/\.0+$/, '').replace(/\D/g, '');
  return digits ? `AOS-${digits.padStart(7, '0')}` : '';
}
