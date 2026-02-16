// Browser-compatible settings types
export interface KeyboardShortcuts {
  newChat: string;
}

export const defaultKeyboardShortcuts: KeyboardShortcuts = {
  newChat: 'CommandOrControl+N',
};

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
