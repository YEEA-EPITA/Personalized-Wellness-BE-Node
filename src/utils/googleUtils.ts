import config from 'config';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = config.get<string>('googleClientId');
const CLIENT_SECRET = config.get<string>('googleClientSecret');
const REDIRECT_URL = `${config.get<string>('hostUrl')}/api/v1/google/auth/callback`;

const auth = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

const scopes = [
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export default {
  auth,
  scopes,
};
