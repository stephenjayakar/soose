// Browser-compatible logger (replaces electron-log)
const log = {
  info: (...args: unknown[]) => console.log('[soose]', ...args),
  warn: (...args: unknown[]) => console.warn('[soose]', ...args),
  error: (...args: unknown[]) => console.error('[soose]', ...args),
  debug: (...args: unknown[]) => console.debug('[soose]', ...args),
};

export default log;
