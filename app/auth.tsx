import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../utils/supabase';

WebBrowser.maybeCompleteAuthSession();
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { IslamicPattern, Crescent } from '../components/IslamicElements';
import { ChevronLeft, Mail, Lock, User, Chrome } from 'lucide-react-native';
// Google Sign-in is imported dynamically to prevent crashes in Expo Go

export default function AuthScreen() {
  const params = useLocalSearchParams();
  const [isLogin, setIsLogin] = useState(params.mode !== 'signup');
  const generatedUri = AuthSession.makeRedirectUri({ scheme: 'sakinah' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    // Handle OAuth callback if app was opened/resumed via deep link with tokens
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (!url) return;
      if (url.includes('access_token') || url.includes('code=')) {
        try {
          if (url.includes('code=')) {
            await supabase.auth.exchangeCodeForSession(url);
          } else {
            const urlObj = new URL(url);
            const hash = urlObj.hash.startsWith('#') ? urlObj.hash.slice(1) : urlObj.hash;
            const p = new URLSearchParams(hash);
            const access_token = p.get('access_token');
            const refresh_token = p.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
          router.replace('/');
        } catch (e) {
          console.log('Initial URL auth error:', e);
        }
      }
    };
    handleInitialURL();
  }, []);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });
        if (error) throw error;
        Alert.alert('Success', 'Check your email for the confirmation link!');
      }
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Auth Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'sakinah' });
      // console.log('Redirect URI:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

      // Set up the deep-link listener BEFORE opening the browser
      // Android intent system will intercept the exp:// redirect and fire this
      const subscription = Linking.addEventListener('url', async ({ url }) => {
        subscription.remove();
        setLoading(true);
        try {
          // PKCE flow: ?code=...
          if (url.includes('code=')) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);
            if (exchangeError) throw exchangeError;
            router.replace('/');
            return;
          }
          // Implicit flow: #access_token=...&refresh_token=...
          const urlObj = new URL(url);
          const hash = urlObj.hash.startsWith('#') ? urlObj.hash.slice(1) : urlObj.hash;
          const hashParams = new URLSearchParams(hash);
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
            router.replace('/');
            return;
          }
          throw new Error('No tokens received');
        } catch (e: any) {
          Alert.alert('Sign-in Error', e.message || 'Failed to complete sign-in.');
        } finally {
          setLoading(false);
        }
      });

      // Open in the real external browser so Android can intercept the exp:// redirect
      await Linking.openURL(data.url);

    } catch (error: any) {
      Alert.alert('Sign-in Error', error.message || 'Google sign-in failed.');
      console.log('OAuth error:', error);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeft size={28} color={colors.primary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Crescent size={60} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {isLogin ? 'Welcome Back' : 'Join Sakinah'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text, opacity: 0.6 }]}>
            {isLogin
              ? 'Sign in to sync your reflections and progress'
              : 'Create an account to save your spiritual journey'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
                <User size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="First Name"
                  placeholderTextColor={isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(15, 61, 46, 0.4)'}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.spacing} />
              <View style={[styles.inputContainer, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Last Name"
                  placeholderTextColor={isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(15, 61, 46, 0.4)'}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Mail size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email Address"
              placeholderTextColor={isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(15, 61, 46, 0.4)'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Lock size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(15, 61, 46, 0.4)'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.authBtnText, { color: colors.background }]}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.text, opacity: 0.4 }]}>OR</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.border }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Chrome size={20} color={colors.primary} />
            <Text style={[styles.googleBtnText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.text, opacity: 0.5, fontSize: 10 }}>
            Redirect URI (Add to Supabase):
          </Text>
          <Text style={{ color: colors.primary, fontSize: 10, textAlign: 'center' }}>
            {generatedUri}
          </Text>
        </View> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 100, paddingBottom: 40 },
  backBtn: { position: 'absolute', top: 60, left: 24, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontFamily: 'Georgia', marginBottom: 8, marginTop: 16 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  form: { gap: 16 },
  row: { flexDirection: 'row' },
  spacing: { width: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  authBtn: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  authBtnText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontSize: 12, fontWeight: 'bold' },
  googleBtn: {
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  googleBtnText: { fontSize: 16, fontWeight: '600' },
  toggleBtn: { marginTop: 32, alignItems: 'center' },
  toggleText: { fontSize: 14 },
});
