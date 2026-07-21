import { Platform } from 'react-native';

// expo-notifications was removed from Expo Go in SDK 53.
// Use require() inside try/catch so the app doesn't crash when running in Expo Go.
let Notifications: any = null;
try {
  if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
  }
} catch {
  // Running in Expo Go — notifications unavailable, rest of app continues normally
}

if (Notifications) {
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
}

async function ensureNotificationChannel() {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('prayer-reminders', {
    name: 'Prayer Reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    lightColor: '#0F3D2E',
  });
}

try {
  ensureNotificationChannel();
} catch (e) {
  console.warn('Failed to ensure notification channel:', e);
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function cancelAllNotifications() {
  if (!Notifications || Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

let isScheduling = false;

export async function schedulePrayerNotifications(lat: number, lon: number) {
  if (!Notifications || Platform.OS === 'web') return;
  if (isScheduling) return;

  isScheduling = true;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await ensureNotificationChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();

    let count = 0;

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
        const notifTime = new Date(prayer.time.getTime() - 5 * 60 * 1000);
        if (notifTime.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${prayer.name} in 5 minutes`,
              body: `${prayer.name} prayer is starting in 5 minutes. Time to prepare.`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: notifTime,
              channelId: 'prayer-reminders',
            },
          });
          count++;
        }
      }
    }

    console.log(`Scheduled ${count} prayer notifications for the next 7 days.`);
  } finally {
    isScheduling = false;
  }
}
