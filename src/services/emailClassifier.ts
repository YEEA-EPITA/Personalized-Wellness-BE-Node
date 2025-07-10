import cron from 'node-cron';
import { GoogleServices } from '.';
import { EmailProcessor } from '.';
import { google } from 'googleapis';
import config from 'config';

const EmailClassifier = cron.schedule('0 */3 * * *', async () => {   // every 3h
  try {
    console.log('[CRON] Gmail classifier started');

    const usersWithGmail = await GoogleServices.getAllGmailUsers();
    if (!usersWithGmail.success) throw usersWithGmail.err;

    console.log(`[INFO] Total Gmail users: ${usersWithGmail.data.length}`);

    for (const user of usersWithGmail.data) {
    const token = user.tokens.access_token;
    const email = user.email;
    
    console.log(`[INFO] Processing user: ${email}`);

    const GOOGLE_CLIENT_ID = config.get<string>('googleClientId');
    const GOOGLE_CLIENT_SECRET = config.get<string>('googleClientSecret')
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
        console.warn(`[WARN] Failed to get mails for ${email}:`, getMailsRes.error);
        continue;
    }

    const mails = getMailsRes.data.messages;

    if (mails.length === 0) {
        console.log(`[INFO] No new messages for ${email}`);
        continue;
      }

      console.log(`[INFO] ${mails.length} messages fetched for ${email}`);


    const result = await EmailProcessor.processAndSaveEmails(mails);

    console.log(`[SUCCESS] ${result.length} events saved for ${email}`);
    }
    } catch (err) {
        console.error('[ERROR] Gmail classification job failed:', err);
    }
});

export default EmailClassifier;
