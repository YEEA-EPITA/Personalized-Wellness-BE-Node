import axios from 'axios';
import config from 'config';

const headers = ({ accessToken }: { accessToken: string }) => {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
};

interface JiraTokenResultSuccess {
  success: true;
  data: Record<string, any>;
}

interface JiraTokenResultFailure {
  success: false;
  err: unknown;
}

type CommonResult = JiraTokenResultSuccess | JiraTokenResultFailure;

const JiraAPIs = class JiraAPIs {
  static async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await axios.post<JiraTokenResultSuccess>(
        'https://auth.atlassian.com/oauth/token',
        {
          grant_type: 'authorization_code',
          client_id: config.get<string>('jiraClientId'),
          client_secret: config.get<string>('jiraClientSecret'),
          code,
          redirect_uri: `${config.get<string>('hostUrl')}/api/v1/jira/auth/callback`,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async exchangeRefreshToken({
    refreshToken,
  }: {
    refreshToken: string;
  }) {
    try {
      const response = await axios.post<JiraTokenResultSuccess>(
        'https://auth.atlassian.com/oauth/token',
        {
          grant_type: 'refresh_token',
          client_id: config.get<string>('jiraClientId'),
          client_secret: config.get<string>('jiraClientSecret'),
          refresh_token: refreshToken,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async getResource({ accessToken }: { accessToken: string }) {
    try {
      const response = await axios.get(
        'https://api.atlassian.com/oauth/token/accessible-resources',
        {
          headers: headers({ accessToken }),
        }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, err };
    }
  }

  // getMySelf
  static async getMySelf({
    accessToken,
    cloudId,
  }: {
    accessToken: string;
    cloudId: string;
  }) {
    try {
      const response = await axios.get<any>(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`,
        { headers: headers({ accessToken }) }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, err };
    }
  }
};

export default JiraAPIs;
