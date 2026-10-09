import { GST_RATE } from '../constants/business';
import type {
  AgencyQuoteMasterData,
  AgencySiteRow,
  BillingRowCalc,
  CrmValue,
  DateParts,
  MoneyTotals,
} from '../types';
import { billingDateFor, flightingLabel, flightMonthLabel, monthKey } from '../utils/dates';
import { round2, toAmount } from '../utils/numbers';

// ===========================================================================
// Agency billing — one row per flighting month. Invoices fall due
// billingDaysEom days after the end of each month (0 = at EOM).
// ===========================================================================

export function toBillingRow(
  key: string,
  flighting: string,
  billing: DateParts | null,
  netRaw: number,
  commissionRaw: number,
): BillingRowCalc {
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
export function monthlyBillingRows(
  agencyData: AgencyQuoteMasterData,
  sites: AgencySiteRow[],
  billingDaysEom = 0,
): BillingRowCalc[] {
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
      const k = String(m?.k ?? '');
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
      const [y, mo] = k.split('-').map(Number);
      const t = Date.UTC(y, mo - 1, 1);
      return toBillingRow(k, flightMonthLabel(t), billingDateFor(t, billingDaysEom), v.net, v.commission);
    });
}

// Single row from the deal totals, when there's no agency quote data.
// investment is after agency commission; commission is a % of the market rate.
export function dealBillingRows(
  investmentValue: CrmValue,
  marketRate: number | null,
  rate: number,
  startMs: number | null,
  endMs: number | null,
  billingDaysEom = 0,
): BillingRowCalc[] {
  const net = toAmount(investmentValue);
  if (net === null) return [];
  const commission = marketRate !== null ? marketRate * rate : rate < 1 ? (net * rate) / (1 - rate) : 0;

  const billFrom = endMs ?? startMs;
  return [
    toBillingRow(
      'deal',
      flightingLabel(startMs, endMs),
      billFrom !== null ? billingDateFor(billFrom, billingDaysEom) : null,
      net,
      commission,
    ),
  ];
}

export function sumRows(rows: BillingRowCalc[]): MoneyTotals | null {
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
