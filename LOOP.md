# LOOP.md — the weekly self-improving job

A scheduled Claude Code job (Claude Max, `/schedule`, weekly, Sunday 18:00 Sydney time) that reads what happened, picks one improvement, builds it, tests it, and opens a PR. It never merges. Liam merges, which deploys.

## Inputs it reads, in order

1. `KNOWLEDGE.md` (always first; the rules).
2. `ops/reports/<latest>.md` — the weekly ops report produced by `npm run ops:weekly` (signups, activation funnel, retention, MRR, alerts, feedback clusters, support themes). If the report is older than 8 days, it runs `npm run ops:weekly` itself first.
3. `ops/feedback/BACKLOG.md` — open items with counts.
4. `git log --since="8 days ago"` — what changed last week, so it doesn't redo work.
5. `LAUNCH.md` "numbers that mean it isn't" — to recognise a strategic problem it should raise rather than patch.

## How it picks

Score every candidate improvement 1–5 on each of:
- **Reach:** how many current teachers or parents hit this weekly.
- **Evidence:** number of feedback items, support tickets or funnel drop-offs pointing at it.
- **Leverage:** does it move activation (slip sent, parent opened, day ticked) or retention (slip written in last 14 days)? Revenue-only changes score lower until activation is above 50%.
- **Cost:** inverse of estimated hours; anything over one day of work is split or deferred.

Highest product of the four wins. Ties go to the item that touches the parent page, because that is the product.

Hard rules:
- One improvement per week. Not two.
- Never change pricing, the trial length, security rules, or the parent-link scheme without a human decision recorded in DECISION.md.
- If the funnel shows fewer than 3 teachers sent a slip in the last 14 days, the "improvement" is a written diagnosis in `ops/reports/`, not code. Distribution problems are not solved with features.

## How it builds

1. Branch `loop/YYYY-MM-DD-<slug>` from `main`.
2. Re-read the relevant source files fully before editing.
3. Implement. Add or update tests for the change. Keep the diff under ~400 lines; if it grows, cut scope.
4. `npm run check` must pass: typecheck, all tests, production build.
5. If the change is visible, run the dev server and walk the affected flow in the browser (sign-in → student → slip → parent link) and record what was checked in the PR body.
6. Update `ops/feedback/BACKLOG.md`: mark the item done, leave the rest.
7. Open a PR titled `loop: <what changed>` with: the evidence (numbers, quotes), what changed, how it was tested, what to watch next week. End the body with the generation notice.

## Success criteria it checks itself against

Before opening the PR, it must be able to answer yes to all of:
- The change traces to at least one number or quote in this week's report.
- `npm run check` is green locally.
- No new dependency was added without a sentence justifying it.
- The parent page bundle did not grow by more than 10% (`npx vite build` output).
- The PR body says what metric should move and by roughly how much, so next week can check.

Next week, before picking, it looks at last week's PR: was it merged, and did the named metric move? If merged and the metric didn't move for two consecutive weeks, it writes that down and lowers the weight of similar items.

## Budget guard

- **Time:** hard stop at 90 minutes of agent time per run. At 75 minutes it commits what's green, opens the PR as a draft, and writes what's left.
- **Tokens:** if the job's context passes roughly 400K tokens it stops reading and starts finishing.
- **Blast radius:** no force pushes, no pushes to `main`, no edits to `.github/workflows`, `firestore.rules`, or `LIMITS.md`. No external network calls except npm and the repo's own dev server.
- **Cost:** runs inside Claude Max; no API spend. If it is ever moved to the API, cap at US$5 per run and refuse to start if the month's total passes US$40.
- **Runaway:** if the same item has been attempted three weeks running, it is marked `blocked` in the backlog with the reason and a human is asked in the report.

## What it emails Liam after each run

One email via the Gmail connector, subject `Practice Slip week <n>`: five lines of numbers, the alert list, the PR link, the one decision (if any) that needs a human. If the week was quiet, it says so in one line and stops.
