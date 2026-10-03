/** Date ranges for the statistics pages. Days are ISO dates (YYYY-MM-DD) in UTC, which is
 * the company time zone (backend TIME_ZONE). Weeks start on Monday. */

export type Period = { start: string; end: string };
export type Preset = Period & { label: string };

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  return iso(new Date());
}

export function shift(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return iso(date);
}

export function startOfWeek(day: string) {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return shift(day, weekday === 0 ? -6 : 1 - weekday);
}

function startOfMonth(day: string) {
  return `${day.slice(0, 7)}-01`;
}

/** The same quick ranges on every statistics page. Current week and month end today. */
export function presets(today: string): Preset[] {
  const monday = startOfWeek(today);
  const lastMonthEnd = shift(startOfMonth(today), -1);
  return [
    { label: "Today", start: today, end: today },
    { label: "This week", start: monday, end: today },
    { label: "Last week", start: shift(monday, -7), end: shift(monday, -1) },
    { label: "This month", start: startOfMonth(today), end: today },
    { label: "Last month", start: startOfMonth(lastMonthEnd), end: lastMonthEnd },
  ];
}

/** The period in `?from=&to=` (swapped if reversed), else `fallback`. */
export function resolvePeriod(query: { from?: string; to?: string }, fallback: Period): Period {
  const from = ISO_DAY.test(query.from ?? "") ? query.from! : fallback.start;
  const to = ISO_DAY.test(query.to ?? "") ? query.to! : fallback.end;
  return from <= to ? { start: from, end: to } : { start: to, end: from };
}

/** Default for the company and finance statistics: the last 30 days. */
export function last30Days(today: string): Period {
  return { start: shift(today, -29), end: today };
}

/** Number of days from `start` to `end`, both included. */
export function daySpan(start: string, end: string) {
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime();
  return Math.round(ms / 86400000) + 1;
}
