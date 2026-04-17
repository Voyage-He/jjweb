/**
 * Keyboard shortcuts handler
 * Global keyboard event management
 */

import React, { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Component that handles global keyboard shortcuts
 */
export function KeyboardShortcuts({ shortcuts, enabled = true }: KeyboardShortcutsProps) {
  const shortcutsRef = useRef(shortcuts);

  // Keep shortcuts ref updated
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow specific shortcuts even in input fields (like Escape)
        if (e.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        // Check key (case-insensitive)
        if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) return false;

        // Check modifiers
        const wantsCtrl = shortcut.ctrl ?? false;
        const wantsMeta = shortcut.meta ?? false;
        const wantsShift = shortcut.shift ?? false;
        const wantsAlt = shortcut.alt ?? false;

        // On macOS, Meta is Cmd, on Windows/Linux, Ctrl is the primary modifier
        const isCtrlPressed = e.ctrlKey;
        const isMetaPressed = e.metaKey;

        // Allow either Ctrl or Meta for "ctrl" shortcut (cross-platform)
        const ctrlMatch = wantsCtrl ? (isCtrlPressed || isMetaPressed) : (!isCtrlPressed && !isMetaPressed || !wantsMeta);
        const metaMatch = wantsMeta ? isMetaPressed : !isMetaPressed;
        const shiftMatch = wantsShift ? e.shiftKey : !e.shiftKey;
        const altMatch = wantsAlt ? e.altKey : !e.altKey;

        return ctrlMatch && metaMatch && shiftMatch && altMatch;
      });

      if (matchingShortcut) {
        e.preventDefault();
        e.stopPropagation();
        matchingShortcut.action();
      }
    },
    [enabled]
  );

  // Register event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
}

/**
 * Default keyboard shortcuts for the application
 */
export function createDefaultShortcuts({
  onNewChange,
  onCommit,
  onAbandon,
  onUndo,
  onRedo,
  onOpenCommandPalette,
  onOpenSettings,
  onNavigateUp,
  onNavigateDown,
  onNavigateLeft,
  onNavigateRight,
  onToggleSidebar,
  onToggleDetailPanel,
  onFocusSearch,
}: {
  onNewChange?: () => void;
  onCommit?: () => void;
  onAbandon?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSettings?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onToggleSidebar?: () => void;
  onToggleDetailPanel?: () => void;
  onFocusSearch?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  // Change operations
  if (onNewChange) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      action: onNewChange,
      description: 'Create new change',
    });
  }

  if (onCommit) {
    shortcuts.push({
      key: 'c',
      ctrl: true,
      action: onCommit,
      description: 'Commit working copy',
    });
  }

  if (onAbandon) {
    shortcuts.push({
      key: 'Delete',
      action: onAbandon,
      description: 'Abandon current change',
    });
  }

  // Undo/Redo
  if (onUndo) {
    shortcuts.push({
      key: 'z',
      ctrl: true,
      action: onUndo,
      description: 'Undo last operation',
    });
  }

  if (onRedo) {
    shortcuts.push({
      key: 'y',
      ctrl: true,
      action: onRedo,
      description: 'Redo last undone operation',
    });
  }

  // Command palette
  if (onOpenCommandPalette) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      action: onOpenCommandPalette,
      description: 'Open command palette',
    });
  }

  // Settings
  if (onOpenSettings) {
    shortcuts.push({
      key: ',',
      ctrl: true,
      action: onOpenSettings,
      description: 'Open settings',
    });
  }

  // Navigation
  if (onNavigateUp) {
    shortcuts.push({
      key: 'ArrowUp',
      action: onNavigateUp,
      description: 'Navigate up in graph',
    });
    shortcuts.push({
      key: 'k',
      action: onNavigateUp,
      description: 'Navigate up in graph (vim)',
    });
  }

  if (onNavigateDown) {
    shortcuts.push({
      key: 'ArrowDown',
      action: onNavigateDown,
      description: 'Navigate down in graph',
    });
    shortcuts.push({
      key: 'j',
      action: onNavigateDown,
      description: 'Navigate down in graph (vim)',
    });
  }

  if (onNavigateLeft) {
    shortcuts.push({
      key: 'ArrowLeft',
      action: onNavigateLeft,
      description: 'Navigate to parent commit',
    });
    shortcuts.push({
      key: 'h',
      action: onNavigateLeft,
      description: 'Navigate to parent commit (vim)',
    });
  }

  if (onNavigateRight) {
    shortcuts.push({
      key: 'ArrowRight',
      action: onNavigateRight,
      description: 'Navigate to child commit',
    });
    shortcuts.push({
      key: 'l',
      action: onNavigateRight,
      description: 'Navigate to child commit (vim)',
    });
  }

  // UI toggles
  if (onToggleSidebar) {
    shortcuts.push({
      key: 'b',
      ctrl: true,
      action: onToggleSidebar,
      description: 'Toggle sidebar',
    });
  }

  if (onToggleDetailPanel) {
    shortcuts.push({
      key: 'd',
      ctrl: true,
      action: onToggleDetailPanel,
      description: 'Toggle detail panel',
    });
  }

  // Search
  if (onFocusSearch) {
    shortcuts.push({
      key: '/',
      action: onFocusSearch,
      description: 'Focus search',
    });
  }

  return shortcuts;
}

/**
 * Keyboard shortcut help overlay
 */
interface KeyboardHelpOverlayProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardHelpOverlay({ shortcuts, isOpen, onClose }: KeyboardHelpOverlayProps) {
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const grouped = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.description.includes('Navigate')
        ? 'Navigation'
        : shortcut.description.includes('Toggle')
        ? 'UI'
        : shortcut.description.includes('Open')
        ? 'Application'
        : 'Actions';

      if (!acc[category]) acc[category] = [];
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-auto">
          {Object.entries(grouped).map(([category, categoryShortcuts]) => (
            <div key={category} className="mb-4 last:mb-0">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.ctrl && (
                        <kbd className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                        </kbd>
                      )}
                      {shortcut.shift && (
                        <kbd className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Shift
                        </kbd>
                      )}
                      {shortcut.alt && (
                        <kbd className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Alt
                        </kbd>
                      )}
                      <kbd className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {formatKey(shortcut.key)}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">?</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
}

/**
 * Format key name for display
 */
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    ' ': 'Space',
    Escape: 'Esc',
    Delete: 'Del',
  };

  return keyMap[key] || key.toUpperCase();
}

export default KeyboardShortcuts;
