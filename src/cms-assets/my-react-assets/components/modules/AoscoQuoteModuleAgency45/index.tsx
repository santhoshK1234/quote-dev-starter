import React from "react";

import { fields } from "./fields";

// Styles live in a shared .css file; `?raw` imports it as a string so it can
// still be injected via <style> (SSR + quote PDF render, no Tailwind here).
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
  address: string;
}

export interface AccountDetails {
  accountsName: string;
  accountsProcess: string;
  accountsEmail: string;
}

export interface AgencyDetails {
  agencyName: string;
  shortName?: string; // e.g. "OAC" -> "OAC commission 30%"
  addressLine1: string;
  addressLine2: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface CampaignBooking {
  campaignName: string;
  referenceId: string;
  siteSizeType: string;
  type: string;
  weeksRequired: number | string;
  startDate: string;
  endDate: string;
}

export interface ScheduleMeta {
  locality: string; // cover subtitle, e.g. "Caboolture & Gold Coast Digital"
  state: string; // default state for the placements table
  bonusNote: string;
}

export interface ExecutionParty {
  representativeName: string;
  position: string;
  date: string;
  onBehalfOf?: string; // e.g. "Toyota / OA Collective (820MJL8IF)"
}

// One row of quote_master_data.ad_schedules
export interface QuoteAdSchedule {
  n?: string | null; // site name
  fid?: string | null; // face ID -> site code
  bonus?: boolean | null;
  ws?: string[]; // week-start dates "dd/mm/yyyy"
  dim?: string | null; // "12.0x3.3 m"
  st?: string | null; // state (optional)
  sot?: string | null;
  mpw?: string | null;
  ot?: string | null;
  ct?: string | null;
  iph?: string | null;
  nif?: string | null;
  r7?: string | null;
  r28?: string | null;
  dwell?: string | null;
  totalWeeks?: number;
}

// The parsed shape of the quote_master_data JSON property.
export interface QuoteMasterData {
  logoSrc?: string;
  coverImageSrc?: string;
  documentTitle?: string;
  companyLegalName?: string;
  advertiser?: Partial<AdvertiserDetails>;
  account?: Partial<AccountDetails>;
  agency?: Partial<AgencyDetails>;
  campaign?: Partial<CampaignBooking>;
  ad_schedules?: QuoteAdSchedule[];
  scheduleMeta?: Partial<ScheduleMeta>;
  specialConditions?: string[];
  execution?: {
    advertiser?: Partial<ExecutionParty>;
    aosco?: Partial<ExecutionParty>;
  };
}

// The parsed shape of the agency_quote_master_data JSON property
// (built by the NestJS line-item sync). Short keys keep the JSON small.
export interface AgencyQuoteMonth {
  k: string; // month "YYYY-MM"
  w: number; // weeks booked (all schedules)
  r: number; // client total  -> "Total (less agency comm)"
  a: number; // agency commission
}

export interface AgencyQuoteSchedule {
  n: string | null; // name
  r: number; // client_rate_per_week
  a: number; // agency_discount_amount per week
  w: Record<string, number>; // weeks per month
  d?: string[]; // week-start dates "YYYY-MM-DD"
}

export interface AgencyQuoteMasterData {
  v?: number;
  m?: AgencyQuoteMonth[];
  s?: AgencyQuoteSchedule[];
}

// ---------------------------------------------------------------------------
// HubSpot module types
// ---------------------------------------------------------------------------

type CrmValue = string | number | null | undefined;

// Must match the keys built in hublDataTemplate at the bottom of this file.
// Everything comes from the DEAL record only (single source of truth).
interface HublData {
  isQuoteBlueprint: boolean;

  dealId?: CrmValue;
  dealName?: CrmValue;
  campaignStartDate?: CrmValue;
  campaignEndDate?: CrmValue;
  scheduleSummaryJson?: unknown; // quote_master_data
  agencyQuoteJson?: unknown; // agency_quote_master_data
  agencyDiscount?: CrmValue; // agency_discount (0.3 or 30 both mean 30%)

  // actualMarketRate - discount - agency commission = investment
  // investment + gstAmount = totalInvestment
  actualMarketRate?: CrmValue; // total_bill_amount_before_discount_total_market_rate (before all discounts)
  investment?: CrmValue; // total_commercial_rate (ex GST, after discount and agency commission)
  gstAmount?: CrmValue;
  totalInvestment?: CrmValue;

  advertiserCompany?: CrmValue;
  advertiserFirstName?: CrmValue;
  advertiserLastName?: CrmValue;
  advertiserPhone?: CrmValue;
  advertiserEmail?: CrmValue;

  agencyCompanyName?: CrmValue;
  agencyFirstName?: CrmValue;
  agencyLastName?: CrmValue;
  agencyEmail?: CrmValue;
  agencyPhone?: CrmValue;
  agencyAddress?: CrmValue;
  agencyAddressLine2?: CrmValue;
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
  "https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/logo.png";
// Cover photo. Swap for the billboard photo once it's uploaded to File Manager.
const HERO_IMAGE_SRC =
  "https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/Quote%20Cover.png";

const GST_RATE = 0.1;
const DEFAULT_COMMISSION_RATE = 0.1; // only when agency_discount is empty and nothing can be derived
const BILLING_DAYS_EOM = 47; // invoice due = end of flighting month + 47 days
const NETWORK_SITE_COUNT = 18; // every site on the AOSco network
const MAX_GRID_WEEKS = 26; // cap when stretching the grid to the deal start/end dates
const DEFAULT_STATE = "QLD";
const DEFAULT_TYPE = "Digital billboards";
const FORMAT_WORD = "Digital";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_UPPER = MONTHS_SHORT.map((m) => m.toUpperCase());
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ===========================================================================
// Generic helpers
// ===========================================================================

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// Returns the first value that isn't null/undefined/blank, as a string.
function firstFilled(...values: CrmValue[]): string {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return "";
}

function fullName(first: CrmValue, last: CrmValue): string {
  return [first, last].map((v) => firstFilled(v)).filter(Boolean).join(" ");
}

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// "a", "a and b", "a, b and c"
function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// "4000", "4,000.00", "$4,000.00", 4000 -> 4000; blank/unreadable -> null.
function toAmount(value: CrmValue): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/[^0-9.-]/g, "");
  if (s === "" || s === "-" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// "0.3", "30", "30%" -> 0.3. Values above 1 are read as a percentage.
function toRate(value: CrmValue): number | null {
  const n = toAmount(value);
  if (n === null || n < 0) return null;
  return n > 1 ? n / 100 : n;
}

// 0.3 -> "30%", 0.1111 -> "11.11%"
function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}

function formatCurrency(value: number, dropZeroCents = false): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0.00";
  const whole = dropZeroCents && Number.isInteger(round2(n));
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
}

const money = (n: number | null | undefined) =>
  n === null || n === undefined ? "\u2014" : formatCurrency(n);
const negativeMoney = (n: number | null | undefined) =>
  n === null || n === undefined ? "\u2014" : `\u2013${formatCurrency(Math.abs(n))}`;

// JSON deal properties can arrive as a JSON string, an object, an
// HTML-escaped string (&quot;…) or a double-encoded JSON string.
function parseJsonProperty<T extends object>(raw: unknown): Partial<T> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Partial<T>;

  const tryParse = (text: string): unknown => {
    try {
      let parsed: unknown = JSON.parse(text);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
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
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    parsed = tryParse(decoded);
  }
  return typeof parsed === "object" && parsed !== null ? (parsed as Partial<T>) : {};
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

// HubSpot deal date -> "dd/mm/yyyy". Handles "1/9/26", "01/09/2026",
// ISO "2026-09-01" and epoch ms/seconds.
function formatHubspotDate(value: CrmValue): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})(?!\d)/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return "";
    return `${pad2(day)}/${pad2(month)}/${year}`;
  }

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;

  if (/^\d+(\.\d+)?(e\+?\d+)?$/i.test(raw)) {
    const n = Number(raw);
    let date: Date | null = null;
    if (n > 1e11) date = new Date(n);
    else if (n > 1e8) date = new Date(n * 1000);
    if (!date || Number.isNaN(date.getTime())) return "";
    return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
  }

  return "";
}

// "15/09/2026" or "2026-09-15" -> UTC ms; else null.
function toDayMs(value: unknown): number | null {
  const s = String(value ?? "").trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  return null;
}

function parseDealDate(value: CrmValue): number | null {
  return toDayMs(formatHubspotDate(value));
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
  if (a0 === null || b0 === null) return "";
  const a = toDateParts(a0);
  const b = toDateParts(b0);
  const ma = MONTHS_SHORT[a.month - 1];
  const mb = MONTHS_SHORT[b.month - 1];
  if (a.year !== b.year) return `${ma} ${a.year} \u2013 ${mb} ${b.year}`;
  if (a.month !== b.month) return `${ma} \u2013 ${mb} ${b.year}`;
  return `${ma} ${b.year}`;
}

// "MAR-2027"
function flightMonthLabel(t: number): string {
  const p = toDateParts(t);
  return `${MONTHS_UPPER[p.month - 1]}-${p.year}`;
}

function monthKey(t: number): string {
  const p = toDateParts(t);
  return `${p.year}-${pad2(p.month)}`;
}

// End of the month containing t, plus BILLING_DAYS_EOM days.
function billingDateFor(t: number): DateParts {
  const p = toDateParts(t);
  return toDateParts(Date.UTC(p.year, p.month, 0) + BILLING_DAYS_EOM * DAY_MS);
}

function ordinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

// "22nd MAY 2027"
function billingDateLabel(p: DateParts | null): string {
  if (!p) return "\u00A0";
  return `${p.day}${ordinalSuffix(p.day)} ${FULL_MONTHS[p.month - 1].toUpperCase()} ${p.year}`;
}

// ===========================================================================
// Sites (merges quote_master_data.ad_schedules with agency_quote_master_data.s)
// ===========================================================================

interface SiteRow {
  key: string;
  code: string; // face ID
  name: string; // display name
  locality: string; // "Caboolture" from "Caboolture – 66 Morayfield Rd"
  bonus: boolean;
  size: string; // "12.0 x 3.3 m"
  state: string;
  weeks: number[]; // sorted, unique week-start dates (UTC ms)
  netPerWeek: number; // client rate (after agency commission)
  commissionPerWeek: number;
}

const MONTH_WORD = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";
const PERIOD_PREFIX = new RegExp(`^${MONTH_WORD}\\s*[-\u2013]\\s*${MONTH_WORD}\\s+[-\u2013]\\s+`, "i");

// "Oct-Jan - BONUS NEWMARKET LANDSCAPE" -> "NEWMARKET LANDSCAPE"
function cleanSiteName(raw: string): string {
  const cleaned = raw
    .replace(PERIOD_PREFIX, "")
    .replace(/^bonus\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || raw.trim();
}

// "Caboolture – 66 Morayfield Rd" -> "Caboolture"; no separator -> ""
function siteLocality(name: string): string {
  const parts = name.split(/\s+[\u2013-]\s+/);
  return parts.length > 1 ? parts[0].trim() : "";
}

const normName = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim().toLowerCase();

function uniqueSortedDays(list: unknown[]): number[] {
  return uniq(list.map(toDayMs).filter((t): t is number => t !== null)).sort((a, b) => a - b);
}

function makeSiteRow(
  q: QuoteAdSchedule | null,
  s: AgencyQuoteSchedule | null,
  index: number,
  defaultState: string,
): SiteRow {
  const rawName = firstFilled(q?.n, s?.n);
  const name = cleanSiteName(rawName);

  const agencyDates = s?.d;
  const quoteDates = q?.ws;
  const fromAgency = uniqueSortedDays(Array.isArray(agencyDates) ? agencyDates : []);
  const weeks = fromAgency.length
    ? fromAgency
    : uniqueSortedDays(Array.isArray(quoteDates) ? quoteDates : []);

  const net = Number(s?.r) || 0;
  const commission = Number(s?.a) || 0;
  const bonus =
    typeof q?.bonus === "boolean"
      ? q.bonus
      : s
        ? net === 0 && commission === 0
        : /\bbonus\b/i.test(rawName);

  return {
    key: String(index),
    code: firstFilled(q?.fid).replace(/\.0+$/, ""),
    name,
    locality: siteLocality(name),
    bonus,
    size: firstFilled(q?.dim).replace(/\s*x\s*/i, " x "),
    state: firstFilled(q?.st, defaultState),
    weeks,
    netPerWeek: bonus ? 0 : net,
    commissionPerWeek: bonus ? 0 : commission,
  };
}

function buildSites(
  data: QuoteMasterData,
  agencyData: AgencyQuoteMasterData,
  defaultState: string,
): SiteRow[] {
  const quoteRows = Array.isArray(data.ad_schedules) ? data.ad_schedules : [];
  const agencyRows = Array.isArray(agencyData.s) ? agencyData.s : [];

  if (quoteRows.length === 0) {
    return agencyRows.map((s, i) => makeSiteRow(null, s, i, defaultState));
  }

  const agencyByName = new Map<string, AgencyQuoteSchedule>();
  for (const s of agencyRows) {
    const k = normName(s?.n);
    if (k && !agencyByName.has(k)) agencyByName.set(k, s);
  }
  return quoteRows.map((q, i) =>
    makeSiteRow(q, agencyByName.get(normName(q?.n)) ?? null, i, defaultState),
  );
}

// Continuous weekly columns covering every booked week, stretched to the
// deal's start/end dates (e.g. WK1 = 1 Feb even if nothing runs that week).
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
  const groups: Array<{ key: string; label: string; span: number; month: number; year: number }> = [];
  for (const w of weeks) {
    const p = toDateParts(w);
    const key = `${p.year}-${p.month}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.span += 1;
    else groups.push({ key, label: "", span: 1, month: p.month, year: p.year });
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

// ===========================================================================
// Billing — one row per flighting month, billed 47 days EOM
// ===========================================================================

interface BillingRowCalc {
  key: string;
  flighting: string; // "MAR-2027"
  billing: DateParts | null;
  investment: number; // before agency commission
  commission: number;
  net: number; // "Total (less agency comm)"
  gst: number;
  total: number; // net + GST
}

interface MoneyTotals {
  investment: number;
  commission: number;
  net: number;
  gst: number;
  total: number;
}

function toBillingRow(key: string, flighting: string, billing: DateParts | null, netRaw: number, commissionRaw: number): BillingRowCalc {
  const net = round2(netRaw);
  const commission = round2(commissionRaw);
  const gst = round2(net * GST_RATE); // GST is on the amount after agency commission
  return {
    key,
    flighting,
    billing,
    investment: round2(net + commission),
    commission,
    net,
    gst,
    total: round2(net + gst),
  };
}

// Uses agency_quote_master_data.m (month totals); if that's missing, sums the
// paid weeks per month from the site rows. Months with nothing to bill are skipped.
function monthlyBillingRows(agencyData: AgencyQuoteMasterData, sites: SiteRow[]): BillingRowCalc[] {
  const byMonth = new Map<string, { net: number; commission: number }>();
  const add = (k: string, net: number, commission: number) => {
    const cur = byMonth.get(k) ?? { net: 0, commission: 0 };
    cur.net += net;
    cur.commission += commission;
    byMonth.set(k, cur);
  };

  const months = Array.isArray(agencyData.m) ? agencyData.m : [];
  if (months.length > 0) {
    for (const m of months) {
      const k = String(m?.k ?? "");
      if (/^\d{4}-\d{2}$/.test(k)) add(k, Number(m.r) || 0, Number(m.a) || 0);
    }
  } else {
    for (const s of sites) {
      if (s.bonus) continue;
      for (const t of s.weeks) add(monthKey(t), s.netPerWeek, s.commissionPerWeek);
    }
  }

  return [...byMonth.entries()]
    .filter(([, v]) => v.net + v.commission > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => {
      const [y, mo] = k.split("-").map(Number);
      const t = Date.UTC(y, mo - 1, 1);
      return toBillingRow(k, flightMonthLabel(t), billingDateFor(t), v.net, v.commission);
    });
}

// Single row from the deal totals, when there's no agency quote data.
// investment is after agency commission; commission is a % of the market rate.
function dealBillingRows(
  investmentValue: CrmValue,
  marketRate: number | null,
  rate: number,
  startMs: number | null,
  endMs: number | null,
): BillingRowCalc[] {
  const net = toAmount(investmentValue);
  if (net === null) return [];
  const commission = marketRate !== null ? marketRate * rate : rate < 1 ? (net * rate) / (1 - rate) : 0;

  let flighting = "";
  if (startMs !== null && endMs !== null) {
    const a = flightMonthLabel(startMs);
    const b = flightMonthLabel(endMs);
    flighting = a === b ? a : `${a} \u2013 ${b}`;
  } else if (startMs !== null || endMs !== null) {
    flighting = flightMonthLabel((startMs ?? endMs) as number);
  }
  const billFrom = endMs ?? startMs;
  return [
    toBillingRow("deal", flighting, billFrom !== null ? billingDateFor(billFrom) : null, net, commission),
  ];
}

function sumRows(rows: BillingRowCalc[]): MoneyTotals | null {
  if (rows.length === 0) return null;
  return rows.reduce<MoneyTotals>(
    (t, r) => ({
      investment: round2(t.investment + r.investment),
      commission: round2(t.commission + r.commission),
      net: round2(t.net + r.net),
      gst: round2(t.gst + r.gst),
      total: round2(t.total + r.total),
    }),
    { investment: 0, commission: 0, net: 0, gst: 0, total: 0 },
  );
}

// ===========================================================================
// Default copy
// ===========================================================================

const DEFAULT_EXECUTION = {
  advertiser: { representativeName: "", position: "Director", date: "" },
  aosco: { representativeName: "Jesse McIntyre", position: "Sales Director", date: "" },
};

function defaultSpecialConditions(agencyName: string): string[] {
  const list = [
    "Unlimited material changes / uploads included.",
    `Billed ${BILLING_DAYS_EOM} days EOM.`,
    "Cancellation (COVID consideration): AOSco agrees to honour a 7-day cancellation deadline, effective up until the Monday before campaign launch, in writing.",
    "AOSco will offer bonus STA sites to the same spec if we have the avails.",
    "Bonus offered in this campaign is placed STA.",
  ];
  if (agencyName) {
    list.push(
      `Monies owed to AOSco can be resolved outside of ${agencyName} if ${agencyName} are trading insolvent \u2013 settled with media agency directly, monies due as per the above term dates.`,
    );
  }
  return list;
}

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
    <table className={cx("aosco-card", wide && "aosco-card--wide")}>
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
            <td>{value || "\u00A0"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stat({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={cx("aosco-stat", dark && "aosco-stat--dark")}>
      <div className="aosco-stat-label">{label}</div>
      <div className="aosco-stat-value">{value || "\u00A0"}</div>
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
  tone?: "dark" | "gold";
}) {
  return (
    <div className={cx("aosco-glance-tile", tone && `aosco-glance-tile--${tone}`)}>
      <div className="aosco-glance-label">{label}</div>
      <div className="aosco-glance-value">{value}</div>
    </div>
  );
}

function SignField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="aosco-sign">
      <div className="aosco-mini-label">{label}</div>
      <div className="aosco-sign-value">{value || "\u00A0"}</div>
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
      <table className={cx("aosco-grid", dense && "aosco-grid--dense")}>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: dense ? "17%" : "20%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "7%" }} />
          {weeks.map((w) => (
            <col key={w} />
          ))}
          <col style={{ width: "5%" }} />
          <col style={{ width: "5%" }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={4} className="aosco-grid-band">
              {FORMAT_WORD.toUpperCase()} LARGE FORMAT
            </th>
            {monthGroups(weeks).map((g, i) => (
              <th key={g.key} colSpan={g.span} className={cx("aosco-grid-band", i % 2 === 1 && "aosco-grid-band--alt")}>
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
              <td className="aosco-left">{s.code || "\u2013"}</td>
              <td className="aosco-left aosco-grid-site">{s.name}</td>
              <td className={s.bonus ? "aosco-spot-bonus" : "aosco-spot-paid"}>{s.bonus ? "Bonus" : "Paid"}</td>
              <td>{s.size || "\u2013"}</td>
              {weeks.map((w, i) =>
                booked[r].has(i) ? (
                  <td key={w} className={s.bonus ? "aosco-cell-gtd" : "aosco-cell-paid"}>
                    {s.bonus ? "GTD" : "1"}
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
              <td key={i}>{n || "\u2013"}</td>
            ))}
            <td>{paidSites}</td>
            <td>{bonusSites}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface SiteAmounts {
  market: number;
  discount: number;
  commission: number;
  investment: number; // after discount and agency commission
}

// Site rows only carry the client rate and agency commission, so the market
// rate is worked back from the deal-level discount % (same % on every site).
function siteAmounts(s: SiteRow, discountRate: number): SiteAmounts {
  const investment = round2(s.weeks.length * s.netPerWeek);
  const commission = round2(s.weeks.length * s.commissionPerWeek);
  const afterDiscount = investment + commission;
  const market = round2(discountRate < 1 ? afterDiscount / (1 - discountRate) : afterDiscount);
  return { market, discount: round2(market - afterDiscount), commission, investment };
}

function PlacementsTable({
  sites,
  discountRate,
  discountLabel,
  commissionLabel,
}: {
  sites: SiteRow[];
  discountRate: number | null; // null = no market rate on the deal: discount columns hidden
  discountLabel: string;
  commissionLabel: string;
}) {
  const paidWeeks = sites.filter((s) => !s.bonus).reduce((n, s) => n + s.weeks.length, 0);
  const bonusWeeks = sites.filter((s) => s.bonus).reduce((n, s) => n + s.weeks.length, 0);
  const showDiscount = discountRate !== null;
  const amounts = sites.map((s) => siteAmounts(s, discountRate ?? 0));
  const sum = (pick: (a: SiteAmounts) => number) => round2(amounts.reduce((n, a) => n + pick(a), 0));
  const dash = "\u2013";

  return (
    <table className="aosco-table aosco-table--compact">
      <thead>
        <tr>
          <th style={{ width: "8%" }}>Site code</th>
          <th>Site</th>
          <th style={{ width: "5%" }}>State</th>
          <th style={{ width: "10%" }}>Format &amp; size</th>
          <th style={{ width: "14%" }}>Week commencing</th>
          <th className="mid" style={{ width: "6%" }}>Paid weeks</th>
          <th className="mid" style={{ width: "6%" }}>Bonus weeks</th>
          {showDiscount && <th className="num" style={{ width: "9%" }}>Market rate</th>}
          {showDiscount && <th className="num" style={{ width: "9%" }}>{discountLabel}</th>}
          <th className="num" style={{ width: "9%" }}>{commissionLabel}</th>
          <th className="num" style={{ width: "9%" }}>Investment</th>
        </tr>
      </thead>
      <tbody>
        {sites.map((s, i) => {
          const first = s.weeks[0];
          const last = s.weeks[s.weeks.length - 1];
          const a = amounts[i];
          return (
            <tr key={s.key}>
              <td>{s.code || "\u2013"}</td>
              <td className="strong">{s.name}</td>
              <td>{s.state}</td>
              <td>{[FORMAT_WORD, s.size].filter(Boolean).join(" ")}</td>
              <td>
                {first === undefined
                  ? "\u2013"
                  : s.weeks.length === 1
                    ? dayMonthYear(first)
                    : `${dayMonthYear(first)} \u2013 ${dayMonthYear(last)}`}
              </td>
              <td className="mid">{s.bonus ? "\u2013" : s.weeks.length}</td>
              <td className={cx("mid", s.bonus && "aosco-table-bonus")}>
                {s.bonus ? `${s.weeks.length} (GTD)` : "\u2013"}
              </td>
              {showDiscount && <td className="num">{s.bonus ? dash : money(a.market)}</td>}
              {showDiscount && <td className="num">{s.bonus ? dash : negativeMoney(a.discount)}</td>}
              <td className="num">{s.bonus ? dash : negativeMoney(a.commission)}</td>
              <td className={cx("num", s.bonus ? "aosco-table-bonus" : "strong")}>
                {s.bonus ? "No charge" : money(a.investment)}
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
          {showDiscount && <td className="num">{money(sum((a) => a.market))}</td>}
          {showDiscount && <td className="num">{negativeMoney(sum((a) => a.discount))}</td>}
          <td className="num">{negativeMoney(sum((a) => a.commission))}</td>
          <td className="num">{money(sum((a) => a.investment))}</td>
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
  const data = parseJsonProperty<QuoteMasterData>(h.scheduleSummaryJson) as QuoteMasterData;
  const agencyData = parseJsonProperty<AgencyQuoteMasterData>(h.agencyQuoteJson) as AgencyQuoteMasterData;

  const documentTitle = firstFilled(data.documentTitle, "ADVERTISING ORDER");
  const companyLegalName = firstFilled(data.companyLegalName, "Australian Outdoor Sign Company Pty Ltd");
  const logoSrc = firstFilled(data.logoSrc, LOGO_SRC);
  const heroSrc = firstFilled(data.coverImageSrc, HERO_IMAGE_SRC);

  // -------------------------------------------------------------------------
  // People. Priority: deal property -> quote_master_data -> default.
  // The agency contact (when there is one) is the person the order is
  // addressed to, signs it, and receives the invoices.
  // -------------------------------------------------------------------------
  const adv = {
    companyName: firstFilled(h.advertiserCompany, data.advertiser?.companyName),
    contactName: firstFilled(fullName(h.advertiserFirstName, h.advertiserLastName), data.advertiser?.contactName),
    phone: firstFilled(h.advertiserPhone, data.advertiser?.phone),
    email: firstFilled(h.advertiserEmail, data.advertiser?.email),
  };

  const agency = {
    name: firstFilled(h.agencyCompanyName, data.agency?.agencyName),
    shortName: firstFilled(data.agency?.shortName),
    address: [
      firstFilled(h.agencyAddress, data.agency?.addressLine1),
      firstFilled(h.agencyAddressLine2, data.agency?.addressLine2),
    ]
      .filter(Boolean)
      .join(", "),
    contactName: firstFilled(fullName(h.agencyFirstName, h.agencyLastName), data.agency?.contactName),
    phone: firstFilled(h.agencyPhone, data.agency?.phone),
    email: firstFilled(h.agencyEmail, data.agency?.email),
  };

  const primary = agency.contactName
    ? {
        name: agency.contactName,
        first: firstFilled(h.agencyFirstName, agency.contactName.split(" ")[0]),
        email: agency.email,
      }
    : {
        name: adv.contactName,
        first: firstFilled(h.advertiserFirstName, data.advertiser?.greetingName, adv.contactName.split(" ")[0]),
        email: adv.email,
      };
  const greetingName = firstFilled(primary.first, data.advertiser?.greetingName, "Customer");
  const accounts = {
    name: firstFilled(primary.name, data.account?.accountsName),
    email: firstFilled(primary.email, data.account?.accountsEmail),
  };

  // -------------------------------------------------------------------------
  // Schedule
  // -------------------------------------------------------------------------
  const defaultState = firstFilled(data.scheduleMeta?.state, DEFAULT_STATE);
  const sites = buildSites(data, agencyData, defaultState);
  const paidSites = sites.filter((s) => !s.bonus);
  const bonusSites = sites.filter((s) => s.bonus);
  const paidWeeks = paidSites.reduce((n, s) => n + s.weeks.length, 0);
  const bonusWeeks = bonusSites.reduce((n, s) => n + s.weeks.length, 0);

  const bookedTimes = sites.flatMap((s) => s.weeks);
  const firstBooked = bookedTimes.length ? Math.min(...bookedTimes) : null;
  const lastBooked = bookedTimes.length ? Math.max(...bookedTimes) : null;

  const dealStart = parseDealDate(h.campaignStartDate);
  const dealEnd = parseDealDate(h.campaignEndDate);
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
  const titleParen = titleMatch && titleMatch[1] ? titleMatch[2] : "";

  const referenceId = firstFilled(
    data.campaign?.referenceId,
    h.dealId ? `AOS-${firstFilled(h.dealId)}` : "",
  );

  const uniqueSiteCount = new Set(sites.map((s) => (s.code || s.name).toLowerCase())).size;
  const isNetwork = uniqueSiteCount >= NETWORK_SITE_COUNT;
  const localities = uniq(sites.map((s) => s.locality));
  const shortLocalities =
    localities.length > 0 && localities.length <= 2 && localities.every(Boolean) ? localities : [];

  const sitesTile = isNetwork
    ? "AOSco Network"
    : shortLocalities.length
      ? shortLocalities.join(" + ")
      : uniqueSiteCount
        ? plural(uniqueSiteCount, "site")
        : "";

  const subtitle = [
    titleParen,
    firstFilled(
      data.scheduleMeta?.locality,
      shortLocalities.length ? `${shortLocalities.join(" & ")} ${FORMAT_WORD}` : "",
    ),
  ]
    .filter(Boolean)
    .join(" \u00B7 ");

  const onAir = bonusWeeks
    ? `${paidWeeks} paid + ${plural(bonusWeeks, "bonus week")}`
    : paidWeeks
      ? plural(paidWeeks, "paid week")
      : "";

  const weeksRequired = bonusWeeks
    ? `${plural(paidWeeks + bonusWeeks, "week")} (${paidWeeks} paid + ${bonusWeeks} guaranteed bonus)`
    : paidWeeks
      ? plural(paidWeeks, "week")
      : "";

  const sitesBooking = firstFilled(
    data.campaign?.siteSizeType,
    isNetwork
      ? "NETWORK \u2013 as per schedule"
      : sites.length
        ? `As per schedule: ${joinAnd(
            sites.map(
              (s) =>
                `${s.name} (${[s.code, s.bonus ? "guaranteed bonus" : "paid"].filter(Boolean).join(", ")})`,
            ),
          )}`
        : "",
  );

  // -------------------------------------------------------------------------
  // Money
  // -------------------------------------------------------------------------
  const configuredRate = toRate(h.agencyDiscount);
  const marketRate = toAmount(h.actualMarketRate);
  const monthRows = monthlyBillingRows(agencyData, sites);
  const billingRows = monthRows.length
    ? monthRows
    : dealBillingRows(h.investment, marketRate, configuredRate ?? DEFAULT_COMMISSION_RATE, startMs, endMs);
  const totals = sumRows(billingRows);

  // Both the discount and the agency commission are taken off the market rate:
  //   actualMarketRate - discount - agency commission = investment
  //   investment + GST = totalInvestment
  // Deal amounts win; the billing rows fill any gaps.
  const investment = toAmount(h.investment) ?? totals?.net ?? null;
  const commission = totals?.commission ?? null;
  const discount =
    marketRate !== null && investment !== null
      ? round2(Math.max(0, marketRate - investment - (commission ?? 0)))
      : null;
  const gstAmount = toAmount(h.gstAmount) ?? (investment !== null ? round2(investment * GST_RATE) : null);
  const totalInvestment =
    toAmount(h.totalInvestment) ?? (investment !== null && gstAmount !== null ? round2(investment + gstAmount) : null);
  const discountRate = discount !== null && marketRate ? discount / marketRate : null;

  // Agency % is deal.agency_discount, else commission / market rate. Never
  // commission / (investment + commission): that ignores the other discount (10% -> 11.11%).
  const commissionRate =
    configuredRate ??
    (marketRate && commission !== null
      ? commission / marketRate
      : monthRows.length
        ? null
        : DEFAULT_COMMISSION_RATE);
  const rateLabel = commissionRate !== null ? formatRate(commissionRate) : "";
  const discountRateLabel = discountRate !== null ? formatRate(discountRate) : "";
  const agencyPrefix = agency.shortName || "Agency";
  const commissionLabel = [`${agencyPrefix} commission`, rateLabel].filter(Boolean).join(" ");
  const discountLabel = ["Discount", discountRateLabel].filter(Boolean).join(" ");

  const bonusNote = firstFilled(
    data.scheduleMeta?.bonusNote,
    bonusSites.length
      ? `${joinAnd(bonusSites.map((s) => s.name))} ${bonusWeeks === 1 ? "bonus week" : "bonus weeks"} supplied as a guaranteed bonus (GTD) at no charge.`
      : "",
  );

  // -------------------------------------------------------------------------
  // Conditions + execution
  // -------------------------------------------------------------------------
  const specialConditions = data.specialConditions ?? defaultSpecialConditions(agency.name);

  const execAdvertiser = {
    ...DEFAULT_EXECUTION.advertiser,
    ...(data.execution?.advertiser || {}),
    representativeName: firstFilled(data.execution?.advertiser?.representativeName, primary.name),
  };
  const execAosco = { ...DEFAULT_EXECUTION.aosco, ...(data.execution?.aosco || {}) };
  const advertiserEntity = firstFilled(
    data.execution?.advertiser?.onBehalfOf,
    adv.companyName,
    agency.name,
  );

  const headLabel = [documentTitle, referenceId].filter(Boolean).join(" \u00B7 ");

  return (
    <div className="aosco-root">
      <style>{MODULE_CSS}</style>

      {/* ================= cover ================= */}
      <section className="aosco-sheet">
        <img src={logoSrc} alt={companyLegalName} className="aosco-cover-logo" />

        <p className="aosco-eyebrow">{documentTitle}</p>
        <h1 className="aosco-cover-title">{titleMain || "\u00A0"}</h1>
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
            value={investment !== null ? `${formatCurrency(investment, true)} + GST` : ""}
            dark
          />
        </div>

        <div className="aosco-prepared">
          <div>
            <div className="aosco-mini-label">Prepared for</div>
            <p className="aosco-prepared-name">{primary.name || "\u00A0"}</p>
            <p className="aosco-prepared-org">{adv.companyName || agency.name}</p>
          </div>
          <div>
            <div className="aosco-mini-label">Prepared by</div>
            <p className="aosco-prepared-name">
              {[execAosco.representativeName, execAosco.position].filter(Boolean).join(", ")}
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
        <p className="aosco-greeting">Dear {greetingName},</p>
        <p className="aosco-intro">
          Thank you for the opportunity to provide our services to you. This Advertising Order and the
          attached Terms and Conditions set out the basis on which AOSco provide our services.
        </p>

        <div className="aosco-cols">
          <DetailCard
            title="Advertiser details"
            rows={[
              ["Company", adv.companyName],
              ["Contact", adv.contactName || "N/A"],
              ["Phone", adv.phone],
              ["Email", adv.email],
            ]}
          />
          <DetailCard
            title="Agency details"
            rows={[
              ["Agency", agency.name],
              ["Address", agency.address],
              ["Contact", agency.contactName],
              ["Phone", agency.phone],
              ["Email", agency.email],
            ]}
          />
          <DetailCard
            title="Account details"
            rows={[
              ["Accounts contact", accounts.name],
              ["Accounts email", accounts.email],
            ]}
          />
        </div>

        <SectionTitle num="02">Campaign booking</SectionTitle>
        <DetailCard
          wide
          rows={[
            ["Campaign name", campaignName],
            ["Reference ID", referenceId],
            ["Sites, size & type", sitesBooking],
            ["Type", firstFilled(data.campaign?.type, DEFAULT_TYPE)],
            ["Weeks required", weeksRequired],
            ["Start date", startMs !== null ? formatDmy(startMs) : ""],
            ["End date", endMs !== null ? formatDmy(endMs) : ""],
          ]}
        />

        <SectionTitle num="03">Investment at a glance</SectionTitle>
        <div className="aosco-glance aosco-glance--six">
          <GlanceTile label="Market rate" value={money(marketRate)} />
          <GlanceTile label={discountLabel} value={negativeMoney(discount)} />
          <GlanceTile label={commissionLabel} value={negativeMoney(commission)} />
          <GlanceTile
            label="Investment"
            value={investment !== null ? `${money(investment)} + GST` : "\u2014"}
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
                  states.join(", "),
                  weekdays.length === 1 ? `All weeks commence ${WEEKDAYS[weekdays[0]]}` : "",
                ]
                  .filter(Boolean)
                  .join(" \u00B7 ")}
              </span>
            </div>
            <ScheduleGrid sites={sites} weeks={weekColumns} />

            <p className="aosco-h3">Placements</p>
            <PlacementsTable
              sites={sites}
              discountRate={discountRate}
              discountLabel={discountLabel}
              commissionLabel={commissionLabel}
            />
          </>
        ) : (
          <p>The schedule will be confirmed before the campaign starts.</p>
        )}

        <table className="aosco-table aosco-gap">
          <thead>
            <tr>
              <th>Investment summary</th>
              <th className="num" style={{ width: "22%" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Market rate (before discounts)</td>
              <td className="num">{money(marketRate)}</td>
            </tr>
            <tr>
              <td>Less discount{discountRateLabel ? ` (${discountRateLabel})` : ""}</td>
              <td className="num">{negativeMoney(discount)}</td>
            </tr>
            <tr>
              <td>
                Less {agency.shortName ? `${agency.shortName} ` : ""}agency commission{rateLabel ? ` (${rateLabel})` : ""}
              </td>
              <td className="num">{negativeMoney(commission)}</td>
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
        {(accounts.name || accounts.email) && (
          <p className="aosco-accounts">
            <strong>Accounts:</strong> {[accounts.name, accounts.email].filter(Boolean).join(" \u00B7 ")}
          </p>
        )}
        <table className="aosco-table">
          <thead>
            <tr>
              <th style={{ width: "13%" }}>Flighting dates</th>
              <th style={{ width: "17%" }}>Billing cycle {BILLING_DAYS_EOM} days EOM</th>
              <th className="num">Rate after discount</th>
              <th className="num">{commissionLabel}</th>
              <th className="num">Total (less agency comm)</th>
              <th className="num">GST {formatRate(GST_RATE)}</th>
              <th className="num">Total due to AOSco inc GST</th>
            </tr>
          </thead>
          <tbody>
            {billingRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="aosco-table-small">
                  Billing will be confirmed with the final schedule.
                </td>
              </tr>
            ) : (
              billingRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.flighting || "\u00A0"}</td>
                  <td>{billingDateLabel(row.billing)}</td>
                  <td className="num">{money(row.investment)}</td>
                  <td className="num">{money(row.commission)}</td>
                  <td className="num">{money(row.net)}</td>
                  <td className="num">{money(row.gst)}</td>
                  <td className="num">{money(row.total)}</td>
                </tr>
              ))
            )}
            <tr className="aosco-table-total">
              <td colSpan={6} className="num">Campaign total</td>
              <td className="num">{money(totals?.total)}</td>
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
            <p className="aosco-exec-entity">{advertiserEntity || "\u00A0"}</p>
            {execAdvertiser.representativeName && (
              <p className="aosco-exec-by">by {execAdvertiser.representativeName}</p>
            )}
            <SignField label="Representative name" value={execAdvertiser.representativeName} />
            <SignField label="Position" value={execAdvertiser.position} />
            <SignField label="Signature" />
            <SignField label="Date" value={execAdvertiser.date} />
          </div>
          <div>
            <div className="aosco-exec-eyebrow">Executed on behalf of</div>
            <p className="aosco-exec-entity">{companyLegalName}</p>
            {execAosco.representativeName && (
              <p className="aosco-exec-by">by {execAosco.representativeName}</p>
            )}
            <SignField label="Representative name" value={execAosco.representativeName} />
            <SignField label="Position" value={execAosco.position} />
            <SignField label="Signature" />
            <SignField label="Date" value={execAosco.date} />
          </div>
        </div>
      </section>
    </div>
  );
}

export const meta = {
  label: "AOSco Advertising Order (Agency)",
  content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
};

// Single source of truth: every value is read from the DEAL record.
// The deal lookup is guarded because a quote blueprint preview may not
// have a deal attached.
export const hublDataTemplate = `
  {% set dealData = {} %}
  {% if quoteTemplateContext.deal and quoteTemplateContext.deal.hs_object_id %}
    {% set dealData = crm_object("deal", quoteTemplateContext.deal.hs_object_id, "hs_object_id,dealname,quote_master_data,agency_quote_master_data,agency_discount,campaign_start_date,campaign_end_date,total_commercial_rate,gst_amount,total_investment,advertiser_company,advertiser_contact_first_name,advertiser_contact_last_name,advertiser_person_phone_number,advertiser_person_email_address,agency_company_name,agency_person_first_name,agency_person_last_name,agency_person_email,agency_company_address,agency_address_line_2,agency_person_phone,total_bill_amount_before_discount_total_market_rate") %}
  {% endif %}

  {% set hublData = {
    "isQuoteBlueprint": isQuoteBlueprint,
    "dealId": dealData.hs_object_id,
    "dealName": dealData.dealname,
    "campaignStartDate": dealData.campaign_start_date,
    "campaignEndDate": dealData.campaign_end_date,
    "totalInvestment": dealData.total_investment,
    "investment": dealData.total_commercial_rate,
    "gstAmount": dealData.gst_amount,
    "actualMarketRate": dealData.total_bill_amount_before_discount_total_market_rate,
    "scheduleSummaryJson": dealData.quote_master_data,
    "agencyQuoteJson": dealData.agency_quote_master_data,
    "agencyDiscount": dealData.agency_discount,

    "advertiserCompany": dealData.advertiser_company,
    "advertiserFirstName": dealData.advertiser_contact_first_name,
    "advertiserLastName": dealData.advertiser_contact_last_name,
    "advertiserPhone": dealData.advertiser_person_phone_number,
    "advertiserEmail": dealData.advertiser_person_email_address,

    "agencyCompanyName": dealData.agency_company_name,
    "agencyFirstName": dealData.agency_person_first_name,
    "agencyLastName": dealData.agency_person_last_name,
    "agencyEmail": dealData.agency_person_email,
    "agencyPhone": dealData.agency_person_phone,
    "agencyAddress": dealData.agency_company_address,
    "agencyAddressLine2": dealData.agency_address_line_2
  } %}
`;