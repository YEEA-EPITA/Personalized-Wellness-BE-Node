import nlp from 'compromise';
import nlpDates from 'compromise-dates';

nlp.extend(nlpDates);

export interface ParsedEvent {
  eventDate?: string;
  eventType: string;
  keyword: string;
  summary: string;
}

export function parseEmailForEvent(message: string): ParsedEvent {
  const doc: any = nlp(message);
  const dates = doc.dates().json();
  const eventDate = dates.length ? dates[0].text : '';

  let eventType = 'general';
  let keyword = '';
  const lowered = message.toLowerCase();

  const keywords = {
    schedule: ['meeting', 'calendar', 'workshop', 'invite', 'event', 'appointment'],
    project: ['project', 'status', 'task', 'progress'],
    critical: ['important', 'required', 'request', 'action required', 'urgent'],
    confirmation: ['confirm', 'confirmation', 'availability', 'rsvp', 'attending'],
    update: ['update', 'change', 'revision', 'modified', 'review'],
    security: ['security', 'password', 'restore', 'recovery'],
    settings: ['settings', 'preferences', 'configuration'],
  };

  const hasKeyword = (words: string[]): string | undefined =>
    words.find(word => lowered.includes(word));

  for (const [type, wordList] of Object.entries(keywords)) {
    const matched = hasKeyword(wordList);
    if (matched) {
      eventType = type;
      keyword = matched;
      break;
    }
  }

  // Split into sentences
  const sentences = message.split(/(?<=[.?!])\s+/);

  // Remove greeting sentences (e.g., "Dear won,", "Hello team,", etc.), Add if needed
  const greetingRegex = /^(dear|hello|hi)[\s,]/i;
  const filteredSentences = sentences.filter(s => !greetingRegex.test(s.trim()));

  // Try to find sentence with keyword
  const matchedSentence = filteredSentences.find(sentence =>
    keyword && sentence.toLowerCase().includes(keyword)
  );

  // If no keyword match, fallback to first non-greeting sentence
  const summary = (matchedSentence || filteredSentences[0] || '').trim();

  return {
    eventDate,
    eventType,
    keyword,
    summary,
  };
}
