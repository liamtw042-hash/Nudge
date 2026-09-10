import type { Teacher } from './types.ts';

export const TRIAL_DAYS = 30;
export const PRICE_MONTHLY_AUD = 9;
export const PRICE_YEARLY_AUD = 79;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Access = {
  canWrite: boolean;
  state: 'trial' | 'active' | 'trial_ended' | 'lapsed';
  daysLeft: number;
};

export function trialEnd(createdAt: number): number {
  return createdAt + TRIAL_DAYS * DAY_MS;
}

export function access(teacher: Teacher, now: number = Date.now()): Access {
  if (teacher.plan === 'active') {
    if (teacher.planUntil == null || teacher.planUntil > now) {
      return { canWrite: true, state: 'active', daysLeft: teacher.planUntil ? Math.ceil((teacher.planUntil - now) / DAY_MS) : Infinity };
    }
    return { canWrite: false, state: 'lapsed', daysLeft: 0 };
  }
  if (now < teacher.trialEndsAt) {
    return { canWrite: true, state: 'trial', daysLeft: Math.ceil((teacher.trialEndsAt - now) / DAY_MS) };
  }
  return { canWrite: false, state: 'trial_ended', daysLeft: 0 };
}

/** Monthly recurring revenue in AUD for a set of teachers. Yearly is spread over 12 months. */
export function mrr(teachers: Pick<Teacher, 'plan' | 'planUntil' | 'activatedAt'>[], now: number = Date.now()): number {
  let total = 0;
  for (const t of teachers) {
    if (t.plan !== 'active') continue;
    if (t.planUntil != null && t.planUntil <= now) continue;
    const length = t.planUntil != null && t.activatedAt != null ? t.planUntil - t.activatedAt : 31 * DAY_MS;
    total += length > 200 * DAY_MS ? PRICE_YEARLY_AUD / 12 : PRICE_MONTHLY_AUD;
  }
  return Math.round(total * 100) / 100;
}
