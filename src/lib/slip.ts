import { daysBetween, isFuture, shortDate, slipDays } from './dates';
import { shortId } from './ids';
import type { Slip, SlipItem, Student } from './types';

export const MAX_ITEMS = 8;
export const DEFAULT_TARGET_DAYS = 5;

export function emptyItem(): SlipItem {
  return { id: shortId(), title: '', instruction: '' };
}

export function newSlip(startDate: string, from?: Slip | null): Slip {
  return {
    id: shortId(),
    startDate,
    items: from && from.items.length > 0 ? from.items.map((i) => ({ ...i, id: shortId() })) : [emptyItem()],
    targetDays: from?.targetDays ?? DEFAULT_TARGET_DAYS,
    note: '',
    writtenAt: Date.now(),
  };
}

/** Drop blank rows, trim text. Returns null if nothing is left. */
export function cleanSlip(slip: Slip): Slip | null {
  const items = slip.items
    .map((i) => ({ ...i, title: i.title.trim(), instruction: i.instruction.trim() }))
    .filter((i) => i.title.length > 0 || i.instruction.length > 0)
    .map((i) => (i.title.length === 0 ? { ...i, title: i.instruction, instruction: '' } : i));
  if (items.length === 0) return null;
  return {
    ...slip,
    items: items.slice(0, MAX_ITEMS),
    targetDays: Math.min(7, Math.max(1, Math.round(slip.targetDays))),
    note: slip.note.trim(),
  };
}

export type WeekStatus = {
  days: string[];
  ticked: string[];
  tickedCount: number;
  targetDays: number;
  /** Days of the week that have already happened (including today). */
  elapsed: number;
  /** Consecutive days with no tick, counting back from yesterday. */
  quietDays: number;
  weekOver: boolean;
  onTrack: boolean;
};

export function weekStatus(student: Student, today: string): WeekStatus | null {
  const slip = student.slip;
  if (!slip) return null;
  const days = slipDays(slip.startDate);
  const ticked = days.filter((d) => student.log[d]);
  const elapsed = days.filter((d) => !isFuture(d, today)).length;
  const weekOver = daysBetween(slip.startDate, today) >= 7;
  let quietDays = 0;
  for (let i = elapsed - 1; i >= 0; i--) {
    const d = days[i];
    if (!d || d === today) continue;
    if (student.log[d]) break;
    quietDays++;
  }
  // Days still open to tick: today (if not yet ticked) and everything after it.
  const stillOpen = days.filter((d) => isFuture(d, today) || (d === today && !student.log[d])).length;
  const onTrack = ticked.length + stillOpen >= slip.targetDays;
  return { days, ticked, tickedCount: ticked.length, targetDays: slip.targetDays, elapsed, quietDays, weekOver, onTrack };
}

/** Plain-text version for sharing over messaging apps. */
export function shareText(student: Student, url: string): string {
  const slip = student.slip;
  const lines: string[] = [];
  lines.push(`${student.name}'s practice this week${student.teacherName ? ` from ${student.teacherName}` : ''}`);
  if (slip) {
    slip.items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.title}${item.instruction ? ` – ${item.instruction}` : ''}`);
    });
    lines.push(`Aim for ${slip.targetDays} day${slip.targetDays === 1 ? '' : 's'}.`);
    if (slip.note) lines.push(slip.note);
  }
  lines.push(`Tick off each day here: ${url}`);
  return lines.join('\n');
}

export function slipTitle(student: Student): string {
  return `${possessive(student.name)} practice this week`;
}

export function possessive(name: string): string {
  const n = name.trim();
  if (!n) return 'Their';
  return n.endsWith('s') ? `${n}'` : `${n}'s`;
}

export function slipDateRange(slip: Slip): string {
  const days = slipDays(slip.startDate);
  return `${shortDate(days[0] ?? slip.startDate)} – ${shortDate(days[6] ?? slip.startDate)}`;
}
