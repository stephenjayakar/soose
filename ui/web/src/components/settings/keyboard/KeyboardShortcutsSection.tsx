import React from 'react';
import { formatShortcut as formatShortcutUtil } from '../../../utils/keyboardShortcuts';

// Re-export utilities needed by ShortcutRecorder
export function getShortcutLabel(key: string): string {
  const labels: Record<string, string> = {
    newChat: 'New Chat',
    focusWindow: 'Focus Window',
    quickLauncher: 'Quick Launcher',
    newChatWindow: 'New Chat Window',
    openDirectory: 'Open Directory',
    settings: 'Settings',
    find: 'Find',
    findNext: 'Find Next',
    findPrevious: 'Find Previous',
    alwaysOnTop: 'Always On Top',
  };
  return labels[key] || key;
}

export function formatShortcut(shortcut: string): string {
  return formatShortcutUtil(shortcut);
}

// In browser mode, keyboard shortcuts are handled via standard browser shortcuts.
export default function KeyboardShortcutsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Keyboard shortcuts are handled by your browser in web mode.
        Use standard browser shortcuts (Ctrl/Cmd+N, Ctrl/Cmd+F, etc.)
      </p>
    </div>
  );
}
