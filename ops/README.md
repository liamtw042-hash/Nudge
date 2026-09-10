# ops/ — running Practice Slip without Liam

Two scheduled Claude Code routines do the work. Liam's part is in HUMAN.md.

## Routine A: daily support sweep (every day, 07:30 Sydney)

Reads the Gmail label `Support` through the Gmail connector and follows `ops/support/RUNBOOK.md`: answers FAQ-class messages, drafts everything else, escalates by the rules, logs each conversation to `ops/support/LOG.md` (no bodies, just class and action), commits the log.

## Routine B: weekly ops and improvement (Sunday, 18:00 Sydney)

1. `npm run ops:snapshot` (pulls production if credentials are present).
2. `npm run ops:weekly` (report, send list, feedback backlog).
3. Sends each email in `ops/data/sendlist.json` from the support Gmail via the connector, then `npm run ops:mark-sent`. See `ops/onboarding/SEQUENCE.md`.
4. Emails Liam the report (`ops/monitoring/MONITORING.md` says what goes in the subject line when there's an alert).
5. Runs the improvement loop in `LOOP.md` and opens a PR.
6. Commits `ops/reports/`, `ops/data/sent.json`, `ops/support/LOG.md`, `ops/feedback/BACKLOG.md`.

## The scripts

| Command | Does |
|---|---|
| `npm run ops:snapshot` | Pull teachers, students, events, feedback, invoices from Firestore; check the site is up. Needs `GOOGLE_APPLICATION_CREDENTIALS`. |
| `npm run ops:weekly` | Compute summary, alerts, feedback clusters, onboarding emails. Writes the report. No network. |
| `npm run ops:mark-sent` | Record sent onboarding emails so none repeat. |

All logic is in `src/ops/*.ts` and tested in `src/test/ops.test.ts`. The scripts are thin. They run on Node 24 directly (type stripping), which is why relative imports carry `.ts` extensions.

## Files

```
ops/support/RUNBOOK.md      classification, auto-reply rules, escalation rules
ops/support/FAQ.md          the answers the responder is allowed to send
ops/support/LOG.md          one line per handled conversation
ops/onboarding/SEQUENCE.md  triggers and copy for the welcome/nudge/check-in sequence
ops/content/CALENDAR.md     four weeks of posts, marked human-send or auto
ops/monitoring/MONITORING.md what is checked, thresholds, where alerts go
ops/feedback/BACKLOG.md     clustered feedback, regenerated weekly
ops/legal/PRIVACY.md        the privacy statement to publish
ops/RULES-TESTING.md        how to run the Firestore rules tests
ops/reports/                weekly reports
ops/data/                   snapshot.json, sent.json, sendlist.json
```

## Analytics dashboard

Live at `/app/admin` for admin emails: teachers, paying, trial, MRR, 14-day retention, activation funnel, signups by week, open invoices, feedback. Computed from Firestore on load; nothing manual.
