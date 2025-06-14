import config from 'config';
import axios from 'axios';

const clientId = config.get<string>('outlookClientId');
const clientSecret = config.get<string>('outlookClientSecret');
const tenantId = config.get<string>('outlookTenantId');
const redirectUri = `${config.get<string>('hostUrl')}/api/v1/outlook/auth/callback`;

const dashboardRedirectUrl = `${config.get<string>('frontendURL')}/dashboard/accounts`;

const scopes = [
  'openid',
  'profile',
  'User.Read',
  'Mail.Read',
  'offline_access',
].join(' ');

const params = new URLSearchParams({
  client_id: clientId,
  response_type: 'code',
  redirect_uri: redirectUri,
  response_mode: 'query',
  scope: scopes,
});

const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

const exchangeCodeForToken = async ({ code }: { code: string }) => {
  try {
    const response = await axios.post<any>(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
      })
    );
    return { success: true, data: response.data };
  } catch (err) {
    return { success: false, err };
  }
};

const refreshAccessToken = async ({
  refreshToken,
}: {
  refreshToken: string;
}) => {
  try {
    const response = await axios.post<any>(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        refresh_token: refreshToken,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      })
    );
    return { success: true, data: response.data };
  } catch (err) {
    return { success: false, err };
  }
};

export default {
  authUrl,
  exchangeCodeForToken,
  dashboardRedirectUrl,
  refreshAccessToken,
};
