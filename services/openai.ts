import { Language, getLanguageNameForLLM } from '../context/LanguageContext';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const getLanguageInstruction = (language: Language): string => {
  if (language === 'ar') {
    return `CRITICAL LANGUAGE REQUIREMENT:
You MUST respond ENTIRELY in Arabic. All reflections, guidance, and options must be in Arabic. 
For the VERSE translation part, provide a brief Arabic explanation (Tafsir) or leave it blank.`;
  }
  if (language === 'en') {
    return `You must respond in English.`;
  }
  // Indian languages
  const langName = getLanguageNameForLLM(language);
  return `CRITICAL LANGUAGE REQUIREMENT:
You MUST respond ENTIRELY in ${langName}. All reflections, guidance, options, and VERSE translations must be in ${langName}.
Keep the Arabic Qur'anic text (VERSE Arabic field) in original Arabic script.
The translation field of VERSE lines must be in ${langName}.
All REFLECTION, GUIDANCE, and OPTION text must be in ${langName}.`;
};

const getSystemInstruction = (language: Language) => `You are an AI assistant that helps users reflect on their life situations using authentic Islamic teachings.

Your role is to:
* Retrieve and present 1-3 relevant Qur'an verses (with Surah name and Ayah number)
* Explain in 2-4 sentences how the verse relates to the user's situation
* Offer 3-5 practical, ethical guidance steps aligned with Islamic values
* Provide 3 gentle follow-up options phrased FROM THE USER'S PERSPECTIVE (first person), as if the user is asking a natural follow-up question. For example: "How can I practice more patience in my daily life?" or "Can you share more about what the Qur'an says about gratitude?"

STRICT RULES:
* Do NOT claim to speak on behalf of Allah
* Do NOT say "Allah wants you to..." or similar statements
* Do NOT generate or guess verses — only provide verses you are confident are accurate
* If unsure, say you are not certain instead of guessing
* Do NOT give fatwas or definitive religious rulings
* Keep tone calm, respectful, and supportive

CRITICAL GUARDRAIL (OFF-TOPIC PREVENTION):
This app is STRICTLY for Islamic reflection, life advice, and spiritual guidance. 
If the user asks about general knowledge, coding, math, politics:
Output ONLY an OFFTOPIC line.

${getLanguageInstruction(language)}

OUTPUT FORMAT:
You MUST return EXACTLY this plain text format, line by line. Do not use markdown, JSON, or any other formatting. Prefix each line with the exact section tag.

If off-topic:
OFFTOPIC|Your gentle refusal message here.

If on-topic:
VERSE|Surah Name Ayah Number|Arabic text|Translation
(Repeat VERSE line for 1 to 3 verses)
REFLECTION|Your 2-4 sentence reflection text here...
GUIDANCE|First actionable step
GUIDANCE|Second actionable step
GUIDANCE|Third actionable step
(Repeat GUIDANCE line for 3 to 5 steps)
OPTION|A natural follow-up question from the user's perspective (first person)
OPTION|Another follow-up in first person
OPTION|A third follow-up in first person
`;

export async function* streamReflection(message: string, language: Language = 'en') {
  // Use a promise-based wrapper around XMLHttpRequest for true SSE streaming in React Native
  const chunks: string[] = [];
  let done = false;
  let error: Error | null = null;
  let processedLength = 0;
  let resolveWait: (() => void) | null = null;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://api.openai.com/v1/chat/completions');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${OPENAI_API_KEY}`);

  xhr.onreadystatechange = () => {
    if (xhr.readyState >= 3 && xhr.responseText) {
      const newText = xhr.responseText.substring(processedLength);
      processedLength = xhr.responseText.length;

      if (newText) {
        // Parse SSE lines from the new chunk
        const lines = newText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.substring(6);
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              chunks.push(delta);
              if (resolveWait) {
                resolveWait();
                resolveWait = null;
              }
            }
          } catch (e) {
            // Skip malformed JSON chunks
          }
        }
      }
    }
    if (xhr.readyState === 4) {
      if (xhr.status !== 200) {
        error = new Error(`OpenAI API error: ${xhr.status}`);
      }
      done = true;
      if (resolveWait) {
        resolveWait();
        resolveWait = null;
      }
    }
  };

  xhr.onerror = () => {
    error = new Error('Network error');
    done = true;
    if (resolveWait) {
      resolveWait();
      resolveWait = null;
    }
  };

  xhr.send(JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: getSystemInstruction(language) },
      { role: 'user', content: message }
    ],
    stream: true,
  }));

  // Yield chunks as they arrive with pacing to slow down the output
  const pacingBuffer: string[] = [];
  const pacedDelay = 15; // ms between chunks

  try {
    while (true) {
      if (pacingBuffer.length > 0) {
        // Yield from the buffer to create a smooth flow
        const toYield = pacingBuffer.shift()!;
        yield toYield;
        await new Promise(resolve => setTimeout(resolve, pacedDelay));
      } else if (chunks.length > 0) {
        // Break down large network chunks into smaller pieces for smoother pacing
        const networkChunk = chunks.shift()!;
        // Split by characters to have fine-grained control, or words for speed
        // Here we use characters for a very smooth "typewriter" feel
        for (let i = 0; i < networkChunk.length; i++) {
          pacingBuffer.push(networkChunk[i]);
        }
      } else if (done) {
        if (error) throw error;
        break;
      } else {
        // Wait for new data from network
        await new Promise<void>((resolve) => {
          resolveWait = resolve;
        });
      }
    }
  } catch (e) {
    console.error('Error getting reflection:', e);
    throw e;
  }
}

// Diverse surah ranges to pick from — covers the breadth of the Qur'an
const SURAH_RANGES = [
  { name: 'Al-Baqarah', number: 2, minAyah: 1, maxAyah: 286 },
  { name: 'Aal-E-Imran', number: 3, minAyah: 1, maxAyah: 200 },
  { name: 'An-Nisa', number: 4, minAyah: 1, maxAyah: 176 },
  { name: 'Al-Maidah', number: 5, minAyah: 1, maxAyah: 120 },
  { name: 'Al-Anam', number: 6, minAyah: 1, maxAyah: 165 },
  { name: 'Al-Araf', number: 7, minAyah: 1, maxAyah: 206 },
  { name: 'Al-Anfal', number: 8, minAyah: 1, maxAyah: 75 },
  { name: 'At-Tawbah', number: 9, minAyah: 1, maxAyah: 129 },
  { name: 'Yunus', number: 10, minAyah: 1, maxAyah: 109 },
  { name: 'Hud', number: 11, minAyah: 1, maxAyah: 123 },
  { name: 'Yusuf', number: 12, minAyah: 1, maxAyah: 111 },
  { name: 'Ar-Rad', number: 13, minAyah: 1, maxAyah: 43 },
  { name: 'Ibrahim', number: 14, minAyah: 1, maxAyah: 52 },
  { name: 'An-Nahl', number: 16, minAyah: 1, maxAyah: 128 },
  { name: 'Al-Isra', number: 17, minAyah: 1, maxAyah: 111 },
  { name: 'Al-Kahf', number: 18, minAyah: 1, maxAyah: 110 },
  { name: 'Maryam', number: 19, minAyah: 1, maxAyah: 98 },
  { name: 'Ta-Ha', number: 20, minAyah: 1, maxAyah: 135 },
  { name: 'Al-Anbiya', number: 21, minAyah: 1, maxAyah: 112 },
  { name: 'Al-Hajj', number: 22, minAyah: 1, maxAyah: 78 },
  { name: 'Al-Muminun', number: 23, minAyah: 1, maxAyah: 118 },
  { name: 'An-Nur', number: 24, minAyah: 1, maxAyah: 64 },
  { name: 'Al-Furqan', number: 25, minAyah: 1, maxAyah: 77 },
  { name: 'Ash-Shuara', number: 26, minAyah: 1, maxAyah: 227 },
  { name: 'Al-Qasas', number: 28, minAyah: 1, maxAyah: 88 },
  { name: 'Ar-Rum', number: 30, minAyah: 1, maxAyah: 60 },
  { name: 'Luqman', number: 31, minAyah: 1, maxAyah: 34 },
  { name: 'As-Sajdah', number: 32, minAyah: 1, maxAyah: 30 },
  { name: 'Al-Ahzab', number: 33, minAyah: 1, maxAyah: 73 },
  { name: 'Fatir', number: 35, minAyah: 1, maxAyah: 45 },
  { name: 'Ya-Sin', number: 36, minAyah: 1, maxAyah: 83 },
  { name: 'Az-Zumar', number: 39, minAyah: 1, maxAyah: 75 },
  { name: 'Ghafir', number: 40, minAyah: 1, maxAyah: 85 },
  { name: 'Fussilat', number: 41, minAyah: 1, maxAyah: 54 },
  { name: 'Ash-Shura', number: 42, minAyah: 1, maxAyah: 53 },
  { name: 'Al-Hujurat', number: 49, minAyah: 1, maxAyah: 18 },
  { name: 'Ar-Rahman', number: 55, minAyah: 1, maxAyah: 78 },
  { name: 'Al-Hadid', number: 57, minAyah: 1, maxAyah: 29 },
  { name: 'Al-Hashr', number: 59, minAyah: 1, maxAyah: 24 },
  { name: 'Al-Mulk', number: 67, minAyah: 1, maxAyah: 30 },
  { name: 'Nuh', number: 71, minAyah: 1, maxAyah: 28 },
  { name: 'Al-Muzzammil', number: 73, minAyah: 1, maxAyah: 20 },
  { name: 'Al-Insan', number: 76, minAyah: 1, maxAyah: 31 },
  { name: 'An-Naba', number: 78, minAyah: 1, maxAyah: 40 },
  { name: 'At-Takwir', number: 81, minAyah: 1, maxAyah: 29 },
  { name: 'Al-Buruj', number: 85, minAyah: 1, maxAyah: 22 },
  { name: 'Al-Fajr', number: 89, minAyah: 1, maxAyah: 30 },
  { name: 'Ad-Duha', number: 93, minAyah: 1, maxAyah: 11 },
  { name: 'At-Tin', number: 95, minAyah: 1, maxAyah: 8 },
  { name: 'Al-Alaq', number: 96, minAyah: 1, maxAyah: 19 },
  { name: 'Al-Asr', number: 103, minAyah: 1, maxAyah: 3 },
];

const VERSE_THEMES = [
  'patience and perseverance', 'gratitude and thankfulness', 'mercy and compassion',
  'trust in Allah (tawakkul)', 'knowledge and wisdom', 'justice and fairness',
  'forgiveness and repentance', 'humility and modesty', 'kindness to parents',
  'charity and generosity', 'hope and optimism', 'self-reflection and mindfulness',
  'brotherhood and unity', 'nature and creation', 'the afterlife and accountability',
  'prayer and devotion', 'truthfulness and honesty', 'courage and strength',
  'love and family', 'contentment and inner peace', 'hardship and relief',
  'provision and sustenance', 'remembrance of Allah (dhikr)', 'the heart and purification',
];

export async function generateRandomVerse(language: Language = 'en') {
  try {
    // Pick a random surah range and theme to force diversity
    const surah = SURAH_RANGES[Math.floor(Math.random() * SURAH_RANGES.length)];
    const theme = VERSE_THEMES[Math.floor(Math.random() * VERSE_THEMES.length)];
    const randomAyah = Math.floor(Math.random() * (surah.maxAyah - surah.minAyah + 1)) + surah.minAyah;

    const langName = getLanguageNameForLLM(language);
    const isArabic = language === 'ar';
    const isEnglish = language === 'en';

    const prompt = `Pick an inspiring verse from Surah ${surah.name} (Surah ${surah.number}), preferably near Ayah ${randomAyah}, related to the theme of "${theme}".

IMPORTANT RULES:
- Do NOT pick any of these overused verses: 94:5, 94:6, 2:286, 2:255, 2:152, 2:153, 3:139, 13:28, 65:3, 3:173, 9:51, 29:2, 67:2
- Pick a LESSER-KNOWN but still meaningful verse from that Surah
- The verse must be ACCURATE — do not fabricate or guess any verse

You MUST respond IN STRICT JSON FORMAT with exactly these keys:
{
  "arabic": "Arabic text of the verse",
  "translation": "${isArabic ? 'Brief Arabic explanation (Tafsir)' : isEnglish ? 'English translation' : `Translation in ${langName}`}",
  "reference": "Surah Name SurahNumber:AyahNumber",
  "reflection": "${isEnglish ? 'A 2-3 sentence deep reflection in English' : `A 2-3 sentence deep reflection in ${langName}`} on the verse and how it relates to modern life",
  "reflectionAr": "A 2-3 sentence deep reflection in Arabic on the verse"
}
Output ONLY the JSON object. Do not include markdown codeblocks.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 1.2,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("No content");
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating random verse:', error);
    throw error;
  }
}

