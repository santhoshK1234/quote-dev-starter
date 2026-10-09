import { cx } from '../utils/classNames';

export function GlanceTile({
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
