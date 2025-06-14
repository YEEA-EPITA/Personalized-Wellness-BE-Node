import axios from 'axios';

const headers = ({ accessToken }: { accessToken: string }) => {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
};

const OutlookAPIs = class OutlookAPIs {
  static async getMySelf({ accessToken }: { accessToken: string }) {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: headers({ accessToken }),
      });
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async getMails({
    accessToken,
    limit = 5,
  }: {
    accessToken: string;
    limit: number;
  }) {
    try {
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/me/mailfolders/inbox/messages?$select=subject,from,body,receivedDateTime&$top=${limit}&$orderby=receivedDateTime%20DESC`,
        {
          headers: headers({ accessToken }),
        }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, err };
    }
  }
};

export default OutlookAPIs;
