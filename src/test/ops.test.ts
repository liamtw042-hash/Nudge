import { summarise } from '@/lib/analytics';
import type { AppEvent, Teacher } from '@/lib/types';
import { backlogMarkdown, clusterFeedback } from '@/ops/feedback';
import { alerts } from '@/ops/monitor';
import { finalise, plannedEmails } from '@/ops/onboarding';
import { suggestion, weeklyReport } from '@/ops/report';
import type { Snapshot } from '@/ops/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 8, 13, 18).getTime();

function teacher(id: string, daysAgo: number, over: Partial<Teacher> = {}): Teacher {
  const createdAt = NOW - daysAgo * DAY;
  return { id, email: `${id}@x.test`, name: `${id} Teacher`, studio: '', createdAt, trialEndsAt: createdAt + 30 * DAY, plan: 'trial', planUntil: null, activatedAt: null, ...over };
}

function ev(teacherId: string, type: AppEvent['type'], daysAgo: number): AppEvent {
  return { id: `${teacherId}-${type}-${daysAgo}`, teacherId, studentId: null, type, at: NOW - daysAgo * DAY };
}

function snap(over: Partial<Snapshot> = {}): Snapshot {
  return { takenAt: NOW, siteUp: true, teachers: [], events: [], feedback: [], billing: [], students: [], ...over };
}

describe('plannedEmails', () => {
  it('welcomes new teachers once', () => {
    const s = snap({ teachers: [teacher('a', 0)] });
    expect(plannedEmails(s, {}, NOW).map((e) => e.template)).toEqual(['welcome']);
    expect(plannedEmails(s, { a: ['welcome'] }, NOW)).toEqual([]);
  });

  it('nudges by behaviour, one email per teacher per run', () => {
    const s = snap({
      teachers: [teacher('idle', 3), teacher('wrote', 5), teacher('week', 8)],
      events: [ev('wrote', 'student_created', 4), ev('wrote', 'slip_written', 4), ev('week', 'student_created', 7), ev('week', 'slip_written', 7), ev('week', 'slip_shared', 7)],
    });
    const sent = { idle: ['welcome'], wrote: ['welcome'], week: ['welcome'] };
    const plan = plannedEmails(s, sent, NOW);
    expect(Object.fromEntries(plan.map((e) => [e.teacherId, e.template]))).toEqual({ idle: 'no_student', wrote: 'not_shared', week: 'checkin' });
  });

  it('asks for money at day 25 only from teachers who use it, and never from payers', () => {
    const user = teacher('user', 26);
    const payer = teacher('payer', 26, { plan: 'active', activatedAt: NOW - DAY, planUntil: NOW + 30 * DAY });
    const ghost = teacher('ghost', 26);
    const s = snap({
      teachers: [user, payer, ghost],
      events: [ev('user', 'slip_written', 2), ev('user', 'slip_shared', 2), ev('payer', 'slip_written', 2), ev('payer', 'slip_shared', 2)],
    });
    const sent = { user: ['welcome', 'checkin'], payer: ['welcome', 'checkin'], ghost: ['welcome', 'no_student'] };
    const plan = plannedEmails(s, sent, NOW);
    expect(plan.map((e) => [e.teacherId, e.template])).toEqual([['user', 'trial_ending']]);
    expect(plan[0]?.body).toContain('1 slip in the last fortnight');
  });

  it('fills placeholders', () => {
    const s = snap({ teachers: [teacher('a', 0)] });
    const [e] = finalise(plannedEmails(s, {}, NOW), 'https://ps.test', 'hi@ps.test');
    expect(e?.body).toContain('https://ps.test');
    expect(e?.body).not.toContain('{{');
  });
});

describe('alerts', () => {
  it('is quiet when nothing is wrong', () => {
    expect(alerts(snap({ teachers: [teacher('a', 1)] }), null, NOW)).toEqual([]);
  });

  it('flags the site down and stale invoices as errors', () => {
    const s = snap({
      siteUp: false,
      billing: [{ id: 'b', teacherId: 'a', email: 'a@x.test', name: 'A', period: 'monthly', at: NOW - 3 * DAY, status: 'open' }],
    });
    const levels = alerts(s, null, NOW).map((a) => a.level);
    expect(levels).toEqual(['error', 'error']);
  });

  it('warns on a signup drop and on slips nobody opened', () => {
    const teachers = [...Array.from({ length: 4 }, (_, i) => teacher(`old${i}`, 9 + i)), teacher('new', 2), teacher('writer', 6)];
    const s = snap({ teachers, events: [ev('writer', 'slip_written', 5)] });
    const msgs = alerts(s, null, NOW).map((a) => a.message);
    expect(msgs.some((m) => m.startsWith('Signups dropped'))).toBe(true);
    expect(msgs.some((m) => m.includes('no parent has opened'))).toBe(true);
  });

  it('detects churn between snapshots', () => {
    const prev = snap({ takenAt: NOW - 7 * DAY, teachers: [teacher('p', 40, { plan: 'active', activatedAt: NOW - 40 * DAY, planUntil: NOW - 2 * DAY })] });
    const cur = snap({ teachers: [teacher('p', 40, { plan: 'active', activatedAt: NOW - 40 * DAY, planUntil: NOW - 2 * DAY })] });
    const msgs = alerts(cur, prev, NOW).map((a) => a.message);
    expect(msgs.some((m) => m.startsWith('Churn'))).toBe(true);
  });
});

describe('feedback clustering', () => {
  it('groups by theme and keeps samples', () => {
    const clusters = clusterFeedback([
      { text: 'Sending via WhatsApp put the link on its own line, fine, but the text was long' },
      { text: 'Can I share to two parents?' },
      { text: 'Love it. So easy.' },
      { text: 'Wish I could attach a recording to an item' },
      { text: 'zzz' },
    ]);
    // Sorted by count; ties keep first-seen order (praise was seen before editor).
    expect(clusters.map((c) => [c.key, c.count])).toEqual([
      ['sending', 2],
      ['praise', 1],
      ['editor', 1],
      ['other', 1],
    ]);
    expect(backlogMarkdown(clusters)).toContain('**Sending the slip to parents** (2)');
  });
});

describe('weekly report', () => {
  it('renders numbers, funnel, alerts and a suggestion', () => {
    const teachers = [teacher('a', 10), teacher('b', 3)];
    const events = [ev('a', 'student_created', 9), ev('a', 'slip_written', 8), ev('a', 'slip_shared', 8), ev('a', 'parent_opened', 7), ev('a', 'day_ticked', 6)];
    const s = snap({ teachers, events });
    const report = weeklyReport({
      date: '2026-09-13',
      summary: summarise(teachers, events, NOW),
      alerts: alerts(s, null, NOW),
      clusters: clusterFeedback([]),
      emails: plannedEmails(s, { a: ['welcome', 'checkin'], b: ['welcome'] }, NOW),
    });
    expect(report).toContain('| Teachers | 2 |');
    expect(report).toContain('Signed up 2 → added student 1 (50%)');
    expect(report).toContain('Fewer than 5 teachers have signed up');
  });

  it('points at the first broken funnel step', () => {
    const base = { date: 'd', alerts: [], clusters: [], emails: [] };
    const sum = (funnel: Partial<ReturnType<typeof summarise>['funnel']>) => ({
      ...summarise([], [], NOW),
      funnel: { signups: 10, addedStudent: 10, wroteSlip: 10, shared: 10, parentOpened: 10, dayTicked: 10, ...funnel },
    });
    expect(suggestion({ ...base, summary: sum({ wroteSlip: 3 }) })).toContain('Under half');
    expect(suggestion({ ...base, summary: sum({ shared: 4 }) })).toContain('not sent');
    expect(suggestion({ ...base, summary: sum({ parentOpened: 2 }) })).toContain("don't open");
    expect(suggestion({ ...base, summary: sum({}) })).toContain('healthy');
  });
});
