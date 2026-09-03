# Nudge

A routine app for adults with ADHD who struggle to start things. Tap a routine and it takes over: one small step on screen, read aloud, with a big dial counting it down. When the step ends it moves on by itself. Pause, skip and add two minutes are one tap each. At the end it tells you what you did and nothing else.

No accounts, no backend, no streaks, no stats, no notifications. Everything is stored on the phone.

## Run it on an iPhone

1. Install **Expo Go** from the App Store on the phone.
2. On the computer, in this folder:

   ```bash
   npm install
   npm start
   ```

3. Make sure the phone and computer are on the same Wi-Fi.
4. Scan the QR code in the terminal with the iPhone camera. It opens in Expo Go.

If the phone can't reach the computer (some networks block it), run `npx expo start --tunnel` instead.

## Project layout

```
src/app/            Expo Router screens
  index.tsx         Home: the routines, one tap to start
  run/[id].tsx      The runner: step, dial, controls, sign-off
  edit/[id].tsx     The builder: name, colour, steps, drag to reorder
src/components/     Dial (the signature timer), MiniDial, Controls
src/lib/            runner (timestamp timer), rewards (rotation), audio, speech,
                    haptics, store (AsyncStorage), presets, copy, duration
src/theme/tokens.ts Palette, type, motion
assets/sounds/      Eight generated completion sounds (WAV)
```

`DESIGN.md` explains every visual decision. `AGENTS.md` has the rules for anyone, human or otherwise, changing the app.

## Scripts

- `npm start` — dev server for Expo Go
- `npm run typecheck` — TypeScript, must be clean
