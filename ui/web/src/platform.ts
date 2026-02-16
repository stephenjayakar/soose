/**
 * Platform shim for Soose - replaces Electron IPC with browser-native implementations.
 * 
 * This module provides window.electron and window.appConfig APIs that the Goose
 * renderer code expects, but implemented using fetch/localStorage/browser APIs
 * instead of Electron IPC.
 */

// --- Connection config (persisted in localStorage) ---

export interface SooseConfig {
  serverUrl: string;
  secretKey: string;
  workingDir: string; // This is a SERVER-SIDE path
}

const CONFIG_KEY = 'soose_config';

export function getSooseConfig(): SooseConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    serverUrl: localStorage.getItem('soose_server_url') || 'http://127.0.0.1:3000',
    secretKey: localStorage.getItem('soose_secret_key') || '',
    workingDir: localStorage.getItem('soose_working_dir') || '~',
  };
}

export function saveSooseConfig(config: Partial<SooseConfig>): void {
  const current = getSooseConfig();
  const merged = { ...current, ...config };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
}

// --- Settings (replaces Electron userData/settings.json) ---

const SETTINGS_KEY = 'soose_settings';

function getSettings(): Record<string, unknown> {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    showMenuBarIcon: true,
    showDockIcon: true,
    enableWakelock: false,
    spellcheckEnabled: true,
  };
}

function saveSettings(settings: Record<string, unknown>): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Recent dirs (server-side paths) ---

const RECENT_DIRS_KEY = 'soose_recent_dirs';

function getRecentDirs(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_DIRS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function addRecentDir(dir: string): void {
  const dirs = getRecentDirs().filter((d) => d !== dir);
  dirs.unshift(dir);
  localStorage.setItem(RECENT_DIRS_KEY, JSON.stringify(dirs.slice(0, 20)));
}

// --- Recipe hash tracking ---

const RECIPE_HASHES_KEY = 'soose_recipe_hashes';

function getRecipeHashes(): string[] {
  try {
    const stored = localStorage.getItem(RECIPE_HASHES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

async function simpleHash(obj: unknown): Promise<string> {
  const text = JSON.stringify(obj);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// --- Event bus (replaces ipcRenderer.on/off/emit) ---

type EventCallback = (...args: unknown[]) => void;
const eventListeners = new Map<string, Set<EventCallback>>();

function emitEvent(channel: string, ...args: unknown[]): void {
  const listeners = eventListeners.get(channel);
  if (listeners) {
    listeners.forEach((cb) => cb({}, ...args));
  }
}

// --- The electron API shim ---

const electronShim = {
  platform: 'browser' as string,

  // Logging
  logInfo: (...args: unknown[]) => console.log('[soose]', ...args),

  // Connection
  getGoosedHostPort: async (): Promise<string | null> => {
    return getSooseConfig().serverUrl;
  },
  getSecretKey: async (): Promise<string> => {
    return getSooseConfig().secretKey;
  },

  // Window management (no-ops or browser equivalents)
  createChatWindow: (_msg?: string, _dir?: string) => {
    // Open a new tab/window to the same app
    window.open(window.location.origin, '_blank');
  },
  closeWindow: () => {
    window.close();
  },
  hideWindow: () => {
    // no-op in browser
  },
  reloadApp: () => {
    window.location.reload();
  },
  reactReady: () => {
    // no-op — no Electron main process waiting
  },

  // Settings
  getSettings: async () => getSettings(),
  saveSettings: async (settings: unknown) => {
    saveSettings(settings as Record<string, unknown>);
  },

  // Config (Electron-specific, mostly returns config values)
  getConfig: () => ({
    apiHost: getSooseConfig().serverUrl,
  }),

  // File operations via goosed API (server-side)
  directoryChooser: async (): Promise<{ dirPath?: string }> => {
    const dir = prompt('Enter server-side directory path:', getSooseConfig().workingDir);
    if (dir) return { dirPath: dir };
    return {};
  },
  listFiles: async (dirPath: string, _extension?: string): Promise<string[]> => {
    // Use the goosed developer shell to list files on the server
    // This uses the existing goosed API - no server changes needed
    try {
      const config = getSooseConfig();
      const res = await fetch(`${config.serverUrl}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': config.secretKey,
        },
        body: JSON.stringify({
          // We can't easily list files without a session, so return empty
          // The remote dir browser component handles this properly
        }),
      });
      if (!res.ok) return [];
      return [];
    } catch {
      return [];
    }
  },
  readFile: async (_filePath: string): Promise<{ content: string } | null> => {
    console.warn('[soose] readFile not supported in browser mode');
    return null;
  },
  writeFile: async (_filePath: string, _content: string): Promise<void> => {
    console.warn('[soose] writeFile not supported in browser mode');
  },
  selectFileOrDirectory: async (defaultPath?: string): Promise<string | null> => {
    const result = prompt('Enter server-side file or directory path:', defaultPath || '');
    return result;
  },
  ensureDirectory: async (_dirPath: string): Promise<void> => {
    // no-op in browser
  },
  getPathForFile: (_file: File): string => {
    // In browser, we can't get native file paths
    return '';
  },
  openDirectoryInExplorer: async (_dir: string): Promise<void> => {
    console.warn('[soose] Cannot open directory explorer from browser');
  },
  addRecentDir: async (dir: string) => addRecentDir(dir),

  // Permissions / extensions
  getAllowedExtensions: async () => [],

  // Desktop-only settings (no-ops in browser)
  setMenuBarIcon: async (_show: boolean) => {},
  getMenuBarIconState: async () => true,
  setDockIcon: async (_show: boolean) => {},
  getDockIconState: async () => true,
  setWakelock: async (_enable: boolean) => {},
  getWakelockState: async () => false,
  setSpellcheck: async (_enable: boolean) => {},
  getSpellcheckState: async () => true,
  openNotificationsSettings: async () => {},

  // External links
  openExternal: async (url: string): Promise<void> => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  // Dialogs
  showMessageBox: async (options: {
    type?: string;
    title?: string;
    message: string;
    detail?: string;
    buttons?: string[];
  }): Promise<{ response: number }> => {
    const result = window.confirm(`${options.message}\n\n${options.detail || ''}`);
    return { response: result ? 0 : 1 };
  },
  showSaveDialog: async (_options: unknown): Promise<{ canceled: boolean; filePath?: string }> => {
    console.warn('[soose] showSaveDialog not available in browser');
    return { canceled: true };
  },
  showNotification: (_title: string, _body: string) => {
    // Use browser notifications if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(_title, { body: _body });
    }
  },

  // Updates (no-op in browser)
  getVersion: (): string => 'soose-web',
  checkForUpdates: async () => ({ updateInfo: null, error: null }),
  downloadUpdate: async () => ({ success: false, error: 'Not available in browser' }),
  installUpdate: () => {},
  restartApp: () => window.location.reload(),
  onUpdaterEvent: (_cb: unknown) => {},
  getUpdateState: async () => null,
  isUsingGitHubFallback: async () => false,

  // Recipe hashes
  hasAcceptedRecipeBefore: async (recipe: unknown): Promise<boolean> => {
    const hash = await simpleHash(recipe);
    return getRecipeHashes().includes(hash);
  },
  recordRecipeHash: async (recipe: unknown): Promise<void> => {
    const hash = await simpleHash(recipe);
    const hashes = getRecipeHashes();
    if (!hashes.includes(hash)) {
      hashes.push(hash);
      localStorage.setItem(RECIPE_HASHES_KEY, JSON.stringify(hashes));
    }
  },

  // MCP Apps (no-op — these launch Electron BrowserWindows)
  launchApp: async (_app: unknown) => {
    console.warn('[soose] MCP App launching not yet supported in browser mode');
  },
  refreshApp: async (_app: unknown) => {},
  closeApp: async (_appName: string) => {},

  // Event system (replaces ipcRenderer.on/off)
  on: (channel: string, callback: EventCallback) => {
    if (!eventListeners.has(channel)) {
      eventListeners.set(channel, new Set());
    }
    eventListeners.get(channel)!.add(callback);
  },
  off: (channel: string, callback: EventCallback) => {
    eventListeners.get(channel)?.delete(callback);
  },
  emit: (channel: string, ...args: unknown[]) => {
    emitEvent(channel, ...args);
  },

  // Theme
  broadcastThemeChange: (_themeData: { mode: string; useSystemTheme: boolean; theme: string }) => {
    // In browser, theme is managed by ThemeContext + localStorage directly
  },

  // Mouse events (no-op)
  onMouseBackButtonClicked: (_cb: () => void) => _cb,
  offMouseBackButtonClicked: (_cb: unknown) => {},
};

// --- The appConfig shim ---

function buildAppConfig(): Record<string, unknown> {
  const config = getSooseConfig();
  return {
    GOOSE_API_HOST: config.serverUrl,
    GOOSE_WORKING_DIR: config.workingDir,
    GOOSE_DEFAULT_PROVIDER: undefined,
    GOOSE_DEFAULT_MODEL: undefined,
    GOOSE_PREDEFINED_MODELS: undefined,
    GOOSE_BASE_URL_SHARE: undefined,
    GOOSE_VERSION: 'soose-web',
    GOOSE_ALLOWLIST_WARNING: false,
    recipeDeeplink: undefined,
    recipeParameters: undefined,
    recipeId: undefined,
    scheduledJobId: undefined,
    REQUEST_DIR: undefined,
    SECURITY_ML_MODEL_MAPPING: undefined,
  };
}

const appConfigShim = {
  get: (key: string): unknown => buildAppConfig()[key],
  getAll: (): Record<string, unknown> => buildAppConfig(),
};

// --- Install shims on window ---

export function installPlatformShims(): void {
  (window as any).electron = electronShim;
  (window as any).appConfig = appConfigShim;
}

// Export for direct use
export { electronShim, appConfigShim, emitEvent };
