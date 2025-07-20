import { Schema, model, Document } from 'mongoose';

export interface IEvent extends Document {
  emailId: string;
  userEmail: string;
  from: string;
  eventType: string;
  keyword: string;
  subject: string;
  eventDateTime: Date | null;
  endDateTime: Date | null;
  receivedDateTime: Date | null;
  summary: string;
}

const eventSchema = new Schema<IEvent>(
  {
    emailId: { type: String, required: true },
    userEmail: { type: String, required: true },
    from: { type: String, required: true },
    eventType: { type: String, default: '' },
    keyword: { type: String, default: '' },  
    subject: { type: String, required: true }, 
    eventDateTime: { type: Date, default: null },
    endDateTime: { type: Date, default: null },
    receivedDateTime: { type: Date, default: null },   
    summary: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const EventModel = model<IEvent>('Event', eventSchema);

export default EventModel;
