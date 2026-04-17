/**
 * Command Palette
 * Modal component for quick command access with fuzzy search
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  category?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ commands, isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands with fuzzy search
  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    const queryLower = query.toLowerCase();
    const queryChars = queryLower.split('');

    return commands
      .map((cmd) => {
        const labelLower = cmd.label.toLowerCase();
        let score = 0;
        let lastIndex = -1;

        // Calculate fuzzy match score
        for (const char of queryChars) {
          const index = labelLower.indexOf(char, lastIndex + 1);
          if (index === -1) {
            score = -1;
            break;
          }
          // Prefer consecutive matches
          score += index === lastIndex + 1 ? 2 : 1;
          lastIndex = index;
        }

        // Also check for substring match (higher priority)
        if (labelLower.includes(queryLower)) {
          score += 10;
        }

        return { command: cmd, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.command);
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};

    filteredCommands.forEach((cmd) => {
      const category = cmd.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after render
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  // Handle command click
  const handleCommandClick = useCallback(
    (command: Command) => {
      command.action();
      onClose();
    },
    [onClose]
  );

  // Update selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  // Calculate the actual index in the flat list for a given category and local index
  let flatIndex = 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <kbd className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleCommandClick(cmd)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center justify-between px-4 py-2 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-sm text-gray-900 dark:text-gray-100">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↵</kbd>
              select
            </span>
          </div>
          <span>{filteredCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage command palette state and keyboard shortcut
 */
export function useCommandPalette(openShortcut: string = 'mod+k') {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const key = openShortcut.split('+')[1] || 'k';

      if (isMod && e.key.toLowerCase() === key) {
        e.preventDefault();
        toggle();
      }

      // Also handle escape when palette is open
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openShortcut, toggle, isOpen, close]);

  return { isOpen, open, close, toggle };
}

/**
 * Default commands for the application
 */
export function createDefaultCommands({
  onNewChange,
  onCommit,
  onAbandon,
  onUndo,
  onRedo,
  onOpenSettings,
  onToggleTheme,
}: {
  onNewChange?: () => void;
  onCommit?: () => void;
  onAbandon?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenSettings?: () => void;
  onToggleTheme?: () => void;
}): Command[] {
  return [
    {
      id: 'new-change',
      label: 'Create new change',
      shortcut: 'N',
      category: 'Changes',
      action: onNewChange || (() => {}),
    },
    {
      id: 'commit',
      label: 'Commit working copy',
      shortcut: 'C',
      category: 'Changes',
      action: onCommit || (() => {}),
    },
    {
      id: 'abandon',
      label: 'Abandon current change',
      category: 'Changes',
      action: onAbandon || (() => {}),
    },
    {
      id: 'undo',
      label: 'Undo last operation',
      shortcut: 'Z',
      category: 'Operations',
      action: onUndo || (() => {}),
    },
    {
      id: 'redo',
      label: 'Redo last undone operation',
      category: 'Operations',
      action: onRedo || (() => {}),
    },
    {
      id: 'settings',
      label: 'Open settings',
      shortcut: ',',
      category: 'Application',
      action: onOpenSettings || (() => {}),
    },
    {
      id: 'toggle-theme',
      label: 'Toggle dark mode',
      category: 'Application',
      action: onToggleTheme || (() => {}),
    },
  ];
}

export default CommandPalette;
