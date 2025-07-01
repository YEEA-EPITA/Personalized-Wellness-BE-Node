import EventModel from '../models/EventModel';
import { parseEmailForEvent } from '../utils/emailParser';

interface Email {
  id: string;
  from: string;
  subject: string;
  message: string;
  receivedDateTime: string;
}

export async function processAndSaveEmails(emails: Email[]) {
  try {
    console.log('Processing emails:', emails);
    
    for (const email of emails) {
      console.log('Parsing:', email.message);

      const parsed = parseEmailForEvent(email.message);
      console.log('Parsed:', parsed);

      const event = new EventModel({
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        date: email.receivedDateTime,
        eventType: parsed.eventType,
        summary: parsed.summary,
        rawMessage: email.message,
      });

      await event.save();
    }

  } catch (error) {
    throw error;
  }
}
