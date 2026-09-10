# Practice Slip

A practice slip for private music teachers that goes to the parent, not the child. The teacher writes the week's practice at the end of the lesson; it becomes a permanent link; the parent opens it with no app or login and taps a circle each day the child practises; the teacher sees who practised before the next lesson.

Built as an autonomous business build. Read the documents in this order:

| File | What it is |
|---|---|
| `KNOWLEDGE.md` | The operating rules for indie software businesses. Re-read before decisions. |
| `DECISION.md` | Twelve candidate markets, why this one, and its weaknesses. |
| `VALIDATION.md` | Mom Test questions and 14 sourced public complaints. |
| `OFFER.md` | The one-sentence pitch, the price, why someone pays. |
| `LAUNCH.md` + `launch/` | Where to post, in what order, and every message ready to send. |
| `HUMAN.md` | The short list of things only Liam can do. |
| `ops/` | Support, onboarding, content, monitoring, analytics and feedback automation. |
| `LOOP.md` | The weekly self-improving job. |
| `LIMITS.md` | Where AI genuinely cannot act, and the smallest human action for each. |

## Run it

```bash
npm install
npm run dev
```

With no `.env` the app runs in **local mode**: everything is stored in the browser's localStorage, sign-in is a name and email, and the whole product works end to end. That is what the tests use.

Copy `.env.example` to `.env` and fill in the Firebase values to talk to a real project.

## Check it

```bash
npm run check
```

Runs the TypeScript check, the test suite (unit tests for dates, slips, billing, analytics and the local repo, plus end-to-end flow tests for sign-in → student → slip → parent tick → note), and a production build. CI runs the same on every push.

Firestore security rules live in `firestore.rules`. They are the enforcement layer: a parent link can read one student and tick days on it, nothing else. Rules tests need the Firestore emulator (Java); see `ops/RULES-TESTING.md`.

## Layout

```
src/lib         pure logic: dates, slips, billing, analytics, ids, config
src/data        Repo interface, LocalRepo (localStorage), FirestoreRepo (firestore/lite)
src/auth        AuthProvider: Firebase Auth (lazy) or local session
src/pages       Landing, SignIn, Dashboard, StudentPage, ParentSlip, Billing, Settings, Admin
src/components  DayDots (the signature element), SlipCard, SlipEditor, ui
src/ops         pure logic for the operations scripts (onboarding, monitoring, feedback, reports)
scripts/ops     runnable scripts that pull a Firestore snapshot and produce the weekly report
```

## Design

Paper-toned background, white cards with hairlines, no shadows or gradients. Newsreader for anything a parent reads; IBM Plex Sans for the UI. Green for the teacher's actions, marigold for a day that got practised. The parent page is the product: a slip and seven circles.
