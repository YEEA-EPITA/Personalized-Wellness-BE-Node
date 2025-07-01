import nlp from 'compromise';
import nlpDates from 'compromise-dates';

nlp.extend(nlpDates);

interface ParsedEvent {
  date?: string;
  eventType: string;
  summary: string;
}

export function parseEmailForEvent(message: string): ParsedEvent {
  const doc: any = nlp(message);
  const dates = doc.dates().json();
  const date = dates.length ? dates[0].text : '';

  let eventType = 'general';
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

  const hasKeyword = (words: string[]) => words.some(word => lowered.includes(word));

  if (hasKeyword(keywords.security)) {
    eventType = 'security';
  } else if (hasKeyword(keywords.schedule) || (date && hasKeyword(keywords.confirmation))) {
    eventType = 'schedule';
  } else if (hasKeyword(keywords.project)) {
    eventType = 'project';
  } else if (hasKeyword(keywords.update)) {
    eventType = 'update';
  } else if (hasKeyword(keywords.critical)) {
    eventType = 'critical';
  } else if (hasKeyword(keywords.settings)) {
    eventType = 'settings';
  }

  return {
    date,
    eventType,
    summary: message.slice(0, 200) + '...',
  };
}
