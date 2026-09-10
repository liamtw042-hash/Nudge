import { mrr } from './billing.ts';
import { isoDate, weekStart } from './dates.ts';
import type { AppEvent, Teacher } from './types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

export type Funnel = {
  signups: number;
  addedStudent: number;
  wroteSlip: number;
  shared: number;
  parentOpened: number;
  dayTicked: number;
};

export type Summary = {
  teachers: number;
  active: number;
  trialing: number;
  lapsed: number;
  mrrAud: number;
  /** Teachers with a slip written in the last 14 days, among those older than 14 days. */
  retention14: number | null;
  funnel: Funnel;
  signupsByWeek: { week: string; count: number }[];
};

/** Everything the admin dashboard shows, computed from raw records. */
export function summarise(teachers: Teacher[], events: AppEvent[], now: number = Date.now()): Summary {
  const byTeacher = new Map<string, Set<string>>();
  for (const e of events) {
    const set = byTeacher.get(e.teacherId) ?? new Set<string>();
    set.add(e.type);
    byTeacher.set(e.teacherId, set);
  }
  const count = (type: string) => [...byTeacher.values()].filter((s) => s.has(type)).length;

  const funnel: Funnel = {
    signups: teachers.length,
    addedStudent: count('student_created'),
    wroteSlip: count('slip_written'),
    shared: count('slip_shared'),
    parentOpened: count('parent_opened'),
    dayTicked: count('day_ticked'),
  };

  const cutoff = now - 14 * DAY_MS;
  const eligible = teachers.filter((t) => t.createdAt < cutoff);
  const recentWriters = new Set(events.filter((e) => e.type === 'slip_written' && e.at >= cutoff).map((e) => e.teacherId));
  const retention14 = eligible.length === 0 ? null : Math.round((eligible.filter((t) => recentWriters.has(t.id)).length / eligible.length) * 100);

  const weeks = new Map<string, number>();
  for (const t of teachers) {
    const w = weekStart(isoDate(new Date(t.createdAt)));
    weeks.set(w, (weeks.get(w) ?? 0) + 1);
  }
  const signupsByWeek = [...weeks.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([week, c]) => ({ week, count: c })).slice(-12);

  const active = teachers.filter((t) => t.plan === 'active' && (t.planUntil == null || t.planUntil > now)).length;
  const lapsed = teachers.filter((t) => (t.plan === 'active' && t.planUntil != null && t.planUntil <= now) || (t.plan === 'trial' && t.trialEndsAt <= now)).length;

  return {
    teachers: teachers.length,
    active,
    trialing: teachers.filter((t) => t.plan === 'trial' && t.trialEndsAt > now).length,
    lapsed,
    mrrAud: mrr(teachers, now),
    retention14,
    funnel,
    signupsByWeek,
  };
}
