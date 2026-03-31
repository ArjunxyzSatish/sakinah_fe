import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { IslamicPattern, Lantern } from '../components/IslamicElements';

export default function Settings() {
  const { isDark, toggleTheme, colors } = useTheme();
  const { t } = useLanguage();

  const textColor = { color: colors.text };
  const primaryColor = { color: colors.primary };
  const borderStyle = { borderColor: colors.border };
  const cardStyle = { backgroundColor: colors.card, borderColor: colors.cardBorder };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, primaryColor]}>{t('nav.settings')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
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
          <View style={[styles.divider, { backgroundColor: colors.cardBorder, width: '100%' }]} />
          <TouchableOpacity 
            style={styles.row}
            onPress={() => {
              Alert.alert('Reset App', 'This will clear all saved data and take you back to onboarding. Please restart the app after doing this.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: async () => {
                  await AsyncStorage.clear();
                  Alert.alert('Done', 'Data cleared. Open the Expo terminal and press "r" to reload.');
                }}
              ]);
            }}
          >
            <Text style={[styles.rowText, { color: 'red' }]}>Reset App Data</Text>
          </TouchableOpacity>
        </View>

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
    paddingBottom: 120,
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
    padding: 32,
    alignItems: 'center',
    gap: 24,
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
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
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
