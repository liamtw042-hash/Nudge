# Support responder runbook

Runs daily as a scheduled Claude Code routine with the Gmail connector. Reads unread mail under the label `Support`. For each thread:

## 1. Classify

| Class | Looks like | Action |
|---|---|---|
| **FAQ** | Matches a question in `FAQ.md` (how to send, parent can't open, price, trial, printing, delete data, sign-in link didn't arrive) | **Send** the FAQ answer, personalised with their name and any specific detail. Mark thread "Handled". |
| **Bug** | Something doesn't work: describes an error, a blank page, a tick not saving, a link "not active" | **Draft** a reply asking for phone/browser and the student link (never the parent's name), acknowledge within the draft, and add a line to `ops/feedback/BACKLOG.md` under "Bugs" with the thread date. Escalate. |
| **Feature request** | "Could it…", "I wish…" | **Send** a short thanks that names the request back to them and says it's logged. Append the request to `ops/feedback/BACKLOG.md`. No promises, no dates. |
| **Billing** | Invoice request, paid, receipt, cancel, refund | **Draft** only. Escalate. Money is always Liam's. |
| **Trial / access** | "Trial ended", "can't write slips" | **Send** the FAQ answer on how billing works, and draft the invoice email (template I1 from `launch/messages.md`) for Liam. |
| **Press / partnership / "who are you"** | Journalists, associations, other companies | **Draft** using R2 from `launch/messages.md`. Escalate. |
| **Angry / upset** | Any sign of frustration beyond a bug report | **Draft** only, warm and short, no defence. Escalate as URGENT. |
| **Data / privacy / legal** | Delete my account, GDPR/APP, child data | **Draft** using `ops/legal/PRIVACY.md` wording. Escalate. Never delete anything automatically. |
| **Spam** | Sales pitches, SEO offers | Archive, log as spam. |

## 2. Rules for anything sent automatically

- Only FAQ, feature-thanks and trial/access replies are ever sent without a human.
- Sign as "Liam" with the line "(I'm 15 and this is my project; a helper drafts the routine replies and I read every thread.)" once per thread. Honesty about the responder is not optional.
- Never quote the parent's or child's name back in a way that could go to the wrong person; reply in-thread only.
- Never promise a date, a feature, a refund, or a discount.
- If the same person has already received two automatic replies in a thread, stop: draft and escalate.
- Unsure about the class: draft and escalate. A slow honest reply beats a fast wrong one.

## 3. Escalation

An escalation is a Gmail draft left in the thread plus a line in the daily digest email to Liam (`liamtw042@gmail.com`), subject `Support: N to read`, ordered URGENT first. Liam reads drafts, edits or sends. If a thread has waited more than 48 hours with a draft unsent, the next day's digest repeats it at the top with "48h".

## 4. Log

Append one line per thread to `ops/support/LOG.md`:

```
2026-09-14 | FAQ:sending | sent | thread:<gmail id>
2026-09-14 | bug | drafted+escalated | thread:<gmail id> | note: tick not saving on old Android
```

No message bodies, no emails, no names in the log. Commit the log with the day's run.

## 5. Weekly

The weekly routine reads LOG.md, counts classes, and puts the top three support themes into the report. If FAQ:X appears five or more times in a week, that answer becomes a line on the landing page or in the product, and the loop treats it as a candidate improvement.
