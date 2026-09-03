import React, { forwardRef, memo, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { TICKS } from '@/lib/runner';
import type { Motion } from '@/lib/rewards';
import { inkMuted, motion, spent, type } from '@/theme/tokens';

/**
 * The dial. Sixty ticks, like the minute marks on a kitchen timer, every
 * fifth one longer. Ticks go out one at a time as the step runs down, from
 * the end of the wound section back toward twelve, so what is left always
 * reads as a wedge you could put your thumb on. Ticks go out instantly;
 * they come back on with a wind, the way you would twist the timer.
 *
 * When a step completes, the dial is where the reward happens: a flood of
 * colour, a sweep around the ring, or the whole thing swelling for a moment.
 */

export type DialHandle = {
  celebrate: (kind: Motion, color: string) => void;
};

type Props = {
  size: number;
  /** Ticks currently lit, 0..60. */
  lit: number;
  /** The routine's glaze. */
  color: string;
  paused: boolean;
  numeral: string;
};

const TICK_W = 5;
const TICK_LEN = 22;
const TICK_LONG = 32;
const SWEEP_MS = 520;

export const Dial = memo(
  forwardRef<DialHandle, Props>(function Dial({ size, lit, color, paused, numeral }, ref) {
    const litSV = useSharedValue(lit);
    const colorSV = useSharedValue(color);
    const rewardSV = useSharedValue(color);
    const flashSV = useSharedValue(0);
    const sweepSV = useSharedValue(0);
    const scaleSV = useSharedValue(1);
    const pausedSV = useSharedValue(paused ? 1 : 0);

    // Out instantly, back on with a wind.
    useEffect(() => {
      if (lit >= litSV.value) {
        litSV.value = withTiming(lit, { duration: motion.medium, easing: motion.easeOut });
      } else {
        litSV.value = lit;
      }
    }, [lit, litSV]);

    useEffect(() => {
      colorSV.value = color;
    }, [color, colorSV]);

    useEffect(() => {
      pausedSV.value = withTiming(paused ? 1 : 0, { duration: motion.medium, easing: motion.easing });
    }, [paused, pausedSV]);

    useImperativeHandle(
      ref,
      () => ({
        celebrate(kind, rewardColor) {
          rewardSV.value = rewardColor;
          if (kind === 'flood' || kind === 'pulse') {
            flashSV.value = withSequence(
              withTiming(1, { duration: 140, easing: motion.easeOut }),
              withDelay(300, withTiming(0, { duration: 720, easing: motion.easing })),
            );
          }
          if (kind === 'pulse') {
            scaleSV.value = withSequence(
              withTiming(1.06, { duration: 260, easing: motion.easeOut }),
              withTiming(1, { duration: 760, easing: motion.easing }),
            );
          }
          if (kind === 'sweep') {
            sweepSV.value = 0;
            sweepSV.value = withTiming(TICKS, { duration: SWEEP_MS, easing: Easing.linear }, (finished) => {
              if (finished) {
                flashSV.value = 1;
                sweepSV.value = 0;
                flashSV.value = withTiming(0, { duration: 760, easing: motion.easing });
              }
            });
          }
        },
      }),
      [flashSV, rewardSV, scaleSV, sweepSV],
    );

    const wholeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleSV.value }] }));

    const outerRadius = size / 2 - 2;
    const ticks = [];
    for (let i = 0; i < TICKS; i++) {
      const len = i % 5 === 0 ? TICK_LONG : TICK_LEN;
      ticks.push(
        <Tick
          key={i}
          index={i}
          size={size}
          length={len}
          radius={outerRadius - len / 2}
          lit={litSV}
          base={colorSV}
          reward={rewardSV}
          flash={flashSV}
          sweep={sweepSV}
          pausedSV={pausedSV}
        />,
      );
    }

    return (
      <Animated.View style={[{ width: size, height: size }, wholeStyle]}>
        {ticks}
        <View style={styles.centre} pointerEvents="none">
          <Text style={type.numeral} maxFontSizeMultiplier={1.2}>
            {numeral}
          </Text>
          {paused ? (
            <Text style={[type.label, styles.pausedLabel]} maxFontSizeMultiplier={1.2}>
              Paused
            </Text>
          ) : null}
        </View>
      </Animated.View>
    );
  }),
);

type TickProps = {
  index: number;
  size: number;
  length: number;
  radius: number;
  lit: SharedValue<number>;
  base: SharedValue<string>;
  reward: SharedValue<string>;
  flash: SharedValue<number>;
  sweep: SharedValue<number>;
  pausedSV: SharedValue<number>;
};

const Tick = memo(function Tick({ index, size, length, radius, lit, base, reward, flash, sweep, pausedSV }: TickProps) {
  const style = useAnimatedStyle(() => {
    const isLit = index < lit.value;
    const swept = index < sweep.value;
    const glow = Math.max(flash.value, swept ? 1 : 0);
    const resting = isLit ? base.value : spent;
    return {
      backgroundColor: interpolateColor(glow, [0, 1], [resting, reward.value]),
      opacity: isLit ? 1 - pausedSV.value * 0.5 : 1,
    };
  });
  return (
    <Animated.View
      style={[
        styles.tick,
        {
          width: TICK_W,
          height: length,
          borderRadius: TICK_W / 2,
          left: size / 2 - TICK_W / 2,
          top: size / 2 - length / 2,
          transform: [{ rotate: `${index * (360 / TICKS)}deg` }, { translateY: -radius }],
        },
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  tick: {
    position: 'absolute',
  },
  centre: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedLabel: {
    marginTop: 2,
    color: inkMuted,
  },
});
