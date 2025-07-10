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
            const loweredFrom = email.from.toLowerCase();
            const loweredSubject = email.subject.toLowerCase();
            const loweredMessage = email.message.toLowerCase();

            const isCalendarInvite =
                loweredFrom.includes('calendar-noreply@google.com') ||
                loweredFrom.includes('calendar.google.com') ||
                loweredFrom.includes('invite@') ||
                (loweredSubject.includes('invitation:') && loweredSubject.includes('@')) ||
                loweredSubject.includes('you have been invited') ||
                loweredMessage.includes('google calendar') ||
                loweredMessage.includes('you have been invited')|| 
                loweredSubject.startsWith('canceled event:') ||
                loweredSubject.startsWith('updated event:') ||
                loweredSubject.startsWith('rescheduled:');

            if (isCalendarInvite) {
                continue;
            }

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


