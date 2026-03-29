import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';

export interface TooltipStep {
  /** Title of the tooltip */
  title: string;
  /** Body text */
  body: string;
  /** Optional emoji icon */
  icon?: string;
}

interface TooltipOverlayProps {
  steps: TooltipStep[];
  visible: boolean;
  onDone: () => void;
}

export function TooltipOverlay({ steps, visible, onDone }: TooltipOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  // Reset step when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible]);

  // Animate in on step change
  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.92);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [currentStep, visible]);

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.94, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      if (isLast) {
        onDone();
      } else {
        setCurrentStep((s) => s + 1);
      }
    });
  };

  const handleSkip = () => {
    Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      onDone();
    });
  };

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      {/* Full-screen backdrop – tapping advances to next step */}
      <Pressable style={styles.backdrop} onPress={handleNext}>
        {/* Centered bubble – use pointerEvents="box-none" so inner presses work */}
        <View style={styles.centerWrapper} pointerEvents="box-none">
          <Animated.View
            style={[styles.bubble, { opacity, transform: [{ scale }] }]}
          >
            {/* Step progress dots */}
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === currentStep && styles.dotActive]}
                />
              ))}
            </View>

            {/* Icon + Title */}
            <View style={styles.titleRow}>
              {step.icon ? <Text style={styles.icon}>{step.icon}</Text> : null}
              <Text style={styles.title}>{step.title}</Text>
            </View>

            {/* Body */}
            <Text style={styles.body}>{step.body}</Text>

            {/* Step counter */}
            <Text style={styles.counter}>
              {currentStep + 1} / {steps.length}
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                onPress={handleSkip}
                style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.skipText}>Überspringen</Text>
              </Pressable>
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.nextText}>
                  {isLast ? "Los geht's! 🎾" : 'Weiter →'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bubble: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 14,
    gap: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#1a9e6f',
    width: 20,
    borderRadius: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 21,
  },
  counter: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  nextBtn: {
    backgroundColor: '#1a9e6f',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  nextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
