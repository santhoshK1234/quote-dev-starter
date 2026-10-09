import { DAY_MS, FULL_MONTHS, MONTHS_SHORT, MONTHS_UPPER } from '../constants/dates';
import type { CrmValue, DateParts } from '../types';
import { pad2 } from './strings';

// ===========================================================================
// Date helpers (all UTC ms, so no timezone drift)
// ===========================================================================

export function toDateParts(time: number): DateParts {
  const d = new Date(time);
  return { day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
}

// HubSpot date -> "dd/mm/yyyy". HubSpot sends deal dates as Australian
// day-first dates with a two- or four-digit year ("1/9/26", "01/09/2026");
// two-digit years are read as 20xx. Also accepts ISO "2026-09-01" and
// epoch ms/seconds (incl. "1788220800000.0" and "1.7882208E12").
export function formatHubspotDate(value: CrmValue): string {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})(?!\d)/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return '';
    return `${pad2(day)}/${pad2(month)}/${year}`;
  }

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;

  if (/^\d+(\.\d+)?(e\+?\d+)?$/i.test(raw)) {
    const n = Number(raw);
    let date: Date | null = null;
    if (n > 1e11) date = new Date(n);
    else if (n > 1e8) date = new Date(n * 1000);
    if (!date || Number.isNaN(date.getTime())) return '';
    return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
  }

  return ''; // unknown format: show nothing rather than a wrong date
}

// Strict: "15/09/2026" or "2026-09-15" -> UTC ms; else null.
export function toDayMs(value: unknown): number | null {
  const s = String(value ?? '').trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  return null;
}

// Lenient: any date value the deal or the schedule can hold -> UTC ms; else null.
export function parseDate(value: CrmValue): number | null {
  return toDayMs(formatHubspotDate(value));
}

export function formatDmy(t: number): string {
  const p = toDateParts(t);
  return `${pad2(p.day)}/${pad2(p.month)}/${p.year}`;
}

// "1 Feb"
export function dayMonth(t: number): string {
  const p = toDateParts(t);
  return `${p.day} ${MONTHS_SHORT[p.month - 1]}`;
}

// "15 Mar 2027"
export function dayMonthYear(t: number): string {
  return `${dayMonth(t)} ${toDateParts(t).year}`;
}

// "Feb – Mar 2027", "Oct 2026 – Jan 2027", "Mar 2027"
export function monthRangeLabel(from: number | null, to: number | null): string {
  const a0 = from ?? to;
  const b0 = to ?? from;
  if (a0 === null || b0 === null) return '';
  const a = toDateParts(a0);
  const b = toDateParts(b0);
  const ma = MONTHS_SHORT[a.month - 1];
  const mb = MONTHS_SHORT[b.month - 1];
  if (a.year !== b.year) return `${ma} ${a.year} – ${mb} ${b.year}`;
  if (a.month !== b.month) return `${ma} – ${mb} ${b.year}`;
  return `${ma} ${b.year}`;
}

// "SEP-2026"
export function flightMonthLabel(t: number): string {
  const p = toDateParts(t);
  return `${MONTHS_UPPER[p.month - 1]}-${p.year}`;
}

// "SEP-2026 – NOV-2026"; a single month if both dates fall in the same month.
export function flightingLabel(start: number | null, end: number | null): string {
  const a = start !== null ? flightMonthLabel(start) : '';
  const b = end !== null ? flightMonthLabel(end) : '';
  if (a && b && a !== b) return `${a} – ${b}`;
  return a || b;
}

// "2026-09"
export function monthKey(t: number): string {
  const p = toDateParts(t);
  return `${p.year}-${pad2(p.month)}`;
}

// End of the month containing t, plus daysAfterEom days (0 = billed at EOM).
export function billingDateFor(t: number, daysAfterEom = 0): DateParts {
  const p = toDateParts(t);
  return toDateParts(Date.UTC(p.year, p.month, 0) + daysAfterEom * DAY_MS);
}

export function ordinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Today's date in Queensland time, so a quote generated on a UTC server
// late in the Australian evening still shows the Australian date.
export function todayInBrisbane(): DateParts {
  try {
    const parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Brisbane',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(new Date());
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const day = get('day');
    const month = get('month');
    const year = get('year');
    if (day && month && year) return { day, month, year };
  } catch {
    // Intl timeZone not supported — fall through to local time.
  }
  const now = new Date();
  return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
}

// "9th October 2026"
export function longDateLabel(p: DateParts): string {
  return `${p.day}${ordinalSuffix(p.day)} ${FULL_MONTHS[p.month - 1]} ${p.year}`;
}

// "22nd MAY 2027"; no date -> non-breaking space
export function billingDateLabel(p: DateParts | null): string {
  if (!p) return ' ';
  return `${p.day}${ordinalSuffix(p.day)} ${FULL_MONTHS[p.month - 1].toUpperCase()} ${p.year}`;
}
