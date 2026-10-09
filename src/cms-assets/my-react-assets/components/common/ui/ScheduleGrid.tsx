import { FORMAT_WORD } from '../constants/business';
import { WEEK_MS } from '../constants/dates';
import { monthGroups } from '../quote/schedule';
import type { SiteRow } from '../types';
import { cx } from '../utils/classNames';
import { dayMonth } from '../utils/dates';

// Campaign schedule grid: one row per site, one column per week.
export function ScheduleGrid({ sites, weeks }: { sites: SiteRow[]; weeks: number[] }) {
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
