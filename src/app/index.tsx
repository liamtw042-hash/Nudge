import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hairline, TextButton } from '@/components/Controls';
import { MiniDial } from '@/components/MiniDial';
import { totalMinutes } from '@/lib/duration';
import { haptic } from '@/lib/haptics';
import { routineLength, useStore } from '@/lib/store';
import type { Routine } from '@/lib/types';
import { glazes, paper, space, type } from '@/theme/tokens';

/**
 * Home. A list, not a dashboard. Each routine is one big touch target and
 * touching it starts the routine. Nothing to read first, nothing to choose.
 */
export default function Home() {
  const routines = useStore((s) => s.routines);
  const voiceOn = useStore((s) => s.voiceOn);
  const setVoiceOn = useStore((s) => s.setVoiceOn);
  const restoreStarters = useStore((s) => s.restoreStarters);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={type.label} maxFontSizeMultiplier={1.3}>
          Nudge
        </Text>
        <Text style={[type.bodyMuted, styles.lede]} maxFontSizeMultiplier={1.3}>
          Pick one. It starts straight away.
        </Text>

        <Hairline />
        {routines.map((routine) => (
          <RoutineRow key={routine.id} routine={routine} />
        ))}

        {routines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={type.body} maxFontSizeMultiplier={1.3}>
              Nothing here yet.
            </Text>
            <TextButton label="Bring back the starters" onPress={restoreStarters} align="left" style={styles.emptyAction} />
          </View>
        ) : null}

        <View style={styles.footer}>
          <TextButton
            label="+ New routine"
            align="left"
            onPress={() => router.push({ pathname: '/edit/[id]', params: { id: 'new' } })}
          />
          <TextButton label={voiceOn ? 'Voice on' : 'Voice off'} muted align="right" onPress={() => setVoiceOn(!voiceOn)} />
        </View>
      </ScrollView>
    </View>
  );
}

function RoutineRow({ routine }: { routine: Routine }) {
  const router = useRouter();
  const seconds = routineLength(routine);
  const count = routine.steps.length;
  const canStart = count > 0;

  return (
    <View>
      <Pressable
        disabled={!canStart}
        onPress={() => {
          haptic.tap();
          router.push({ pathname: '/run/[id]', params: { id: routine.id } });
        }}
        accessibilityRole="button"
        accessibilityLabel={`Start ${routine.name}`}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View style={styles.rowText}>
          <Text style={type.title} maxFontSizeMultiplier={1.3}>
            {routine.name}
          </Text>
          <Text style={[type.label, styles.meta]} maxFontSizeMultiplier={1.3}>
            {count === 0 ? 'No steps yet' : `${count} step${count === 1 ? '' : 's'} · ${totalMinutes(seconds)}`}
          </Text>
        </View>
        <MiniDial size={64} color={glazes[routine.color]} lit={canStart ? 60 : 0} />
      </Pressable>
      <TextButton
        label="Edit"
        muted
        align="left"
        style={styles.edit}
        onPress={() => router.push({ pathname: '/edit/[id]', params: { id: routine.id } })}
      />
      <Hairline />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: paper,
  },
  content: {
    paddingHorizontal: space.edge,
  },
  lede: {
    marginTop: 10,
    marginBottom: 26,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 6,
    gap: 16,
  },
  rowPressed: {
    opacity: 0.55,
    transform: [{ scale: 0.985 }],
  },
  rowText: {
    flex: 1,
  },
  meta: {
    marginTop: 8,
  },
  edit: {
    marginBottom: 10,
    marginLeft: -6,
  },
  empty: {
    paddingTop: 28,
    paddingBottom: 8,
  },
  emptyAction: {
    marginTop: 8,
    marginLeft: -6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginHorizontal: -6,
  },
});
