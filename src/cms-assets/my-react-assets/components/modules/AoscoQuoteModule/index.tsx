import React from 'react';

import { fields } from "./fields";

// Styles live in a shared .css file; `?raw` imports it as a string so it can
// still be injected via <style> (SSR + quote PDF render, no Tailwind here).
import MODULE_CSS from '../../styles/aosco-quote.css?raw';

export { fields };

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

export interface ScheduleRow {
  n: string;
  bonus?: boolean;
  sot?: string | number | null;
  mpw?: string | number | null;
  ot?: string | null;
  ct?: string | null;
  iph?: string | number | null;
  dwell?: string | null;
  dim?: string | null;
  siteId?: string | null;
  fid?: string | null;
  nif?: string | number | null;
  r7?: string | number | null;
  r28?: string | number | null;
  ws: string[];
  totalWeeks?: number;
}

export interface ScheduleMeta {
  locality: string;
  cashContraLabel: string;
  weekCommencingLabel: string;
  bonusPlacementLabel: string;
  reachInfoLabel: string;
  broadcastInfoLabel: string;
  bonusNote: string;
}

export interface BillingRow {
  flighting: string;
  billingDate: string;
  investment: number;
  gst: number;
  total: number;
}

export interface Billing {
  attAccounts: string;
  invoice1: string;
  invoice2: string;
  rows: BillingRow[];
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
  weekDates?: string[];
  scheduleMeta?: Partial<ScheduleMeta>;
  billing?: Partial<Billing>;
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
interface HublData {
  isQuoteBlueprint: boolean;

  // Deal
  dealId?: CrmValue;
  dealName?: CrmValue;
  referenceNumber?: CrmValue; // aos_reference_number — incrementing number, shown as AOS-0000001
  campaignStartDate?: CrmValue; // HubSpot date property (epoch ms or YYYY-MM-DD)
  campaignEndDate?: CrmValue;
  scheduleSummaryJson?: unknown; // quote_master_data — usually a JSON string, parsed client-side below

  // Deal — billing amounts
  investment?: CrmValue;      // total_commercial_rate (ex GST)
  gstAmount?: CrmValue;       // gst_amount
  totalInvestment?: CrmValue; // total_investment (incl GST)

  // Deal — advertiser details (used for Advertiser + Account Details)
  advertiserCompany?: CrmValue;          // advertiser_company
  advertiserEmail?: CrmValue;            // advertiser_person_email_address
  advertiserFirstName?: CrmValue;        // advertiser_contact_first_name
  advertiserLastName?: CrmValue;         // advertiser_contact_last_name
  advertiserPhone?: CrmValue;            // advertiser_person_phone_number
}

interface Props {
  fieldValues: FieldValues;
  hublData: HublData;
}

interface FieldValues {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDMY(dateStr: string): Date {
  const [day, month, year] = String(dateStr).split('/').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// Formats any HubSpot-style date value as dd/mm/yyyy.
// Handles: epoch milliseconds (what crm_object returns for date properties),
// epoch seconds, "YYYY-MM-DD" / ISO strings, and values already in d/m/yyyy.
// UTC getters are used for timestamps because HubSpot stores date-only
// properties as midnight UTC — local getters could shift the day.
function formatDateDMY(value: CrmValue): string {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  // Already d/m/yyyy — just normalise the padding.
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${pad2(Number(dmy[1]))}/${pad2(Number(dmy[2]))}/${dmy[3]}`;

  // YYYY-MM-DD (optionally followed by a time) — read the parts directly.
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;

  let date: Date;
  if (/^\d+$/.test(raw)) {
    const num = Number(raw);
    date = new Date(raw.length <= 10 ? num * 1000 : num); // seconds vs ms
  } else {
    date = new Date(raw);
  }

  if (Number.isNaN(date.getTime())) return raw; // unknown format: show as-is
  return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

// Formats a HubSpot deal date property (campaign_start_date etc.) as
// dd/mm/yyyy. HubSpot sends these as Australian day-first dates with a
// two- or four-digit year: "1/9/26", "01/09/26", "01/09/2026" -> "01/09/2026".
// Two-digit years are read as 20xx. Also accepts epoch timestamps and
// ISO "2026-09-01" in case the property format ever changes.
function formatHubspotDate(value: CrmValue): string {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  // d/m/yy, dd/mm/yy, d/m/yyyy, dd/mm/yyyy (optionally followed by a time)
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})(?!\d)/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return '';
    return `${pad2(day)}/${pad2(month)}/${year}`;
  }

  // ISO "2026-09-01"
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;

  // Epoch ms / seconds, including "1788220800000.0" and "1.7882208E12"
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

// Returns the first value that isn't null/undefined/blank, as a string.
function firstFilled(...values: CrmValue[]): string {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return '';
}

function formatCurrency(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Union of every date across all schedule rows, sorted chronologically —
// used as the week-column headers when weekDates isn't explicitly supplied.
function deriveWeekDates(schedule: ScheduleRow[]): string[] {
  const set = new Set<string>();
  schedule.forEach((row) => (row.ws || []).forEach((d) => set.add(d)));
  return Array.from(set).sort((a, b) => parseDMY(a).getTime() - parseDMY(b).getTime());
}

// quote_master_data can reach us in a few shapes depending on how HubL
// serialises it: a JSON string (normal), an already-parsed object, an
// HTML-escaped string (&quot;…), or a double-encoded JSON string.
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

// "630.0" -> "630", "96096.0" -> "96096"; anything else ("N/A", "10%",
// "2.7") is left alone. The sync script writes whole numbers as floats.
function cleanNumber(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return /^-?\d+\.0+$/.test(s) ? s.replace(/\.0+$/, '') : s;
}

function toDMY(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function addDays(dmy: string, days: number): string {
  const d = parseDMY(dmy);
  d.setDate(d.getDate() + days);
  return toDMY(d);
}

// Cleans one row from quote_master_data: trims the site name, strips the
// ".0" float suffixes, normalises and chronologically sorts its week dates
// (they arrive unordered, e.g. ["02/11/2026","12/10/2026",...]).
function normalizeRow(row: any): ScheduleRow {
  const ws: string[] = Array.isArray(row?.ws)
    ? Array.from(new Set<string>(row.ws.map((d: CrmValue) => formatDateDMY(d)).filter(Boolean)))
    : [];
  ws.sort((a, b) => parseDMY(a).getTime() - parseDMY(b).getTime());

  return {
    ...row,
    n: String(row?.n ?? '').trim(),
    bonus: row?.bonus === true || row?.bonus === 'true',
    sot: cleanNumber(row?.sot),
    mpw: cleanNumber(row?.mpw),
    ot: cleanNumber(row?.ot),
    ct: cleanNumber(row?.ct),
    iph: cleanNumber(row?.iph),
    dwell: cleanNumber(row?.dwell),
    dim: cleanNumber(row?.dim),
    fid: cleanNumber(row?.fid ?? row?.siteId),
    nif: cleanNumber(row?.nif),
    r7: cleanNumber(row?.r7),
    r28: cleanNumber(row?.r28),
    ws,
    totalWeeks: Number(row?.totalWeeks) || ws.length,
  };
}

// Every Monday from the first booked week to the last, so weeks with no
// bookings (e.g. 14/09/2026 in the current deal) still get a column and
// the table reads as a continuous calendar. Any booked date that isn't
// on that 7-day grid is merged in so nothing is ever dropped.
function buildWeekColumns(schedule: ScheduleRow[]): string[] {
  const booked = deriveWeekDates(schedule);
  if (booked.length === 0) return [];

  const columns = new Set<string>();
  const last = parseDMY(booked[booked.length - 1]).getTime();
  const cursor = parseDMY(booked[0]);
  while (cursor.getTime() <= last && columns.size < 156) { // hard stop: 3 years
    columns.add(toDMY(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  booked.forEach((d) => columns.add(d));

  return Array.from(columns).sort((a, b) => parseDMY(a).getTime() - parseDMY(b).getTime());
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Campaign Booking helpers (rules confirmed by the client)
// ---------------------------------------------------------------------------

// A network buy uses every site on the AOSco network.
const NETWORK_SITE_COUNT = 18;
const DAY_MS = 24 * 60 * 60 * 1000;

// "Site, Size & Type of Selected Billboards":
//   all 18 sites on the schedule -> "NETWORK"
//   otherwise                    -> how many billboards are itemised ("3 SITES")
// Billboards are counted once each (by Move/face ID, else by name), so a
// site that appears on several schedule rows is not counted twice.
function siteSizeTypeLabel(schedule: ScheduleRow[]): string {
  const sites = new Set(
    schedule
      .map((row) => firstFilled(row.fid, row.siteId, row.n).toLowerCase())
      .filter(Boolean)
  );
  const count = sites.size;
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
function campaignWeeks(schedule: ScheduleRow[], startDate: string, endDate: string): number {
  const booked = deriveWeekDates(schedule); // every row, bonus included
  if (booked.length > 0) {
    const first = parseDMY(booked[0]).getTime();
    const last = parseDMY(booked[booked.length - 1]).getTime();
    return Math.round((last - first) / (7 * DAY_MS)) + 1;
  }
  if (startDate && endDate) {
    const days = Math.round((parseDMY(endDate).getTime() - parseDMY(startDate).getTime()) / DAY_MS) + 1;
    return days > 0 ? Math.ceil(days / 7) : 0;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Billing helpers
// ---------------------------------------------------------------------------

// Month labels in the style used on the printed agreement ("SEPT – NOV").
const FLIGHT_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Any HubSpot date value -> "SEPT" etc. Empty string if it can't be read.
function monthLabel(value: CrmValue): string {
  const dmy = formatHubspotDate(value);
  const m = dmy.match(/^\d{2}\/(\d{2})\/\d{4}$/);
  return m ? FLIGHT_MONTHS[Number(m[1]) - 1] || '' : '';
}

// "SEPT – NOV"; a single month if both dates fall in the same month.
function flightingLabel(start: CrmValue, end: CrmValue): string {
  const s = monthLabel(start);
  const e = monthLabel(end);
  if (s && e && s !== e) return `${s} \u2013 ${e}`;
  return s || e;
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
function todayInBrisbane(): { day: number; month: number; year: number } {
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

// "4000", "4,000.00", "$4,000.00", 4000 -> 4000; blank/unreadable -> null.
function toAmount(value: CrmValue): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/[^0-9.-]/g, '');
  if (s === '' || s === '-' || s === '.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_ADVERTISER: AdvertiserDetails = { greetingName: 'Nic', companyName: '', contactName: '', phone: '', email: '' };
const DEFAULT_ACCOUNT: AccountDetails = { accountsName: '', accountsProcess: 'Please send to Nic for distribution and payment', accountsEmail: '' };
const DEFAULT_CAMPAIGN: CampaignBooking = { campaignName: '', referenceId: 'AOS-', siteSizeType: '', type: '', weeksRequired: 0, startDate: '', endDate: '' };
const DEFAULT_EXECUTION: Execution = {
  advertiser: { representativeName: '', position: 'Owner', date: '' },
  aosco: { representativeName: 'Jesse McIntyre', position: 'Sales Director', date: '' },
};
const DEFAULT_SCHEDULE_META: ScheduleMeta = {
  locality: 'Locality - QLD',
  cashContraLabel: '4K Cash / 20k Contra',
  weekCommencingLabel: 'Week Commencing DATES MONDAY',
  bonusPlacementLabel: '8 Weeks Paid and Bonus Placment',
  reachInfoLabel: 'REACH INFORMATION MOVE DATA P18-64',
  broadcastInfoLabel: '',
  bonusNote: 'ALL Bonus in Yellow is placed Gaurenteed.',
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

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

interface FieldLineProps {
  label: string;
  value?: string | number | null;
  underline?: boolean;
}

// Label + underlined fill-in value, matching the printed form style
// ("COMPANY NAME: ______"). Pass underline={false} for explanatory text
// like the Accounts Process line, which isn't a blank to fill.
function FieldLine({ label, value, underline = true }: FieldLineProps) {
  return (
    <div className="aosco-field-row">
      <span className="aosco-field-label">{label}</span>
      <span className={cx('aosco-field-value', underline && 'aosco-field-value--underline')}>{value || '\u00A0'}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule table
// ---------------------------------------------------------------------------

interface ScheduleTableProps {
  schedule: ScheduleRow[];
  weekDates: string[];
  meta: ScheduleMeta;
}

// Relative column widths (percent) for the 12 fixed columns, in order.
// SITE gets the largest share since it holds real place names; the rest
// only ever hold a short number/time/code. Whatever's left over after
// these is split evenly across the week columns + the Total Weeks column.
const FIXED_COLUMN_WIDTHS = [13, 4, 4, 4, 4, 4, 5, 6, 4.5, 4, 3.5, 3.5]; // sums to 59.5

function ScheduleTable({ schedule, weekDates, meta }: ScheduleTableProps) {
  const dates = weekDates && weekDates.length > 0 ? weekDates : buildWeekColumns(schedule);

  const weekTotals = dates.map(
    (date) => schedule.filter((row) => (row.ws || []).includes(date)).length
  );

  const fixedTotal = FIXED_COLUMN_WIDTHS.reduce((sum, w) => sum + w, 0);
  const remaining = Math.max(100 - fixedTotal, 0);
  const flexColumnWidth = remaining / (dates.length + 1); // +1 for Total Weeks

  return (
    <div className="aosco-table-scroll">
      <table className="aosco-schedule-table">
        <colgroup>
          {FIXED_COLUMN_WIDTHS.map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
          {dates.map((d) => (
            <col key={d} style={{ width: `${flexColumnWidth}%` }} />
          ))}
          <col style={{ width: `${flexColumnWidth}%` }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={8} className={cx('aosco-cell', 'aosco-cell--p1', 'bg-gray-500')} />
            <th colSpan={4} className={cx('aosco-cell', 'bg-green-700', 'text-white')}>
              {meta.cashContraLabel || '\u00A0'}
            </th>
            <th colSpan={dates.length + 1} className={cx('aosco-cell', 'bg-gray-500', 'text-white')}>
              {meta.bonusPlacementLabel}
            </th>
          </tr>
          <tr>
            <th colSpan={8} className={cx('aosco-cell', 'aosco-cell--p1', 'bg-blue-900')} />
            <th colSpan={4} className={cx('aosco-cell', 'bg-blue-900', 'text-white')}>
              {meta.weekCommencingLabel}
            </th>
            {dates.map((d) => (
              <th key={d} className={cx('aosco-cell', 'bg-blue-700', 'text-white')} title={d}>
                {d.slice(0, 5)}
                <br />
                {d.slice(6)}
              </th>
            ))}
            <th className={cx('aosco-cell', 'bg-blue-700', 'text-white')} />
          </tr>
          <tr>
            <th className={cx('aosco-cell', 'bg-sky-400', 'text-white', 'text-left')}>{meta.locality}</th>
            <th colSpan={6} className={cx('aosco-cell', 'bg-sky-400')} />
            <th className={cx('aosco-cell', 'bg-sky-200')}>SITE SIZES</th>
            <th colSpan={3} className={cx('aosco-cell', 'bg-green-300')}>{meta.reachInfoLabel}</th>
            <th colSpan={dates.length + 1} className={cx('aosco-cell', 'bg-green-700', 'text-white')}>
              {meta.broadcastInfoLabel || '\u00A0'}
            </th>
          </tr>
          <tr className={cx('bg-gray-200', 'text-gray-800')}>
            <th className="aosco-cell">SITE</th>
            <th className="aosco-cell">SOT</th>
            <th className="aosco-cell">Min/W</th>
            <th className="aosco-cell">Start</th>
            <th className="aosco-cell">End</th>
            <th className="aosco-cell">Imp/H</th>
            <th className="aosco-cell">Dwell</th>
            <th className="aosco-cell">Dims</th>
            <th className="aosco-cell">MoveID</th>
            <th className="aosco-cell">NIF</th>
            <th className="aosco-cell">7d%</th>
            <th className="aosco-cell">28d%</th>
            <th colSpan={dates.length} className={cx('aosco-cell', 'bg-yellow-300', 'text-gray-900')}>
              {meta.bonusNote}
            </th>
            <th className="aosco-cell">Wks</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, i) => (
            <tr key={i} className={row.bonus ? cx('text-red-600', 'font-semibold') : 'text-gray-900'}>
              <td className={cx('aosco-cell', 'aosco-cell--wrap')}>{row.n}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.sot}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.mpw}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.ot}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.ct}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.iph}</td>
              <td className={cx('aosco-cell', 'text-center', 'aosco-cell--wrap')}>{row.dwell}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.dim}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.fid}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.nif}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.r7}</td>
              <td className={cx('aosco-cell', 'text-center')}>{row.r28}</td>
              {dates.map((d) => {
                const placed = (row.ws || []).includes(d);
                return (
                  <td
                    key={d}
                    className={cx(
                      'aosco-cell',
                      'text-center',
                      placed && (row.bonus ? 'bg-yellow-300' : cx('bg-blue-500', 'text-white'))
                    )}
                  >
                    {placed ? 1 : ''}
                  </td>
                );
              })}
              <td className={cx('aosco-cell', 'bg-gray-100', 'text-center', 'font-semibold')}>
                {(row.ws || []).length}
              </td>
            </tr>
          ))}
          <tr className={cx('bg-gray-300', 'font-semibold')}>
            <td colSpan={12} className={cx('aosco-cell', 'text-right')}>Total Value</td>
            {weekTotals.map((total, i) => (
              <td key={i} className={cx('aosco-cell', 'text-center')}>{total}</td>
            ))}
            <td className={cx('aosco-cell', 'text-center')}>{weekTotals.reduce((sum, total) => sum + total, 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Billing table
// ---------------------------------------------------------------------------

interface BillingTableProps {
  campaignStartDate?: CrmValue; // deal.campaign_start_date
  campaignEndDate?: CrmValue;   // deal.campaign_end_date
  investment?: CrmValue;        // deal.total_commercial_rate (ex GST)
  gstAmount?: CrmValue;         // deal.gst_amount
  totalInvestment?: CrmValue;   // deal.total_investment (incl GST)
}

// One billing row, all values from the deal:
//   Flighting Dates         -> month of campaign start – month of campaign end
//   Billing UPFRONT         -> today's date, e.g. "23rd September 2026"
//   Advertising Investment  -> total_commercial_rate
//   plus GST 10%            -> gst_amount
//   Total Due incl GST      -> total_investment (also shown as TOTAL)
function BillingTable({ campaignStartDate, campaignEndDate, investment, gstAmount, totalInvestment }: BillingTableProps) {
  const flighting = flightingLabel(campaignStartDate, campaignEndDate);
  const today = todayInBrisbane();

  const investmentAmount = toAmount(investment);
  const gst = toAmount(gstAmount);
  // Falls back to investment + GST only if total_investment is empty.
  const total =
    toAmount(totalInvestment) ??
    (investmentAmount !== null || gst !== null ? (investmentAmount ?? 0) + (gst ?? 0) : null);

  return (
    <div className="aosco-billing">
      <table className="aosco-billing-table">
        <colgroup>
          <col style={{ width: '17%' }} />
          <col style={{ width: '31%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '19%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className={cx('aosco-billing-cell', 'aosco-billing-head')}>Flighting Dates</th>
            <th className={cx('aosco-billing-cell', 'aosco-billing-head', 'font-bold')}>Billing UPFRONT</th>
            <th className={cx('aosco-billing-cell', 'aosco-billing-head')}>
              Advertising
              <br />
              Investment
            </th>
            <th className={cx('aosco-billing-cell', 'aosco-billing-head')}>
              plus
              <br />
              GST 10%
            </th>
            <th className={cx('aosco-billing-cell', 'aosco-billing-head')}>
              Total Due to
              <br />
              AOSco
              <br />
              <span className="italic">incl</span> GST
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="aosco-billing-cell">{flighting || '\u00A0'}</td>
            <td className="aosco-billing-cell">
              {today.day}
              <sup>{ordinalSuffix(today.day)}</sup> {FULL_MONTHS[today.month - 1]} {today.year}
            </td>
            <td className="aosco-billing-cell">{investmentAmount !== null ? formatCurrency(investmentAmount) : '\u00A0'}</td>
            <td className="aosco-billing-cell">{gst !== null ? formatCurrency(gst) : '\u00A0'}</td>
            <td className="aosco-billing-cell">{total !== null ? formatCurrency(total) : '\u00A0'}</td>
          </tr>
          <tr>
            <td className="aosco-billing-cell">{'\u00A0'}</td>
            <td className="aosco-billing-cell" />
            <td className="aosco-billing-cell" />
            <td className={cx('aosco-billing-cell', 'font-bold')}>TOTAL:</td>
            <td className={cx('aosco-billing-cell', 'font-bold')}>{total !== null ? formatCurrency(total) : '\u00A0'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component — HubSpot quote module entry point
// ---------------------------------------------------------------------------

export function Component({ hublData }: Props) {
  const h: HublData = hublData || ({} as HublData);

  const data = parseQuoteMasterData(h.scheduleSummaryJson);

  const documentTitle = data.documentTitle || 'ADVERTISING AGREEMENT';
  const companyLegalName = data.companyLegalName || 'Australian Outdoor Sign Company Pty Ltd';
  const coverSrc = 'https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/Quote%20Cover.png';
  const logoSrc = 'https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/logo.png';
  const coverImageSrc = data.coverImageSrc;

  const schedule: ScheduleRow[] = Array.isArray(data.ad_schedules) ? data.ad_schedules.map(normalizeRow) : [];
  const resolvedWeekDates =
    Array.isArray(data.weekDates) && data.weekDates.length > 0
      ? data.weekDates.map((d) => formatDateDMY(d)).filter(Boolean)
      : buildWeekColumns(schedule);

  // -------------------------------------------------------------------------
  // CRM → form field mapping
  // Advertiser + Account Details come from the deal's own advertiser_*
  // properties (no longer from the billing contact / billing company).
  // Priority: deal property → quote_master_data JSON → default.
  // -------------------------------------------------------------------------
  // advertiser_contact_first_name + ' ' + advertiser_contact_last_name
  const advertiserFullName = [h.advertiserFirstName, h.advertiserLastName]
    .map((v) => firstFilled(v))
    .filter(Boolean)
    .join(' ');

  // Advertiser Details
  const adv: AdvertiserDetails = {
    greetingName: firstFilled(h.advertiserFirstName, data.advertiser?.greetingName, DEFAULT_ADVERTISER.greetingName),
    companyName: firstFilled(h.advertiserCompany, data.advertiser?.companyName),  // COMPANY NAME   <- advertiser_company
    contactName: firstFilled(advertiserFullName, data.advertiser?.contactName),   // Contact Name   <- first + last name
    phone: firstFilled(h.advertiserPhone, data.advertiser?.phone),                // Phone Number   <- advertiser_person_phone_number
    email: firstFilled(h.advertiserEmail, data.advertiser?.email),                // Email Address  <- advertiser_person_email_address
  };

  // Account Details — same deal properties as Advertiser Details
  const acc: AccountDetails = {
    accountsName: firstFilled(advertiserFullName, data.account?.accountsName),    // Accounts Name    <- first + last name
    accountsProcess: firstFilled(
      data.account?.accountsProcess,
      adv.greetingName ? `Please send to ${adv.greetingName} for distribution and payment` : '',
      DEFAULT_ACCOUNT.accountsProcess
    ),
    accountsEmail: firstFilled(h.advertiserEmail, data.account?.accountsEmail),   // Accounts Email 1 <- advertiser_person_email_address
  };

  // Campaign Booking
  const startDate = formatHubspotDate(h.campaignStartDate);
  const endDate = formatHubspotDate(h.campaignEndDate);
  const camp: CampaignBooking = {
    campaignName: firstFilled(h.dealName, data.campaign?.campaignName),
    // Incrementing deal number -> "AOS-0000001"
    referenceId: firstFilled(
      formatReferenceId(h.referenceNumber),
      data.campaign?.referenceId,
      DEFAULT_CAMPAIGN.referenceId
    ),
    // "NETWORK" for all 18 sites, otherwise the number of billboards on the schedule
    siteSizeType: firstFilled(data.campaign?.siteSizeType, siteSizeTypeLabel(schedule), DEFAULT_CAMPAIGN.siteSizeType),
    // Not specified by the client yet — only filled if quote_master_data provides it.
    type: firstFilled(data.campaign?.type),
    // Total campaign length in weeks, bonus weeks included (first to last booked week)
    weeksRequired: campaignWeeks(schedule, startDate, endDate),
    startDate,
    endDate,
  };

  const exec: Execution = {
    advertiser: {
      ...DEFAULT_EXECUTION.advertiser,
      ...(data.execution?.advertiser || {}),
      representativeName: firstFilled(data.execution?.advertiser?.representativeName, advertiserFullName),
    },
    aosco: { ...DEFAULT_EXECUTION.aosco, ...(data.execution?.aosco || {}) },
  };
  const meta: ScheduleMeta = {
    ...DEFAULT_SCHEDULE_META,
    // Default label follows the actual schedule instead of a fixed "8 Weeks".
    bonusPlacementLabel: resolvedWeekDates.length
      ? `${resolvedWeekDates.length} Weeks Paid and Bonus Placement`
      : DEFAULT_SCHEDULE_META.bonusPlacementLabel,
    ...data.scheduleMeta,
  };
  const specialConditions = data.specialConditions ?? DEFAULT_SPECIAL_CONDITIONS;

  return (
    <div className="aosco-root">
      <style>{MODULE_CSS}</style>

      {/* Cover page */}
      <section className="aosco-cover">
        {coverImageSrc && <img src={coverImageSrc} alt="" className="aosco-cover-img" />}
        <div className="aosco-cover-overlay" />

        <div className="aosco-cover-center">
          {coverSrc ? (
            <img src={coverSrc} alt={companyLegalName} className="aosco-cover-logo-img" />
          ) : (
            <div>
              <div className="aosco-text-logo">
                AOS<span className="aosco-text-logo-sup">Co.</span>
              </div>
              <p className="aosco-tagline">Australian Outdoor Sign Company</p>
            </div>
          )}
        </div>
      </section>

      {/* Content page header bar */}
      <div className="aosco-header-bar">
        <h1 className="aosco-header-title">{documentTitle}</h1>
        {logoSrc ? (
          <img src={logoSrc} alt={companyLegalName} className="aosco-header-logo-img" />
        ) : (
          <span className="aosco-header-text-logo">AOS<span className="aosco-header-text-logo-sup">Co.</span></span>
        )}
      </div>

      <div className="aosco-body">
        <p className="aosco-greeting">Dear {adv.greetingName || '\u00A0'},</p>
        <p className="aosco-intro">Thank you for the opportunity to provide our services to you.</p>
        <p className="aosco-intro-last">
          This document and the <strong>attached</strong> Terms and Conditions set out the basis on which AOSCO provide our services.
        </p>

        {/* Advertiser + Account Details */}
        <section className="aosco-section">
          <p className="aosco-section-heading">Advertiser Details</p>
          <FieldLine label="COMPANY NAME:" value={adv.companyName} />
          <FieldLine label="Contact Name:" value={adv.contactName} />
          <FieldLine label="Phone Number:" value={adv.phone} />
          <FieldLine label="Email Address:" value={adv.email} />

          <p className={cx('aosco-section-heading', 'aosco-section-heading--mt')}>Account Details</p>
          <FieldLine label="Accounts Name:" value={acc.accountsName} />
          <FieldLine label="Accounts Process:" value={acc.accountsProcess} underline={false} />
          <FieldLine label="Accounts Email 1:" value={acc.accountsEmail} />
        </section>

        {/* Campaign Booking */}
        <section className="aosco-section">
          <p className="aosco-section-heading">Campaign Booking</p>
          <FieldLine label="Campaign Name:" value={camp.campaignName} />
          <FieldLine label="Reference ID:" value={camp.referenceId} />
          <FieldLine label="Site, Size & Type of Selected Billboards:" value={camp.siteSizeType} />
          <FieldLine label="Type:" value={camp.type} />
          <FieldLine label="Weeks Required:" value={camp.weeksRequired} />
          <FieldLine label="Start Date:" value={camp.startDate} />
          <FieldLine label="End Date:" value={camp.endDate} />
        </section>

        {/* Schedule + Billing */}
        <section className="aosco-section">
          <p className="aosco-section-heading aosco-section-heading--underline">Schedule:</p>
          <ScheduleTable schedule={schedule} weekDates={resolvedWeekDates} meta={meta} />

          <br/>
          <p className="aosco-section-heading aosco-section-heading--underline">Billing:</p>
          <p className="aosco-billing-subtitle">ATT Accounts:</p>
          <p className="aosco-billing-line">Invoice 1:</p>
          <p className="aosco-billing-line">Invoice 2:</p>

          <BillingTable
            campaignStartDate={h.campaignStartDate}
            campaignEndDate={h.campaignEndDate}
            investment={h.investment}
            gstAmount={h.gstAmount}
            totalInvestment={h.totalInvestment}
          />
        </section>

        {/* Special Conditions */}
        <section className="aosco-section">
          <p className="aosco-section-heading aosco-section-heading--underline">Special conditions:</p>
          <ol className="aosco-sc-list" style={{ listStyleType: 'decimal' }}>
            {specialConditions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        </section>

        {/* Execution / signatures */}
        <section className="aosco-section aosco-section--exec">
          <p className="aosco-section-heading">Execution</p>
          <p className="aosco-exec-intro">
            I acknowledge that I have received and read this Agreement, confirm that the details contained within
            (including regarding payments due) are correct and hereby agree to be bound to this Agreement and the
            Terms and Conditions as <strong>attached.</strong>
          </p>
          <div className="aosco-exec-grid">
            <div>
              <p className="aosco-exec-col-title">Executed on behalf of {adv.companyName || '\u00A0'} by</p>
              <FieldLine label="Representative Name:" value={exec.advertiser.representativeName} />
              <FieldLine label="Position:" value={exec.advertiser.position} />
              <FieldLine label="Date:" value={exec.advertiser.date} />
            </div>
            <div>
              <p className="aosco-exec-col-title">Executed on behalf of {companyLegalName}</p>
              <FieldLine label="Representative Name:" value={exec.aosco.representativeName} />
              <FieldLine label="Position:" value={exec.aosco.position} />
              <FieldLine label="Date:" value={exec.aosco.date} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export const meta = {
  label: "AOSco Quote",
  content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
};

// Flattened so the React side gets simple, predictable keys (see HublData).
// All advertiser/account details now come from the deal itself.
export const hublDataTemplate = `
  {% set dealData = crm_object("deal", quoteTemplateContext.deal.hs_object_id, "hs_object_id,dealname,aos_reference_number,quote_master_data,campaign_start_date,campaign_end_date,total_commercial_rate,gst_amount,total_investment,advertiser_company,advertiser_person_email_address,advertiser_contact_first_name,advertiser_contact_last_name,advertiser_person_phone_number") %}

  {% set hublData = {
    "isQuoteBlueprint": isQuoteBlueprint,
    "dealId": dealData.hs_object_id,
    "dealName": dealData.dealname,
    "referenceNumber": dealData.aos_reference_number,
    "campaignStartDate": dealData.campaign_start_date,
    "campaignEndDate": dealData.campaign_end_date,
    "totalInvestment": dealData.total_investment,
    "investment": dealData.total_commercial_rate,
    "gstAmount": dealData.gst_amount,
    "scheduleSummaryJson": dealData.quote_master_data,
    "advertiserCompany": dealData.advertiser_company,
    "advertiserEmail": dealData.advertiser_person_email_address,
    "advertiserFirstName": dealData.advertiser_contact_first_name,
    "advertiserLastName": dealData.advertiser_contact_last_name,
    "advertiserPhone": dealData.advertiser_person_phone_number,
  } %}
`;