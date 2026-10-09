import { NETWORK_SITE_COUNT } from '../constants/business';
import type {
  AgencyQuoteMasterData,
  AgencyQuoteSchedule,
  AgencySiteRow,
  QuoteMasterData,
  ScheduleRow,
  SiteAmounts,
  SiteRow,
} from '../types';
import { uniq } from '../utils/arrays';
import { parseDate, toDayMs } from '../utils/dates';
import { round2 } from '../utils/numbers';
import { cleanNumber, firstFilled } from '../utils/strings';

// ===========================================================================
// Site names
// ===========================================================================

const MONTH_WORD = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*';
const PERIOD_PREFIX = new RegExp(`^${MONTH_WORD}\\s*[-–]\\s*${MONTH_WORD}\\s+[-–]\\s+`, 'i');

// "Oct-Jan - BONUS NEWMARKET LANDSCAPE" -> "NEWMARKET LANDSCAPE"
export function cleanSiteName(raw: string): string {
  const cleaned = raw
    .replace(PERIOD_PREFIX, '')
    .replace(/^bonus\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || raw.trim();
}

// "Caboolture – 66 Morayfield Rd" -> "Caboolture"; no separator -> ""
export function siteLocality(name: string): string {
  const parts = name.split(/\s+[–-]\s+/);
  return parts.length > 1 ? parts[0].trim() : '';
}

// Case/whitespace-insensitive key for matching site names across data sources.
export const normName = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

// ===========================================================================
// Direct quotes — sites from quote_master_data.ad_schedules
// ===========================================================================

export function buildDirectSites(schedule: ScheduleRow[], defaultState: string): SiteRow[] {
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

// ===========================================================================
// Agency quotes — merges quote_master_data.ad_schedules with
// agency_quote_master_data.s (matched by site name)
// ===========================================================================

export function uniqueSortedDays(list: unknown[]): number[] {
  return uniq(list.map(toDayMs).filter((t): t is number => t !== null)).sort((a, b) => a - b);
}

export function makeAgencySiteRow(
  q: ScheduleRow | null,
  s: AgencyQuoteSchedule | null,
  index: number,
  defaultState: string,
): AgencySiteRow {
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
    typeof q?.bonus === 'boolean'
      ? q.bonus
      : s
        ? net === 0 && commission === 0
        : /\bbonus\b/i.test(rawName);

  return {
    key: String(index),
    code: firstFilled(q?.fid).replace(/\.0+$/, ''),
    name,
    locality: siteLocality(name),
    bonus,
    size: firstFilled(q?.dim).replace(/\s*x\s*/i, ' x '),
    state: firstFilled(q?.st, defaultState),
    weeks,
    netPerWeek: bonus ? 0 : net,
    commissionPerWeek: bonus ? 0 : commission,
  };
}

export function buildAgencySites(
  data: QuoteMasterData,
  agencyData: AgencyQuoteMasterData,
  defaultState: string,
): AgencySiteRow[] {
  const quoteRows = Array.isArray(data.ad_schedules) ? data.ad_schedules : [];
  const agencyRows = Array.isArray(agencyData.s) ? agencyData.s : [];

  if (quoteRows.length === 0) {
    return agencyRows.map((s, i) => makeAgencySiteRow(null, s, i, defaultState));
  }

  const agencyByName = new Map<string, AgencyQuoteSchedule>();
  for (const s of agencyRows) {
    const k = normName(s?.n);
    if (k && !agencyByName.has(k)) agencyByName.set(k, s);
  }
  return quoteRows.map((q, i) =>
    makeAgencySiteRow(q, agencyByName.get(normName(q?.n)) ?? null, i, defaultState),
  );
}

// Site rows only carry the client rate and agency commission, so the market
// rate is worked back from the deal-level discount % (same % on every site).
export function siteAmounts(s: AgencySiteRow, discountRate: number): SiteAmounts {
  const investment = round2(s.weeks.length * s.netPerWeek);
  const commission = round2(s.weeks.length * s.commissionPerWeek);
  const afterDiscount = investment + commission;
  const market = round2(discountRate < 1 ? afterDiscount / (1 - discountRate) : afterDiscount);
  return { market, discount: round2(market - afterDiscount), commission, investment };
}

// ===========================================================================
// Campaign Booking helpers (rules confirmed by the client)
// ===========================================================================

// Billboards are counted once each (by face ID, else by name), so a site that
// appears on several schedule rows (paid + bonus) is not counted twice.
export function uniqueSiteCount(sites: SiteRow[]): number {
  return new Set(sites.map((s) => (s.code || s.name).toLowerCase()).filter(Boolean)).size;
}

// "Site, Size & Type of Selected Billboards":
//   all 18 sites on the schedule -> "NETWORK"
//   otherwise                    -> how many billboards are itemised ("3 SITES")
export function siteSizeTypeLabel(count: number): string {
  if (count === 0) return '';
  if (count >= NETWORK_SITE_COUNT) return 'NETWORK';
  return `${count} ${count === 1 ? 'SITE' : 'SITES'}`;
}
