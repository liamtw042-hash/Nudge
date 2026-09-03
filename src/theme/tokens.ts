import { StyleSheet } from 'react-native';
import { Easing } from 'react-native-reanimated';

import type { GlazeKey } from '@/lib/types';

/**
 * Palette. One idea: unbleached paper, warm ink, and a small family of
 * pottery glazes. No greys that came out of a tool. Every value here was
 * picked by eye against the paper tone.
 */
export const paper = '#F3EDE2';
export const paperDeep = '#EAE2D4'; // a pressed surface, a field
export const ink = '#26211D';
export const inkMuted = '#7C7168';
export const inkFaint = '#B3A797';
export const rule = '#DDD4C6'; // hairlines
export const spent = '#D8CEBE'; // a tick that has gone out

/** The glazes. Each routine wears one; rewards borrow from the rest. */
export const glazes: Record<GlazeKey, string> = {
  clay: '#B85C3C',
  ochre: '#B9832A',
  moss: '#5B6E4B',
  plum: '#7A4E5C',
  slate: '#526273',
};

export const glazeOrder: GlazeKey[] = ['clay', 'ochre', 'moss', 'plum', 'slate'];

export const fonts = {
  serif: 'Fraunces_400Regular',
  serifMedium: 'Fraunces_500Medium',
  serifItalic: 'Fraunces_400Regular_Italic',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
};

/** Motion has weight. Nothing bounces. */
export const motion = {
  slow: 650,
  medium: 420,
  quick: 200,
  easing: Easing.bezier(0.32, 0, 0.16, 1),
  easeOut: Easing.bezier(0.16, 0.6, 0.2, 1),
};

export const space = {
  edge: 28,
  gap: 16,
};

export const type = StyleSheet.create({
  step: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.4,
    color: ink,
  },
  stepLong: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.3,
    color: ink,
  },
  numeral: {
    fontFamily: fonts.mono,
    fontSize: 56,
    lineHeight: 64,
    color: ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    color: ink,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: ink,
  },
  body: {
    fontFamily: fonts.serif,
    fontSize: 21,
    lineHeight: 30,
    color: ink,
  },
  bodyMuted: {
    fontFamily: fonts.serif,
    fontSize: 19,
    lineHeight: 27,
    color: inkMuted,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: inkMuted,
  },
  labelInk: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: ink,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 16,
    lineHeight: 22,
    color: ink,
    fontVariant: ['tabular-nums'],
  },
});
