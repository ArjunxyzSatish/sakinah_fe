import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { MascotState } from '../context/MascotContext';
import { Colors } from '../constants/Colors';

export function NoorMascot({ state }: { state: MascotState }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    const duration = state === 'loading' ? 1000 : state === 'reflecting' ? 1500 : 2000;
    scale.value = withRepeat(withTiming(state === 'loading' ? 1.4 : 1.1, { duration }), -1, true);
    opacity.value = withRepeat(withTiming(state === 'loading' ? 0.8 : 0.6, { duration }), -1, true);
  }, [state]);

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value * 0.5,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 0.7 }],
    opacity: opacity.value * 0.6,
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 0.4 }],
    opacity: opacity.value * 0.8,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.aura, auraStyle]} />
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.core, coreStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 48,
    height: 48,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6ee7b7', // emerald-300
  },
  glow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fde68a', // amber-200
  },
  core: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fffbeb', // amber-50
  },
});
