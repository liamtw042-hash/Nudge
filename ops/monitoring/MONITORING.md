# Monitoring

What is checked, how often, the thresholds, and where it goes. All alerts route to `liamtw042@gmail.com` via the Gmail connector from the weekly routine (daily once volume justifies it).

## Checks (in `src/ops/monitor.ts`, run by `npm run ops:weekly`)

| Check | Threshold | Level |
|---|---|---|
| Site up | Public URL does not return 200 | ERROR |
| Zero events | 7 days of no events while ≥3 teachers exist | ERROR (logging or site broken) |
| Invoice waiting | Open invoice request older than 2 days | ERROR (someone wants to pay) |
| Signup drop | This week < half of last week, last week ≥ 4 | WARN |
| Delivery failing | Teacher wrote slips 3+ days ago, no parent has opened any | WARN (the send step is broken for them) |
| Lapsed | Paying teacher's period ended this week | WARN |
| Churn | Paying last snapshot, not paying now | WARN |
| Trials ending | Trials ending within 7 days | INFO |
| No signups | Two weeks with zero signups | INFO (distribution) |

## Where it goes

- Subject line: `Practice Slip week N` normally; `ALERT: <first error>` if any ERROR exists. Errors get their own paragraph at the top of the email.
- Everything is also in `ops/reports/<date>.md`, committed.

## What is deliberately not monitored

- Client-side JavaScript errors: no error-tracking service without an adult account holder (Sentry etc.). The app is small enough that a broken page shows up as "zero events" or a support email within a day. Revisit after 50 teachers (LIMITS.md).
- Uptime every five minutes: UptimeRobot's free tier would do it but needs an account; the weekly check plus support email is enough at this size. A parent can add UptimeRobot in five minutes if wanted.

## Manual sanity (part of Routine B)

The routine loads the live site in the browser, signs in as the admin, and opens `/app/admin`. If the dashboard loads and shows the same teacher count as the snapshot, the read path is healthy. It notes "dashboard OK" in the report.
