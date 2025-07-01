import { Schema, Document, model } from 'mongoose';

export interface IEvent extends Document {
  emailId: string;
  from: string;
  subject: string;
  date?: string;
  eventType?: string;
  summary?: string;
  rawMessage?: string;
}

const eventSchema = new Schema<IEvent>(
  {
    emailId: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true },
    date: { type: String, default: '' },
    eventType: { type: String, default: '' },
    summary: { type: String, default: '' },
    rawMessage: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const EventModel = model<IEvent>('Event', eventSchema);

export default EventModel;
