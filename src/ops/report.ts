import type { Summary } from '../lib/analytics.ts';
import type { Cluster } from './feedback.ts';
import { backlogMarkdown } from './feedback.ts';
import type { PlannedEmail } from './onboarding.ts';
import type { Alert } from './types.ts';

export type ReportInput = {
  date: string;
  summary: Summary;
  alerts: Alert[];
  clusters: Cluster[];
  emails: PlannedEmail[];
};

/** The one document a human reads each week. Numbers first, then what to do. */
export function weeklyReport(r: ReportInput): string {
  const f = r.summary.funnel;
  const pct = (n: number, d: number) => (d === 0 ? '–' : `${Math.round((n / d) * 100)}%`);
  const lines: string[] = [];
  lines.push(`# Practice Slip — week ending ${r.date}`);
  lines.push('');
  lines.push('## Numbers');
  lines.push('');
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| Teachers | ${r.summary.teachers} |`);
  lines.push(`| Paying | ${r.summary.active} |`);
  lines.push(`| On trial | ${r.summary.trialing} |`);
  lines.push(`| MRR (AUD) | $${r.summary.mrrAud} |`);
  lines.push(`| Wrote a slip in last 14 days | ${r.summary.retention14 == null ? '–' : `${r.summary.retention14}%`} |`);
  lines.push('');
  lines.push('## Activation');
  lines.push('');
  lines.push(`Signed up ${f.signups} → added student ${f.addedStudent} (${pct(f.addedStudent, f.signups)}) → wrote slip ${f.wroteSlip} (${pct(f.wroteSlip, f.signups)}) → sent it ${f.shared} (${pct(f.shared, f.signups)}) → parent opened ${f.parentOpened} (${pct(f.parentOpened, f.signups)}) → parent ticked ${f.dayTicked} (${pct(f.dayTicked, f.signups)})`);
  lines.push('');
  if (r.summary.signupsByWeek.length > 0) {
    lines.push('Signups by week: ' + r.summary.signupsByWeek.map((w) => `${w.week.slice(5)}: ${w.count}`).join(' · '));
    lines.push('');
  }
  lines.push('## Alerts');
  lines.push('');
  if (r.alerts.length === 0) lines.push('_Quiet week. Nothing broken, nothing dropped._');
  for (const a of r.alerts) lines.push(`- **${a.level.toUpperCase()}** ${a.message}`);
  lines.push('');
  lines.push('## Feedback, clustered');
  lines.push('');
  lines.push(backlogMarkdown(r.clusters));
  lines.push('');
  lines.push('## Onboarding emails due today');
  lines.push('');
  if (r.emails.length === 0) lines.push('_None._');
  for (const e of r.emails) lines.push(`- ${e.template} → ${e.name || e.to} (${e.to})`);
  lines.push('');
  lines.push('## What to fix next');
  lines.push('');
  lines.push(suggestion(r));
  lines.push('');
  return lines.join('\n');
}

/** A blunt, rule-based pointer. The weekly loop does the real thinking. */
export function suggestion(r: ReportInput): string {
  const f = r.summary.funnel;
  if (r.alerts.some((a) => a.level === 'error')) return 'Fix the ERROR alerts first. Nothing else matters while something is broken or someone is waiting to pay.';
  if (f.signups < 5) return 'Fewer than 5 teachers have signed up. This is a distribution week: send the next batch in LAUNCH.md, not a feature.';
  if (f.wroteSlip / Math.max(1, f.signups) < 0.5) return 'Under half of signups write a slip. Watch a teacher do it (screen-share) and remove whatever stops them.';
  if (f.shared / Math.max(1, f.wroteSlip) < 0.6) return 'Slips get written but not sent. The send step is the bottleneck: check the share sheet on real phones.';
  if (f.parentOpened / Math.max(1, f.shared) < 0.5) return 'Slips get sent but parents don\'t open them. Ask teachers how they sent it and what the parent saw.';
  if (f.dayTicked / Math.max(1, f.parentOpened) < 0.5) return 'Parents open but don\'t tick. Revisit the parent page copy and the first-tap moment.';
  const top = r.clusters.find((c) => c.key !== 'praise' && c.key !== 'other');
  if (top) return `Activation is healthy. The biggest feedback cluster is "${top.label}" (${top.count}). Start there.`;
  return 'Activation is healthy and feedback is quiet. Spend the week on distribution and on asking for testimonials.';
}
