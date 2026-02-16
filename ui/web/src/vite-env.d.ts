/// <reference types="vite/client" />

// Browser-compatible global type declarations
interface AppConfigAPI {
  get: (key: string) => unknown;
  getAll: () => Record<string, unknown>;
}

interface ElectronAPI {
  platform: string;
  logInfo: (...args: unknown[]) => void;
  getGoosedHostPort: () => Promise<string | null>;
  getSecretKey: () => Promise<string>;
  createChatWindow: (msg?: string, dir?: string) => void;
  closeWindow: () => void;
  hideWindow: () => void;
  reloadApp: () => void;
  reactReady: () => void;
  getSettings: () => Promise<Record<string, unknown>>;
  saveSettings: (settings: unknown) => Promise<void>;
  getConfig: () => Record<string, unknown>;
  directoryChooser: () => Promise<{ dirPath?: string }>;
  listFiles: (dirPath: string, extension?: string) => Promise<string[]>;
  readFile: (filePath: string) => Promise<{ content: string } | null>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  selectFileOrDirectory: (defaultPath?: string) => Promise<string | null>;
  ensureDirectory: (dirPath: string) => Promise<void>;
  getPathForFile: (file: File) => string;
  openDirectoryInExplorer: (dir: string) => Promise<void>;
  addRecentDir: (dir: string) => Promise<void>;
  getAllowedExtensions: () => Promise<string[]>;
  setMenuBarIcon: (show: boolean) => Promise<void>;
  getMenuBarIconState: () => Promise<boolean>;
  setDockIcon: (show: boolean) => Promise<void>;
  getDockIconState: () => Promise<boolean>;
  setWakelock: (enable: boolean) => Promise<void>;
  getWakelockState: () => Promise<boolean>;
  setSpellcheck: (enable: boolean) => Promise<void>;
  getSpellcheckState: () => Promise<boolean>;
  openNotificationsSettings: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  showMessageBox: (options: { type?: string; title?: string; message: string; detail?: string; buttons?: string[] }) => Promise<{ response: number }>;
  showSaveDialog: (options: unknown) => Promise<{ canceled: boolean; filePath?: string }>;
  showNotification: (title: string, body: string) => void;
  getVersion: () => string;
  checkForUpdates: () => Promise<{ updateInfo: unknown; error: string | null }>;
  downloadUpdate: () => Promise<{ success: boolean; error: string | null }>;
  installUpdate: () => void;
  restartApp: () => void;
  onUpdaterEvent: (cb: unknown) => void;
  getUpdateState: () => Promise<{ updateAvailable: boolean; latestVersion?: string } | null>;
  isUsingGitHubFallback: () => Promise<boolean>;
  hasAcceptedRecipeBefore: (recipe: unknown) => Promise<boolean>;
  recordRecipeHash: (recipe: unknown) => Promise<void>;
  launchApp: (app: unknown) => Promise<void>;
  refreshApp: (app: unknown) => Promise<void>;
  closeApp: (appName: string) => Promise<void>;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
  emit: (channel: string, ...args: unknown[]) => void;
  broadcastThemeChange: (themeData: { mode: string; useSystemTheme: boolean; theme: string }) => void;
  onMouseBackButtonClicked: (cb: () => void) => unknown;
  offMouseBackButtonClicked: (cb: unknown) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    appConfig: AppConfigAPI;
  }
}
