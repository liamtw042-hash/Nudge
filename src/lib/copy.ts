import { countWord, spokenMinutes } from './duration';

/**
 * The voice of the app. Calm, plain, a bit dry. Sounds like a person who
 * has done this before and is not impressed by much, in a kind way.
 */

/** Spoken and shown when a step starts: "Water. A whole glass. One minute." */
export function stepAnnouncement(name: string, spokenLength: string): string {
  const n = name.trim();
  const end = /[.!?]$/.test(n) ? '' : '.';
  return `${n}${end} ${spokenLength}.`;
}

type EndContext = { routineName: string; doneCount: number; elapsedSeconds: number };

/**
 * Sign-off lines. Rotated so they don't wear out. Only ever about what
 * happened, never what didn't.
 */
const SIGN_OFFS: ((c: EndContext) => string)[] = [
  (c) => `That's the ${c.routineName.toLowerCase()}.`,
  () => 'Done. Go on with your day.',
  (c) => `${countWord(c.doneCount, 'thing')}. That'll do.`,
  (c) => `That took ${spokenMinutes(c.elapsedSeconds)}. Not bad.`,
  () => 'Finished. Nothing else to do here.',
  (c) => `${c.routineName}, done.`,
  () => "Right. That's that.",
];

let lastSignOff = -1;

export function signOff(c: EndContext): string {
  // With nothing done there is still nothing to apologise for.
  if (c.doneCount === 0) return `That's the ${c.routineName.toLowerCase()}.`;
  let i = Math.floor(Math.random() * SIGN_OFFS.length);
  if (i === lastSignOff) i = (i + 1) % SIGN_OFFS.length;
  lastSignOff = i;
  return SIGN_OFFS[i](c);
}

/** The done list as one sentence: "Water. Face. Teeth." */
export function doneSentence(names: string[]): string {
  return names
    .map((n) => n.trim().replace(/[.!?]+$/, ''))
    .filter(Boolean)
    .map((n) => `${n}.`)
    .join(' ');
}

/** Spoken at the end. Short. */
export function spokenEnd(line: string, doneCount: number): string {
  if (doneCount === 0) return line;
  return `${line} ${countWord(doneCount, 'thing')} done.`;
}
