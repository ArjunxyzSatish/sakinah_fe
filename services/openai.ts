import { Language } from '../context/LanguageContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function* streamReflection(message: string, language: Language = 'en', token: string | null = null) {
  const chunks: string[] = [];
  let done = false;
  let error: Error | null = null;
  let processedLength = 0;
  let resolveWait: (() => void) | null = null;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE_URL}/reflect/stream/`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  if (token) {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  }

  xhr.onreadystatechange = () => {
    if (xhr.readyState >= 3 && xhr.responseText) {
      const newText = xhr.responseText.substring(processedLength);
      processedLength = xhr.responseText.length;

      if (newText) {
        const lines = newText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.substring(6);
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              error = new Error(parsed.error);
              done = true;
              if (resolveWait) resolveWait();
              break;
            }
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
        error = new Error(`API error: ${xhr.status}`);
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
    message,
    language
  }));

  const pacingBuffer: string[] = [];
  const pacedDelay = 15;

  try {
    while (true) {
      if (pacingBuffer.length > 0) {
        const toYield = pacingBuffer.shift()!;
        yield toYield;
        await new Promise(resolve => setTimeout(resolve, pacedDelay));
      } else if (chunks.length > 0) {
        const networkChunk = chunks.shift()!;
        for (let i = 0; i < networkChunk.length; i++) {
          pacingBuffer.push(networkChunk[i]);
        }
      } else if (done) {
        if (error) throw error;
        break;
      } else {
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

export async function generateRandomVerse(language: Language = 'en', token: string | null = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/verse/random/?language=${language}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error generating random verse:', error);
    throw error;
  }
}
export async function saveChat(prompt: string, responseText: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/save/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt,
        response: responseText
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}
