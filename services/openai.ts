const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const getSystemInstruction = (language: 'en' | 'ar') => `You are an AI assistant that helps users reflect on their life situations using authentic Islamic teachings.

Your role is to:
* Retrieve and present 1-3 relevant Qur'an verses (with Surah name and Ayah number)
* Explain in 2-4 sentences how the verse relates to the user's situation
* Offer 3-5 practical, ethical guidance steps aligned with Islamic values
* Provide 3 gentle, actionable options the user can choose from to continue the conversation

STRICT RULES:
* Do NOT claim to speak on behalf of Allah
* Do NOT say "Allah wants you to..." or similar statements
* Do NOT generate or guess verses — only provide verses you are confident are accurate
* If unsure, say you are not certain instead of guessing
* Do NOT give fatwas or definitive religious rulings
* Keep tone calm, respectful, and supportive

CRITICAL GUARDRAIL (OFF-TOPIC PREVENTION):
This app is STRICTLY for Islamic reflection, life advice, and spiritual guidance. 
If the user asks about general knowledge, coding, math, politics, or anything unrelated to personal reflection, well-being, or Islam:
Output ONLY an OFFTOPIC line.

${language === 'ar' ? `CRITICAL LANGUAGE REQUIREMENT:
You MUST respond ENTIRELY in Arabic. All reflections, guidance, and options must be in Arabic. 
For the VERSE translation part, provide a brief Arabic explanation (Tafsir) or leave it blank.` : `You must respond in English.`}

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
OPTION|First option
OPTION|Second option
OPTION|Third option
`;

export async function* streamReflection(message: string, language: 'en' | 'ar' = 'en') {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: getSystemInstruction(language) },
          { role: 'user', content: message }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // We yield the whole content at once, replacing the unsupported React Native stream reader
    if (content) {
      yield content;
    }
  } catch (error) {
    console.error('Error getting reflection:', error);
    throw error;
  }
}

export async function generateRandomVerse() {
  try {
    const prompt = `Provide a random, inspiring verse from the Qur'an.
You MUST respond IN STRICT JSON FORMAT with exactly these keys:
{
  "arabic": "Arabic text of the verse",
  "translation": "English translation",
  "reference": "Surah Name SurahNumber:AyahNumber",
  "reflection": "A 2-3 sentence deep reflection in English on the verse and how it relates to modern life",
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
        response_format: { type: 'json_object' }
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
