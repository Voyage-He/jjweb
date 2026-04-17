/**
 * File changes list component
 * Displays a list of files changed in a commit
 */

import React from 'react';
import type { FileChange, FileStatus } from '@jujutsu-gui/shared';

interface FileChangesListProps {
  files: FileChange[];
  onFileClick?: (path: string) => void;
}

export function FileChangesList({ files, onFileClick }: FileChangesListProps) {
  // Group files by status
  const grouped = files.reduce((acc, file) => {
    const status = file.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(file);
    return acc;
  }, {} as Record<FileStatus, FileChange[]>);

  const statusOrder: FileStatus[] = ['added', 'modified', 'deleted', 'renamed', 'conflict', 'untracked'];
  const statusLabels: Record<FileStatus, string> = {
    added: 'Added',
    modified: 'Modified',
    deleted: 'Deleted',
    renamed: 'Renamed',
    conflict: 'Conflicts',
    untracked: 'Untracked',
  };

  return (
    <div className="mt-2 space-y-3">
      {statusOrder.map((status) => {
        const statusFiles = grouped[status];
        if (!statusFiles || statusFiles.length === 0) return null;

        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon status={status} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {statusLabels[status]} ({statusFiles.length})
              </span>
            </div>
            <ul className="space-y-1">
              {statusFiles.map((file) => (
                <li key={file.path}>
                  <button
                    onClick={() => onFileClick?.(file.path)}
                    className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 font-mono text-xs truncate"
                    title={file.path}
                  >
                    {file.oldPath ? (
                      <span>
                        <span className="text-gray-500 dark:text-gray-400">{file.oldPath}</span>
                        <span className="text-gray-400 dark:text-gray-500 mx-1">→</span>
                        <span className="text-gray-900 dark:text-gray-100">{file.path}</span>
                      </span>
                    ) : (
                      <span className="text-gray-900 dark:text-gray-100">{file.path}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Status icon component
 */
function StatusIcon({ status }: { status: FileStatus }) {
  const icons: Record<FileStatus, { color: string; path: string }> = {
    added: {
      color: 'text-green-500',
      path: 'M12 4v16m8-8H4',
    },
    modified: {
      color: 'text-blue-500',
      path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    },
    deleted: {
      color: 'text-red-500',
      path: 'M6 18L18 6M6 6l12 12',
    },
    renamed: {
      color: 'text-amber-500',
      path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    },
    conflict: {
      color: 'text-orange-500',
      path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    untracked: {
      color: 'text-gray-400',
      path: 'M8.228 9a3 3 0 011.828-2.828 3 3 0 013.344 0 3 3 0 011.828 2.828M9 12h6m-3-3v6',
    },
  };

  const icon = icons[status];

  return (
    <svg className={`w-4 h-4 ${icon.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
    </svg>
  );
}

export default FileChangesList;
