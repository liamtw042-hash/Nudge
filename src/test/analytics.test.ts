import { summarise } from '@/lib/analytics';
import type { AppEvent, Teacher } from '@/lib/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 8, 10, 12).getTime();

function t(id: string, over: Partial<Teacher> = {}): Teacher {
  return { id, email: `${id}@x.test`, name: id, studio: '', createdAt: NOW - 30 * DAY, trialEndsAt: NOW + DAY, plan: 'trial', planUntil: null, activatedAt: null, ...over };
}

function e(teacherId: string, type: AppEvent['type'], at = NOW - DAY): AppEvent {
  return { id: `${teacherId}-${type}-${at}`, teacherId, studentId: null, type, at };
}

describe('summarise', () => {
  it('builds the funnel by distinct teacher', () => {
    const s = summarise([t('a'), t('b')], [e('a', 'student_created'), e('a', 'slip_written'), e('a', 'slip_written'), e('b', 'student_created')], NOW);
    expect(s.funnel).toMatchObject({ signups: 2, addedStudent: 2, wroteSlip: 1, shared: 0 });
  });

  it('computes 14-day retention among teachers older than 14 days', () => {
    const s = summarise([t('old1'), t('old2'), t('new', { createdAt: NOW - 2 * DAY })], [e('old1', 'slip_written', NOW - 3 * DAY), e('old2', 'slip_written', NOW - 20 * DAY)], NOW);
    expect(s.retention14).toBe(50);
  });

  it('counts plans and revenue', () => {
    const s = summarise([t('p', { plan: 'active', activatedAt: NOW - DAY, planUntil: NOW + 20 * DAY }), t('x', { trialEndsAt: NOW - DAY }), t('y')], [], NOW);
    expect(s.active).toBe(1);
    expect(s.lapsed).toBe(1);
    expect(s.trialing).toBe(1);
    expect(s.mrrAud).toBe(9);
  });

  it('groups signups by week', () => {
    const s = summarise([t('a', { createdAt: new Date(2026, 8, 8).getTime() }), t('b', { createdAt: new Date(2026, 8, 9).getTime() }), t('c', { createdAt: new Date(2026, 8, 1).getTime() })], [], NOW);
    expect(s.signupsByWeek).toEqual([
      { week: '2026-08-31', count: 1 },
      { week: '2026-09-07', count: 2 },
    ]);
  });
});
