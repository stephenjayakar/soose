// Global type declarations for Soose browser environment

interface AppConfigAPI {
  get: (key: string) => unknown;
  getAll: () => Record<string, unknown>;
}

interface ElectronAPI {
  platform: string;
  logInfo: (...args: unknown[]) => void;
  getGoosedHostPort: () => Promise<string | null>;
  getSecretKey: () => Promise<string>;
  createChatWindow: (...args: unknown[]) => void;
  closeWindow: () => void;
  hideWindow: () => void;
  reloadApp: () => void;
  reactReady: () => void;
  getSettings: () => Promise<Record<string, unknown>>;
  saveSettings: (settings: unknown) => Promise<void>;
  getConfig: () => Record<string, unknown>;
  directoryChooser: () => Promise<{ dirPath?: string }>;
  listFiles: (dirPath: string, extension?: string) => Promise<string[]>;
  readFile: (filePath: string) => Promise<{ content: string; file?: string; error?: string; found?: boolean } | null>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  selectFileOrDirectory: (defaultPath?: string) => Promise<string | null>;
  ensureDirectory: (dirPath: string) => Promise<void>;
  getPathForFile: (file: File) => string;
  openDirectoryInExplorer: (dir: string) => Promise<void>;
  addRecentDir: (dir: string) => Promise<void>;
  getAllowedExtensions: () => Promise<string[]>;
  // These return a truthy value on success for testing in if()
  setMenuBarIcon: (show: boolean) => Promise<boolean>;
  getMenuBarIconState: () => Promise<boolean>;
  setDockIcon: (show: boolean) => Promise<boolean>;
  getDockIconState: () => Promise<boolean>;
  setWakelock: (enable: boolean) => Promise<boolean>;
  getWakelockState: () => Promise<boolean>;
  setSpellcheck: (enable: boolean) => Promise<boolean>;
  getSpellcheckState: () => Promise<boolean>;
  openNotificationsSettings: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  showMessageBox: (options: { type?: string; title?: string; message: string; detail?: string; buttons?: string[]; defaultId?: number; cancelId?: number }) => Promise<{ response: number }>;
  showSaveDialog: (options: unknown) => Promise<{ canceled: boolean; filePath?: string }>;
  showNotification: (...args: unknown[]) => void;
  getVersion: () => string;
  checkForUpdates: () => Promise<{ updateInfo: unknown; error: string | null }>;
  downloadUpdate: () => Promise<{ success: boolean; error: string | null }>;
  installUpdate: () => void;
  restartApp: () => void;
  onUpdaterEvent: (cb: (event: any) => void) => void;
  getUpdateState: () => Promise<{ updateAvailable: boolean; latestVersion?: string } | null>;
  isUsingGitHubFallback: () => Promise<boolean>;
  hasAcceptedRecipeBefore: (recipe: unknown) => Promise<boolean>;
  recordRecipeHash: (recipe: unknown) => Promise<void>;
  launchApp: (app: unknown) => Promise<void>;
  refreshApp: (app: unknown) => Promise<void>;
  closeApp: (appName: string) => Promise<void>;
  on: (channel: string, callback: Function) => void;
  off: (channel: string, callback: Function) => void;
  emit: (channel: string, ...args: unknown[]) => void;
  broadcastThemeChange: (themeData: { mode: string; useSystemTheme: boolean; theme: string }) => void;
  onMouseBackButtonClicked: (cb: () => void) => unknown;
  offMouseBackButtonClicked: (cb: unknown) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    appConfig: AppConfigAPI;
    isCreatingRecipe?: boolean;
  }
}

export {};
