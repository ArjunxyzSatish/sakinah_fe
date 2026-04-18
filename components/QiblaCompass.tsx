import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Mosque } from './IslamicElements';
import { useTheme } from '../context/ThemeContext';

interface QiblaCompassProps {
  glowOpacity: Animated.SharedValue<number> | any;
  animatedStyles: any;
  qiblaPointerStyle: any;
  heading?: number;
  qiblaAngle?: number;
  hideStats?: boolean;
}

export function QiblaCompass({ glowOpacity, animatedStyles, qiblaPointerStyle, heading, qiblaAngle, hideStats }: QiblaCompassProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.compassContainer}>
      <View style={styles.compassWrapper}>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }, { opacity: glowOpacity }]}>
          <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: colors.accent, opacity: 0.15, transform: [{scale: 1.3}] }} />
          <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.primary, opacity: 0.2, transform: [{scale: 1.15}] }} />
        </Animated.View>

        <Animated.View style={[styles.compassRing, animatedStyles, { borderColor: colors.border }]}>
          <Text style={[styles.dirText, { top: 8, left: 0, right: 0, textAlign: 'center', color: colors.text, opacity: 0.5 }]}>N</Text>
          <Text style={[styles.dirText, { right: 8, top: 0, bottom: 0, textAlignVertical: 'center', lineHeight: 220, textAlign: 'right', color: colors.text, opacity: 0.5 }]}>E</Text>
          <Text style={[styles.dirText, { bottom: 8, left: 0, right: 0, textAlign: 'center', color: colors.text, opacity: 0.5 }]}>S</Text>
          <Text style={[styles.dirText, { left: 8, top: 0, bottom: 0, textAlignVertical: 'center', lineHeight: 220, color: colors.text, opacity: 0.5 }]}>W</Text>
        </Animated.View>

        <Animated.View style={[styles.qiblaPointer, qiblaPointerStyle]}>
          <View style={[styles.pointerArrow, { borderBottomColor: colors.primary }]} />
          <Mosque size={32} color={colors.primary} style={styles.mosqueIcon} />
        </Animated.View>

        <View style={[styles.centerDot, { backgroundColor: colors.primary }]} />
      </View>

      {!hideStats && heading !== undefined && qiblaAngle !== undefined && (
        <View style={styles.infoRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.text }]}>Heading</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{heading}°</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.text }]}>Qibla</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{qiblaAngle}°</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compassContainer: { alignItems: 'center', gap: 24 },
  compassWrapper: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  compassRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderStyle: 'dashed' },
  dirText: { position: 'absolute', fontSize: 12, fontWeight: 'bold' },
  qiblaPointer: { position: 'absolute', width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  pointerArrow: { position: 'absolute', top: 0, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  mosqueIcon: { position: 'absolute', top: 22 },
  centerDot: { width: 8, height: 8, borderRadius: 4 },
  infoRow: { flexDirection: 'row', gap: 32, marginTop: 12 },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 10, textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.1)' },
});
