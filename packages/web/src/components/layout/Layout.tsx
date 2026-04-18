/**
 * Main layout component
 */

import React from 'react';
import { useUIStore, useRepoStore } from '../../stores';
import { RepoSwitcher } from '../repo/RepoSwitcher';

interface LayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  detail?: React.ReactNode;
  onOpenRepo?: () => void;
  onInitRepo?: () => void;
  onCloneRepo?: () => void;
  onCloseRepo?: () => void;
}

export function Layout({ sidebar, main, detail, onOpenRepo, onInitRepo, onCloneRepo, onCloseRepo }: LayoutProps) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const detailPanelOpen = useUIStore((state) => state.detailPanelOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const toggleDetailPanel = useUIStore((state) => state.toggleDetailPanel);
  const showGridLines = useUIStore((state) => state.showGridLines);
  const toggleGridLines = useUIStore((state) => state.toggleGridLines);
  const repository = useRepoStore((state) => state.repository);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Repository switcher */}
          {repository && (
            <RepoSwitcher
              onOpenRepo={onOpenRepo}
              onInitRepo={onInitRepo}
              onCloneRepo={onCloneRepo}
              onCloseRepo={onCloseRepo}
            />
          )}
          {!repository && (
            <h1 className="text-lg font-semibold">Jujutsu GUI</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleGridLines}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${showGridLines ? 'text-blue-600' : 'text-gray-400'}`}
            title="Toggle grid lines"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={toggleDetailPanel}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Toggle detail panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && sidebar && (
          <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-auto">
            {sidebar}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {main}
        </main>

        {/* Detail panel */}
        {detailPanelOpen && detail && (
          <aside className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-auto">
            {detail}
          </aside>
        )}
      </div>
    </div>
  );
}
