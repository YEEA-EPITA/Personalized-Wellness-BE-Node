import { EventModel } from '../models';
import { EmailParser } from '../utils';

interface Email {
  id: string;
  userEmail: string;
  from: string;
  subject: string;
  message: string;
  receivedDateTime: string;
}

export class EmailProcessor {
    static async processAndSaveEmails(emails: Email[]) {
        const savedEvents = [];

        for (const email of emails) {         
            const parsed = await EmailParser.parseEmailForEvent(email.message, email.receivedDateTime);

            const event = new EventModel({
            emailId: email.id,
            userEmail: email.userEmail,
            from: email.from,
            subject: email.subject,
            receivedDateTime: email.receivedDateTime,
            eventDateTime: parsed.eventDateTime || '',
            endDateTime: parsed.endDateTime || '',
            eventType: parsed.eventType,
            keyword: parsed.keyword,
            summary: parsed.summary,
            });

        const saved = await event.save();
        savedEvents.push(saved);
        }

        return savedEvents;
    }
}


