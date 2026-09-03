import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptic } from '@/lib/haptics';
import { ink, inkMuted, paper, type } from '@/theme/tokens';

/**
 * Two kinds of control and no more. Words, not icons: at 6am a word is
 * quicker to trust than a glyph. The big round one is the button on top of
 * the timer. The small ones are just words with room around them.
 */

type TextButtonProps = {
  label: string;
  onPress: () => void;
  muted?: boolean;
  /** For single glyphs like − and +, which need more size to read as buttons. */
  glyph?: boolean;
  style?: StyleProp<ViewStyle>;
  align?: 'left' | 'center' | 'right';
};

export function TextButton({ label, onPress, muted = false, glyph = false, style, align = 'center' }: TextButtonProps) {
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.textButton,
        { alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' },
        pressed && styles.pressed,
        style,
      ]}>
      <Text style={[type.labelInk, muted && { color: inkMuted }, glyph && styles.glyph]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
}

type RoundButtonProps = {
  label: string;
  onPress: () => void;
  size?: number;
  color?: string;
};

export function RoundButton({ label, onPress, size = 96, color = ink }: RoundButtonProps) {
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        pressed && styles.roundPressed,
      ]}>
      <Text style={[type.labelInk, styles.roundLabel]} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.hairline, style]} />;
}

const styles = StyleSheet.create({
  textButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pressed: {
    opacity: 0.45,
  },
  glyph: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0,
  },
  round: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  roundLabel: {
    color: paper,
    fontSize: 13,
    letterSpacing: 2,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDD4C6',
  },
});
