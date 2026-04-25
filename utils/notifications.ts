import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notification alerts so the user actually sees them
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

// Create notification channel for Android (required on Android 8+)
// Without this, notifications are silently dropped.
async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-reminders', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#0F3D2E',
    });
  }
}

// Initialize channel immediately
try {
  ensureNotificationChannel();
} catch (e) {
  console.warn('Failed to ensure notification channel:', e);
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function cancelAllNotifications() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('Cancelled all scheduled notifications.');
}

export async function schedulePrayerNotifications(times: string[]) {
  if (Platform.OS === 'web') return;

  // Ensure permissions are granted before scheduling
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Notification permissions not granted, skipping scheduling.');
    return;
  }

  // Ensure the channel exists (Android requirement)
  await ensureNotificationChannel();

  // Clear ALL existing scheduled notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const time of times) {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Sakinah - Prayer Time",
        body: "It is time for prayer. Take a moment to reflect and find peace.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
        channelId: 'prayer-reminders',
      },
    });
  }

  // Verify scheduled notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`Scheduled ${times.length} daily prayer notifications. Verified: ${scheduled.length} active.`);
}
