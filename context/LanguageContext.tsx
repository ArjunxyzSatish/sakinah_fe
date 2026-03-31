import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoaded: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.reflect': 'Reflect',
    'nav.saved': 'Saved',
    'nav.wallpaper': 'Wallpaper',
    'nav.settings': 'Settings',
    'home.verseOfDay': 'Verse of the Day',
    'home.reflect': 'Reflect',
    'chat.title': 'Reflection',
    'chat.empty': 'Share what is on your mind.\nLet us reflect together.',
    'chat.placeholder': 'Share your thoughts...',
    'saved.title': 'Saved Verses',
    'saved.empty': "You haven't saved any verses yet.",
    'wallpaper.title': 'Lock Screen',
    'wallpaper.light': 'Light',
    'wallpaper.dark': 'Dark',
    'wallpaper.translation': 'Translation',
    'wallpaper.save': 'Save Wallpaper',
    'wallpaper.saved': 'Saved',
    'settings.title': 'Settings',
    'settings.preferences': 'Preferences',
    'settings.appearance': 'Appearance',
    'settings.appearanceDesc': 'Light or dark mode',
    'settings.language': 'Language',
    'settings.languageDesc': 'English / العربية',
    'settings.notifications': 'Prayer Reminders',
    'settings.notificationsDesc': 'Gentle notifications',
    'settings.activeDays': 'Active Days',
    'settings.notificationTimes': 'Notification Times',
    'settings.about': 'About',
    'settings.aboutDesc': "Sakinah is a space for quiet reflection, grounded in the teachings of the Qur'an.",
    'settings.version': 'Version 1.1.0',
    'onboarding.step1.title': "Reflect through the Qur'an",
    'onboarding.step1.subtitle': 'Find relevant verses and guidance for real-life situations',
    'onboarding.continue': 'Continue',
    'onboarding.next': 'Next',
    'onboarding.skip': 'Skip',
    'onboarding.step2.title': "Share what's on your mind",
    'onboarding.step2.subtitle': 'You can type anything. The app finds relevant verses and helps you reflect.',
    'onboarding.step2.point1': "Relevant Qur'an verses",
    'onboarding.step2.point2': 'Short reflections',
    'onboarding.step2.point3': 'Practical guidance',
    'onboarding.step3.title': 'A tool for reflection',
    'onboarding.step3.p1': 'This app shares verses and insights based on established teachings.',
    'onboarding.step3.p2': 'It does not provide religious rulings or speak on behalf of Allah.',
    'onboarding.step3.btn': 'I understand',
    'onboarding.step4.title': 'What would you like help with?',
    'onboarding.step4.optional': 'Optional',
    'onboarding.step5.title': 'Start your first reflection',
    'onboarding.step5.placeholder': "What's on your mind?",
    'onboarding.step5.showVerse': "Show today's verse",
    'onboarding.step2': 'Step 2 of 2',
    'onboarding.title': 'What are you feeling?',
    'onboarding.subtitle': 'Select any topics to start your reflection.',
    'onboarding.start': 'Start Reflection',
    'topics.anxiety': 'Anxiety',
    'topics.gratitude': 'Gratitude',
    'topics.patience': 'Patience',
    'topics.decision-making': 'Decision Making',
    'topics.grief': 'Grief',
    'topics.purpose': 'Purpose',
    'topics.relationships': 'Relationships',
    'topics.forgiveness': 'Forgiveness',
    'topics.inner-peace': 'Inner Peace',
    'topics.hardship': 'Hardship',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.reflect': 'تأمل',
    'nav.saved': 'المحفوظات',
    'nav.wallpaper': 'الخلفية',
    'nav.settings': 'الإعدادات',
    'home.verseOfDay': 'آية اليوم',
    'home.reflect': 'تأمل',
    'chat.title': 'تأمل',
    'chat.empty': 'شارك ما يدور في ذهنك.\nلنتأمل معاً.',
    'chat.placeholder': 'شارك أفكارك...',
    'saved.title': 'الآيات المحفوظة',
    'saved.empty': "لم تقم بحفظ أي آيات حتى الآن.",
    'wallpaper.title': 'شاشة القفل',
    'wallpaper.light': 'فاتح',
    'wallpaper.dark': 'داكن',
    'wallpaper.translation': 'الترجمة',
    'wallpaper.save': 'حفظ الخلفية',
    'wallpaper.saved': 'تم الحفظ',
    'settings.title': 'الإعدادات',
    'settings.preferences': 'التفضيلات',
    'settings.appearance': 'المظهر',
    'settings.appearanceDesc': 'الوضع الفاتح أو الداكن',
    'settings.language': 'اللغة',
    'settings.languageDesc': 'English / العربية',
    'settings.notifications': 'تذكير بالصلاة',
    'settings.notificationsDesc': 'إشعارات لطيفة',
    'settings.activeDays': 'الأيام النشطة',
    'settings.notificationTimes': 'أوقات الإشعارات',
    'settings.about': 'حول',
    'settings.aboutDesc': "سكينة هي مساحة للتأمل الهادئ، مستمدة من تعاليم القرآن الكريم.",
    'settings.version': 'الإصدار 1.1.0',
    'onboarding.step1.title': 'تأمل من خلال القرآن',
    'onboarding.step1.subtitle': 'ابحث عن آيات وإرشادات ذات صلة بمواقف الحياة الواقعية',
    'onboarding.continue': 'متابعة',
    'onboarding.next': 'التالي',
    'onboarding.skip': 'تخطي',
    'onboarding.step2.title': 'شارك ما يدور في ذهنك',
    'onboarding.step2.subtitle': 'يمكنك كتابة أي شيء. يجد التطبيق آيات ذات صلة ويساعدك على التأمل.',
    'onboarding.step2.point1': 'آيات قرآنية ذات صلة',
    'onboarding.step2.point2': 'تأملات قصيرة',
    'onboarding.step2.point3': 'إرشادات عملية',
    'onboarding.step3.title': 'أداة للتأمل',
    'onboarding.step3.p1': 'يشارك هذا التطبيق آيات ورؤى مبنية على تعاليم راسخة.',
    'onboarding.step3.p2': 'لا يقدم فتاوى دينية ولا يتحدث باسم الله.',
    'onboarding.step3.btn': 'أفهم',
    'onboarding.step4.title': 'بماذا تريد المساعدة؟',
    'onboarding.step4.optional': 'اختياري',
    'onboarding.step5.title': 'ابدأ تأملك الأول',
    'onboarding.step5.placeholder': 'ما الذي يشغل بالك؟',
    'onboarding.step5.showVerse': 'عرض آية اليوم',
    'onboarding.step2': 'الخطوة ٢ من ٢',
    'onboarding.title': 'بماذا تشعر؟',
    'onboarding.subtitle': 'اختر أي موضوع لبدء التأمل.',
    'onboarding.start': 'ابدأ التأمل',
    'topics.anxiety': 'القلق',
    'topics.gratitude': 'الامتنان',
    'topics.patience': 'الصبر',
    'topics.decision-making': 'اتخاذ القرار',
    'topics.grief': 'الحزن',
    'topics.purpose': 'الهدف',
    'topics.relationships': 'العلاقات',
    'topics.forgiveness': 'التسامح',
    'topics.inner-peace': 'السلام الداخلي',
    'topics.hardship': 'المشقة',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      const saved = await AsyncStorage.getItem('sakinah_language') as Language;
      if (saved && (saved === 'en' || saved === 'ar')) {
        setLanguageState(saved);
        const isRTL = saved === 'ar';
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.forceRTL(isRTL);
        }
      }
      setIsLoaded(true);
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('sakinah_language', lang);
    const isRTL = lang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
