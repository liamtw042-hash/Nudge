import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoundButton, TextButton } from '@/components/Controls';
import { Dial, type DialHandle } from '@/components/Dial';
import { playSound } from '@/lib/audio';
import { doneSentence, signOff, spokenEnd, stepAnnouncement } from '@/lib/copy';
import { clock, clockTime, spokenDuration, totalMinutes } from '@/lib/duration';
import { haptic } from '@/lib/haptics';
import { nextReward } from '@/lib/rewards';
import { useRunner, type RunnerView } from '@/lib/runner';
import { hush, say } from '@/lib/speech';
import { useStore } from '@/lib/store';
import type { Routine } from '@/lib/types';
import { glazes, motion, paper, space, type } from '@/theme/tokens';

/**
 * The runner. The whole app, really. One step, the dial, four controls.
 * The app drives; the person follows. Nothing on this screen asks a question.
 */
export default function RunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = useStore((s) => s.routines.find((r) => r.id === id));
  if (!routine || routine.steps.length === 0) return <Redirect href="/" />;
  return <Runner routine={routine} />;
}

function Runner({ routine }: { routine: Routine }) {
  useKeepAwake();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const voiceOn = useStore((s) => s.voiceOn);
  const voiceRef = useRef(voiceOn);
  voiceRef.current = voiceOn;

  const dial = useRef<DialHandle>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      hush();
    },
    [],
  );

  const [ending, setEnding] = useState<{ line: string; doneNames: string[] } | null>(null);

  const { state, done, skip, pause, resume, addTime, end } = useRunner(routine, {
    onStepStart: (index) => {
      const step = routine.steps[index];
      if (!step) return;
      later(
        () => {
          if (voiceRef.current) say(stepAnnouncement(step.name, spokenDuration(step.seconds)));
        },
        index === 0 ? 350 : 700,
      );
    },
    onStepEnd: (_index, outcome) => {
      if (outcome !== 'done') {
        haptic.soft();
        return;
      }
      const reward = nextReward(routine.color);
      playSound(reward.sound);
      if (reward.size === 'big') haptic.big();
      else if (reward.size === 'none') haptic.soft();
      else haptic.done();
      dial.current?.celebrate(reward.motion, glazes[reward.color]);
    },
    onFinish: (final: RunnerView) => {
      hush();
      const doneNames = routine.steps.filter((_, i) => final.outcomes[i] === 'done').map((s) => s.name);
      const elapsed = ((final.finishedAt ?? Date.now()) - final.startedAt) / 1000;
      const line = signOff({ routineName: routine.name, doneCount: doneNames.length, elapsedSeconds: elapsed });
      setEnding({ line, doneNames });
      playSound('done');
      haptic.finish();
      later(() => {
        if (voiceRef.current) say(spokenEnd(line, doneNames.length));
      }, 600);
    },
  });

  const step = routine.steps[state.index];
  const accent = glazes[routine.color];
  const dialSize = Math.min(width - space.edge * 2, 336);
  const paused = state.phase === 'paused';

  if (ending) {
    const doneCount = ending.doneNames.length;
    const elapsed = ((state.finishedAt ?? Date.now()) - state.startedAt) / 1000;
    const finishedAt = new Date(state.finishedAt ?? Date.now());
    const meta = [doneCount > 0 ? `${doneCount} done` : null, totalMinutes(elapsed), clockTime(finishedAt)]
      .filter(Boolean)
      .join(' · ');
    return (
      <Animated.View
        entering={FadeIn.duration(motion.slow).easing(motion.easing).delay(200)}
        style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.endBody}>
          <Text style={type.heading} maxFontSizeMultiplier={1.3}>
            {ending.line}
          </Text>
          {doneCount > 0 ? (
            <Text style={[type.body, styles.endList]} maxFontSizeMultiplier={1.3}>
              {doneSentence(ending.doneNames)}
            </Text>
          ) : null}
          <Text style={[type.label, styles.endMeta]} maxFontSizeMultiplier={1.3}>
            {meta}
          </Text>
        </View>
        <View style={styles.endAction}>
          <RoundButton label="OK" onPress={() => router.back()} />
        </View>
      </Animated.View>
    );
  }

  const longName = (step?.name.length ?? 0) > 26;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.top}>
        <Text style={type.label} maxFontSizeMultiplier={1.3}>
          {state.index + 1} of {routine.steps.length}
        </Text>
        <TextButton label="End" muted onPress={end} style={styles.endButton} />
      </View>

      <View style={styles.stepBlock}>
        <Animated.View
          key={state.index}
          entering={FadeInDown.duration(motion.slow).easing(motion.easing).delay(260)}
          exiting={FadeOutUp.duration(motion.medium).easing(motion.easing)}
          style={styles.stepText}>
          <Text style={longName ? type.stepLong : type.step} maxFontSizeMultiplier={1.25} numberOfLines={4}>
            {step?.name}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.dialBlock}>
        <Dial ref={dial} size={dialSize} lit={state.lit} color={accent} paused={paused} numeral={clock(state.seconds)} />
      </View>

      <View style={styles.controls}>
        <View style={styles.smallRow}>
          <TextButton label={paused ? 'Resume' : 'Pause'} onPress={paused ? resume : pause} align="left" style={styles.smallButton} />
          <TextButton label="+2 min" onPress={() => addTime()} style={styles.smallButton} />
          <TextButton label="Skip" onPress={skip} align="right" style={styles.smallButton} />
        </View>
        <Animated.View entering={FadeIn.duration(motion.slow)} exiting={FadeOut.duration(motion.quick)} style={styles.doneWrap}>
          <RoundButton label="Done" onPress={done} size={104} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: paper,
    paddingHorizontal: space.edge,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  endButton: {
    marginRight: -6,
  },
  stepBlock: {
    minHeight: 150,
    justifyContent: 'center',
    marginTop: 8,
  },
  stepText: {
    width: '100%',
  },
  dialBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  controls: {
    alignItems: 'center',
  },
  smallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginHorizontal: -6,
    marginBottom: 18,
  },
  smallButton: {
    minWidth: 92,
  },
  doneWrap: {
    alignItems: 'center',
  },
  endBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 22,
  },
  endList: {
    marginTop: 2,
  },
  endMeta: {
    marginTop: 4,
  },
  endAction: {
    alignItems: 'center',
  },
});
