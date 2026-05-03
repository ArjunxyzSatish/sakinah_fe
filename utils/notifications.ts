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

import { getTodayPrayerTimes } from './adhanHelper';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

export async function schedulePrayerNotifications(lat: number, lon: number) {
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

  let count = 0;

  // Schedule for the next 7 days to ensure they ring even if app isn't opened tomorrow
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    
    const coords = new Coordinates(lat, lon);
    const params = CalculationMethod.MuslimWorldLeague();
    const prayerTimes = new PrayerTimes(coords, d, params);

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      if (prayer.time.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayer.name}`,
            body: `It's ${prayer.name} time. Take a moment to connect and find peace.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: prayer.time,
            channelId: 'prayer-reminders',
          },
        });
        count++;
      }
    }
  }

  console.log(`Scheduled ${count} adhan notifications for the next 7 days.`);
}
