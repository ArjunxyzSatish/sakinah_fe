import { Slot, usePathname, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, TouchableOpacity, Text, ImageBackground, StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, MessageCircle, Image as ImageIcon, Settings, Bookmark, BookOpen } from 'lucide-react-native';
import { Mosque } from '../components/IslamicElements';
import { useMascot, MascotProvider } from '../context/MascotContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { UserProvider, useUser } from '../context/UserContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { VerseProvider } from '../context/VerseContext';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

try { SplashScreen.preventAutoHideAsync(); } catch (e) { console.warn('SplashScreen.preventAutoHideAsync failed:', e); }

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

  // Safety: force-hide splash screen after 8s no matter what
  // Prevents the app from being permanently stuck on a blank/splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const isNavigationVisible = pathname !== '/onboarding' && pathname !== '/auth' && langLoaded && userLoaded;

  // Show a branded loading screen while providers initialize
  // This prevents the blank white screen when SplashScreen.preventAutoHideAsync fails
  if (!langLoaded || !userLoaded) {
    return (
      <ImageBackground
        source={require('../assets/splash-icon.png')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    );
  }

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home'), custom: null },
    { path: '/chat', icon: MessageCircle, label: t('nav.reflect'), custom: null },
    { path: '/prayer', icon: null, label: t('nav.prayer'), custom: 'mosque' },
    { path: '/quran', icon: BookOpen, label: t('nav.quran'), custom: null },
    { path: '/saved', icon: Bookmark, label: t('nav.saved'), custom: null },
    { path: '/settings', icon: Settings, label: t('nav.settings'), custom: null },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.background} />
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
                  {item.custom === 'mosque' ? (
                    <Mosque
                      size={24}
                      color={isActive ? colors.primary : (isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(26, 26, 26, 0.4)')}
                    />
                  ) : (
                    <Icon
                      strokeWidth={isActive ? 2.5 : 1.5}
                      size={24}
                      color={isActive ? colors.primary : (isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(26, 26, 26, 0.4)')}
                    />
                  )}
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

import React from 'react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F3D2E', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Sakinah crashed</Text>
          <Text style={{ color: '#faa', fontSize: 14, marginBottom: 12 }}>{String(this.state.error)}</Text>
          <Text style={{ color: '#ccc', fontSize: 11 }}>{this.state.error?.stack?.slice(0, 800)}</Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
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
