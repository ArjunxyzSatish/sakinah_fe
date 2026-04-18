import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, ActivityIndicator, Linking, Platform
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Localization from 'expo-localization';
import * as AuthSession from 'expo-auth-session';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { IslamicPattern, Crescent } from './IslamicElements';
import { Check, X, Zap, BookOpen, Sparkles, Star } from 'lucide-react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.117:8000/api';

interface RegionalPricing {
  weeklyDisplay: string;
  monthlyDisplay: string;
  weeklySaving: string;
  currency: string;
  razorpayWeeklyAmount: number;
  razorpayMonthlyAmount: number;
  razorpayCurrency: string;
}

function getRegionalPricing(regionCode: string | null | undefined): RegionalPricing {
  switch (regionCode) {
    case 'IN':
      return {
        weeklyDisplay: '₹79', monthlyDisplay: '₹249',
        weeklySaving: 'Save 21%', currency: 'INR',
        razorpayWeeklyAmount: 7900, razorpayMonthlyAmount: 24900,
        razorpayCurrency: 'INR',
      };
    case 'AE': case 'SA': case 'QA': case 'KW': case 'BH': case 'OM': case 'JO':
      return {
        weeklyDisplay: '$2.99', monthlyDisplay: '$7.99',
        weeklySaving: 'Save 33%', currency: 'USD',
        razorpayWeeklyAmount: 299, razorpayMonthlyAmount: 799,
        razorpayCurrency: 'USD',
      };
    case 'PK': case 'BD': case 'LK':
      return {
        weeklyDisplay: '$0.99', monthlyDisplay: '$2.99',
        weeklySaving: 'Save 25%', currency: 'USD',
        razorpayWeeklyAmount: 99, razorpayMonthlyAmount: 299,
        razorpayCurrency: 'USD',
      };
    case 'MY': case 'ID':
      return {
        weeklyDisplay: '$1.49', monthlyDisplay: '$4.49',
        weeklySaving: 'Save 25%', currency: 'USD',
        razorpayWeeklyAmount: 149, razorpayMonthlyAmount: 449,
        razorpayCurrency: 'USD',
      };
    case 'TR':
      return {
        weeklyDisplay: '$1.49', monthlyDisplay: '$3.99',
        weeklySaving: 'Save 33%', currency: 'USD',
        razorpayWeeklyAmount: 149, razorpayMonthlyAmount: 399,
        razorpayCurrency: 'USD',
      };
    default:
      return {
        weeklyDisplay: '$2.99', monthlyDisplay: '$7.99',
        weeklySaving: 'Save 33%', currency: 'USD',
        razorpayWeeklyAmount: 299, razorpayMonthlyAmount: 799,
        razorpayCurrency: 'USD',
      };
  }
}

interface PaywallProps {
  visible: boolean;
  onDismiss: () => void;
  reason?: 'reflection' | 'verse';
}

export default function Paywall({ visible, onDismiss, reason = 'reflection' }: PaywallProps) {
  const { colors, isDark } = useTheme();
  const { session, markSubscribed } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(false);

  const locale = Localization.getLocales()[0];
  const regionCode = locale?.regionCode;
  const pricing = getRegionalPricing(regionCode);

  // Listen for deep link payment callback
  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      if (url.includes('pay/success')) {
        const params = new URL(url.replace('exp://', 'http://host')).searchParams;
        const plan = params.get('plan') as 'weekly' | 'monthly' || selectedPlan;
        const paymentId = params.get('payment_id') || '';
        const orderId = params.get('order_id') || '';
        const signature = params.get('signature') || '';
        await handlePaymentSuccess(plan, paymentId, orderId, signature);
      }
    });
    return () => subscription.remove();
  }, [selectedPlan, session]);

  const handlePaymentSuccess = async (
    plan: 'weekly' | 'monthly',
    paymentId: string,
    orderId: string,
    signature: string
  ) => {
    try {
      if (session?.access_token) {
        await fetch(`${API_BASE_URL}/payments/verify/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature, plan }),
        });
      }
      const daysToAdd = plan === 'weekly' ? 7 : 30;
      const expiresAt = Date.now() + daysToAdd * 24 * 60 * 60 * 1000;
      await markSubscribed(plan, expiresAt);
      onDismiss();
    } catch (e) {
      console.error('Payment verification error:', e);
    }
  };

  const handleUpgrade = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const callbackBase = AuthSession.makeRedirectUri({ scheme: 'sakinah' });
      const amount = selectedPlan === 'weekly' ? pricing.razorpayWeeklyAmount : pricing.razorpayMonthlyAmount;

      const res = await fetch(`${API_BASE_URL}/payments/create-order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          amount,
          currency: pricing.razorpayCurrency,
          callback_url: `${callbackBase.replace(/\/--\/?$/, '')}`,
        }),
      });

      const data = await res.json();
      if (data.checkout_url) {
        await Linking.openURL(data.checkout_url);
      }
    } catch (e) {
      console.error('Order creation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: 'Unlimited daily reflections' },
    { icon: BookOpen, text: 'Unlimited verse discoveries' },
    { icon: Sparkles, text: 'Deeper personalised guidance' },
    { icon: Star, text: 'Priority spiritual support' },
  ];

  const headings = {
    reflection: {
      title: "Your reflections\nhave touched a limit",
      subtitle: "You've journeyed deeply today. Continue your spiritual growth without pause.",
    },
    verse: {
      title: "You've explored\nyour daily verses",
      subtitle: "Every verse is a new light. Keep discovering wisdom without limits.",
    },
  };

  const { title, subtitle } = headings[reason];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeInUp.duration(450).springify()}
          style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <IslamicPattern color={isDark ? 'rgba(247,245,239,0.03)' : 'rgba(15,61,46,0.03)'} />

          {/* Dismiss button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
            <X size={20} color={colors.text} style={{ opacity: 0.4 }} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
              <View style={[styles.iconRing, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '10' }]}>
                <Crescent size={40} color={colors.primary} />
              </View>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>SAKINAH PREMIUM</Text>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.text }]}>{subtitle}</Text>
            </Animated.View>

            {/* Features */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.features}>
              {features.map(({ icon: Icon, text }, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Icon size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Plan Selector */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.planSection}>
              {/* Weekly */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  { borderColor: selectedPlan === 'weekly' ? colors.primary : colors.border, backgroundColor: colors.card },
                  selectedPlan === 'weekly' && { borderWidth: 2, backgroundColor: colors.primary + '08' }
                ]}
                onPress={() => setSelectedPlan('weekly')}
                activeOpacity={0.8}
              >
                <View style={styles.planCardInner}>
                  <View style={[styles.radioCircle, { borderColor: selectedPlan === 'weekly' ? colors.primary : colors.border }]}>
                    {selectedPlan === 'weekly' && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, { color: colors.text }]}>Weekly</Text>
                    <Text style={[styles.planBilling, { color: colors.text, opacity: 0.5 }]}>Billed every 7 days</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.text }]}>
                    {pricing.weeklyDisplay}
                    <Text style={{ fontSize: 13, opacity: 0.6 }}>/wk</Text>
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Monthly — Best Value */}
              <View>
                <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.background }]}>{pricing.weeklySaving} · BEST VALUE</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    { borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border, backgroundColor: colors.card },
                    selectedPlan === 'monthly' && { borderWidth: 2, backgroundColor: colors.primary + '08' }
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.8}
                >
                  <View style={styles.planCardInner}>
                    <View style={[styles.radioCircle, { borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border }]}>
                      {selectedPlan === 'monthly' && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={[styles.planName, { color: colors.text }]}>Monthly</Text>
                      <Text style={[styles.planBilling, { color: colors.text, opacity: 0.5 }]}>Billed every 30 days</Text>
                    </View>
                    <Text style={[styles.planPrice, { color: colors.text }]}>
                      {pricing.monthlyDisplay}
                      <Text style={{ fontSize: 13, opacity: 0.6 }}>/mo</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* CTA */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.ctaSection}>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                onPress={handleUpgrade}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={[styles.ctaBtnText, { color: colors.background }]}>
                    CONTINUE WITH {selectedPlan.toUpperCase()}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
                <Text style={[styles.dismissText, { color: colors.text }]}>
                  Maybe tomorrow
                </Text>
              </TouchableOpacity>

              <Text style={[styles.legalText, { color: colors.text }]}>
                Secured by Razorpay · Cancel anytime
              </Text>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    padding: 28,
    paddingBottom: 48,
    gap: 28,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    gap: 12,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Georgia',
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.65,
  },
  features: {
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  planSection: {
    gap: 12,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
  },
  planBilling: {
    fontSize: 12,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  badgeContainer: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: -1,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  ctaSection: {
    gap: 14,
    alignItems: 'center',
  },
  ctaBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  dismissText: {
    fontSize: 14,
    opacity: 0.5,
  },
  legalText: {
    fontSize: 11,
    opacity: 0.35,
    textAlign: 'center',
  },
});
