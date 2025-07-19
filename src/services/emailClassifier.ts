import cron from 'node-cron';
import { GoogleServices } from '.';
import { OutlookServices } from '.';
import { EmailProcessor } from '.';
import { google } from 'googleapis';
import config from 'config';
import { PlatformsModel } from '../models';

const EmailClassifier = cron.schedule('0 */3 * * *', async () => {   // every 3h
  try {

    /** ---------------- Gmail ---------------- */
    const usersWithGmail = await GoogleServices.getAllGmailUsers();

    if (!usersWithGmail.success) throw usersWithGmail.err;

    for (const user of usersWithGmail.data) {
      try {
        const token = user.tokens.access_token;
        const email = user.email;

        const GOOGLE_CLIENT_ID = config.get<string>('googleClientId');
        const GOOGLE_CLIENT_SECRET = config.get<string>('googleClientSecret');
        const GOOGLE_REDIRECT_URL = `${config.get<string>('hostUrl')}/api/v1/google/auth/callback`;

        const oAuth2Client = new google.auth.OAuth2(
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
          GOOGLE_REDIRECT_URL
        );

        oAuth2Client.setCredentials({
          access_token: token,
          refresh_token: user.tokens.refresh_token,
        });

        const getMailsRes = await GoogleServices.getGmailMessages({ auth: oAuth2Client });

        if (!getMailsRes.success) {
            const error = getMailsRes.error;
            if (error.response?.data?.error === 'invalid_grant') {
                continue;
            }
            continue;
        }

        const mails = getMailsRes.data.messages;

        if (!mails || mails.length === 0) {
          continue;
        }

        const savedEvents = await EmailProcessor.processAndSaveEmails(mails);
      } catch (err) {
        continue;
      }
    }

    /** ---------------- Outlook ---------------- */
    const usersWithOutlook = await OutlookServices.getAllOutlookUsers();
    if (!usersWithOutlook.success) throw usersWithOutlook.err;

    for (const user of usersWithOutlook.data) {
      try {
        const token = user.tokens.access_token;
        const email = user.email;


        let mails: any[];
        try {
            mails = await OutlookServices.fetchAndParseMails(token, email, 20);
        } catch (fetchError) {
            const error = fetchError as Error;
            continue;
        }

        if (!mails || mails.length === 0) {
          continue;
        }

        const savedEvents = await EmailProcessor.processAndSaveEmails(mails);
      } catch (err) {
        continue;
      }
    }
    } catch (err) {
    }
});

export default EmailClassifier;
