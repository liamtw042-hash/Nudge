import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { prepareAudio } from '@/lib/audio';
import { prepareVoice } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { paper } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 350, fade: true });

export default function RootLayout() {
  // Direct file requires so the bundle carries five faces, not thirty.
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular: require('@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf'),
    Fraunces_400Regular_Italic: require('@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf'),
    Fraunces_500Medium: require('@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.ttf'),
    IBMPlexMono_400Regular: require('@expo-google-fonts/ibm-plex-mono/400Regular/IBMPlexMono_400Regular.ttf'),
    IBMPlexMono_500Medium: require('@expo-google-fonts/ibm-plex-mono/500Medium/IBMPlexMono_500Medium.ttf'),
  });
  const hydrated = useStore((s) => s.hydrated);
  const [waitedLongEnough, setWaitedLongEnough] = useState(false);

  useEffect(() => {
    prepareAudio();
    prepareVoice();
    // If storage is slow or broken we still open. Nothing here is worth a stuck splash.
    const t = setTimeout(() => setWaitedLongEnough(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const ready = (fontsLoaded || fontError != null) && (hydrated || waitedLongEnough);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: paper }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: paper },
          animation: 'fade',
          animationDuration: 320,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="run/[id]" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="edit/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
