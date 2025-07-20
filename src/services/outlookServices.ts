import { PlatformsModel } from '../models';
import { platformsConstants } from '../constants';
import * as cheerio from 'cheerio';
import { EmailProcessor} from '../services';
import { outlookUtils } from '../utils';


export default class OutlookServices {
  static async saveOutlookToken({ data }: any) {
    try {
      const platform = new PlatformsModel(data);

      await platform.save();
      return { success: true };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async getOutlookToken({ connectorId }: any) {
    try {
      const platform = await PlatformsModel.findOne({
        connectorId,
        type: platformsConstants.PLATFORMS.outlook.value,
      });
      return { success: true, data: platform };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async updateOutlookToken({ connectorId, data }: any) {
    try {
      const platform = await PlatformsModel.findOneAndUpdate(
        { connectorId },
        data,
        { new: true }
      );
      return { success: true, data: platform };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async fetchAndParseMails(token: string, userEmail: string, limit: number = 30) {
    const getMailsRes = await outlookUtils.OutlookAPIs.getMails({
      accessToken: token,
      limit,
    });

    if (!getMailsRes.success) throw getMailsRes.err;

    const mails = (getMailsRes.data as { value: any[] }).value;

    return mails.map((mail: any) => {
      const { subject, from, body, receivedDateTime, id } = mail;
      const $ = cheerio.load(body?.content || '');
      const plainText = $.text().replace(/\s+/g, ' ').trim();

      return {
        id,
        from: from?.emailAddress?.address ?? '',
        userEmail,
        receivedDateTime,
        subject,
        message: plainText,
      };
    });
  }

  static async classifyAndSaveMails(token: string, userEmail: string, limit: number = 30) {
    const mails = await this.fetchAndParseMails(token, userEmail, limit);

    const formattedMessages = mails.map(mail => ({
      ...mail,
      from: mail.from || '', 
    }));

    const savedEvents = await EmailProcessor.processAndSaveEmails(formattedMessages);
    return savedEvents;
  }

  static async getAllOutlookUsers(): Promise<any> {
    try {
      const users = await PlatformsModel.find({ type: 'OUTLOOK' });
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error };
    }
  }
    
}
