import EventModel from '../models/EventModel';
import { parseEmailForEvent, ParsedEvent } from '../utils/emailParser';

interface Email {
  id: string;
  from: string;
  subject: string;
  message: string;
  receivedDateTime: string;
}

export async function processAndSaveEmails(emails: Email[]) {
  const savedEvents = [];

  for (const email of emails) {
    const parsed: ParsedEvent = parseEmailForEvent(email.message);

    const event = new EventModel({
      emailId: email.id,
      from: email.from,
      subject: email.subject,
      receivedDate: email.receivedDateTime,
      eventDate: parsed.eventDate || '',
      eventType: parsed.eventType,
      keyword: parsed.keyword,
      summary: parsed.summary,
    //   rawMessage: email.message, // To be used if needed
    });

    const saved = await event.save();
    savedEvents.push(saved);
  }

  return savedEvents;
}
