import React from 'react';

import { fields } from "./fields";

// Styles live in a shared .css file; `?raw` imports it as a string so it can
// still be injected via <style> (SSR + quote PDF render, no Tailwind here).
// Same stylesheet as the agency templates so all quotes share one look.
import MODULE_CSS from '../../styles/aosco-quote-agency45.css?raw';

export { fields };

// ===========================================================================
// Data shapes
// ===========================================================================

export interface AdvertiserDetails {
  greetingName: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface AccountDetails {
  accountsName: string;
  accountsProcess: string;
  accountsEmail: string;
}

export interface CampaignBooking {
  campaignName: string;
  referenceId: string;
  siteSizeType: string;
  type: string;
  weeksRequired: number;
  startDate: string;
  endDate: string;
}

// One row of quote_master_data.ad_schedules (sync script's short keys)
export interface ScheduleRow {
  n: string; // site name
  bonus?: boolean | string | null;
  sot?: string | number | null;
  mpw?: string | number | null;
  ot?: string | null;
  ct?: string | null;
  iph?: string | number | null;
  dwell?: string | null;
  dim?: string | null; // "4x6"
  siteId?: string | null;
  fid?: string | null; // face ID -> site code
  st?: string | null; // state (optional)
  nif?: string | number | null;
  r7?: string | number | null;
  r28?: string | number | null;
  ws: string[]; // week-start dates "dd/mm/yyyy"
  totalWeeks?: number;
}

export interface ScheduleMeta {
  locality: string; // cover subtitle, e.g. "Brisbane Digital"
  state: string; // default state for the placements table
  bonusNote: string;
}

export interface ExecutionParty {
  representativeName: string;
  position: string;
  date: string;
}

export interface Execution {
  advertiser: ExecutionParty;
  aosco: ExecutionParty;
}

// The parsed shape of the quote_master_data JSON property.
export interface QuoteMasterData {
  logoSrc?: string;
  coverImageSrc?: string;
  documentTitle?: string;
  companyLegalName?: string;
  advertiser?: Partial<AdvertiserDetails>;
  account?: Partial<AccountDetails>;
  campaign?: Partial<CampaignBooking>;
  ad_schedules?: ScheduleRow[];
  scheduleMeta?: Partial<ScheduleMeta>;
  specialConditions?: string[];
  execution?: {
    advertiser?: Partial<ExecutionParty>;
    aosco?: Partial<ExecutionParty>;
  };
}

// ---------------------------------------------------------------------------
// HubSpot module types
// ---------------------------------------------------------------------------

type CrmValue = string | number | null | undefined;

// Must match the keys built in hublDataTemplate at the bottom of this file.
// Everything comes from the DEAL record only.
interface HublData {
  isQuoteBlueprint: boolean;

  // Deal
  dealId?: CrmValue;
  dealName?: CrmValue;
  referenceNumber?: CrmValue; // aos_reference_number — incrementing number, shown as AOS-0000001
  campaignStartDate?: CrmValue;
  campaignEndDate?: CrmValue;
  scheduleSummaryJson?: unknown; // quote_master_data

  // Deal — money
  //   actualMarketRate - discount = investment
  //   investment + gstAmount = totalInvestment
  actualMarketRate?: CrmValue; // total_bill_amount_before_discount_total_market_rate (before discount)
  investment?: CrmValue;       // total_commercial_rate (ex GST, after discount)
  gstAmount?: CrmValue;        // gst_amount
  totalInvestment?: CrmValue;  // total_investment (incl GST)

  // Deal — advertiser details (used for Advertiser + Account Details)
  advertiserCompany?: CrmValue;   // advertiser_company
  advertiserEmail?: CrmValue;     // advertiser_person_email_address
  advertiserFirstName?: CrmValue; // advertiser_contact_first_name
  advertiserLastName?: CrmValue;  // advertiser_contact_last_name
  advertiserPhone?: CrmValue;     // advertiser_person_phone_number
}

interface Props {
  fieldValues: FieldValues;
  hublData: HublData;
}

interface FieldValues {}

// ===========================================================================
// Constants
// ===========================================================================

const LOGO_SRC =
  'https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/logo.png';
const HERO_IMAGE_SRC =
  'https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/Quote%20Cover.png';

const GST_RATE = 0.1;
const NETWORK_SITE_COUNT = 18; // every site on the AOSco network
const MAX_GRID_WEEKS = 26; // cap when stretching the grid to the deal start/end dates
const DEFAULT_STATE = 'QLD';
const DEFAULT_TYPE = 'Digital billboards';
const FORMAT_WORD = 'Digital';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_UPPER = MONTHS_SHORT.map((m) => m.toUpperCase());
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ===========================================================================
// Generic helpers
// ===========================================================================

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

// Returns the first value that isn't null/undefined/blank, as a string.
function firstFilled(...values: CrmValue[]): string {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return '';
}

function fullName(first: CrmValue, last: CrmValue): string {
  return [first, last].map((v) => firstFilled(v)).filter(Boolean).join(' ');
}

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

// "a", "a and b", "a, b and c"
function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// "4000", "4,000.00", "$4,000.00", 4000 -> 4000; blank/unreadable -> null.
function toAmount(value: CrmValue): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/[^0-9.-]/g, '');
  if (s === '' || s === '-' || s === '.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// 0.3 -> "30%", 0.1111 -> "11.11%"
function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}

function formatCurrency(value: number, dropZeroCents = false): string {
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

const money = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : formatCurrency(n);
const negativeMoney = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `–${formatCurrency(Math.abs(n))}`;

// "630.0" -> "630", "96096.0" -> "96096"; anything else is left alone.
// The sync script writes whole numbers as floats.
function cleanNumber(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return /^-?\d+\.0+$/.test(s) ? s.replace(/\.0+$/, '') : s;
}

// quote_master_data can reach us as a JSON string (normal), an already-parsed
// object, an HTML-escaped string (&quot;…) or a double-encoded JSON string.
function parseQuoteMasterData(raw: unknown): QuoteMasterData {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as QuoteMasterData;

  const tryParse = (text: string): unknown => {
    try {
      let parsed: unknown = JSON.parse(text);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); // double-encoded
      return parsed;
    } catch {
      return null;
    }
  };

  const text = String(raw).trim();
  let parsed = tryParse(text);
  if (!parsed) {
    const decoded = text
      .replace(/&quot;|&#34;|&#x22;/g, '"')
      .replace(/&#39;|&#x27;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    parsed = tryParse(decoded);
  }
  return typeof parsed === 'object' && parsed !== null ? (parsed as QuoteMasterData) : {};
}

// ===========================================================================
// Date helpers (all UTC ms, so no timezone drift)
// ===========================================================================

interface DateParts {
  day: number;
  month: number; // 1-12
  year: number;
}

function toDateParts(time: number): DateParts {
  const d = new Date(time);
  return { day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
}

// HubSpot date -> "dd/mm/yyyy". HubSpot sends deal dates as Australian
// day-first dates with a two- or four-digit year ("1/9/26", "01/09/2026");
// two-digit years are read as 20xx. Also accepts ISO "2026-09-01" and
// epoch ms/seconds (incl. "1788220800000.0" and "1.7882208E12").
function formatHubspotDate(value: CrmValue): string {
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

// Any date value the deal or the schedule can hold -> UTC ms; else null.
function parseDate(value: CrmValue): number | null {
  const m = formatHubspotDate(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
}

function formatDmy(t: number): string {
  const p = toDateParts(t);
  return `${pad2(p.day)}/${pad2(p.month)}/${p.year}`;
}

// "1 Feb"
function dayMonth(t: number): string {
  const p = toDateParts(t);
  return `${p.day} ${MONTHS_SHORT[p.month - 1]}`;
}

// "15 Mar 2027"
function dayMonthYear(t: number): string {
  return `${dayMonth(t)} ${toDateParts(t).year}`;
}

// "Feb – Mar 2027", "Oct 2026 – Jan 2027", "Mar 2027"
function monthRangeLabel(from: number | null, to: number | null): string {
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
function flightMonthLabel(t: number): string {
  const p = toDateParts(t);
  return `${MONTHS_UPPER[p.month - 1]}-${p.year}`;
}

// "SEP-2026 – NOV-2026"; a single month if both dates fall in the same month.
function flightingLabel(start: number | null, end: number | null): string {
  const a = start !== null ? flightMonthLabel(start) : '';
  const b = end !== null ? flightMonthLabel(end) : '';
  if (a && b && a !== b) return `${a} – ${b}`;
  return a || b;
}

function ordinalSuffix(day: number): string {
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
function todayInBrisbane(): DateParts {
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
function longDateLabel(p: DateParts): string {
  return `${p.day}${ordinalSuffix(p.day)} ${FULL_MONTHS[p.month - 1]} ${p.year}`;
}

// ===========================================================================
// Sites (from quote_master_data.ad_schedules)
// ===========================================================================

interface SiteRow {
  key: string;
  code: string; // face ID
  name: string; // display name
  locality: string; // "Caboolture" from "Caboolture – 66 Morayfield Rd"
  bonus: boolean;
  size: string; // "12 x 3.3"
  state: string;
  weeks: number[]; // sorted, unique week-start dates (UTC ms)
}

const MONTH_WORD = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*';
const PERIOD_PREFIX = new RegExp(`^${MONTH_WORD}\\s*[-–]\\s*${MONTH_WORD}\\s+[-–]\\s+`, 'i');

// "Oct-Jan - BONUS NEWMARKET LANDSCAPE" -> "NEWMARKET LANDSCAPE"
function cleanSiteName(raw: string): string {
  const cleaned = raw
    .replace(PERIOD_PREFIX, '')
    .replace(/^bonus\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || raw.trim();
}

// "Caboolture – 66 Morayfield Rd" -> "Caboolture"; no separator -> ""
function siteLocality(name: string): string {
  const parts = name.split(/\s+[–-]\s+/);
  return parts.length > 1 ? parts[0].trim() : '';
}

function buildSites(schedule: ScheduleRow[], defaultState: string): SiteRow[] {
  return schedule.map((row, i) => {
    const rawName = firstFilled(row?.n);
    const weeks = uniq(
      (Array.isArray(row?.ws) ? row.ws : []).map(parseDate).filter((t): t is number => t !== null),
    ).sort((a, b) => a - b);
    const bonus =
      row?.bonus === true ||
      row?.bonus === 'true' ||
      (row?.bonus === undefined || row?.bonus === null ? /\bbonus\b/i.test(rawName) : false);
    const name = cleanSiteName(rawName);

    return {
      key: String(i),
      code: cleanNumber(firstFilled(row?.fid, row?.siteId)),
      name,
      locality: siteLocality(name),
      bonus,
      size: cleanNumber(row?.dim).replace(/\s*x\s*/i, ' x '),
      state: firstFilled(row?.st, defaultState),
      weeks,
    };
  });
}

// Continuous weekly columns covering every booked week, stretched to the
// deal's start/end dates (e.g. WK1 = start date even if nothing runs that week).
function buildWeekColumns(
  bookedTimes: number[],
  campaignStart: number | null,
  campaignEnd: number | null,
): number[] {
  if (bookedTimes.length === 0) return [];
  const first = Math.min(...bookedTimes);
  const last = Math.max(...bookedTimes);

  let start = first;
  if (campaignStart !== null && campaignStart < first) {
    start = first - Math.ceil((first - campaignStart) / WEEK_MS) * WEEK_MS;
  }
  let end = last;
  const lastWeekEnd = last + 6 * DAY_MS;
  if (campaignEnd !== null && campaignEnd > lastWeekEnd) {
    end = last + Math.ceil((campaignEnd - lastWeekEnd) / WEEK_MS) * WEEK_MS;
  }

  let count = Math.floor((end - start) / WEEK_MS) + 1;
  if (count > MAX_GRID_WEEKS) {
    start = first; // bad deal dates: show only the booked range
    count = Math.floor((last - first) / WEEK_MS) + 1;
  }
  return Array.from({ length: count }, (_, i) => start + i * WEEK_MS);
}

function monthGroups(weeks: number[]): Array<{ key: string; label: string; span: number }> {
  const groups: Array<{ key: string; span: number; month: number; year: number }> = [];
  for (const w of weeks) {
    const p = toDateParts(w);
    const key = `${p.year}-${p.month}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.span += 1;
    else groups.push({ key, span: 1, month: p.month, year: p.year });
  }
  return groups.map((g) => ({
    key: g.key,
    span: g.span,
    label:
      g.span >= 3
        ? `${FULL_MONTHS[g.month - 1].toUpperCase()} ${g.year}`
        : `${MONTHS_UPPER[g.month - 1]} ${String(g.year).slice(2)}`,
  }));
}

// ---------------------------------------------------------------------------
// Campaign Booking helpers (rules confirmed by the client)
// ---------------------------------------------------------------------------

// Billboards are counted once each (by face ID, else by name), so a site that
// appears on several schedule rows (paid + bonus) is not counted twice.
function uniqueSiteCount(sites: SiteRow[]): number {
  return new Set(sites.map((s) => (s.code || s.name).toLowerCase()).filter(Boolean)).size;
}

// "Site, Size & Type of Selected Billboards":
//   all 18 sites on the schedule -> "NETWORK"
//   otherwise                    -> how many billboards are itemised ("3 SITES")
function siteSizeTypeLabel(count: number): string {
  if (count === 0) return '';
  if (count >= NETWORK_SITE_COUNT) return 'NETWORK';
  return `${count} ${count === 1 ? 'SITE' : 'SITES'}`;
}

// Reference ID: incrementing number from the deal, zero-padded to 7 digits.
//   1 -> "AOS-0000001", "42" -> "AOS-0000042", "AOS-0000042" -> as-is.
function formatReferenceId(value: CrmValue): string {
  const raw = firstFilled(value);
  if (!raw) return '';
  if (/^AOS-\d+$/i.test(raw)) return raw.toUpperCase();
  const digits = raw.replace(/\.0+$/, '').replace(/\D/g, '');
  return digits ? `AOS-${digits.padStart(7, '0')}` : '';
}

// "Weeks Required": one number for the whole campaign length — every week
// from the first booked week to the last, paid AND bonus, counted once.
// Falls back to the deal's start/end dates when there is no schedule.
function campaignWeeks(bookedTimes: number[], start: number | null, end: number | null): number {
  if (bookedTimes.length > 0) {
    const first = Math.min(...bookedTimes);
    const last = Math.max(...bookedTimes);
    return Math.round((last - first) / WEEK_MS) + 1;
  }
  if (start !== null && end !== null) {
    const days = Math.round((end - start) / DAY_MS) + 1;
    return days > 0 ? Math.ceil(days / 7) : 0;
  }
  return 0;
}

// ===========================================================================
// Default copy
// ===========================================================================

const DEFAULT_ADVERTISER: AdvertiserDetails = { greetingName: 'Nic', companyName: '', contactName: '', phone: '', email: '' };
const DEFAULT_ACCOUNT: AccountDetails = { accountsName: '', accountsProcess: 'Please send to Nic for distribution and payment', accountsEmail: '' };
const DEFAULT_REFERENCE_ID = 'AOS-';
const DEFAULT_EXECUTION: Execution = {
  advertiser: { representativeName: '', position: 'Owner', date: '' },
  aosco: { representativeName: 'Jesse McIntyre', position: 'Sales Director', date: '' },
};

// Transcribed verbatim, including the source document's own numbering
// (items 7-9 are one continuous sentence split across three numbers in
// both the .docx and the .pdf export — that's the original, not a
// conversion artifact, so it's reproduced as-is).
const DEFAULT_SPECIAL_CONDITIONS: string[] = [
  'Unlimited Material Changes / Uploads Included.',
  'Advertising to commence 30th August 2026',
  'AOSCO will upload earlier than start date once contract is signed and artwork is sized suitable',
  'AOSCO will re size artwork to suit at no Charge.',
  'Invoiced over 1 equal amount in August',
  'CANCELLATION (COVID Consideration) - AOSco agrees to honour a 7-day cancellation deadline, effective up until Monday before campaign launch in writing.',
  'Execution - I acknowledge that I have received and read this Agreement, confirm that the details contained',
  'within (including regarding payments due) are correct and hereby agree to be bound to this Agreement and',
  'the Terms and Conditions as attached.',
  'AOSco will offer Bonus STA Sites to the same spec if we have the avails.',
  'Bonus offered in this campaign is placed as 100% Guaranteed Bonus',
];

// Example schedule data, in the sync script's short-key format — for
// reference/testing only, NOT used as a default value.
export const AOSCO_EXAMPLE_SCHEDULE: ScheduleRow[] = [
  { n: '636 Moggill Rd Indooroopilly INBOUND (Portrait)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 803, dwell: '8 Sec (1 in 10)', dim: '4x6', siteId: '96062', nif: 2.2, r7: 2.1, r28: 3.6, ws: ['13/09/2026', '27/09/2026', '11/10/2026', '25/10/2026'] },
  { n: 'BONUS CHAPEL HILL INBOUND', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 803, dwell: '8 Sec (1 in 10)', dim: '4x6', siteId: '96062', nif: 2.2, r7: 2.1, r28: 3.6, ws: ['20/09/2026', '04/10/2026', '18/10/2026', '01/11/2026'] },
  { n: 'Enoggera Rd Newmarket (Landscape)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 4700, dwell: '8 Sec (1 in 10)', dim: '9x3', siteId: '96060', nif: 3.2, r7: 6.3, r28: 9.8, ws: ['13/09/2026', '20/09/2026', '27/09/2026', '11/10/2026', '18/10/2026', '25/10/2026'] },
  { n: 'BONUS NEWMARKET LANDSCAPE', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 4700, dwell: '8 Sec (1 in 10)', dim: '9x3', siteId: '96060', nif: 3.2, r7: 6.3, r28: 9.8, ws: ['04/10/2026', '01/11/2026'] },
  { n: 'Kingsford Smith Drive, Hamilton (Landscape)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 1728, dwell: '8 Sec (1 in 10)', dim: '12x3.3', siteId: '96061', nif: 2.7, r7: 2.8, r28: 4.8, ws: ['13/09/2026', '27/09/2026', '11/10/2026', '25/10/2026'] },
  { n: 'BONUS HAMILTON LANDSCAPE', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 1728, dwell: '8 Sec (1 in 10)', dim: '12x3.3', siteId: '96061', nif: 2.7, r7: 2.8, r28: 4.8, ws: ['20/09/2026', '04/10/2026', '18/10/2026', '01/11/2026'] },
  { n: '100 Lutwyche Rd Windsor (Landscape)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 5706, dwell: '8 Sec (1 in 10)', dim: '12x3.3', siteId: '96104', nif: 3.2, r7: 10, r28: 16.6, ws: ['13/09/2026', '20/09/2026', '27/09/2026', '11/10/2026', '18/10/2026', '25/10/2026'] },
  { n: 'BONUS WINDSOR LANDSCAPE', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 5706, dwell: '8 Sec (1 in 10)', dim: '12x3.3', siteId: '96104', nif: 3.2, r7: 10, r28: 16.6, ws: ['04/10/2026', '01/11/2026'] },
  { n: '100 Ipswich Road Woolloongabba (Landscape)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 2631, dwell: '10 Sec (1 in 10)', dim: '12x3.3', siteId: '96099', nif: 3.3, r7: 4.7, r28: 7.3, ws: ['20/09/2026', '18/10/2026'] },
  { n: 'BONUS GABBA LANDSCAPE', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 2631, dwell: '10 Sec (1 in 10)', dim: '12x3.3', siteId: '96099', nif: 3.3, r7: 4.7, r28: 7.3, ws: ['04/10/2026', '01/11/2026'] },
  { n: 'CENTENARY Highway DFO Jindalee NEW SITE', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 1610, dwell: '60 Sec (1 in 10)', dim: '15.8x5.4', siteId: '449694', nif: 2.5, r7: 4.5, r28: 7.6, ws: ['27/09/2026', '25/10/2026'] },
  { n: 'CENTENARY Highway DFO Jindalee', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 1610, dwell: '60 Sec (1 in 10)', dim: '15.8x5.4', siteId: '449694', nif: 2.5, r7: 4.5, r28: 7.6, ws: ['13/09/2026', '11/10/2026'] },
];

// ===========================================================================
// Presentational pieces
// ===========================================================================

function PageHead({ logoSrc, label }: { logoSrc: string; label: string }) {
  return (
    <div className="aosco-page-head">
      <img src={logoSrc} alt="AOSco" />
      <span className="aosco-page-head-ref">{label}</span>
    </div>
  );
}

function SectionTitle({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <h2 className="aosco-h2">
      <span className="aosco-h2-num">{num}</span>
      <span>{children}</span>
    </h2>
  );
}

function DetailCard({
  title,
  rows,
  wide = false,
}: {
  title?: string;
  rows: Array<[string, React.ReactNode]>;
  wide?: boolean;
}) {
  return (
    <table className={cx('aosco-card', wide && 'aosco-card--wide')}>
      {title && (
        <thead>
          <tr>
            <th colSpan={2}>{title}</th>
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="aosco-card-k">{label}</td>
            <td>{value || ' '}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stat({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={cx('aosco-stat', dark && 'aosco-stat--dark')}>
      <div className="aosco-stat-label">{label}</div>
      <div className="aosco-stat-value">{value || ' '}</div>
    </div>
  );
}

function GlanceTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'dark' | 'gold';
}) {
  return (
    <div className={cx('aosco-glance-tile', tone && `aosco-glance-tile--${tone}`)}>
      <div className="aosco-glance-label">{label}</div>
      <div className="aosco-glance-value">{value}</div>
    </div>
  );
}

function SignField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="aosco-sign">
      <div className="aosco-mini-label">{label}</div>
      <div className="aosco-sign-value">{value || ' '}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaign schedule grid
// ---------------------------------------------------------------------------

function ScheduleGrid({ sites, weeks }: { sites: SiteRow[]; weeks: number[] }) {
  const start = weeks[0];
  const colOf = (t: number) => Math.floor((t - start) / WEEK_MS);
  const booked = sites.map((s) => new Set(s.weeks.map(colOf)));
  const totals = weeks.map((_, i) => booked.reduce((n, set) => n + (set.has(i) ? 1 : 0), 0));
  const paidSites = sites.filter((s) => !s.bonus).length;
  const bonusSites = sites.length - paidSites;
  const dense = weeks.length > 12;

  return (
    <div className="aosco-grid-scroll">
      <table className={cx('aosco-grid', dense && 'aosco-grid--dense')}>
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: dense ? '17%' : '20%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '7%' }} />
          {weeks.map((w) => (
            <col key={w} />
          ))}
          <col style={{ width: '5%' }} />
          <col style={{ width: '5%' }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={4} className="aosco-grid-band">
              {FORMAT_WORD.toUpperCase()} LARGE FORMAT
            </th>
            {monthGroups(weeks).map((g, i) => (
              <th key={g.key} colSpan={g.span} className={cx('aosco-grid-band', i % 2 === 1 && 'aosco-grid-band--alt')}>
                {g.label}
              </th>
            ))}
            <th colSpan={2} className="aosco-grid-band">
              ACTIVITY SUMMARY
            </th>
          </tr>
          <tr>
            <th rowSpan={2} className="aosco-grid-sub aosco-left">Site code</th>
            <th rowSpan={2} className="aosco-grid-sub aosco-left">Site</th>
            <th rowSpan={2} className="aosco-grid-sub">Spot</th>
            <th rowSpan={2} className="aosco-grid-sub">Size</th>
            {weeks.map((w, i) => (
              <th key={w} className="aosco-grid-sub">
                WK {i + 1}
              </th>
            ))}
            <th rowSpan={2} className="aosco-grid-sub">Paid sites</th>
            <th rowSpan={2} className="aosco-grid-sub">Bonus sites</th>
          </tr>
          <tr>
            {weeks.map((w) => (
              <th key={w} className="aosco-grid-date">
                {dayMonth(w)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sites.map((s, r) => (
            <tr key={s.key}>
              <td className="aosco-left">{s.code || '–'}</td>
              <td className="aosco-left aosco-grid-site">{s.name}</td>
              <td className={s.bonus ? 'aosco-spot-bonus' : 'aosco-spot-paid'}>{s.bonus ? 'Bonus' : 'Paid'}</td>
              <td>{s.size || '–'}</td>
              {weeks.map((w, i) =>
                booked[r].has(i) ? (
                  <td key={w} className={s.bonus ? 'aosco-cell-gtd' : 'aosco-cell-paid'}>
                    {s.bonus ? 'GTD' : '1'}
                  </td>
                ) : (
                  <td key={w} />
                ),
              )}
              <td>{s.bonus ? 0 : 1}</td>
              <td>{s.bonus ? 1 : 0}</td>
            </tr>
          ))}
          <tr className="aosco-grid-total">
            <td colSpan={4} className="aosco-left">TOTAL</td>
            {totals.map((n, i) => (
              <td key={i}>{n || '–'}</td>
            ))}
            <td>{paidSites}</td>
            <td>{bonusSites}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Direct deals have no per-site pricing, so placements list weeks only;
// the money is in the investment summary and billing table.
function PlacementsTable({ sites }: { sites: SiteRow[] }) {
  const paidWeeks = sites.filter((s) => !s.bonus).reduce((n, s) => n + s.weeks.length, 0);
  const bonusWeeks = sites.filter((s) => s.bonus).reduce((n, s) => n + s.weeks.length, 0);

  return (
    <table className="aosco-table aosco-table--compact">
      <thead>
        <tr>
          <th style={{ width: '9%' }}>Site code</th>
          <th>Site</th>
          <th style={{ width: '6%' }}>State</th>
          <th style={{ width: '13%' }}>Format &amp; size</th>
          <th style={{ width: '22%' }}>Week commencing</th>
          <th className="mid" style={{ width: '8%' }}>Paid weeks</th>
          <th className="mid" style={{ width: '9%' }}>Bonus weeks</th>
        </tr>
      </thead>
      <tbody>
        {sites.map((s) => {
          const first = s.weeks[0];
          const last = s.weeks[s.weeks.length - 1];
          return (
            <tr key={s.key}>
              <td>{s.code || '–'}</td>
              <td className="strong">{s.name}</td>
              <td>{s.state}</td>
              <td>{[FORMAT_WORD, s.size].filter(Boolean).join(' ')}</td>
              <td>
                {first === undefined
                  ? '–'
                  : s.weeks.length === 1
                    ? dayMonthYear(first)
                    : `${dayMonthYear(first)} – ${dayMonthYear(last)}`}
              </td>
              <td className="mid">{s.bonus ? '–' : s.weeks.length}</td>
              <td className={cx('mid', s.bonus && 'aosco-table-bonus')}>
                {s.bonus ? `${s.weeks.length} (GTD)` : '–'}
              </td>
            </tr>
          );
        })}
        <tr className="aosco-table-total">
          <td>TOTAL</td>
          <td />
          <td />
          <td />
          <td />
          <td className="mid">{paidWeeks}</td>
          <td className="mid">{bonusWeeks}</td>
        </tr>
      </tbody>
    </table>
  );
}

// ===========================================================================
// Component — HubSpot quote module entry point
// ===========================================================================

export function Component({ hublData }: Props) {
  const h: HublData = hublData || ({} as HublData);
  const data = parseQuoteMasterData(h.scheduleSummaryJson);

  const documentTitle = firstFilled(data.documentTitle, 'ADVERTISING AGREEMENT');
  const companyLegalName = firstFilled(data.companyLegalName, 'Australian Outdoor Sign Company Pty Ltd');
  const logoSrc = firstFilled(data.logoSrc, LOGO_SRC);
  const heroSrc = firstFilled(data.coverImageSrc, HERO_IMAGE_SRC);

  // -------------------------------------------------------------------------
  // People. Advertiser + Account Details come from the deal's own
  // advertiser_* properties. Priority: deal property -> quote_master_data -> default.
  // -------------------------------------------------------------------------
  const advertiserFullName = fullName(h.advertiserFirstName, h.advertiserLastName);

  const adv: AdvertiserDetails = {
    greetingName: firstFilled(h.advertiserFirstName, data.advertiser?.greetingName, DEFAULT_ADVERTISER.greetingName),
    companyName: firstFilled(h.advertiserCompany, data.advertiser?.companyName), // advertiser_company
    contactName: firstFilled(advertiserFullName, data.advertiser?.contactName),  // first + last name
    phone: firstFilled(h.advertiserPhone, data.advertiser?.phone),               // advertiser_person_phone_number
    email: firstFilled(h.advertiserEmail, data.advertiser?.email),               // advertiser_person_email_address
  };

  const acc: AccountDetails = {
    accountsName: firstFilled(advertiserFullName, data.account?.accountsName),
    accountsProcess: firstFilled(
      data.account?.accountsProcess,
      adv.greetingName ? `Please send to ${adv.greetingName} for distribution and payment` : '',
      DEFAULT_ACCOUNT.accountsProcess,
    ),
    accountsEmail: firstFilled(h.advertiserEmail, data.account?.accountsEmail),
  };

  // -------------------------------------------------------------------------
  // Schedule
  // -------------------------------------------------------------------------
  const schedule: ScheduleRow[] = Array.isArray(data.ad_schedules) ? data.ad_schedules : [];
  const defaultState = firstFilled(data.scheduleMeta?.state, DEFAULT_STATE);
  const sites = buildSites(schedule, defaultState);
  const paidSites = sites.filter((s) => !s.bonus);
  const bonusSites = sites.filter((s) => s.bonus);
  const paidWeeks = paidSites.reduce((n, s) => n + s.weeks.length, 0);
  const bonusWeeks = bonusSites.reduce((n, s) => n + s.weeks.length, 0);

  const bookedTimes = sites.flatMap((s) => s.weeks);
  const firstBooked = bookedTimes.length ? Math.min(...bookedTimes) : null;
  const lastBooked = bookedTimes.length ? Math.max(...bookedTimes) : null;

  const dealStart = parseDate(h.campaignStartDate);
  const dealEnd = parseDate(h.campaignEndDate);
  const startMs = dealStart ?? firstBooked;
  const endMs = dealEnd ?? (lastBooked !== null ? lastBooked + 6 * DAY_MS : null);

  const weekColumns = buildWeekColumns(bookedTimes, dealStart, dealEnd);
  const weekdays = uniq(bookedTimes.map((t) => new Date(t).getUTCDay()));
  const states = uniq(sites.map((s) => s.state).filter(Boolean));

  // -------------------------------------------------------------------------
  // Campaign
  // -------------------------------------------------------------------------
  const campaignName = firstFilled(h.dealName, data.campaign?.campaignName);
  const titleMatch = campaignName.match(/^(.*?)\s*(\([^)]*\))\s*$/);
  const titleMain = titleMatch && titleMatch[1] ? titleMatch[1] : campaignName;
  const titleParen = titleMatch && titleMatch[1] ? titleMatch[2] : '';

  // Incrementing deal number -> "AOS-0000001"
  const referenceId = firstFilled(
    formatReferenceId(h.referenceNumber),
    data.campaign?.referenceId,
    DEFAULT_REFERENCE_ID,
  );

  const siteCount = uniqueSiteCount(sites);
  const isNetwork = siteCount >= NETWORK_SITE_COUNT;
  const localities = uniq(sites.map((s) => s.locality));
  const shortLocalities =
    localities.length > 0 && localities.length <= 2 && localities.every(Boolean) ? localities : [];

  const sitesTile = isNetwork
    ? 'AOSco Network'
    : shortLocalities.length
      ? shortLocalities.join(' + ')
      : siteCount
        ? plural(siteCount, 'site')
        : '';

  const subtitle = [
    titleParen,
    firstFilled(
      data.scheduleMeta?.locality,
      shortLocalities.length ? `${shortLocalities.join(' & ')} ${FORMAT_WORD}` : '',
    ),
  ]
    .filter(Boolean)
    .join(' · ');

  const onAir = bonusWeeks
    ? `${paidWeeks} paid + ${plural(bonusWeeks, 'bonus week')}`
    : paidWeeks
      ? plural(paidWeeks, 'paid week')
      : '';

  const weeksRequired = campaignWeeks(bookedTimes, startMs, endMs);

  // -------------------------------------------------------------------------
  // Money — all from the deal:
  //   actualMarketRate - discount = investment
  //   investment + GST = totalInvestment
  // -------------------------------------------------------------------------
  const marketRate = toAmount(h.actualMarketRate);
  const investment = toAmount(h.investment);
  const discount =
    marketRate !== null && investment !== null ? round2(Math.max(0, marketRate - investment)) : null;
  const gstAmount = toAmount(h.gstAmount) ?? (investment !== null ? round2(investment * GST_RATE) : null);
  // Falls back to investment + GST only if total_investment is empty.
  const totalInvestment =
    toAmount(h.totalInvestment) ?? (investment !== null && gstAmount !== null ? round2(investment + gstAmount) : null);
  const discountRate = discount !== null && marketRate ? discount / marketRate : null;
  const discountRateLabel = discountRate !== null ? formatRate(discountRate) : '';
  const discountLabel = ['Discount', discountRateLabel].filter(Boolean).join(' ');

  const flighting = flightingLabel(startMs, endMs);
  const billedOn = longDateLabel(todayInBrisbane());

  const bonusNote = firstFilled(
    data.scheduleMeta?.bonusNote,
    bonusSites.length
      ? `${joinAnd(uniq(bonusSites.map((s) => s.name)))} ${bonusWeeks === 1 ? 'bonus week' : 'bonus weeks'} supplied as a guaranteed bonus (GTD) at no charge.`
      : '',
  );

  // -------------------------------------------------------------------------
  // Conditions + execution
  // -------------------------------------------------------------------------
  const specialConditions = data.specialConditions ?? DEFAULT_SPECIAL_CONDITIONS;

  const exec: Execution = {
    advertiser: {
      ...DEFAULT_EXECUTION.advertiser,
      ...(data.execution?.advertiser || {}),
      representativeName: firstFilled(data.execution?.advertiser?.representativeName, adv.contactName),
    },
    aosco: { ...DEFAULT_EXECUTION.aosco, ...(data.execution?.aosco || {}) },
  };

  const headLabel = [documentTitle, referenceId].filter(Boolean).join(' · ');

  return (
    <div className="aosco-root">
      <style>{MODULE_CSS}</style>

      {/* ================= cover ================= */}
      <section className="aosco-sheet">
        <img src={logoSrc} alt={companyLegalName} className="aosco-cover-logo" />

        <p className="aosco-eyebrow">{documentTitle}</p>
        <h1 className="aosco-cover-title">{titleMain || ' '}</h1>
        {subtitle && <p className="aosco-cover-sub">{subtitle}</p>}

        <div className="aosco-hero">
          <img src={heroSrc} alt="" />
        </div>
        <p className="aosco-hero-caption">
          AOSco &ndash; Queensland&rsquo;s fastest growing digital billboard network.
        </p>

        <div className="aosco-stats">
          <Stat label="Campaign" value={monthRangeLabel(startMs, endMs)} />
          <Stat label="Sites" value={sitesTile} />
          <Stat label="On air" value={onAir} />
          <Stat
            label="Investment"
            value={investment !== null ? `${formatCurrency(investment, true)} + GST` : ''}
            dark
          />
        </div>

        <div className="aosco-prepared">
          <div>
            <div className="aosco-mini-label">Prepared for</div>
            <p className="aosco-prepared-name">{adv.contactName || ' '}</p>
            <p className="aosco-prepared-org">{adv.companyName}</p>
          </div>
          <div>
            <div className="aosco-mini-label">Prepared by</div>
            <p className="aosco-prepared-name">
              {[exec.aosco.representativeName, exec.aosco.position].filter(Boolean).join(', ')}
            </p>
            <p className="aosco-prepared-org">{companyLegalName}</p>
          </div>
        </div>

        {referenceId && (
          <p className="aosco-ref">
            <strong>Reference ID:</strong> {referenceId}
          </p>
        )}
      </section>

      {/* ================= summary, booking, investment ================= */}
      <section className="aosco-sheet">
        <PageHead logoSrc={logoSrc} label={headLabel} />

        <SectionTitle num="01">Order summary</SectionTitle>
        <p className="aosco-greeting">Dear {adv.greetingName || ' '},</p>
        <p className="aosco-intro">
          Thank you for the opportunity to provide our services to you. This document and the attached
          Terms and Conditions set out the basis on which AOSco provide our services.
        </p>

        <div className="aosco-cols">
          <DetailCard
            title="Advertiser details"
            rows={[
              ['Company', adv.companyName],
              ['Contact', adv.contactName],
              ['Phone', adv.phone],
              ['Email', adv.email],
            ]}
          />
          <DetailCard
            title="Account details"
            rows={[
              ['Accounts name', acc.accountsName],
              ['Accounts process', acc.accountsProcess],
              ['Accounts email', acc.accountsEmail],
            ]}
          />
        </div>

        <SectionTitle num="02">Campaign booking</SectionTitle>
        <DetailCard
          wide
          rows={[
            ['Campaign name', campaignName],
            ['Reference ID', referenceId],
            // "NETWORK" for all 18 sites, otherwise the number of billboards on the schedule
            ['Sites, size & type', firstFilled(data.campaign?.siteSizeType, siteSizeTypeLabel(siteCount))],
            ['Type', firstFilled(data.campaign?.type, DEFAULT_TYPE)],
            // Total campaign length in weeks, bonus weeks included (first to last booked week)
            ['Weeks required', weeksRequired ? plural(weeksRequired, 'week') : ''],
            ['Start date', startMs !== null ? formatDmy(startMs) : ''],
            ['End date', endMs !== null ? formatDmy(endMs) : ''],
          ]}
        />

        <SectionTitle num="03">Investment at a glance</SectionTitle>
        <div className="aosco-glance aosco-glance--five">
          <GlanceTile label="Market rate" value={money(marketRate)} />
          <GlanceTile label={discountLabel} value={negativeMoney(discount)} />
          <GlanceTile
            label="Investment"
            value={investment !== null ? `${money(investment)} + GST` : '—'}
            tone="dark"
          />
          <GlanceTile label={`GST ${formatRate(GST_RATE)}`} value={money(gstAmount)} />
          <GlanceTile label="Total investment inc GST" value={money(totalInvestment)} tone="gold" />
        </div>
        {bonusNote && <p className="aosco-note">{bonusNote}</p>}
      </section>

      {/* ================= campaign schedule (landscape) ================= */}
      <section className="aosco-sheet aosco-sheet--landscape">
        <SectionTitle num="04">Campaign schedule</SectionTitle>

        {sites.length > 0 && weekColumns.length > 0 ? (
          <>
            <div className="aosco-legend">
              <span className="aosco-legend-item">
                <span className="aosco-swatch aosco-swatch--paid" /> Paid week
              </span>
              {bonusSites.length > 0 && (
                <span className="aosco-legend-item">
                  <span className="aosco-swatch aosco-swatch--gtd" /> Guaranteed bonus week (GTD) &ndash; no charge
                </span>
              )}
              <span className="aosco-legend-meta">
                {[
                  `${FORMAT_WORD} large format`,
                  states.join(', '),
                  weekdays.length === 1 ? `All weeks commence ${WEEKDAYS[weekdays[0]]}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
            <ScheduleGrid sites={sites} weeks={weekColumns} />

            <p className="aosco-h3">Placements</p>
            <PlacementsTable sites={sites} />
          </>
        ) : (
          <p>The schedule will be confirmed before the campaign starts.</p>
        )}

        <table className="aosco-table aosco-gap">
          <thead>
            <tr>
              <th>Investment summary</th>
              <th className="num" style={{ width: '22%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Market rate (before discount)</td>
              <td className="num">{money(marketRate)}</td>
            </tr>
            <tr>
              <td>Less discount{discountRateLabel ? ` (${discountRateLabel})` : ''}</td>
              <td className="num">{negativeMoney(discount)}</td>
            </tr>
            <tr>
              <td className="strong">Investment (ex GST)</td>
              <td className="num strong">{money(investment)}</td>
            </tr>
            <tr>
              <td>Plus GST ({formatRate(GST_RATE)})</td>
              <td className="num">{money(gstAmount)}</td>
            </tr>
            <tr className="aosco-table-total">
              <td>Total investment inc GST</td>
              <td className="num">{money(totalInvestment)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ================= billing, conditions, execution ================= */}
      <section className="aosco-sheet">
        <SectionTitle num="05">Billing</SectionTitle>
        {(acc.accountsName || acc.accountsEmail) && (
          <p className="aosco-accounts">
            <strong>Accounts:</strong> {[acc.accountsName, acc.accountsEmail].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="aosco-accounts">
          <strong>Billed upfront:</strong> {billedOn}
        </p>
        {/* One row for the whole campaign: start month to end month. */}
        <table className="aosco-table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Flighting dates</th>
              <th className="num">Market rate</th>
              <th className="num">{discountLabel}</th>
              <th className="num">GST {formatRate(GST_RATE)}</th>
              <th className="num">Total due to AOSco inc GST</th>
            </tr>
          </thead>
          <tbody>
            <tr className="aosco-table-total">
              <td>{flighting || ' '}</td>
              <td className="num">{money(marketRate)}</td>
              <td className="num">{negativeMoney(discount)}</td>
              <td className="num">{money(gstAmount)}</td>
              <td className="num">{money(totalInvestment)}</td>
            </tr>
          </tbody>
        </table>

        <SectionTitle num="06">Special conditions</SectionTitle>
        <ol className="aosco-sc">
          {specialConditions.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ol>

        <SectionTitle num="07">Execution</SectionTitle>
        <p>
          I acknowledge that I have received and read this Agreement, confirm that the details contained
          within (including regarding payments due) are correct and hereby agree to be bound to this
          Agreement and the Terms and Conditions as attached.
        </p>
        <div className="aosco-exec">
          <div>
            <div className="aosco-exec-eyebrow">Executed on behalf of</div>
            <p className="aosco-exec-entity">{adv.companyName || ' '}</p>
            {exec.advertiser.representativeName && (
              <p className="aosco-exec-by">by {exec.advertiser.representativeName}</p>
            )}
            <SignField label="Representative name" value={exec.advertiser.representativeName} />
            <SignField label="Position" value={exec.advertiser.position} />
            <SignField label="Signature" />
            <SignField label="Date" value={exec.advertiser.date} />
          </div>
          <div>
            <div className="aosco-exec-eyebrow">Executed on behalf of</div>
            <p className="aosco-exec-entity">{companyLegalName}</p>
            {exec.aosco.representativeName && (
              <p className="aosco-exec-by">by {exec.aosco.representativeName}</p>
            )}
            <SignField label="Representative name" value={exec.aosco.representativeName} />
            <SignField label="Position" value={exec.aosco.position} />
            <SignField label="Signature" />
            <SignField label="Date" value={exec.aosco.date} />
          </div>
        </div>
      </section>
    </div>
  );
}

export const meta = {
  label: "AOSco Quote",
  content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
};

// Flattened so the React side gets simple, predictable keys (see HublData).
// Every value is read from the DEAL record. The deal lookup is guarded
// because a quote blueprint preview may not have a deal attached.
export const hublDataTemplate = `
  {% set dealData = {} %}
  {% if quoteTemplateContext.deal and quoteTemplateContext.deal.hs_object_id %}
    {% set dealData = crm_object("deal", quoteTemplateContext.deal.hs_object_id, "hs_object_id,dealname,aos_reference_number,quote_master_data,campaign_start_date,campaign_end_date,total_bill_amount_before_discount_total_market_rate,total_commercial_rate,gst_amount,total_investment,advertiser_company,advertiser_person_email_address,advertiser_contact_first_name,advertiser_contact_last_name,advertiser_person_phone_number") %}
  {% endif %}

  {% set hublData = {
    "isQuoteBlueprint": isQuoteBlueprint,
    "dealId": dealData.hs_object_id,
    "dealName": dealData.dealname,
    "referenceNumber": dealData.aos_reference_number,
    "campaignStartDate": dealData.campaign_start_date,
    "campaignEndDate": dealData.campaign_end_date,
    "actualMarketRate": dealData.total_bill_amount_before_discount_total_market_rate,
    "totalInvestment": dealData.total_investment,
    "investment": dealData.total_commercial_rate,
    "gstAmount": dealData.gst_amount,
    "scheduleSummaryJson": dealData.quote_master_data,
    "advertiserCompany": dealData.advertiser_company,
    "advertiserEmail": dealData.advertiser_person_email_address,
    "advertiserFirstName": dealData.advertiser_contact_first_name,
    "advertiserLastName": dealData.advertiser_contact_last_name,
    "advertiserPhone": dealData.advertiser_person_phone_number
  } %}
`;
