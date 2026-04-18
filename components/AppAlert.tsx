import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  buttons?: AppAlertButton[];
  onDismiss?: () => void;
};

export default function AppAlert({
  visible,
  title,
  message,
  icon,
  buttons = [{ text: 'OK' }],
  onDismiss,
}: Props) {
  const { colors, isDark } = useTheme();

  const handleButton = (btn: AppAlertButton) => {
    btn.onPress?.();
    onDismiss?.();
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <BlurView
          intensity={90}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.primary }]}>
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.buttons}>
            {buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isPrimary && { backgroundColor: colors.primary },
                    isCancel && { borderWidth: 1, borderColor: colors.border },
                    isDestructive && { borderWidth: 1, borderColor: 'rgba(220,50,50,0.5)' },
                  ]}
                  onPress={() => handleButton(btn)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isPrimary && { color: colors.background },
                      isCancel && { color: colors.text, opacity: 0.7 },
                      isDestructive && { color: '#DC3535' },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Hook for easy usage ────────────────────────────────────────────────────────
type AlertConfig = {
  title: string;
  message?: string;
  icon?: string;
  buttons?: AppAlertButton[];
};

export function useAppAlert() {
  const [visible, setVisible] = React.useState(false);
  const [config, setConfig] = React.useState<AlertConfig>({ title: '' });

  const showAlert = (
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    icon?: string,
  ) => {
    setConfig({ title, message, buttons, icon });
    setVisible(true);
  };

  const hideAlert = () => setVisible(false);

  const alertElement = (
    <AppAlert
      visible={visible}
      title={config.title}
      message={config.message}
      icon={config.icon}
      buttons={config.buttons}
      onDismiss={hideAlert}
    />
  );

  return { showAlert, hideAlert, alertElement };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Georgia',
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.75,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 4,
  },
  buttons: {
    width: '100%',
    gap: 10,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
