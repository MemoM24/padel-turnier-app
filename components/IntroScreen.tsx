import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface IntroScreenProps {
  onFinish: () => void;
}

/**
 * Netflix-style intro animation:
 * 1. Black screen
 * 2. Logo fades in + scales up from center (0.6 → 1.0, opacity 0 → 1) — 600ms
 * 3. Logo breathes once: scale 1.0 → 1.08 → 1.0 — 800ms
 * 4. Logo fades out + scales slightly up (1.0 → 1.12, opacity 1 → 0) — 600ms
 * Total: ~2.0s before onFinish is called
 */
export function IntroScreen({ onFinish }: IntroScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Fade in + scale up (appear from center)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // Phase 2: Breathe in (scale up slightly)
      Animated.timing(scale, {
        toValue: 1.09,
        duration: 450,
        useNativeDriver: true,
      }),

      // Phase 3: Breathe out (back to normal)
      Animated.timing(scale, {
        toValue: 1.0,
        duration: 450,
        useNativeDriver: true,
      }),

      // Phase 4: Hold briefly
      Animated.delay(150),

      // Phase 5: Fade out + slight scale up (Netflix-style exit)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/pdl1_logo_transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280,
    height: 168,
  },
});
