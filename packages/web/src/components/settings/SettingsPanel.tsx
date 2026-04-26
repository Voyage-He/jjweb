/**
 * Settings Panel
 * Configuration and preferences management
 */

import React, { useState, useCallback } from 'react';
import type { SettingsResponse, Alias } from '@jujutsu-gui/shared';

interface SettingsPanelProps {
  settings: SettingsResponse | null;
  aliases: Alias[];
  loading?: boolean;
  onUpdateSettings: (settings: Record<string, string>) => void;
  onCreateAlias: (name: string, command: string) => void;
  onDeleteAlias: (name: string) => void;
  onExportSettings: () => void;
  onImportSettings: (data: string) => void;
  appVersion: string;
  jjVersion: string;
}

type SettingsTab = 'general' | 'editor' | 'aliases' | 'shortcuts' | 'about';

export function SettingsPanel({
  settings,
  aliases,
  loading,
  onUpdateSettings,
  onCreateAlias,
  onDeleteAlias,
  onExportSettings,
  onImportSettings,
  appVersion,
  jjVersion,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [editingAlias, setEditingAlias] = useState<{ name: string; command: string } | null>(null);

  const handleImportClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        onImportSettings(text);
      }
    };
    input.click();
  }, [onImportSettings]);

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['general', 'editor', 'aliases', 'shortcuts', 'about'] as SettingsTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {formatTabName(tab)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'general' && (
          <GeneralSettings
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onExportSettings={onExportSettings}
            onImportSettings={handleImportClick}
          />
        )}
        {activeTab === 'editor' && <EditorSettings settings={settings} onUpdateSettings={onUpdateSettings} />}
        {activeTab === 'aliases' && (
          <AliasesSettings
            aliases={aliases}
            editingAlias={editingAlias}
            setEditingAlias={setEditingAlias}
            onCreateAlias={onCreateAlias}
            onDeleteAlias={onDeleteAlias}
          />
        )}
        {activeTab === 'shortcuts' && <ShortcutsSettings />}
        {activeTab === 'about' && <AboutSettings appVersion={appVersion} jjVersion={jjVersion} />}
      </div>
    </div>
  );
}

/**
 * General settings tab
 */
function GeneralSettings({
  settings,
  onUpdateSettings,
  onExportSettings,
  onImportSettings,
}: {
  settings: SettingsResponse | null;
  onUpdateSettings: (settings: Record<string, string>) => void;
  onExportSettings: () => void;
  onImportSettings: () => void;
}) {
  const [localSettings, setLocalSettings] = useState<Record<string, string>>(
    settings?.settings || {}
  );

  const handleSettingChange = (key: string, value: string) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  return (
    <div className="space-y-6">
      {/* User name and email */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">User Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">User Name</label>
            <input
              type="text"
              value={localSettings['user.name'] || ''}
              onChange={(e) => handleSettingChange('user.name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">User Email</label>
            <input
              type="email"
              value={localSettings['user.email'] || ''}
              onChange={(e) => handleSettingChange('user.email', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="your@email.com"
            />
          </div>
        </div>
      </div>

      {/* Repository defaults */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Repository Defaults</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Default Branch</label>
            <input
              type="text"
              value={localSettings['revset-aliases.trunk()'] || ''}
              onChange={(e) => handleSettingChange('revset-aliases.trunk()', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="main"
            />
          </div>
        </div>
      </div>

      {/* Export/Import */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Settings Management</h3>
        <div className="flex gap-2">
          <button
            onClick={onExportSettings}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Export Settings
          </button>
          <button
            onClick={onImportSettings}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Import Settings
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Editor settings tab
 */
function EditorSettings({
  settings,
  onUpdateSettings,
}: {
  settings: SettingsResponse | null;
  onUpdateSettings: (settings: Record<string, string>) => void;
}) {
  const [localSettings, setLocalSettings] = useState<Record<string, string>>(
    settings?.settings || {}
  );

  const handleSettingChange = (key: string, value: string) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  return (
    <div className="space-y-6">
      {/* External editor */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">External Editor</h3>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Editor Command</label>
          <input
            type="text"
            value={localSettings['ui.editor'] || ''}
            onChange={(e) => handleSettingChange('ui.editor', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            placeholder="code --wait"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Command to open files in external editor (e.g., "code --wait", "vim", "nano")
          </p>
        </div>
      </div>

      {/* Diff viewer settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Diff Viewer</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show line numbers</span>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Word wrap</span>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Ignore whitespace by default</span>
            <input
              type="checkbox"
              className="rounded border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Aliases settings tab
 */
function AliasesSettings({
  aliases,
  editingAlias,
  setEditingAlias,
  onCreateAlias,
  onDeleteAlias,
}: {
  aliases: Alias[];
  editingAlias: { name: string; command: string } | null;
  setEditingAlias: (alias: { name: string; command: string } | null) => void;
  onCreateAlias: (name: string, command: string) => void;
  onDeleteAlias: (name: string) => void;
}) {
  const handleSaveAlias = () => {
    if (editingAlias && editingAlias.name && editingAlias.command) {
      onCreateAlias(editingAlias.name, editingAlias.command);
      setEditingAlias(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Command Aliases</h3>
        <button
          onClick={() => setEditingAlias({ name: '', command: '' })}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Alias
        </button>
      </div>

      {/* New/Edit alias form */}
      {editingAlias && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Alias Name</label>
            <input
              type="text"
              value={editingAlias.name}
              onChange={(e) => setEditingAlias({ ...editingAlias, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              placeholder="e.g., st"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Command</label>
            <input
              type="text"
              value={editingAlias.command}
              onChange={(e) => setEditingAlias({ ...editingAlias, command: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              placeholder="e.g., status"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingAlias(null)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAlias}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Aliases list */}
      <div className="space-y-2">
        {aliases.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No aliases configured</p>
        ) : (
          aliases.map((alias) => (
            <div
              key={alias.name}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
              <div>
                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{alias.name}</span>
                <span className="mx-2 text-gray-400">→</span>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{alias.command}</span>
              </div>
              <button
                onClick={() => onDeleteAlias(alias.name)}
                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Shortcuts settings tab
 */
function ShortcutsSettings() {
  const shortcuts = [
    { keys: ['Ctrl', 'N'], action: 'Create new change' },
    { keys: ['Ctrl', 'C'], action: 'Commit working copy' },
    { keys: ['Ctrl', 'Z'], action: 'Undo last operation' },
    { keys: ['Ctrl', 'Y'], action: 'Redo last operation' },
    { keys: ['Ctrl', 'K'], action: 'Open command palette' },
    { keys: ['Ctrl', ','], action: 'Open settings' },
    { keys: ['Ctrl', 'B'], action: 'Toggle sidebar' },
    { keys: ['↑', 'k'], action: 'Navigate up in graph' },
    { keys: ['↓', 'j'], action: 'Navigate down in graph' },
    { keys: ['←', 'h'], action: 'Navigate to parent' },
    { keys: ['→', 'l'], action: 'Navigate to child' },
    { keys: ['/'], action: 'Focus search' },
    { keys: ['?'], action: 'Show keyboard shortcuts' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h3>

      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.action}</span>
            <div className="flex gap-1">
              {shortcut.keys.map((key, i) => (
                <React.Fragment key={i}>
                  <kbd className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {key}
                  </kbd>
                  {i < shortcut.keys.length - 1 && (
                    <span className="text-gray-400 text-xs self-center">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        On macOS, use ⌘ (Command) instead of Ctrl
      </p>
    </div>
  );
}

/**
 * About settings tab
 */
function AboutSettings({ appVersion, jjVersion }: { appVersion: string; jjVersion: string }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">JJ</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Jujutsu GUI</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">A web-based GUI for Jujutsu (jj)</p>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Application Version</div>
          <div className="font-mono text-sm">{appVersion || '0.1.0'}</div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">jj Version</div>
          <div className="font-mono text-sm">{jjVersion || 'Not detected'}</div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        <p>Built with React, TypeScript, and Monaco Editor</p>
        <p className="mt-1">
          <a
            href="https://github.com/martinvonz/jj"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Learn more about jj
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Format tab name for display
 */
function formatTabName(tab: SettingsTab): string {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

export default SettingsPanel;
