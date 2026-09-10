# Feedback loop

## Collection (automatic)

- **In-app:** the Feedback button on every teacher page writes to the `feedback` collection with the page path. No form fields to fill, one textarea.
- **Email:** support threads classified as bug or feature request are appended to `BACKLOG.md` by the daily routine.
- **Behaviour:** the funnel itself is feedback. A drop at a step is logged as an alert and considered alongside written feedback.
- **Interviews:** replies to the day-7 `checkin` email are quoted in the weekly report.

## Clustering (automatic)

`src/ops/feedback.ts` buckets by keyword into: sending, parent page, writing slips, students, printing, billing, phone/layout, sign-in, praise, other. Crude on purpose: it needs to be readable and predictable, not clever. Each cluster keeps up to three samples. `BACKLOG.md` is regenerated weekly with counts; a human can add `Status:` lines that survive because the loop reads the file before overwriting the samples.

## Weekly summary

The report's "Feedback, clustered" section plus "What to fix next" (`src/ops/report.ts`): a rule-based pointer at the first broken funnel step, or the biggest non-praise cluster if the funnel is healthy. LOOP.md turns that into one PR.

## Closing the loop with the person

When a fix ships for something a named teacher asked for, the support routine drafts a two-line "you asked, it's done" reply in their thread for Liam to send. Those are the emails that turn trials into subscriptions.
