import { Schema, Document, model } from 'mongoose';

export interface IEvent extends Document {
  emailId: string;
  from: string;
  eventType: string;
  keyword: string;
  subject: string;
  eventDate: string;
  receivedDate: string;
  summary: string;
  // rawMessage?: string;  // To be used if needed
}

const eventSchema = new Schema<IEvent>(
  {
    emailId: { type: String, required: true },
    from: { type: String, required: true },
    eventType: { type: String, default: '' },
    keyword: { type: String, default: '' },  
    subject: { type: String, required: true },
    eventDate: { type: String, default: '' },      
    receivedDate: { type: String, default: '' },        
    summary: { type: String, default: '' },
    // rawMessage: { type: String, default: '' },      // To be used if needed
  },
  {
    timestamps: true,
  }
);

const EventModel = model<IEvent>('Event', eventSchema);

export default EventModel;
