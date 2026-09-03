import { useCallback, useEffect, useRef, useState } from 'react';

import type { Routine, StepOutcome } from './types';

/**
 * The routine timer. Truth lives in timestamps, not tick counts: a step
 * knows when it ends, and "remaining" is always end minus now. Put the phone
 * down for ten minutes and the maths still holds when you pick it up.
 *
 * If a step ran out while the app was away, that step counts as done and the
 * next one starts fresh from now. We never silently burn through several
 * steps in the background: the person was not there to be told.
 */

export const TICKS = 60;
/** The page turn between steps. The next timer starts after it. */
export const TURN_MS = 800;
export const ADD_MS = 2 * 60 * 1000;

export type Phase = 'running' | 'paused' | 'finished';

type Core = {
  phase: Phase;
  index: number;
  totalMs: number;
  endsAt: number | null;
  remainingAtPause: number | null;
  outcomes: StepOutcome[];
  startedAt: number;
  finishedAt: number | null;
};

export type RunnerHandlers = {
  onStepStart: (index: number) => void;
  onStepEnd: (index: number, outcome: StepOutcome, auto: boolean) => void;
  onFinish: (final: RunnerView) => void;
};

export type RunnerView = Core & {
  /** Whole seconds left, clamped to the step's length. */
  seconds: number;
  /** Ticks still lit on the dial, 0..60. */
  lit: number;
};

function remainingOf(c: Core, now: number): number {
  if (c.phase === 'paused') return c.remainingAtPause ?? 0;
  if (c.endsAt == null) return 0;
  return c.endsAt - now;
}

function litCount(remainingMs: number, totalMs: number): number {
  if (remainingMs <= 0) return 0;
  if (totalMs <= 0) return TICKS;
  const fraction = Math.min(1, remainingMs / totalMs);
  return Math.max(1, Math.min(TICKS, Math.ceil(fraction * TICKS)));
}

function view(c: Core, now: number): RunnerView {
  const remaining = Math.min(c.totalMs, remainingOf(c, now));
  return {
    ...c,
    seconds: Math.max(0, Math.ceil(remaining / 1000)),
    lit: litCount(remaining, c.totalMs),
  };
}

export function useRunner(routine: Routine, handlers: RunnerHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const core = useRef<Core>(makeStart(routine));
  const [snapshot, setSnapshot] = useState<RunnerView>(() => view(core.current, Date.now()));

  const publish = useCallback(() => {
    const next = view(core.current, Date.now());
    setSnapshot((prev) => (sameView(prev, next) ? prev : next));
  }, []);

  const finish = useCallback(() => {
    const c = core.current;
    c.phase = 'finished';
    c.endsAt = null;
    c.remainingAtPause = null;
    c.finishedAt = Date.now();
    publish();
    handlersRef.current.onFinish(view(c, c.finishedAt));
  }, [publish]);

  const advance = useCallback(
    (outcome: StepOutcome, auto: boolean) => {
      const c = core.current;
      if (c.phase === 'finished') return;
      const endedIndex = c.index;
      c.outcomes[endedIndex] = outcome;
      handlersRef.current.onStepEnd(endedIndex, outcome, auto);

      const nextIndex = endedIndex + 1;
      if (nextIndex >= routine.steps.length) {
        finish();
        return;
      }
      const now = Date.now();
      c.index = nextIndex;
      c.totalMs = routine.steps[nextIndex].seconds * 1000;
      c.endsAt = now + TURN_MS + c.totalMs;
      c.remainingAtPause = null;
      c.phase = 'running';
      publish();
      handlersRef.current.onStepStart(nextIndex);
    },
    [finish, publish, routine.steps],
  );

  // First step announces itself once the screen is up.
  useEffect(() => {
    handlersRef.current.onStepStart(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The clock. Cheap: it only re-renders when a shown value changes.
  useEffect(() => {
    const id = setInterval(() => {
      const c = core.current;
      if (c.phase === 'running' && c.endsAt != null && Date.now() >= c.endsAt) {
        advance('done', true);
        return;
      }
      publish();
    }, 100);
    return () => clearInterval(id);
  }, [advance, publish]);

  const done = useCallback(() => advance('done', false), [advance]);
  const skip = useCallback(() => advance('skipped', false), [advance]);

  const pause = useCallback(() => {
    const c = core.current;
    if (c.phase !== 'running' || c.endsAt == null) return;
    c.remainingAtPause = Math.max(0, c.endsAt - Date.now());
    c.endsAt = null;
    c.phase = 'paused';
    publish();
  }, [publish]);

  const resume = useCallback(() => {
    const c = core.current;
    if (c.phase !== 'paused') return;
    c.endsAt = Date.now() + (c.remainingAtPause ?? 0);
    c.remainingAtPause = null;
    c.phase = 'running';
    publish();
  }, [publish]);

  const addTime = useCallback(
    (ms: number = ADD_MS) => {
      const c = core.current;
      if (c.phase === 'finished') return;
      c.totalMs += ms;
      if (c.phase === 'running' && c.endsAt != null) c.endsAt += ms;
      else if (c.phase === 'paused') c.remainingAtPause = (c.remainingAtPause ?? 0) + ms;
      publish();
    },
    [publish],
  );

  /** End the routine now. What's done stays done. */
  const end = useCallback(() => {
    if (core.current.phase === 'finished') return;
    finish();
  }, [finish]);

  return { state: snapshot, done, skip, pause, resume, addTime, end };
}

function makeStart(routine: Routine): Core {
  const now = Date.now();
  const first = routine.steps[0];
  const totalMs = (first?.seconds ?? 0) * 1000;
  return {
    phase: 'running',
    index: 0,
    totalMs,
    endsAt: now + TURN_MS + totalMs,
    remainingAtPause: null,
    outcomes: [],
    startedAt: now,
    finishedAt: null,
  };
}

function sameView(a: RunnerView, b: RunnerView): boolean {
  return (
    a.phase === b.phase &&
    a.index === b.index &&
    a.seconds === b.seconds &&
    a.lit === b.lit &&
    a.totalMs === b.totalMs &&
    a.finishedAt === b.finishedAt
  );
}
