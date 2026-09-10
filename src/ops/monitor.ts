import type { Alert, Snapshot } from './types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Turns two snapshots into a short list of things a human should know.
 * Anything not on the list is fine. Empty list means a quiet week.
 */
export function alerts(current: Snapshot, previous: Snapshot | null, now: number = Date.now()): Alert[] {
  const out: Alert[] = [];
  const week = now - 7 * DAY_MS;
  const twoWeeks = now - 14 * DAY_MS;

  if (current.siteUp === false) out.push({ level: 'error', message: 'Site is down: the public URL did not return 200.' });

  const signupsThisWeek = current.teachers.filter((t) => t.createdAt >= week).length;
  const signupsLastWeek = current.teachers.filter((t) => t.createdAt >= twoWeeks && t.createdAt < week).length;
  // Half or worse counts as a drop.
  if (signupsLastWeek >= 4 && signupsThisWeek <= signupsLastWeek / 2) {
    out.push({ level: 'warn', message: `Signups dropped: ${signupsThisWeek} this week vs ${signupsLastWeek} last week.` });
  }
  if (current.teachers.length > 0 && signupsThisWeek === 0 && signupsLastWeek === 0) {
    out.push({ level: 'info', message: 'No signups in two weeks. Distribution, not product.' });
  }

  // Delivery failing: slips written but no parent has opened anything for that teacher after 3+ days.
  const stuck = current.teachers.filter((t) => {
    const ev = current.events.filter((e) => e.teacherId === t.id);
    const firstSlip = ev.filter((e) => e.type === 'slip_written').map((e) => e.at).sort()[0];
    if (firstSlip == null || now - firstSlip < 3 * DAY_MS) return false;
    return !ev.some((e) => e.type === 'parent_opened');
  });
  if (stuck.length > 0) {
    out.push({ level: 'warn', message: `${stuck.length} teacher${stuck.length === 1 ? '' : 's'} wrote slips 3+ days ago and no parent has opened one: ${stuck.map((t) => t.email).join(', ')}.` });
  }

  const oldInvoices = current.billing.filter((b) => b.status === 'open' && now - b.at > 2 * DAY_MS);
  if (oldInvoices.length > 0) {
    out.push({ level: 'error', message: `${oldInvoices.length} invoice request${oldInvoices.length === 1 ? '' : 's'} open for more than 2 days: ${oldInvoices.map((b) => b.email).join(', ')}. Someone is trying to pay.` });
  }

  const lapsed = current.teachers.filter((t) => t.plan === 'active' && t.planUntil != null && t.planUntil <= now && t.planUntil > week);
  if (lapsed.length > 0) out.push({ level: 'warn', message: `${lapsed.length} paying teacher${lapsed.length === 1 ? '' : 's'} lapsed this week: ${lapsed.map((t) => t.email).join(', ')}.` });

  if (previous) {
    const prevPaying = previous.teachers.filter((t) => t.plan === 'active' && (t.planUntil == null || t.planUntil > previous.takenAt)).map((t) => t.id);
    const nowPaying = new Set(current.teachers.filter((t) => t.plan === 'active' && (t.planUntil == null || t.planUntil > now)).map((t) => t.id));
    const churned = prevPaying.filter((id) => !nowPaying.has(id));
    if (churned.length > 0) out.push({ level: 'warn', message: `Churn: ${churned.length} paying teacher${churned.length === 1 ? '' : 's'} since last snapshot.` });
  }

  const recentEvents = current.events.filter((e) => e.at >= week).length;
  const activeTeachers = current.teachers.filter((t) => t.createdAt < week).length;
  if (activeTeachers >= 3 && recentEvents === 0) {
    out.push({ level: 'error', message: 'Zero events in 7 days with active teachers. Check that event logging and the site are working.' });
  }

  const trialsEnding = current.teachers.filter((t) => t.plan === 'trial' && t.trialEndsAt > now && t.trialEndsAt < now + 7 * DAY_MS);
  if (trialsEnding.length > 0) out.push({ level: 'info', message: `${trialsEnding.length} trial${trialsEnding.length === 1 ? '' : 's'} end this week.` });

  return out;
}
