# LIMITS.md

Where AI genuinely cannot act in this business, why, and the smallest human action that unblocks each. Not softened.

## 1. Account ownership

**Cannot:** create or hold the Firebase/Google project, the GitHub repository, the Gmail inbox, the Reddit or Facebook accounts, a domain, or any payment account. Every one of these is a legal agreement between a provider and a person; some (Google Cloud billing, Lemon Squeezy, Paddle, Stripe, domain registrars) require the person to be 18. Firebase's free plan and GitHub are fine at 15; card-based billing is not.
**Why it matters:** without the Firebase project nothing is live. Without a merchant account nobody can pay by card.
**Smallest unblock:** HUMAN.md steps 1–2 (Liam, ~40 minutes). For card payments, one parent opens one merchant-of-record account and pastes two links (HUMAN.md step 9).

## 2. Sending from Liam's identity

**Cannot, and should not:** send outreach, community posts, replies or invoices as Liam without his consent for each channel. A message from "Liam, 15, Newcastle" is the product's credibility; an AI sending it is misrepresentation. Reddit and Facebook also ban automated posting.
**What AI does instead:** writes every message in advance (`launch/messages.md`, `ops/content/CALENDAR.md`), drafts support replies inside Gmail, and answers FAQ-class support automatically only under the rules Liam has approved in `ops/support/RUNBOOK.md`.
**Smallest unblock:** Liam presses send on a pre-written message. Five to ten minutes a day during launch, less later.

## 3. Money

**Cannot:** receive money, issue invoices under an ABN, hold a bank account, or refund. Invoicing is a legal act by the sole trader.
**What AI does instead:** the invoice request flow, the invoice email template (I1), the admin "activate" switch, and MRR tracking.
**Smallest unblock:** Liam sends the invoice and clicks activate when paid (two minutes per customer). Later, the merchant-of-record account makes this automatic.

## 4. Legal and tax

**Cannot:** decide whether GST registration is needed (not until $75K turnover, but that's a judgement for an accountant), sign terms of service or privacy policies as the operator, or handle a data-deletion request with legal weight. It also cannot assess whether a 15-year-old sole trader can contract with customers in every state; in NSW a minor's contracts for necessaries and beneficial service arrangements are generally enforceable, but that is not advice.
**What AI does instead:** drafted a plain privacy statement in the app (what's stored, how to delete). Kept data collection to first names and practice items so there is almost nothing sensitive to protect.
**Smallest unblock:** one conversation with a parent or the free ATO small-business phone line before the first invoice. Publish a one-page privacy policy (draft in `ops/legal/PRIVACY.md`) under Liam's name.

## 5. Sending email at scale

**Cannot:** run a transactional email service without an account (Resend, Postmark, Brevo and Mailgun all require an adult account holder or a business). Gmail through the Claude connector is fine for tens of emails a day, not thousands, and Google will throttle bulk sends.
**Why it matters:** the onboarding sequence and parent reminders are capped at what one Gmail can send.
**Smallest unblock:** none needed below ~50 teachers. Above that, a parent-held Resend account and a 30-minute change to `ops/onboarding` to send through it.

## 6. Running code on a schedule with production secrets

**Cannot:** hold the Firebase service-account key itself. The weekly ops scripts need it to read teachers and events.
**What AI does instead:** the scripts read the key from an environment variable that Liam sets on his machine once (`GOOGLE_APPLICATION_CREDENTIALS`), and fall back to the last committed snapshot when it's missing.
**Smallest unblock:** download the key once (part of HUMAN.md step 2) and leave it at a path the scheduled job can read.

## 7. Verifying on real devices and real people

**Cannot:** watch a teacher write a slip at the end of a lesson, or a parent open a link on an old Android phone in a car park. The flows are tested end to end in a browser, but usability with real people is observation, not automation.
**Smallest unblock:** two ten-minute screen-shares in the first fortnight (R1 offers them). Write what you see in `launch/interviews.md`.

## 8. Judgement calls about the business

**Cannot, honestly:** know whether this market is worth Liam's next year. DECISION.md lists the weaknesses. The weekly report gives numbers; the call on whether to continue, pivot to tutors (the runner-up market) or stop is a human one, and should be made against the "numbers that mean it isn't" section of LAUNCH.md, not against hope.
**Smallest unblock:** a fifteen-minute read of the week-4 and week-8 reports, and a decision written in DECISION.md.

## What is not a limit

Building, testing, deploying (once secrets exist), drafting every message, classifying and answering routine support, computing analytics, clustering feedback, proposing and implementing improvements, and opening PRs. None of that needs Liam beyond reading and pressing approve.
