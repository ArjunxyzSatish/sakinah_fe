export interface Verse {
  arabic: string;
  translation: string;
  reference: string;
  reflection: string;
  reflectionAr: string;
}

export const DAILY_VERSES: Verse[] = [
  {
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "Indeed, with hardship [will be] ease.",
    reference: "Surah Ash-Sharh 94:6",
    reflection: "This verse reminds us that difficulty is never permanent. Allah promises that relief is not just coming after hardship, but is intertwined with it.",
    reflectionAr: "تذكرنا هذه الآية أن الصعوبة ليست دائمة أبدًا. يعدنا الله أن الفرج لا يأتي بعد العسر فحسب، بل هو متلازم معه."
  },
  {
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    translation: "Allah does not burden a soul beyond that it can bear.",
    reference: "Surah Al-Baqarah 2:286",
    reflection: "A profound reminder of your own resilience. Whatever you are facing right now, you have the spiritual and emotional capacity to endure and overcome it.",
    reflectionAr: "تذكير عميق بمرونتك. مهما كان ما تواجهه الآن، فلديك القدرة الروحية والعاطفية على تحمله وتجاوزه."
  },
  {
    arabic: "وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا",
    translation: "And be patient for the decision of your Lord, for indeed, you are in Our eyes.",
    reference: "Surah At-Tur 52:48",
    reflection: "Patience is easier when you know you are being watched over with care. You are never abandoned or unseen in your struggles.",
    reflectionAr: "يصبح الصبر أسهل عندما تعلم أنك تحت رعاية الله. أنت لست متروكًا أو غير مرئي في صراعاتك."
  },
  {
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
    translation: "So remember Me; I will remember you.",
    reference: "Surah Al-Baqarah 2:152",
    reflection: "A beautiful, reciprocal promise. Taking just a moment to center your heart on the Divine brings immediate spiritual presence and peace into your life.",
    reflectionAr: "وعد جميل ومتبادل. إن تخصيص لحظة لتوجيه قلبك نحو الخالق يجلب حضورًا روحيًا وسلامًا فوريًا إلى حياتك."
  },
  {
    arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
    translation: "And He is with you wherever you are.",
    reference: "Surah Al-Hadid 57:4",
    reflection: "Loneliness is a human feeling, but spiritually, you are always accompanied. This verse invites you to find comfort in His constant presence.",
    reflectionAr: "الوحدة شعور بشري، لكنك روحياً لست وحدك أبداً. تدعوك هذه الآية لتجد الراحة في حضوره الدائم."
  }
];

export function getDailyVerse() {
  const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return DAILY_VERSES[today % DAILY_VERSES.length];
}

export function getRandomVerse() {
  return DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)];
}
