import type { GlazeKey } from './types';

/**
 * Reward rotation. A fixed reward stops working within weeks, so nothing
 * here is fixed: the sound, the colour and the motion each rotate and never
 * repeat back to back. Now and then it is bigger. Now and then it is nothing
 * but the page turning, which keeps the ordinary ones feeling like something.
 */

export type SoundKey = 'tine' | 'rise' | 'bowl' | 'wood' | 'settle' | 'knock' | 'bloom' | 'done';
export type Motion = 'flood' | 'sweep' | 'pulse' | 'none';
export type RewardSize = 'none' | 'normal' | 'big';

export type Reward = {
  size: RewardSize;
  sound: SoundKey | null;
  color: GlazeKey;
  motion: Motion;
};

const ORDINARY_SOUNDS: SoundKey[] = ['tine', 'rise', 'bowl', 'wood', 'settle', 'knock'];
const MOTIONS: Motion[] = ['flood', 'sweep', 'pulse'];
const GLAZES: GlazeKey[] = ['clay', 'ochre', 'moss', 'plum', 'slate'];

const BIG_CHANCE = 0.09;
const NONE_CHANCE = 0.1;

const last = {
  sound: null as SoundKey | null,
  motion: null as Motion | null,
  color: null as GlazeKey | null,
  size: 'normal' as RewardSize,
};

function pickNot<T>(list: T[], avoid: T | null): T {
  if (list.length === 1) return list[0];
  let item = list[Math.floor(Math.random() * list.length)];
  while (item === avoid) item = list[Math.floor(Math.random() * list.length)];
  return item;
}

export function nextReward(routineColor: GlazeKey): Reward {
  const roll = Math.random();
  let size: RewardSize = 'normal';
  // Never two big ones in a row, never two silent ones in a row.
  if (roll < BIG_CHANCE && last.size !== 'big') size = 'big';
  else if (roll < BIG_CHANCE + NONE_CHANCE && last.size !== 'none') size = 'none';
  last.size = size;

  if (size === 'none') {
    return { size, sound: null, color: routineColor, motion: 'none' };
  }

  // The routine's own colour appears most; the other glazes visit.
  const color =
    Math.random() < 0.55 ? routineColor : pickNot(GLAZES.filter((g) => g !== routineColor), last.color);
  last.color = color;

  if (size === 'big') {
    last.sound = 'bloom';
    last.motion = 'pulse';
    return { size, sound: 'bloom', color, motion: 'pulse' };
  }

  const sound = pickNot(ORDINARY_SOUNDS, last.sound);
  const motion = pickNot(MOTIONS, last.motion);
  last.sound = sound;
  last.motion = motion;
  return { size, sound, color, motion };
}
