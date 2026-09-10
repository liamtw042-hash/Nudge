import type { Teacher } from '../lib/types.ts';
import type { SentLog, Snapshot } from './types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

export type TemplateKey = 'welcome' | 'no_student' | 'not_shared' | 'checkin' | 'trial_ending' | 'trial_ended' | 'winback';

export type PlannedEmail = {
  teacherId: string;
  to: string;
  name: string;
  template: TemplateKey;
  subject: string;
  body: string;
};

type State = {
  days: number;
  hasStudent: boolean;
  wroteSlip: boolean;
  shared: boolean;
  parentOpened: boolean;
  isPaying: boolean;
  slipsLast14: number;
};

function first(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there';
}

const SUPPORT = '{{SUPPORT_EMAIL}}';
const URL = '{{PUBLIC_URL}}';

export const TEMPLATES: Record<TemplateKey, (t: Teacher, s: State) => { subject: string; body: string }> = {
  welcome: (t) => ({
    subject: 'Your first slip takes a minute',
    body: `Hi ${first(t.name)},

Thanks for trying Practice Slip. The fastest way to see whether it's for you:

1. Add one student (their first name is enough).
2. Write their slip for this week. It's the same thing you'd write in a notebook.
3. Tap "Send to parent". It opens your messaging app with the slip and the link already written.

That's the whole product. The parent taps a circle each day; you see it before the lesson.

If anything is confusing, reply to this email. I read every one.

Liam
${URL}`,
  }),
  no_student: (t) => ({
    subject: 'Ten seconds to add a student',
    body: `Hi ${first(t.name)},

You signed up a couple of days ago and haven't added a student yet. No problem. It takes about ten seconds: ${URL}/app, "+ Add student", a first name.

If you're waiting on something, or it just didn't click, reply and tell me what. That's more useful to me than a sign-up.

Liam`,
  }),
  not_shared: (t) => ({
    subject: 'The slip is written. One tap to send it.',
    body: `Hi ${first(t.name)},

You've written a slip but it hasn't gone to a parent yet. On the student's page, "Send to parent" opens whatever you use to message them, with the text and link already there. "Copy link" works too if you'd rather paste it yourself.

The link is permanent for that student, so you only ever send it once. Every new slip appears at the same link.

If sending didn't work on your phone, tell me which phone and app and I'll fix it.

Liam`,
  }),
  checkin: (t) => ({
    subject: 'A week in. Three questions.',
    body: `Hi ${first(t.name)},

You've been using Practice Slip for about a week. Three quick questions, one line each is fine:

1. The last slip you sent: how did you send it, and did the parent open it?
2. What did you skip or fight with when writing a slip?
3. Has anything changed at the lesson since?

Honest answers only. What you say goes straight into what I fix next.

Liam`,
  }),
  trial_ending: (t, s) => ({
    subject: 'Your free month ends in five days',
    body: `Hi ${first(t.name)},

Your free month of Practice Slip ends in five days. You've written ${s.slipsLast14} slip${s.slipsLast14 === 1 ? '' : 's'} in the last fortnight.

If it's earning its place: ${URL}/app/billing, pick monthly ($9 AUD) or yearly ($79 AUD), and I'll send an invoice you can pay by bank transfer. Your account switches on the day it's paid.

If it isn't: reply with why. I'll say thanks and mean it. Everything stays readable either way; you just can't write new slips after the trial.

Liam`,
  }),
  trial_ended: (t) => ({
    subject: 'Trial ended. Everything is still there.',
    body: `Hi ${first(t.name)},

Your free month has ended. Your students, slips and the parent links are all still there and still readable. New slips need a subscription: ${URL}/app/billing.

If the price is the problem, or the product is, I'd rather hear it than guess.

Liam`,
  }),
  winback: (t) => ({
    subject: 'One question, then I\'ll leave you alone',
    body: `Hi ${first(t.name)},

You tried Practice Slip a while back and didn't keep going. One question: what got in the way? Wrong problem, wrong tool, or just life?

A one-word reply is fine. I won't write again after this.

Liam`,
  }),
};

function stateFor(t: Teacher, snap: Snapshot, now: number): State {
  const ev = snap.events.filter((e) => e.teacherId === t.id);
  const has = (type: string) => ev.some((e) => e.type === type);
  const wroteSlip = has('slip_written') || snap.students.some((s) => s.teacherId === t.id && s.hasSlip);
  return {
    days: Math.floor((now - t.createdAt) / DAY_MS),
    // A written slip implies a student, even if the creation event was lost.
    hasStudent: wroteSlip || has('student_created') || snap.students.some((s) => s.teacherId === t.id),
    wroteSlip,
    shared: has('slip_shared'),
    parentOpened: has('parent_opened'),
    isPaying: t.plan === 'active' && (t.planUntil == null || t.planUntil > now),
    slipsLast14: ev.filter((e) => e.type === 'slip_written' && e.at >= now - 14 * DAY_MS).length,
  };
}

/**
 * Which email each teacher should get today, if any. At most one per teacher
 * per run, each template at most once ever. Triggered by what they did or
 * didn't do, never by a fixed drip.
 */
export function plannedEmails(snap: Snapshot, sent: SentLog, now: number = Date.now()): PlannedEmail[] {
  const out: PlannedEmail[] = [];
  for (const t of snap.teachers) {
    if (!t.email) continue;
    const done = new Set(sent[t.id] ?? []);
    const s = stateFor(t, snap, now);
    let key: TemplateKey | null = null;

    if (s.days >= 0 && !done.has('welcome')) key = 'welcome';
    else if (s.days >= 2 && !s.hasStudent && !done.has('no_student')) key = 'no_student';
    else if (s.days >= 4 && s.wroteSlip && !s.shared && !done.has('not_shared')) key = 'not_shared';
    else if (s.days >= 7 && s.wroteSlip && !done.has('checkin')) key = 'checkin';
    else if (s.days >= 25 && s.days < 30 && !s.isPaying && s.wroteSlip && !done.has('trial_ending')) key = 'trial_ending';
    else if (s.days >= 31 && !s.isPaying && !done.has('trial_ended') && s.wroteSlip) key = 'trial_ended';
    else if (s.days >= 45 && !s.isPaying && !done.has('winback')) key = 'winback';

    if (!key) continue;
    const { subject, body } = TEMPLATES[key](t, s);
    out.push({ teacherId: t.id, to: t.email, name: t.name, template: key, subject, body });
  }
  return out;
}

/** Fill the placeholders once the real URLs are known. */
export function finalise(emails: PlannedEmail[], publicUrl: string, supportEmail: string): PlannedEmail[] {
  return emails.map((e) => ({
    ...e,
    body: e.body.split(URL).join(publicUrl).split(SUPPORT).join(supportEmail),
  }));
}
