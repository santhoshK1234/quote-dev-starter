import { FORMAT_WORD } from '../constants/business';
import type { SiteRow } from '../types';
import { cx } from '../utils/classNames';
import { dayMonthYear } from '../utils/dates';

// Direct deals have no per-site pricing, so placements list weeks only;
// the money is in the investment summary and billing table.
export function DirectPlacementsTable({ sites }: { sites: SiteRow[] }) {
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
