import { FORMAT_WORD } from '../constants/business';
import { siteAmounts } from '../quote/sites';
import type { AgencySiteRow, SiteAmounts } from '../types';
import { cx } from '../utils/classNames';
import { money, negativeMoney } from '../utils/currency';
import { dayMonthYear } from '../utils/dates';
import { round2 } from '../utils/numbers';

// Agency placements: weeks plus per-site market rate, discount, agency
// commission and investment.
export function AgencyPlacementsTable({
  sites,
  discountRate,
  discountLabel,
  commissionLabel,
}: {
  sites: AgencySiteRow[];
  discountRate: number | null; // null = no market rate on the deal: discount columns hidden
  discountLabel: string;
  commissionLabel: string;
}) {
  const paidWeeks = sites.filter((s) => !s.bonus).reduce((n, s) => n + s.weeks.length, 0);
  const bonusWeeks = sites.filter((s) => s.bonus).reduce((n, s) => n + s.weeks.length, 0);
  const showDiscount = discountRate !== null;
  const amounts = sites.map((s) => siteAmounts(s, discountRate ?? 0));
  const sum = (pick: (a: SiteAmounts) => number) => round2(amounts.reduce((n, a) => n + pick(a), 0));
  const dash = '–';

  return (
    <table className="aosco-table aosco-table--compact">
      <thead>
        <tr>
          <th style={{ width: '8%' }}>Site code</th>
          <th>Site</th>
          <th style={{ width: '5%' }}>State</th>
          <th style={{ width: '10%' }}>Format &amp; size</th>
          <th style={{ width: '14%' }}>Week commencing</th>
          <th className="mid" style={{ width: '6%' }}>Paid weeks</th>
          <th className="mid" style={{ width: '6%' }}>Bonus weeks</th>
          {showDiscount && <th className="num" style={{ width: '9%' }}>Market rate</th>}
          {showDiscount && <th className="num" style={{ width: '9%' }}>{discountLabel}</th>}
          <th className="num" style={{ width: '9%' }}>{commissionLabel}</th>
          <th className="num" style={{ width: '9%' }}>Investment</th>
        </tr>
      </thead>
      <tbody>
        {sites.map((s, i) => {
          const first = s.weeks[0];
          const last = s.weeks[s.weeks.length - 1];
          const a = amounts[i];
          return (
            <tr key={s.key}>
              <td>{s.code || dash}</td>
              <td className="strong">{s.name}</td>
              <td>{s.state}</td>
              <td>{[FORMAT_WORD, s.size].filter(Boolean).join(' ')}</td>
              <td>
                {first === undefined
                  ? dash
                  : s.weeks.length === 1
                    ? dayMonthYear(first)
                    : `${dayMonthYear(first)} – ${dayMonthYear(last)}`}
              </td>
              <td className="mid">{s.bonus ? dash : s.weeks.length}</td>
              <td className={cx('mid', s.bonus && 'aosco-table-bonus')}>
                {s.bonus ? `${s.weeks.length} (GTD)` : dash}
              </td>
              {showDiscount && <td className="num">{s.bonus ? dash : money(a.market)}</td>}
              {showDiscount && <td className="num">{s.bonus ? dash : negativeMoney(a.discount)}</td>}
              <td className="num">{s.bonus ? dash : negativeMoney(a.commission)}</td>
              <td className={cx('num', s.bonus ? 'aosco-table-bonus' : 'strong')}>
                {s.bonus ? 'No charge' : money(a.investment)}
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
