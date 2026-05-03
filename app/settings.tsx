import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { IslamicPattern, Lantern } from '../components/IslamicElements';
import { Bell, Clock, ChevronRight, Trash2, User, LogOut, LogIn } from 'lucide-react-native';
import { useAppAlert } from '../components/AppAlert';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function Settings() {
  const { isDark, toggleTheme, colors } = useTheme();
  const { t } = useLanguage();
  const { 
    prayerEnabled, 
    togglePrayer, 
    user, 
    signOut,
    isSubscribed,
  } = useUser();
  const router = useRouter();
  const { showAlert, alertElement } = useAppAlert();

  const textColor = { color: colors.text };
  const primaryColor = { color: colors.primary };
  const cardStyle = { backgroundColor: colors.card, borderColor: colors.cardBorder };

  const handlePrayerToggle = (val: boolean) => {
    // We pass 0, 0 for lat/lon here, but ideally notifications are scheduled in the prayer screen
    // when location is known. The toggle will at least save the preference.
    togglePrayer(val, 0, 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, primaryColor]}>{t('nav.settings')}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Appearance Section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.dot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.sectionTitle, { color: colors.primary, opacity: 0.8 }]}>{t('settings.appearance')}</Text>
        </View>
        
        <View style={[styles.card, cardStyle]}>
          <View style={styles.row}>
            <Text style={[styles.rowText, textColor]}>{t('wallpaper.dark')}</Text>
            <Switch 
              value={isDark} 
              onValueChange={toggleTheme} 
              trackColor={{ true: colors.primary, false: 'rgba(15, 61, 46, 0.2)' }}
              thumbColor={isDark ? colors.background : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Prayer Notifications Section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.dot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.sectionTitle, { color: colors.primary, opacity: 0.8 }]}>{t('settings.prayer.title')}</Text>
        </View>

        <View style={[styles.card, cardStyle]}>
          {/* Prayer Enable/Disable Toggle */}
          <View style={styles.row}>
            <Text style={[styles.rowText, textColor]}>Prayer Reminders</Text>
            <Switch 
              value={prayerEnabled} 
              onValueChange={handlePrayerToggle} 
              trackColor={{ true: colors.primary, false: 'rgba(15, 61, 46, 0.2)' }}
              thumbColor={prayerEnabled ? colors.background : '#f4f3f4'}
            />
          </View>
          <Text style={{fontSize: 12, opacity: 0.6, marginTop: 12, color: colors.text}}>
            Prayer times are automatically calculated based on your location and the Muslim World League standard.
          </Text>
        </View>

        {/* Data Management Section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.dot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.sectionTitle, { color: colors.primary, opacity: 0.8 }]}>Data Management</Text>
        </View>

        <View style={[styles.card, cardStyle, { paddingVertical: 16 }]}>
          <TouchableOpacity 
            style={[styles.row, { paddingHorizontal: 0 }]}
            onPress={() => {
              showAlert(
                'Reset App Data',
                'This will clear all saved data and take you back to onboarding. Please restart the app after doing this.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: async () => {
                    await AsyncStorage.clear();
                    showAlert('Data Cleared', 'Please restart the app to complete the reset.', undefined, '✅');
                  }},
                ],
                '🗑️'
              );
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Trash2 size={20} color="red" opacity={0.8} />
              <Text style={[styles.rowText, { color: 'red', opacity: 0.8 }]}>Reset App Data</Text>
            </View>
            <ChevronRight size={20} color="red" opacity={0.3} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.dot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.sectionTitle, { color: colors.primary, opacity: 0.8 }]}>Account & Sync</Text>
        </View>

        <View style={[styles.card, cardStyle]}>
          {user ? (
            <View style={{ width: '100%', gap: 16 }}>
              <View style={styles.row}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <User size={24} color={colors.primary} />
                  <View>
                    <Text style={[styles.rowText, textColor]}>{user.email}</Text>
                    <Text style={[
                      { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
                      isSubscribed
                        ? { color: '#D4AF37', fontWeight: '700' }
                        : { color: colors.primary, opacity: 0.6 }
                    ]}>
                      {isSubscribed ? '✦ Sakinah Premium' : 'Free Member'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.cardBorder, width: '100%', height: 1 }]} />

              <TouchableOpacity 
                style={[styles.row, { paddingVertical: 8 }]}
                onPress={async () => {
                  await signOut();
                  showAlert('Signed Out', 'You have been successfully signed out.', undefined, '👋');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <LogOut size={20} color={colors.text} opacity={0.7} />
                  <Text style={[styles.rowText, textColor, { opacity: 0.7 }]}>Sign Out</Text>
                </View>
                <ChevronRight size={20} color={colors.text} opacity={0.2} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.row, { paddingVertical: 8 }]}
              onPress={() => router.push('/auth')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <LogIn size={24} color={colors.primary} />
                <View>
                  <Text style={[styles.rowText, textColor]}>Sign In / Create Account</Text>
                  <Text style={{ fontSize: 12, color: colors.text, opacity: 0.5 }}>Sync your journey and unlock more features</Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.primary} opacity={0.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* About Section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.dot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.sectionTitle, { color: colors.primary, opacity: 0.8 }]}>{t('settings.about')}</Text>
        </View>

        <View style={[styles.card, cardStyle]}>
          <Lantern size={64} color={colors.primary} style={{ opacity: 0.6, marginBottom: 4 }} />
          <Text style={[styles.aboutText, textColor]}>
            {t('settings.aboutDesc')}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
          <Text style={[styles.version, { color: colors.text }]}>{t('settings.version')}</Text>
        </View>
      </ScrollView>
      {alertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 32,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    padding: 24,
    paddingBottom: 150,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    marginTop: 24,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 61, 46, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  freqValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timesContainer: {
    width: '100%',
    gap: 12,
  },
  timeRow: {
    width: '100%',
  },
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeDisplayBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 61, 46, 0.03)',
  },
  timeValueText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  aboutText: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  divider: {
    width: 32,
    height: 1,
  },
  version: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    opacity: 0.4,
  }
});
