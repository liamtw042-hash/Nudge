import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { makePresets } from './presets';
import type { Routine } from './types';

/**
 * Everything the app remembers: the routines and whether the voice is on.
 * That is the whole list. No history, no counts, no last-opened date.
 */
type Persisted = {
  routines: Routine[];
  voiceOn: boolean;
};

type Store = Persisted & {
  hydrated: boolean;
  upsertRoutine: (routine: Routine) => void;
  deleteRoutine: (id: string) => void;
  setVoiceOn: (on: boolean) => void;
  restoreStarters: () => void;
  markHydrated: () => void;
};

export const useStore = create<Store>()(
  persist<Store, [], [], Persisted>(
    (set) => ({
      routines: makePresets(),
      voiceOn: true,
      hydrated: false,
      upsertRoutine: (routine) =>
        set((s) => {
          const i = s.routines.findIndex((r) => r.id === routine.id);
          if (i < 0) return { routines: [...s.routines, routine] };
          const next = s.routines.slice();
          next[i] = routine;
          return { routines: next };
        }),
      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      setVoiceOn: (on) => set({ voiceOn: on }),
      restoreStarters: () => set((s) => ({ routines: [...s.routines, ...makePresets()] })),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'nudge.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ routines: s.routines, voiceOn: s.voiceOn }),
      onRehydrateStorage: () => () => {
        // Hydrated or failed, the app opens either way. Failure just means the starters.
        setTimeout(() => useStore.setState({ hydrated: true }), 0);
      },
    },
  ),
);

export function routineLength(routine: Routine): number {
  return routine.steps.reduce((sum, s) => sum + s.seconds, 0);
}
