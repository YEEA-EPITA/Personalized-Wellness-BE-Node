import dotenv from 'dotenv';
dotenv.config();

import config from 'config';
import app from './app';
import './models';

const env = config.get<string>('env');
const envVariables = config.get<{ prod: string; dev: string; test: string }>(
  'envVariables'
);
const port = config.get<number>('port') || 3001;

if (env !== envVariables.test) {
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

if (env === envVariables.dev) {
  console.log('Running in development mode');
}
