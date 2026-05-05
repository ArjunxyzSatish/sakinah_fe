import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Platform, Alert } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { IslamicPattern, Mosque } from '../components/IslamicElements';
import { QiblaCompass } from '../components/QiblaCompass';
import { useAppAlert } from '../components/AppAlert';
import { Compass, Clock, Bell, MapPin, Settings, CheckCircle2, Circle, Check } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

import { getTodayPrayerTimes, getFallbackCoordinates, PrayerData } from '../utils/adhanHelper';

const { width } = Dimensions.get('window');

const PRAYER_ARABIC: Record<string, string> = {
  Fajr:    'الفجر',
  Dhuhr:   'الظهر',
  Asr:     'العصر',
  Maghrib: 'المغرب',
  Isha:    'العشاء',
};

export default function PrayerScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { prayerEnabled, completedPrayers, togglePrayerCompleted, togglePrayer } = useUser();
  const router = useRouter();
  const { showAlert, alertElement } = useAppAlert();

  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const hasAutoPrompted = useRef(false);
  const wasFacingQibla = useRef(false);

  const [prayerData, setPrayerData] = useState<PrayerData[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('--:--:--');

  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

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
      showAlert(
        'Location Required',
        'Location access was previously denied. To use the Qibla compass, please enable location in your device settings.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
        '📍'
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
      // Use withTiming with a very short duration for near-instant, smooth response
      rotation.value = withTiming(-angle, { duration: 80 });
    });
    Magnetometer.setUpdateInterval(50);

    return () => subscription?.remove();
  }, [rotation]);

  useEffect(() => {
    if (qiblaAngle === 0 && heading === 0) return;
    
    const diff = Math.abs(qiblaAngle - heading);
    const isFacing = diff < 5 || diff > 355;
    
    if (isFacing && !wasFacingQibla.current) {
      wasFacingQibla.current = true;
      glowOpacity.value = withSpring(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (!isFacing && wasFacingQibla.current) {
      wasFacingQibla.current = false;
      glowOpacity.value = withSpring(0);
    }
  }, [heading, qiblaAngle, glowOpacity]);

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

  useEffect(() => {
    let lat = 21.4225;
    let lon = 39.8262;

    if (location) {
      lat = location.coords.latitude;
      lon = location.coords.longitude;
    } else {
      const fallback = getFallbackCoordinates();
      lat = fallback.lat;
      lon = fallback.lon;
    }

    const times = getTodayPrayerTimes(lat, lon);
    setPrayerData(times);

    // If notifications are enabled, make sure they are scheduled accurately
    if (prayerEnabled) {
      togglePrayer(true, lat, lon);
    }
  }, [location, prayerEnabled]);

  useEffect(() => {
    if (!prayerData.length) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      let next = prayerData.find(p => p.time.getTime() > now);
      if (!next) next = prayerData[0]; // Next is Fajr tomorrow
      
      setNextPrayer(next);

      let diff = next.time.getTime() - now;
      if (diff < 0) {
        // If it's Fajr tomorrow
        diff += 24 * 60 * 60 * 1000;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerData]);

  const todayStr = new Date().toDateString();
  const completedTodayCount = prayerData.filter(p => completedPrayers[`${todayStr}-${p.name}`]).length;

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
          <QiblaCompass
            glowOpacity={glowOpacity}
            animatedStyles={animatedStyles}
            qiblaPointerStyle={qiblaPointerStyle}
            heading={heading}
            qiblaAngle={qiblaAngle}
          />

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
            <View style={styles.scheduleHeaderRow}>
              <View style={styles.scheduleHeader}>
                <Bell size={16} color={colors.primary} />
                <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>{t('prayer.schedule')}</Text>
              </View>
              <View style={[styles.completedBadge, { backgroundColor: colors.primary + '15' }]}>
                <Check size={12} color={colors.primary} />
                <Text style={[styles.completedBadgeText, { color: colors.primary }]}>{completedTodayCount}/5 Completed</Text>
              </View>
            </View>

            {locationDenied && (
              <View style={[styles.locationWarning, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                <MapPin size={14} color={colors.primary} />
                <Text style={[styles.locationWarningText, { color: colors.text }]}>
                  Prayer times may be inaccurate.{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>Enable location</Text>
                  {' '}to stay on the right path 🕌
                </Text>
              </View>
            )}

            {nextPrayer && (
              <View style={[styles.countdownCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                <View>
                  <Text style={[styles.countdownSub, { color: colors.background, opacity: 0.8 }]}>Upcoming Prayer</Text>
                  <Text style={[styles.countdownLabel, { color: colors.background }]}>{nextPrayer.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.countdownSub, { color: colors.background, opacity: 0.8 }]}>Starts in</Text>
                  <Text style={[styles.countdownTime, { color: colors.background }]}>-{timeRemaining}</Text>
                </View>
              </View>
            )}

            <View style={styles.timesList}>
              {prayerData.map((prayer, i) => {
                const now = new Date().getTime();
                const isPast = prayer.time.getTime() < now;
                // A prayer is 'active' right now if it has started but the next one hasn't
                const isActive = isPast && nextPrayer?.name !== prayer.name;
                const isNext = nextPrayer?.name === prayer.name;
                // User can mark a prayer done if it has started (isPast) OR it is the current active window (isActive)
                const canMark = isPast || isActive;
                const prayerKey = `${todayStr}-${prayer.name}`;
                const isCompleted = completedPrayers[prayerKey];

                return (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => {
                      if (canMark) {
                        togglePrayerCompleted(prayerKey);
                      }
                    }}
                    activeOpacity={canMark ? 0.8 : 1}
                    style={[
                      styles.timeCard, 
                      { backgroundColor: isNext ? colors.primary + '10' : colors.card, borderColor: isNext ? colors.primary : colors.cardBorder },
                      isNext && { borderWidth: 2, transform: [{ scale: 1.02 }] },
                      isPast && !isNext && { opacity: 0.6 }
                    ]}
                  >
                    <View style={styles.timeInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                        <Text style={[styles.timeLabel, { color: isNext ? colors.primary : colors.text, fontSize: 24, fontWeight: '900', marginBottom: 0 }]}>
                          {prayer.name}
                        </Text>
                        <Text style={{ color: isNext ? colors.primary : colors.text, opacity: isNext ? 0.8 : 0.5, fontSize: 28, fontFamily: 'serif' }}>
                          {PRAYER_ARABIC[prayer.name]}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6, gap: 3 }}>
                        <Text style={[styles.timeValue, { color: isNext ? colors.primary : colors.text, opacity: isNext ? 1 : 0.7, fontSize: 20, fontWeight: '700' }]}>
                          {prayer.timeStr.replace(/\s?(AM|PM)$/i, '')}
                        </Text>
                        <Text style={{ color: isNext ? colors.primary : colors.text, opacity: isNext ? 0.7 : 0.45, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, paddingBottom: 2 }}>
                          {(prayer.timeStr.match(/AM|PM/i) || [])[0]}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.checkboxBtn}>
                      {isCompleted ? (
                        <CheckCircle2 size={32} color={colors.primary} />
                      ) : (
                        <Circle size={32} color={canMark ? colors.text : colors.text} style={{ opacity: canMark ? 0.3 : 0.07 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
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

      {alertElement}
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
  compassDisabledContainer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  compassDisabledTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  compassDisabledDesc: { fontSize: 13, lineHeight: 20, opacity: 0.5, textAlign: 'center', marginBottom: 20 },
  enableLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  enableLocationText: { fontSize: 13, fontWeight: '600' },
  disabledBanner: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  disabledBannerText: { fontSize: 14, fontWeight: '500', opacity: 0.4 },
  enableSettingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, marginTop: 4 },
  enableSettingsBtnText: { fontSize: 13, fontWeight: '600' },
  
  scheduleHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingLeft: 8 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionSubtitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  completedBadgeText: { fontSize: 11, fontWeight: 'bold' },
  
  countdownCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, marginBottom: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  countdownSub: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  countdownLabel: { fontSize: 20, fontWeight: '900' },
  countdownTime: { fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },

  timesList: { gap: 12 },
  timeCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1 },
  timeInfo: { flex: 1 },
  timeLabel: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  timeValue: { fontSize: 20, fontWeight: '600' },
  timeWindow: { fontSize: 11, fontWeight: '500', opacity: 0.4, marginTop: 6, letterSpacing: 0.3 },
  checkboxBtn: { padding: 4 },

  locationWarning: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  locationWarningText: { flex: 1, fontSize: 12, lineHeight: 18, opacity: 0.85 },
});
