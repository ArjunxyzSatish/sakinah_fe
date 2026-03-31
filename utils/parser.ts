export interface ParsedContent {
  isOffTopic: boolean;
  offTopicMessage: string;
  verses: { reference: string; arabic: string; translation: string }[];
  reflection: string;
  guidance: string[];
  options: string[];
  elements: any[];
}

export const parseStreamedContent = (text: string): ParsedContent => {
  const lines = text.split('\n');
  const data = {
    isOffTopic: false,
    offTopicMessage: '',
    verses: [] as {reference: string, arabic: string, translation: string}[],
    reflection: '',
    guidance: [] as string[],
    options: [] as string[],
    elements: [] as any[]
  };

  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('OFFTOPIC|')) {
      currentSection = 'OFFTOPIC';
      data.isOffTopic = true;
      data.offTopicMessage += trimmed.substring(9);
    } else if (trimmed.startsWith('VERSE|')) {
      currentSection = 'VERSE';
      const parts = trimmed.substring(6).split('|');
      data.verses.push({
        reference: parts[0] || '',
        arabic: parts[1] || '',
        translation: parts[2] || ''
      });
    } else if (trimmed.startsWith('REFLECTION|')) {
      currentSection = 'REFLECTION';
      data.reflection += (data.reflection ? ' ' : '') + trimmed.substring(11);
    } else if (trimmed.startsWith('GUIDANCE|')) {
      currentSection = 'GUIDANCE';
      data.guidance.push(trimmed.substring(9));
    } else if (trimmed.startsWith('OPTION|')) {
      currentSection = 'OPTION';
      data.options.push(trimmed.substring(7));
    } else {
      // Continuation
      if (currentSection === 'REFLECTION') data.reflection += ' ' + trimmed;
      else if (currentSection === 'OFFTOPIC') data.offTopicMessage += ' ' + trimmed;
      else if (currentSection === 'VERSE' && data.verses.length > 0) {
        data.verses[data.verses.length - 1].translation += ' ' + trimmed;
      }
    }
  }

  // Generate elements array for easy rendering in chat.tsx
  if (data.isOffTopic) {
    if (data.offTopicMessage) data.elements.push({ type: 'offtopic', content: data.offTopicMessage });
  } else {
    data.verses.forEach(v => data.elements.push({ type: 'verse', ...v }));
    if (data.reflection) data.elements.push({ type: 'reflection', content: data.reflection });
    data.guidance.forEach(g => data.elements.push({ type: 'action', content: g }));
    data.options.forEach(o => data.elements.push({ type: 'question', content: o }));
  }

  return data;
};
