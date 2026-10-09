import { MAX_GRID_WEEKS } from '../constants/business';
import { DAY_MS, FULL_MONTHS, MONTHS_UPPER, WEEK_MS } from '../constants/dates';
import { toDateParts } from '../utils/dates';

// Continuous weekly columns covering every booked week, stretched to the
// deal's start/end dates (e.g. WK1 = start date even if nothing runs that week).
export function buildWeekColumns(
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

// Month header bands over the week columns: "SEPTEMBER 2026" when the month
// spans 3+ weeks, else "SEP 26".
export function monthGroups(weeks: number[]): Array<{ key: string; label: string; span: number }> {
  const groups: Array<{ key: string; span: number; month: number; year: number }> = [];
  for (const w of weeks) {
    const p = toDateParts(w);
    const key = `${p.year}-${p.month}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.span += 1;
    else groups.push({ key, span: 1, month: p.month, year: p.year });
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

// "Weeks Required": one number for the whole campaign length — every week
// from the first booked week to the last, paid AND bonus, counted once.
// Falls back to the deal's start/end dates when there is no schedule.
export function campaignWeeks(bookedTimes: number[], start: number | null, end: number | null): number {
  if (bookedTimes.length > 0) {
    const first = Math.min(...bookedTimes);
    const last = Math.max(...bookedTimes);
    return Math.round((last - first) / WEEK_MS) + 1;
  }
  if (start !== null && end !== null) {
    const days = Math.round((end - start) / DAY_MS) + 1;
    return days > 0 ? Math.ceil(days / 7) : 0;
  }
  return 0;
}
