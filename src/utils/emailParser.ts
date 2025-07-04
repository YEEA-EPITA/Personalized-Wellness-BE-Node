import nlp from 'compromise';
import nlpDates from 'compromise-dates';
import * as chrono from 'chrono-node';

nlp.extend(nlpDates);

export interface ParsedEvent {
  eventDate?: string;
  eventType: string;
  keyword: string;
  summary: string;
}

export class EmailParser {
    static async parseEmailForEvent(message: string, referenceDateStr?: string): Promise<ParsedEvent> {
        const doc: any = nlp(message);

        // Parsing date
        const referenceDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
        const parsed = chrono.parse(message, referenceDate);
        const eventDate = parsed.length ? parsed[0].start?.date().toISOString() : '';

        // Detect eventType & keywords
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

        // Extract summary
        const sentences = message.split(/(?<=[.?!])\s+/);  
        const greetingRegex = /^(dear|hello|hi)[\s,]/i;    // Remove greeting sentences, Add if needed
        const filteredSentences = sentences.filter(s => !greetingRegex.test(s.trim()));
        const matchedSentence = filteredSentences.find(sentence =>
            keyword && sentence.toLowerCase().includes(keyword)
        );
        const summary = (matchedSentence || filteredSentences[0] || '').trim();

        return {
            eventDate,
            eventType,
            keyword,
            summary,
        };
        }
}

