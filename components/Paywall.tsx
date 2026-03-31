import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useUser } from '../context/UserContext';
import { Check } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

export default function Paywall({ onDismiss }: { onDismiss?: () => void }) {
  const { subscribe } = useUser();

  const handleSubscribe = () => {
    subscribe();
    if (onDismiss) onDismiss();
  };

  const features = [
    'Unlimited reflections',
    'Deeper insights & guidance',
    'Save unlimited verses',
    'Custom notification schedules'
  ];

  return (
    <Modal transparent animationType="fade" visible={true} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.duration(400)} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Continue with deeper reflection and guidance</Text>
            <Text style={styles.subtitle}>Used best when revisited regularly</Text>
          </View>

          <View style={styles.featuresList}>
            {features.map((feature, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={styles.iconContainer}>
                  <Check size={14} color={Colors.sakinahPrimary} strokeWidth={3} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pricingSection}>
            <View style={styles.bestValueTag}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
            <TouchableOpacity style={styles.yearlyPlan} onPress={handleSubscribe}>
              <View>
                <Text style={styles.planTitle}>Yearly</Text>
                <Text style={styles.planSubtitle}>7 days free, then $49.99/yr</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planPrice}>$4.16</Text>
                <Text style={styles.planSubtitle}>/mo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.monthlyPlan} onPress={handleSubscribe}>
              <View>
                <Text style={styles.planTitle}>Monthly</Text>
                <Text style={styles.planSubtitle}>7 days free, then $7.99/mo</Text>
              </View>
              <Text style={styles.planPrice}>$7.99</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
              <Text style={styles.subscribeBtnText}>START 7-DAY FREE TRIAL</Text>
            </TouchableOpacity>
            
            <View style={styles.footerLinks}>
              <TouchableOpacity>
                <Text style={styles.footerLink}>RESTORE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDismiss}>
                <Text style={styles.footerLink}>CANCEL ANYTIME</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(247, 245, 239, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.sakinahBg,
    borderRadius: 40,
    padding: 32,
    shadowColor: Colors.sakinahPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 61, 46, 0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Georgia',
    color: Colors.sakinahPrimary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.sakinahText,
    opacity: 0.7,
  },
  featuresList: {
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 61, 46, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.sakinahText,
    opacity: 0.9,
  },
  pricingSection: {
    gap: 12,
    marginBottom: 24,
  },
  bestValueTag: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: Colors.sakinahPrimary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  bestValueText: {
    color: Colors.sakinahBg,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  yearlyPlan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.sakinahPrimary,
    backgroundColor: 'rgba(15, 61, 46, 0.05)',
    borderRadius: 20,
  },
  monthlyPlan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 61, 46, 0.2)',
    borderRadius: 20,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.sakinahText,
  },
  planSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.sakinahText,
    opacity: 0.7,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.sakinahText,
  },
  actionSection: {
    gap: 16,
  },
  subscribeBtn: {
    backgroundColor: Colors.sakinahPrimary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: Colors.sakinahPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeBtnText: {
    color: Colors.sakinahBg,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  footerLink: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: Colors.sakinahText,
    opacity: 0.5,
  },
});
