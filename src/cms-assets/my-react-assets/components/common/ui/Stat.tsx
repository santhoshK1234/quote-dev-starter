import { cx } from '../utils/classNames';

export function Stat({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={cx('aosco-stat', dark && 'aosco-stat--dark')}>
      <div className="aosco-stat-label">{label}</div>
      <div className="aosco-stat-value">{value || ' '}</div>
    </div>
  );
}
