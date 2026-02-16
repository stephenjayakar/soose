import { getSooseConfig } from '../platform';

export const getInitialWorkingDir = (): string => {
  // In Soose, working dir is always a SERVER-SIDE path from config
  // Never a client-side path
  const configDir = window.appConfig?.get('GOOSE_WORKING_DIR') as string;
  if (configDir) return configDir;
  return getSooseConfig().workingDir || '~';
};
