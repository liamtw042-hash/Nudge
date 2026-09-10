import { access, mrr, trialEnd, TRIAL_DAYS } from '@/lib/billing';
import type { Teacher } from '@/lib/types';

const DAY = 24 * 60 * 60 * 1000;

function teacher(over: Partial<Teacher> = {}): Teacher {
  const createdAt = 1_000_000;
  return {
    id: 't',
    email: 'a@b.c',
    name: 'A',
    studio: '',
    createdAt,
    trialEndsAt: trialEnd(createdAt),
    plan: 'trial',
    planUntil: null,
    activatedAt: null,
    ...over,
  };
}

describe('access', () => {
  it('allows writing during the trial and counts days left', () => {
    const t = teacher();
    const a = access(t, t.createdAt + 3 * DAY);
    expect(a.canWrite).toBe(true);
    expect(a.state).toBe('trial');
    expect(a.daysLeft).toBe(TRIAL_DAYS - 3);
  });

  it('soft-locks after the trial', () => {
    const t = teacher();
    expect(access(t, t.trialEndsAt + 1)).toMatchObject({ canWrite: false, state: 'trial_ended' });
  });

  it('honours an active plan and its end', () => {
    const t = teacher({ plan: 'active', activatedAt: 5_000_000, planUntil: 5_000_000 + 31 * DAY });
    expect(access(t, 5_000_000 + DAY).canWrite).toBe(true);
    expect(access(t, 5_000_000 + 40 * DAY)).toMatchObject({ canWrite: false, state: 'lapsed' });
  });
});

describe('mrr', () => {
  it('counts monthly at full price and yearly spread over twelve months', () => {
    const now = 10_000_000;
    const monthly = teacher({ plan: 'active', activatedAt: now - DAY, planUntil: now + 30 * DAY });
    const yearly = teacher({ plan: 'active', activatedAt: now - DAY, planUntil: now + 364 * DAY });
    const ended = teacher({ plan: 'active', activatedAt: now - 60 * DAY, planUntil: now - DAY });
    const trial = teacher();
    expect(mrr([monthly, yearly, ended, trial], now)).toBe(9 + Math.round((79 / 12) * 100) / 100);
  });
});
