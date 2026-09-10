const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD in local time. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayIso(now: Date = new Date()): string {
  return isoDate(now);
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

/** The seven practice days of a slip, starting the day it was written. */
export function slipDays(startDate: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dayLabel(iso: string): string {
  return SHORT_DAYS[parseIso(iso).getDay()] ?? '';
}

export function dayLetter(iso: string): string {
  return dayLabel(iso).charAt(0);
}

/** "Tue 9 Sep" */
export function shortDate(iso: string): string {
  const d = parseIso(iso);
  return `${dayLabel(iso)} ${d.getDate()} ${d.toLocaleString('en-AU', { month: 'short' })}`;
}

/** "9 September 2026" */
export function longDate(iso: string): string {
  const d = parseIso(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseIso(toIso).getTime() - parseIso(fromIso).getTime()) / DAY_MS);
}

export function daysUntil(epochMs: number, now: number = Date.now()): number {
  return Math.ceil((epochMs - now) / DAY_MS);
}

export function isFuture(iso: string, today: string): boolean {
  return iso > today;
}

/** ISO Monday of the week containing the date, for cohort grouping. */
export function weekStart(iso: string): string {
  const d = parseIso(iso);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return isoDate(d);
}
