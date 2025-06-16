import { PlatformsModel } from '../models';
import { google } from 'googleapis';
import { gmail_v1, gmail } from '@googleapis/gmail';
import { OAuth2Client } from 'google-auth-library';
import { googleUtils } from '../utils';
import base64url from 'base64url';
import config from 'config';

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

  static async getGmailMessages(accessToken: string) {
    const oAuth2Client: OAuth2Client = googleUtils.auth;
    oAuth2Client.setCredentials({ access_token: accessToken });

    // const gmailClient = gmail({ auth: oAuth2Client });
    // const gmailClient: gmail_v1.Gmail = gmail({ auth: oAuth2Client });
    const gmailClient: gmail_v1.Gmail = gmail({ version: 'v1', auth: oAuth2Client });

    const res = await gmailClient.users.messages.list({
      userId: 'me',
      maxResults: 5,
    });

    const messageIds = res.data.messages || [];

    const messages = await Promise.all(
      messageIds.map(async (msg) => {
        if (!msg.id) return null;

        const detail = await gmailClient.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const headers = detail.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find(h => h.name === 'From')?.value || '(Unknown Sender)';

        let bodyData = '';
        const payload = detail.data.payload;

        if (payload?.parts?.length) {
          const part = payload.parts.find(p => p.mimeType === 'text/plain' || p.mimeType === 'text/html');
          if (part?.body?.data) {
            bodyData = base64url.decode(part.body.data);
          }
        } else if (payload?.body?.data) {
          bodyData = base64url.decode(payload.body.data);
        }

        return {
          id: msg.id,
          subject,
          from,
          body: bodyData,
        };
      })
    );

    return messages.filter(Boolean);
  }
}
