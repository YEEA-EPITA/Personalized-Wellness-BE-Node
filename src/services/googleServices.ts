import { PlatformsModel } from '../models';

interface findConnectionParams {
  type: string;
  email: string;
}

interface UpdateConnectionParams {
  id: string;
  type: string;
  name: string;
  email: string;
  tokens: Record<string, any>;
  connectorId?: string;
}

interface SaveConnectionParams {
  type: string;
  name: string;
  email: string;
  tokens: Record<string, any>;
  connectorId?: string;
}

export default class GoogleServices {
  static async findConnection({
    type,
    email,
  }: findConnectionParams): Promise<any> {
    try {
      const findConnection = await PlatformsModel.findOne({
        type,
        email,
      });
      return { success: true, data: findConnection };
    } catch (error) {
      return { success: false, error };
    }
  }

  static async updateConnection({
    id,
    type,
    name,
    email,
    tokens,
    connectorId,
  }: UpdateConnectionParams): Promise<any> {
    try {
      const updatedConnection = await PlatformsModel.findByIdAndUpdate(
        id,
        { type, name, email, tokens, connectorId },
        { new: true }
      );
      return { success: true, data: updatedConnection };
    } catch (error) {
      return { success: false, error };
    }
  }

  static async saveConnection({
    type,
    name,
    email,
    tokens,
    connectorId,
  }: SaveConnectionParams): Promise<any> {
    try {
      const newConnection = new PlatformsModel({
        type,
        name,
        email,
        tokens,
        connectorId,
      });
      const savedConnection = await newConnection.save();
      return { success: true, data: savedConnection };
    } catch (error) {
      return { success: false, error };
    }
  }

  static async getOneCalendarEvent({ calendar, eventId }: any): Promise<any> {
    try {
      const findEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId,
      });

      if (findEvent.data.status === 'cancelled') return { success: false };

      return { success: true, data: findEvent };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}
