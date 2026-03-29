import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path, G, Polygon, Circle } from 'react-native-svg';

interface FlagIconProps {
  lang: 'de' | 'en';
  size?: number;
}

/** German flag: 3 horizontal stripes – black / red / gold */
function FlagDE({ size }: { size: number }) {
  const w = size;
  const h = Math.round(size * 0.6);
  const s = Math.round(h / 3);
  return (
    <Svg width={w} height={h} viewBox="0 0 3 2">
      <Rect x="0" y="0" width="3" height="0.667" fill="#000000" />
      <Rect x="0" y="0.667" width="3" height="0.667" fill="#DD0000" />
      <Rect x="0" y="1.333" width="3" height="0.667" fill="#FFCE00" />
    </Svg>
  );
}

/** UK flag: simplified Union Jack */
function FlagGB({ size }: { size: number }) {
  const w = size;
  const h = Math.round(size * 0.6);
  return (
    <Svg width={w} height={h} viewBox="0 0 60 30">
      {/* Blue background */}
      <Rect width="60" height="30" fill="#012169" />
      {/* White diagonals (St Andrew + St Patrick combined) */}
      <Path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      {/* Red diagonals (St Patrick) */}
      <Path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
      {/* White cross (St George) */}
      <Path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
      {/* Red cross (St George) */}
      <Path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </Svg>
  );
}

export function FlagIcon({ lang, size = 28 }: FlagIconProps) {
  const flagH = Math.round(size * 0.6);
  return (
    <View style={[styles.wrapper, { width: size, height: flagH, borderRadius: 3 }]}>
      {lang === 'de' ? <FlagDE size={size} /> : <FlagGB size={size} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
});
