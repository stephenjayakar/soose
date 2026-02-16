import { defaultKeyboardShortcuts, type KeyboardShortcuts } from './keyboardShortcuts';

export type { KeyboardShortcuts };
export { defaultKeyboardShortcuts };

export interface ExternalGoosedConfig {
  enabled: boolean;
  url: string;
  secret: string;
}

export interface Settings {
  showMenuBarIcon?: boolean;
  showDockIcon?: boolean;
  enableWakelock?: boolean;
  spellcheckEnabled?: boolean;
  keyboardShortcuts?: KeyboardShortcuts;
  externalGoosed?: ExternalGoosedConfig;
}
