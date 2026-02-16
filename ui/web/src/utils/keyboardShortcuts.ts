// Browser-compatible keyboard shortcuts

export interface KeyboardShortcuts {
  newChat: string;
  focusWindow: string;
  quickLauncher: string;
  newChatWindow: string;
  openDirectory: string;
  settings: string;
  find: string;
  findNext: string;
  findPrevious: string;
  alwaysOnTop: string;
  [key: string]: string;
}

export const defaultKeyboardShortcuts: KeyboardShortcuts = {
  newChat: 'CommandOrControl+N',
  focusWindow: 'CommandOrControl+Shift+G',
  quickLauncher: 'CommandOrControl+Shift+Space',
  newChatWindow: 'CommandOrControl+Shift+N',
  openDirectory: 'CommandOrControl+O',
  settings: 'CommandOrControl+,',
  find: 'CommandOrControl+F',
  findNext: 'CommandOrControl+G',
  findPrevious: 'CommandOrControl+Shift+G',
  alwaysOnTop: 'CommandOrControl+Shift+T',
};

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
}

export function getSearchShortcutText(): string {
  return isMac() ? '⌘F' : 'Ctrl+F';
}

export function getNavigationShortcutText(): string {
  return isMac() ? '⌘N' : 'Ctrl+N';
}

export function parseShortcut(shortcut: string): { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean } {
  const parts = shortcut.split('+');
  const key = parts[parts.length - 1].toLowerCase();
  const mods = parts.slice(0, -1).map((m) => m.toLowerCase());
  const mac = isMac();
  return {
    key,
    ctrlKey: mods.includes('ctrl') || (!mac && mods.includes('commandorcontrol')),
    metaKey: mods.includes('meta') || mods.includes('cmd') || (mac && mods.includes('commandorcontrol')),
    shiftKey: mods.includes('shift'),
    altKey: mods.includes('alt'),
  };
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);
  return (
    event.key.toLowerCase() === parsed.key &&
    event.ctrlKey === parsed.ctrlKey &&
    event.metaKey === parsed.metaKey &&
    event.shiftKey === parsed.shiftKey &&
    event.altKey === parsed.altKey
  );
}

export function formatShortcut(shortcut: string): string {
  if (!shortcut) return '';
  const mac = isMac();
  return shortcut
    .replace('CommandOrControl', mac ? '⌘' : 'Ctrl')
    .replace('Shift', mac ? '⇧' : 'Shift')
    .replace('Alt', mac ? '⌥' : 'Alt');
}
