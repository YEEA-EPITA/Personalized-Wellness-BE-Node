import nlp from 'compromise';
import nlpDates from 'compromise-dates';
import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';

nlp.extend(nlpDates);

export interface ParsedEvent {
  eventDateTime?: string;
  endDateTime?: string;
  eventType: string;
  keyword: string;
  summary: string;
}

export class EmailParser {
  static async parseEmailForEvent(message: string, referenceDateStr?: string): Promise<ParsedEvent> {
    const referenceDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
    const parsed = chrono.parse(message, referenceDate);

    // EvnentDate(start, end) Extraction
    let eventDateTime = '';
    let endDateTime = '';

    const timeRangeRegex = /(from\s*)?(\d{1,2}:\d{2})\s*(am|pm)?\s*(–|-|to)\s*(\d{1,2}:\d{2})\s*(am|pm)?/i;
    const timeMatch = message.match(timeRangeRegex);

    if (parsed.length > 0) {
      const baseDate = parsed[0].start?.date();
      if (baseDate) {
        const base = DateTime.fromJSDate(baseDate).setZone('Europe/Paris');
        const baseDateStr = base.toFormat('yyyy-MM-dd');
        eventDateTime = base.toISO() ?? '';

        if (timeMatch) {
            const rawStart = (timeMatch[2] ?? '').trim();
            const rawStartAmPm = ((timeMatch[3] || timeMatch[6] || 'AM') ?? 'AM').toUpperCase();
            const rawEnd = (timeMatch[5] ?? '').trim();
            const rawEndAmPm = ((timeMatch[6] || timeMatch[3] || 'AM') ?? 'AM').toUpperCase();

            const startTimeStr = `${rawStart} ${rawStartAmPm}`;
            const endTimeStr = `${rawEnd} ${rawEndAmPm}`;

            const startDT = DateTime.fromFormat(`${baseDateStr} ${startTimeStr}`, 'yyyy-MM-dd h:mm a', {
                zone: 'Europe/Paris',
            });
            const endDT = DateTime.fromFormat(`${baseDateStr} ${endTimeStr}`, 'yyyy-MM-dd h:mm a', {
                zone: 'Europe/Paris',
            });

            if (startDT.isValid && endDT.isValid) {
                eventDateTime = startDT.toISO();
                endDateTime = endDT.toISO();
            } else {
                endDateTime = base.plus({ hours: 1 }).toISO()  ?? '';
            }
            } else {
            endDateTime = base.plus({ hours: 1 }).toISO()  ?? '';
            }
      }
    }

    // Event Type Detection 
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
      study: ['assignment', 'class', 'lecture', 'exam', 'test', 'quiz', 'homework', 'course', 'syllabus', 'holiday', 'school'],
      holiday: ['holiday', 'vacation', 'break', 'leave', 'time off'],
    };

    const hasKeyword = (words: string[]): string | undefined => words.find((word) => lowered.includes(word));

    for (const [type, wordList] of Object.entries(keywords)) {
      const matched = hasKeyword(wordList);
      if (matched) {
        eventType = type;
        keyword = matched;
        break;
      }
    }

    // Summary Extraction
    const sentences = message.split(/(?<=[.?!])\s+/);
    const greetingRegex = /^(dear|hello|hi)[\s,]/i;
    const filteredSentences = sentences.filter((s) => !greetingRegex.test(s.trim()));
    const matchedSentence = filteredSentences.find((sentence) => keyword && sentence.toLowerCase().includes(keyword));
    const summary = (matchedSentence || filteredSentences[0] || '').trim();

    return {
      eventDateTime,
      endDateTime,
      eventType,
      keyword,
      summary,
    };
  }
}
