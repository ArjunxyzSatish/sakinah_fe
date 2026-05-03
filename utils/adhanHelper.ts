import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import * as Localization from 'expo-localization';

export interface PrayerData {
  name: string;
  time: Date;
  timeStr: string;
  endTime: Date;
  endTimeStr: string;
}

export function getTodayPrayerTimes(lat: number, lon: number): PrayerData[] {
  const coordinates = new Coordinates(lat, lon);
  // Default to MWL (Muslim World League) or similar, can be customized later
  const params = CalculationMethod.MuslimWorldLeague();
  
  const date = new Date();
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const midnight = new Date(date);
  midnight.setHours(23, 59, 0, 0);

  return [
    { name: 'Fajr',    time: prayerTimes.fajr,    timeStr: formatTime(prayerTimes.fajr),    endTime: prayerTimes.sunrise, endTimeStr: formatTime(prayerTimes.sunrise) },
    { name: 'Dhuhr',   time: prayerTimes.dhuhr,   timeStr: formatTime(prayerTimes.dhuhr),   endTime: prayerTimes.asr,     endTimeStr: formatTime(prayerTimes.asr) },
    { name: 'Asr',     time: prayerTimes.asr,     timeStr: formatTime(prayerTimes.asr),     endTime: prayerTimes.maghrib, endTimeStr: formatTime(prayerTimes.maghrib) },
    { name: 'Maghrib', time: prayerTimes.maghrib,  timeStr: formatTime(prayerTimes.maghrib), endTime: prayerTimes.isha,    endTimeStr: formatTime(prayerTimes.isha) },
    { name: 'Isha',    time: prayerTimes.isha,    timeStr: formatTime(prayerTimes.isha),    endTime: midnight,            endTimeStr: formatTime(midnight) },
  ];
}

export function getFallbackCoordinates(): { lat: number; lon: number } {
  // Try to use timezone to get approximate coordinates if location is denied
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    tz = Localization.getCalendars()[0]?.timeZone || '';
  }

  // Rough approximation for major regions
  const tzCoords: Record<string, {lat: number, lon: number}> = {
    'Asia/Kolkata': { lat: 28.6139, lon: 77.2090 }, // New Delhi
    'Asia/Calcutta': { lat: 28.6139, lon: 77.2090 },
    'Europe/London': { lat: 51.5074, lon: -0.1278 },
    'America/New_York': { lat: 40.7128, lon: -74.0060 },
    'Asia/Dubai': { lat: 25.2048, lon: 55.2708 },
    'Asia/Riyadh': { lat: 24.7136, lon: 46.6753 },
    'Asia/Karachi': { lat: 24.8607, lon: 67.0011 },
    'Asia/Jakarta': { lat: -6.2088, lon: 106.8456 },
    'Europe/Istanbul': { lat: 41.0082, lon: 28.9784 },
  };

  if (tzCoords[tz]) return tzCoords[tz];
  
  // Default to Mecca
  return { lat: 21.4225, lon: 39.8262 };
}
