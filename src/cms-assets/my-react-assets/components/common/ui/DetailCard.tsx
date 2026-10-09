import React from 'react';

import { cx } from '../utils/classNames';

export function DetailCard({
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
