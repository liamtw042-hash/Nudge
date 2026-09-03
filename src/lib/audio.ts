import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import type { SoundKey } from './rewards';

/**
 * Completion sounds. All generated in-house: struck tones with a few
 * partials and a long, soft decay. Nothing that could be mistaken for
 * a notification.
 */
const SOURCES: Record<SoundKey, number> = {
  tine: require('@/assets/sounds/tine.wav'),
  rise: require('@/assets/sounds/rise.wav'),
  bowl: require('@/assets/sounds/bowl.wav'),
  wood: require('@/assets/sounds/wood.wav'),
  settle: require('@/assets/sounds/settle.wav'),
  knock: require('@/assets/sounds/knock.wav'),
  bloom: require('@/assets/sounds/bloom.wav'),
  done: require('@/assets/sounds/done.wav'),
};

const players: Partial<Record<SoundKey, AudioPlayer>> = {};
let prepared = false;

/**
 * Call once at launch. Sets the audio session so sounds and the voice play
 * even with the ring switch off (the whole point is to be heard at 6am with
 * the phone face down) and mix with whatever music is already on. Then
 * warms up one player per sound so the first chime is not late.
 */
export async function prepareAudio(): Promise<void> {
  if (prepared) return;
  prepared = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      allowsRecording: false,
    });
  } catch {
    // Audio mode is a nicety; the app works without it.
  }
  for (const key of Object.keys(SOURCES) as SoundKey[]) {
    try {
      const p = createAudioPlayer(SOURCES[key]);
      p.volume = 0.9;
      players[key] = p;
    } catch {
      // A missing player just means silence for that one sound.
    }
  }
}

export async function playSound(key: SoundKey | null): Promise<void> {
  if (!key) return;
  const p = players[key];
  if (!p) return;
  try {
    await p.seekTo(0);
    p.play();
  } catch {
    // Never let a sound failure interrupt a routine.
  }
}
