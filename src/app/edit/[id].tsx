import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hairline, TextButton } from '@/components/Controls';
import { clock, totalMinutes } from '@/lib/duration';
import { haptic } from '@/lib/haptics';
import { newId } from '@/lib/id';
import { routineLength, useStore } from '@/lib/store';
import type { GlazeKey, Routine, Step } from '@/lib/types';
import { glazeOrder, glazes, ink, inkFaint, inkMuted, paper, rule, space, type } from '@/theme/tokens';

/**
 * The builder. Edits save themselves as you go, so there is no Save button
 * to remember and no "discard changes?" to get wrong. Steps reorder by
 * holding the handle. Durations step in sensible increments.
 */

const MIN_SECONDS = 15;

function stepFor(seconds: number): number {
  if (seconds < 60) return 15;
  if (seconds < 300) return 30;
  return 60;
}

function leastUsedGlaze(routines: Routine[]): GlazeKey {
  const counts = new Map<GlazeKey, number>(glazeOrder.map((g) => [g, 0]));
  for (const r of routines) counts.set(r.color, (counts.get(r.color) ?? 0) + 1);
  return glazeOrder.reduce((best, g) => ((counts.get(g) ?? 0) < (counts.get(best) ?? 0) ? g : best), glazeOrder[0]);
}

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routines = useStore((s) => s.routines);
  const upsertRoutine = useStore((s) => s.upsertRoutine);
  const deleteRoutine = useStore((s) => s.deleteRoutine);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const existing = useMemo(() => routines.find((r) => r.id === id), [routines, id]);
  const isNew = id === 'new';

  const [draft, setDraft] = useState<Routine>(() =>
    existing
      ? { ...existing, steps: existing.steps.map((s) => ({ ...s })) }
      : {
          id: newId(),
          name: '',
          color: leastUsedGlaze(routines),
          steps: [{ id: newId(), name: '', seconds: 60 }],
        },
  );
  const [focusId, setFocusId] = useState<string | null>(null);
  const deleted = useRef(false);
  const dirty = useRef(false);

  // Autosave, lightly debounced. Only once there is something worth keeping.
  useEffect(() => {
    if (!dirty.current || deleted.current) return;
    const worthKeeping = draft.name.trim().length > 0 || draft.steps.some((s) => s.name.trim().length > 0);
    if (!worthKeeping) return;
    const t = setTimeout(() => {
      upsertRoutine({
        ...draft,
        name: draft.name.trim() || 'Untitled',
        steps: draft.steps.filter((s) => s.name.trim().length > 0).map((s) => ({ ...s, name: s.name.trim() })),
      });
    }, 250);
    return () => clearTimeout(t);
  }, [draft, upsertRoutine]);

  const update = useCallback((fn: (d: Routine) => Routine) => {
    dirty.current = true;
    setDraft(fn);
  }, []);

  const updateStep = useCallback(
    (stepId: string, patch: Partial<Step>) =>
      update((d) => ({ ...d, steps: d.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) })),
    [update],
  );
  const removeStep = useCallback(
    (stepId: string) => update((d) => ({ ...d, steps: d.steps.filter((s) => s.id !== stepId) })),
    [update],
  );
  const addStep = useCallback(() => {
    const fresh: Step = { id: newId(), name: '', seconds: 60 };
    setFocusId(fresh.id);
    update((d) => ({ ...d, steps: [...d.steps, fresh] }));
  }, [update]);
  const onReorder = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => {
      haptic.tap();
      update((d) => ({ ...d, steps: reorderItems(d.steps, from, to) }));
    },
    [update],
  );

  const confirmDelete = () => {
    Alert.alert('Delete this routine?', undefined, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleted.current = true;
          deleteRoutine(draft.id);
          router.back();
        },
      },
    ]);
  };

  const length = routineLength(draft);

  const header = (
    <View>
      <TextInput
        value={draft.name}
        onChangeText={(name) => update((d) => ({ ...d, name }))}
        placeholder="Name it"
        placeholderTextColor={inkFaint}
        style={[type.title, styles.nameInput]}
        autoFocus={isNew}
        returnKeyType="done"
        maxFontSizeMultiplier={1.3}
        selectionColor={glazes[draft.color]}
      />
      <View style={styles.swatches}>
        {glazeOrder.map((g) => (
          <Pressable
            key={g}
            onPress={() => {
              haptic.tap();
              update((d) => ({ ...d, color: g }));
            }}
            accessibilityRole="button"
            accessibilityLabel={`Colour ${g}`}
            hitSlop={8}
            style={styles.swatchHit}>
            <View style={[styles.swatch, { backgroundColor: glazes[g] }]}>
              {draft.color === g ? <View style={styles.swatchDot} /> : null}
            </View>
          </Pressable>
        ))}
      </View>
      <Text style={[type.label, styles.stepsLabel]} maxFontSizeMultiplier={1.3}>
        Steps · {totalMinutes(length)}
      </Text>
      <Hairline />
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      <TextButton label="+ Add step" align="left" onPress={addStep} style={styles.footerButton} />
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.top}>
        <TextButton label="‹ Back" onPress={() => router.back()} align="left" style={styles.topButton} />
        {!isNew ? <TextButton label="Delete" muted onPress={confirmDelete} align="right" style={styles.topButton} /> : null}
      </View>
      <ReorderableList
        data={draft.steps}
        keyExtractor={(s) => s.id}
        onReorder={onReorder}
        renderItem={({ item }) => (
          <StepRow
            step={item}
            accent={glazes[draft.color]}
            autoFocus={item.id === focusId}
            onChange={updateStep}
            onRemove={removeStep}
          />
        )}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

type StepRowProps = {
  step: Step;
  accent: string;
  autoFocus: boolean;
  onChange: (id: string, patch: Partial<Step>) => void;
  onRemove: (id: string) => void;
};

const StepRow = memo(function StepRow({ step, accent, autoFocus, onChange, onRemove }: StepRowProps) {
  const drag = useReorderableDrag();
  const inc = stepFor(step.seconds);
  const decAmount = stepFor(Math.max(MIN_SECONDS, step.seconds - 1));

  return (
    <View style={styles.row}>
      <Pressable
        onLongPress={() => {
          haptic.tap();
          drag();
        }}
        delayLongPress={120}
        accessibilityRole="button"
        accessibilityLabel="Hold to reorder"
        hitSlop={10}
        style={styles.handle}>
        <View style={styles.handleLine} />
        <View style={styles.handleLine} />
        <View style={styles.handleLine} />
      </Pressable>
      <View style={styles.rowBody}>
        <TextInput
          value={step.name}
          onChangeText={(name) => onChange(step.id, { name })}
          placeholder="Say what to do"
          placeholderTextColor={inkFaint}
          style={[type.body, styles.stepInput]}
          autoFocus={autoFocus}
          returnKeyType="done"
          maxFontSizeMultiplier={1.3}
          selectionColor={accent}
        />
        <View style={styles.rowMeta}>
          <View style={styles.stepper}>
            <TextButton
              label="−"
              glyph
              onPress={() => onChange(step.id, { seconds: Math.max(MIN_SECONDS, step.seconds - decAmount) })}
              style={styles.stepperButton}
            />
            <Text style={[type.mono, styles.stepperValue]} maxFontSizeMultiplier={1.3}>
              {clock(step.seconds)}
            </Text>
            <TextButton
              label="+"
              glyph
              onPress={() => onChange(step.id, { seconds: step.seconds + inc })}
              style={styles.stepperButton}
            />
          </View>
          <TextButton label="Remove" muted onPress={() => onRemove(step.id)} align="right" />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: paper,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.edge - 6,
    minHeight: 44,
  },
  topButton: {
    minWidth: 60,
  },
  list: {
    paddingHorizontal: space.edge,
    paddingTop: 12,
  },
  nameInput: {
    paddingVertical: 8,
    color: ink,
  },
  swatches: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    marginLeft: -8,
  },
  swatchHit: {
    padding: 8,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: paper,
  },
  stepsLabel: {
    marginTop: 30,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: rule,
    backgroundColor: paper,
  },
  handle: {
    width: 32,
    paddingTop: 12,
    gap: 4,
  },
  handleLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: inkMuted,
  },
  rowBody: {
    flex: 1,
  },
  stepInput: {
    paddingVertical: 4,
    color: ink,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginLeft: -6,
    marginRight: -6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    minWidth: 44,
  },
  stepperValue: {
    minWidth: 52,
    textAlign: 'center',
  },
  footer: {
    marginTop: 8,
    marginLeft: -6,
  },
  footerButton: {
    minHeight: 52,
  },
});
