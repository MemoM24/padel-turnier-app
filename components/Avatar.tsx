import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAvatarColor, getInitials } from '@/lib/tournament';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 48,
};

const fontSizeMap = {
  sm: 11,
  md: 13,
  lg: 18,
};

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const dim = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: color + '22',
          borderColor: color + '55',
        },
      ]}
    >
      <Text style={[styles.text, { fontSize, color }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  text: {
    fontWeight: '700',
  },
});
