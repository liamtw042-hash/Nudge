import React, { memo } from 'react';
import Svg, { Line } from 'react-native-svg';

import { TICKS } from '@/lib/runner';
import { spent } from '@/theme/tokens';

type Props = {
  size: number;
  color: string;
  /** Ticks lit, 0..60. Defaults to a fully wound dial. */
  lit?: number;
};

/** The dial at small size, printed still. Used as the mark for a routine. */
export const MiniDial = memo(function MiniDial({ size, color, lit = TICKS }: Props) {
  const r = size / 2;
  const outer = r - size * 0.03;
  const width = Math.max(1.5, size * 0.028);
  const lines = [];
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
    const len = i % 5 === 0 ? size * 0.15 : size * 0.1;
    const inner = outer - len;
    lines.push(
      <Line
        key={i}
        x1={r + Math.cos(a) * outer}
        y1={r + Math.sin(a) * outer}
        x2={r + Math.cos(a) * inner}
        y2={r + Math.sin(a) * inner}
        stroke={i < lit ? color : spent}
        strokeWidth={width}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {lines}
    </Svg>
  );
});
