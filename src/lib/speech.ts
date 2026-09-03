import * as Speech from 'expo-speech';

/**
 * The voice. Calm and a touch slower than default. Prefers an "Enhanced"
 * English voice if the phone has one downloaded, in the phone's own accent
 * where possible, and otherwise leaves it to the system.
 */

let voiceId: string | undefined;
let language = 'en';
let prepared = false;

function deviceLocale(): string {
  try {
    const l = Intl.DateTimeFormat().resolvedOptions().locale;
    return typeof l === 'string' && l.length > 0 ? l : 'en';
  } catch {
    return 'en';
  }
}

export async function prepareVoice(): Promise<void> {
  if (prepared) return;
  prepared = true;
  const locale = deviceLocale();
  language = locale.toLowerCase().startsWith('en') ? locale : 'en';
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const english = voices.filter((v) => v.language.toLowerCase().startsWith('en'));
    const region = language.toLowerCase();
    const score = (v: Speech.Voice) =>
      (v.quality === Speech.VoiceQuality.Enhanced ? 2 : 0) + (v.language.toLowerCase() === region ? 1 : 0);
    const best = english.sort((a, b) => score(b) - score(a))[0];
    if (best && score(best) > 0) voiceId = best.identifier;
  } catch {
    voiceId = undefined;
  }
}

export function say(text: string, onDone?: () => void): void {
  try {
    Speech.stop();
    Speech.speak(text, {
      voice: voiceId,
      language: voiceId ? undefined : language,
      rate: 0.92,
      pitch: 1.0,
      onDone,
      onError: onDone,
    });
  } catch {
    onDone?.();
  }
}

export function hush(): void {
  try {
    Speech.stop();
  } catch {
    // nothing to stop
  }
}
