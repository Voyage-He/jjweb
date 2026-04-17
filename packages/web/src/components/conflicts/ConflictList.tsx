/**
 * Conflict list view component
 */

import React from 'react';
import type { Conflict } from '@jujutsu-gui/shared';

interface ConflictListProps {
  conflicts: Conflict[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function ConflictList({ conflicts, selectedPath, onSelect }: ConflictListProps) {
  if (conflicts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <svg
          className="w-12 h-12 mx-auto mb-2 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">No conflicts found</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {conflicts.map((conflict) => (
        <li key={conflict.path}>
          <button
            onClick={() => onSelect(conflict.path)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
              selectedPath === conflict.path ? 'bg-orange-50 dark:bg-orange-900/20' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={conflict.path}>
                  {conflict.path}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {conflict.conflictType === 'content' ? 'Content conflict' : 'File conflict'}
                </p>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ConflictList;
