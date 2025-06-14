import config from 'config';

export const isEnvProd: boolean =
  config.get<string>('env') === config.get<string>('envVariables.prod');

export const isEnvDev: boolean =
  config.get<string>('env') === config.get<string>('envVariables.dev');

export const corsOrigin: string | boolean = isEnvProd
  ? config.get<string>('frontendURL')
  : true;
