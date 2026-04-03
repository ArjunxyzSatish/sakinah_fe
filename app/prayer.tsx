import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Alert, Platform } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { IslamicPattern, Mandala, Mosque } from '../components/IslamicElements';
import { Compass, Clock, Bell, MapPin, Settings } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function PrayerScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { prayerTimes, prayerFrequency, prayerEnabled } = useUser();
  const router = useRouter();
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const hasAutoPrompted = useRef(false);

  const rotation = useSharedValue(0);

  // Auto-prompt for location on first visit
  const autoPromptLocation = useCallback(async () => {
    if (hasAutoPrompted.current) return;

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionChecked(true);

      if (status === 'granted') {
        setLocationDenied(false);
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
          calculateQibla(loc.coords.latitude, loc.coords.longitude);
        } catch (e) {
          console.log('Error getting location:', e);
        }
      } else if (status === 'undetermined') {
        hasAutoPrompted.current = true;
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus === 'granted') {
          setLocationDenied(false);
          try {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            calculateQibla(loc.coords.latitude, loc.coords.longitude);
          } catch (e) {
            console.log('Error getting location:', e);
          }
        } else {
          setLocationDenied(true);
        }
      } else {
        hasAutoPrompted.current = true;
        setLocationDenied(true);
      }
    } catch (e) {
      console.log('Error checking permissions:', e);
    }
  }, []);

  const checkLocationOnFocus = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionChecked(true);

      if (status === 'granted') {
        setLocationDenied(false);
        if (!location) {
          try {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            calculateQibla(loc.coords.latitude, loc.coords.longitude);
          } catch (e) {
            console.log('Error getting location:', e);
          }
        }
      } else {
        setLocationDenied(true);
      }
    } catch (e) {
      console.log('Error checking permissions:', e);
    }
  }, [location]);

  useFocusEffect(
    useCallback(() => {
      if (!hasAutoPrompted.current) {
        autoPromptLocation();
      } else {
        checkLocationOnFocus();
      }
    }, [autoPromptLocation, checkLocationOnFocus])
  );

  const promptForLocation = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status === 'undetermined') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus === 'granted') {
        setLocationDenied(false);
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
          calculateQibla(loc.coords.latitude, loc.coords.longitude);
        } catch (e) {
          console.log('Error getting location:', e);
        }
      } else {
        setLocationDenied(true);
      }
    } else if (status === 'denied') {
      Alert.alert(
        'Location Permission Required',
        'Location access was previously denied. To use the Qibla compass, please enable location permission in your device settings.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      checkLocationOnFocus();
    }
  }, [checkLocationOnFocus]);

  useEffect(() => {
    let subscription: any;

    subscription = Magnetometer.addListener(result => {
      const { x, y } = result;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      setHeading(Math.round(angle));
      rotation.value = withSpring(-angle);
    });
    Magnetometer.setUpdateInterval(100);

    return () => subscription?.remove();
  }, []);

  const calculateQibla = (lat: number, lon: number) => {
    const mLat = 21.4225 * (Math.PI / 180);
    const mLon = 39.8262 * (Math.PI / 180);
    const pLat = lat * (Math.PI / 180);
    const pLon = lon * (Math.PI / 180);

    const y = Math.sin(mLon - pLon);
    const x = Math.cos(pLat) * Math.tan(mLat) - Math.sin(pLat) * Math.cos(mLon - pLon);
    let qibla = Math.atan2(y, x) * (180 / Math.PI);
    if (qibla < 0) qibla += 360;
    setQiblaAngle(Math.round(qibla));
  };

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const qiblaPointerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value + qiblaAngle}deg` }],
  }));

  // Compass section — shared between enabled and disabled states
  const renderCompass = () => (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Compass size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('prayer.qibla')}</Text>
      </View>

      {locationDenied ? (
        <View style={styles.compassDisabledContainer}>
          <Compass size={48} color={colors.text} style={{ opacity: 0.15, marginBottom: 16 }} />
          <Text style={[styles.compassDisabledTitle, { color: colors.text }]}>Enable Location</Text>
          <Text style={[styles.compassDisabledDesc, { color: colors.text }]}>
            Location access is needed to calculate the Qibla direction from your position.
          </Text>
          <TouchableOpacity
            style={[styles.enableLocationBtn, { borderColor: colors.primary }]}
            onPress={promptForLocation}
          >
            <MapPin size={14} color={colors.primary} />
            <Text style={[styles.enableLocationText, { color: colors.primary }]}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.compassContainer}>
            <View style={styles.compassWrapper}>
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
          </View>

          {location ? (
            <View style={styles.locationTag}>
              <MapPin size={12} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.text }]}>Location active</Text>
            </View>
          ) : (
            <View style={styles.locationTag}>
              <Text style={[styles.locationText, { color: colors.text, opacity: 0.4 }]}>Acquiring location...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{t('prayer.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Qibla Compass — always visible */}
        {renderCompass()}

        {/* Prayer Schedule — only when enabled */}
        {prayerEnabled ? (
          <>
            <View style={styles.scheduleHeader}>
              <Bell size={16} color={colors.primary} />
              <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>{t('prayer.schedule')}</Text>
            </View>

            <View style={styles.timesList}>
              {prayerTimes.slice(0, prayerFrequency).map((time: string, i: number) => (
                <View key={i} style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.timeIconBox}>
                    <Clock size={20} color={colors.primary} />
                  </View>
                  <View style={styles.timeInfo}>
                    <Text style={[styles.timeLabel, { color: colors.text, opacity: 0.6 }]}>Prayer {i + 1}</Text>
                    <Text style={[styles.timeValue, { color: colors.text }]}>{time}</Text>
                  </View>
                  <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.disabledBanner}>
            <Bell size={18} color={colors.text} style={{ opacity: 0.3 }} />
            <Text style={[styles.disabledBannerText, { color: colors.text }]}>
              Prayer reminders are disabled
            </Text>
            <TouchableOpacity
              style={[styles.enableSettingsBtn, { borderColor: colors.primary }]}
              onPress={() => router.push('/settings' as any)}
            >
              <Settings size={14} color={colors.primary} />
              <Text style={[styles.enableSettingsBtnText, { color: colors.primary }]}>Enable in Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 16, paddingTop: 32, alignItems: 'center', borderBottomWidth: 1 },
  headerTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  scrollContent: { padding: 24, paddingBottom: 120 },
  section: { padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 32, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
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
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', marginTop: 16, opacity: 0.6 },
  locationText: { fontSize: 10, fontWeight: '600' },
  compassDisabledContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  compassDisabledTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  compassDisabledDesc: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 20,
  },
  enableLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  enableLocationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Disabled prayer banner (below compass)
  disabledBanner: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  disabledBannerText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.4,
  },
  enableSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 4,
  },
  enableSettingsBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingLeft: 8 },
  sectionSubtitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  timesList: { gap: 12 },
  timeCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1 },
  timeIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(15, 61, 46, 0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  timeInfo: { flex: 1 },
  timeLabel: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  timeValue: { fontSize: 20, fontWeight: '600' },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
});
