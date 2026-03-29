import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        return (
          <React.Fragment key={step}>
            <View
              style={[
                styles.step,
                isCompleted && styles.stepCompleted,
                isActive && styles.stepActive,
              ]}
            >
              {isCompleted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={[styles.stepText, isActive && styles.stepTextActive]}>
                  {step}
                </Text>
              )}
            </View>
            {i < totalSteps - 1 && (
              <View style={[styles.line, isCompleted && styles.lineCompleted]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f5f3',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: '#1a9e6f',
    borderColor: '#1a9e6f',
  },
  stepCompleted: {
    backgroundColor: '#1a9e6f',
    borderColor: '#1a9e6f',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  stepTextActive: {
    color: '#ffffff',
  },
  checkmark: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  lineCompleted: {
    backgroundColor: '#1a9e6f',
  },
});
