import config from 'config';

const clientId = config.get<string>('jiraClientId');
const redirectUri = `${config.get<string>('hostUrl')}/api/v1/jira/auth/callback`;

const scopes = [
  'read:jira-user',
  'read:jira-work',
  'manage:jira-project',
  'manage:jira-configuration',
  'offline_access',
].join(' ');

const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${redirectUri}&&response_type=code&prompt=consent`;

export default { authUrl, scopes, redirectUri };
