# Onboarding sequence

Two layers. Neither needs a manual send.

## Layer 1: in the product (already live)

- Empty dashboard: "Add your first student. Takes ten seconds."
- Students but no slips: "Tap a student to write this week's slip."
- Student page before the first slip: the permanent parent link is shown with "Send it once; every new slip shows up there."
- After saving a slip: toast "Slip saved. Now send it." and the Send/Copy/Print row appears.
- Seven days before the trial ends: a banner on the dashboard with a link to Billing.
- Trial ended: a banner explaining the soft lock.

## Layer 2: email, triggered by behaviour

Computed by `src/ops/onboarding.ts` from the snapshot; sent by the weekly routine via the support Gmail; recorded in `ops/data/sent.json` so nothing repeats. One email per teacher per run, each template once ever. Copy lives in `TEMPLATES` in the same file.

| Template | Trigger | Not sent if |
|---|---|---|
| `welcome` | Signed up (any day) | already sent |
| `no_student` | Day 2+, no student added | has a student |
| `not_shared` | Day 4+, wrote a slip, never tapped Send/Copy | shared |
| `checkin` | Day 7+, wrote a slip | never wrote one (nothing to ask about) |
| `trial_ending` | Day 25–29, not paying, wrote a slip | paying, or never used it |
| `trial_ended` | Day 31+, not paying, wrote a slip | paying |
| `winback` | Day 45+, not paying | paying |

Teachers who never wrote a slip get `no_student` once and then `winback` at day 45. No trial-ending pressure on people who never used it.

## Cadence and volume

Weekly runs mean a nudge can arrive up to six days late. That is acceptable at this stage; when there are more than ~30 active trials, move Routine B's email step to daily (same script, same rules). Gmail comfortably sends the resulting volume; above ~50 emails a day, see LIMITS.md §5.

## Replies

Replies to these emails land in the support inbox and go through `ops/support/RUNBOOK.md`. A reply to `checkin` is the most valuable thing this system produces: the routine files its content under "Interviews" in the weekly report verbatim (no names).
