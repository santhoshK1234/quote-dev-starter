import type { NestedItem } from '../types';
import { cx } from '../utils/classNames';

interface NestedItemsProps {
  items?: NestedItem[];
  depth?: number;
}

// Terms clause list: a/b/c at the top level, i/ii/iii when nested.
export function NestedItems({ items, depth = 0 }: NestedItemsProps) {
  if (!items || items.length === 0) return null;
  return (
    <ol className={cx('aosco-nested-list', depth > 0 && 'aosco-nested-list--roman')}>
      {items.map((item, i) => {
        const isNested = typeof item === 'object' && item !== null;
        return (
          <li key={i}>
            {isNested ? item.text : item}
            {isNested && <NestedItems items={item.items} depth={depth + 1} />}
          </li>
        );
      })}
    </ol>
  );
}
