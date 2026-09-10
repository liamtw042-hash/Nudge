# HUMAN.md

Everything below needs you, legally or physically. Nothing else does. Once 1–4 are done, the weekly routine is: open this file, do the items in "Every week", close it. Under an hour.

## Once, to go live (about 90 minutes total)

1. **Create the Firebase project** (Google account, free Spark plan, no card). At console.firebase.google.com: new project `practice-slip` → add a Web app → copy the four config values into GitHub repository secrets `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (Settings → Secrets and variables → Actions). Then in the console: **Authentication** → enable *Google* and *Email link (passwordless)*; **Firestore** → create database (production mode, region `australia-southeast1`).
2. **Let GitHub deploy for you.** In Firebase: Project settings → Service accounts → Generate new private key. Paste the JSON into a GitHub secret `FIREBASE_SERVICE_ACCOUNT`. Set repository *variables* `DEPLOY_ENABLED=true`, `VITE_PUBLIC_URL=https://practice-slip.web.app`, `VITE_SUPPORT_EMAIL=<the inbox from step 3>`, `VITE_ADMIN_EMAILS=liamtw042@gmail.com`, `VITE_PAY_INSTRUCTIONS=<one line about bank transfer/PayID>`. Push anything to `main` and the site deploys. Then run once on your machine to publish the security rules: `npx firebase-tools login` then `npx firebase-tools deploy --only firestore`.
3. **Make the support inbox.** Either a new Gmail (`practiceslip@gmail.com` or similar) or a label in your existing Gmail. Create a filter so anything sent to that address gets the label `Support`. Connect that Gmail to Claude (claude.ai connector settings) so the support routine in `ops/support/RUNBOOK.md` can read and draft from it.
4. **Schedule the routines.** In Claude Code, run `/schedule` and create the two jobs described in `ops/README.md` (daily support sweep, weekly ops + improvement loop). They only need the Gmail connector and this repo.

## Every week (under an hour)

5. **Send the outreach.** `launch/messages.md` has every message written; `LAUNCH.md` says who gets which and in what order. Sending must come from you: it's your name and your email. Log each send in `launch/outreach-tracker.csv` (one line).
6. **Reply to people.** The daily support routine answers the boring questions and leaves drafts for the rest in Gmail. Read the drafts, press send or edit. Reply to Reddit/Facebook comments yourself; those accounts are yours.
7. **Invoice and switch on.** When someone requests an invoice (it lands in the inbox and in the admin dashboard at `/app/admin`), send template I1 with your ABN and bank details. When they pay, click "Mark paid + activate" in the admin dashboard.
8. **Read the weekly report** the routine writes to `ops/reports/` and emails you. Approve or reject the PR the improvement loop opened. Merge = deploy.

## When it's earned it

9. **Card payments.** Ask a parent to open a Lemon Squeezy (or Paddle) account in their name as merchant of record, create two products ($9 AUD monthly, $79 AUD yearly), and paste the two hosted-checkout links into the repository variables `VITE_CHECKOUT_URL_MONTHLY` and `VITE_CHECKOUT_URL_YEARLY`. The billing page switches from invoices to "Pay by card" on the next deploy. Payouts go to that account; sort the family arrangement in writing.
10. **A real domain.** Someone 18+ registers `practiceslip.com` (or `.com.au`, which also needs the ABN) and adds it in Firebase Hosting → Custom domains. Update `VITE_PUBLIC_URL`.

## Housekeeping (once, five minutes)

11. Delete the stale folder `C:\Users\liamt\OneDrive\Desktop\Nudge`. The live repo is at `C:\Users\liamt\dev\practice-slip` (outside OneDrive on purpose; OneDrive restores deleted files and fights with node_modules). Optionally rename the GitHub repo from `Nudge` to `practice-slip`; GitHub redirects the old name.
