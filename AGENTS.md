# Nudge

A routine runner for adults with ADHD who struggle to start. Expo SDK 57, Expo Router, TypeScript, iOS first.

## Rules of the house

- The app drives, the user follows. Never add a screen that asks the user to decide what's next.
- Zero shame. No streaks, no missed-day counts, no "you haven't opened this in a while". Only what was done is ever shown back.
- One thing on screen during a routine: the step, the dial, the controls.
- Rewards rotate. Don't hard-code a single completion sound, colour or animation. See `src/lib/rewards.ts`.
- Timer truth lives in timestamps (`src/lib/runner.ts`), never in tick counts.
- No accounts, no backend, no analytics, no notifications. Local storage only.
- Design language is in `DESIGN.md`. Read it before touching anything visual. No gradients, no glass, no emoji icons, no cards-with-shadows.

## Commands

- `npm start` then scan the QR code in Expo Go.
- `npm run typecheck` must be clean before committing.

Expo docs for this SDK: https://docs.expo.dev/versions/v57.0.0/
