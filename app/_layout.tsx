import { Slot, usePathname, useRouter, useRootNavigationState } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { Home, MessageCircle, Image as ImageIcon, Settings, Bookmark } from 'lucide-react-native';
import { useMascot, MascotProvider } from '../context/MascotContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { UserProvider, useUser } from '../context/UserContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { VerseProvider } from '../context/VerseContext';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function AppLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { mascotState } = useMascot();
  const { t, isLoaded: langLoaded } = useLanguage();
  const { hasCompletedOnboarding, isLoaded: userLoaded } = useUser();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    
    if (langLoaded && userLoaded) {
      if (!hasCompletedOnboarding && pathname !== '/onboarding') {
        router.replace('/onboarding');
      }
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [langLoaded, userLoaded, hasCompletedOnboarding, pathname, rootNavigationState?.key]);

  const isNavigationVisible = pathname !== '/onboarding' && langLoaded && userLoaded;

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/chat', icon: MessageCircle, label: t('nav.reflect') },
    { path: '/saved', icon: Bookmark, label: t('nav.saved') },
    { path: '/wallpaper', icon: ImageIcon, label: t('nav.wallpaper') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Slot />
      </View>

      {isNavigationVisible && (
        <View style={styles.navContainer}>
          <View style={[styles.navbar, { backgroundColor: colors.navBg, shadowColor: colors.primary, borderColor: colors.border }]}>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.path}
                  style={styles.navItem}
                  onPress={() => router.push(item.path as any)}
                >
                  <Icon 
                    strokeWidth={isActive ? 2.5 : 1.5} 
                    size={24} 
                    color={isActive ? colors.primary : (isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(26, 26, 26, 0.4)')} 
                  />
                  <Text style={[
                    styles.navLabel, 
                    { color: isActive ? colors.primary : (isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(26, 26, 26, 0.4)') }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <MascotProvider>
            <VerseProvider>
              <AppLayout />
            </VerseProvider>
          </MascotProvider>
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  navContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 50,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
});
