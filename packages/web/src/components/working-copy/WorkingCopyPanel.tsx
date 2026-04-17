/**
 * Working Copy Panel
 * Displays and manages working copy changes
 */

import React, { useState, useMemo } from 'react';
import type { WorkingCopyStatus, FileChange, FileStatus } from '@jujutsu-gui/shared';

interface WorkingCopyPanelProps {
  status: WorkingCopyStatus | null;
  loading?: boolean;
  onDiscardFile: (path: string) => void;
  onRestoreFile: (path: string) => void;
  onAddToGitignore: (path: string) => void;
  onDiscardAll: () => void;
}

export function WorkingCopyPanel({
  status,
  loading,
  onDiscardFile,
  onRestoreFile,
  onAddToGitignore,
  onDiscardAll,
}: WorkingCopyPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<FileStatus>>(
    new Set(['modified', 'added', 'deleted'])
  );
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showUntracked, setShowUntracked] = useState(true);

  // Group files by status
  const groupedFiles = useMemo(() => {
    if (!status) return {};

    return status.files.reduce((acc, file) => {
      const group = file.status;
      if (!acc[group]) acc[group] = [];
      acc[group].push(file);
      return acc;
    }, {} as Record<FileStatus, FileChange[]>);
  }, [status]);

  // Separate tracked and untracked files
  const { trackedFiles, untrackedFiles } = useMemo(() => {
    if (!status) return { trackedFiles: [], untrackedFiles: [] };

    const tracked: FileChange[] = [];
    const untracked: FileChange[] = [];

    status.files.forEach((file) => {
      if (file.status === 'untracked') {
        untracked.push(file);
      } else {
        tracked.push(file);
      }
    });

    return { trackedFiles: tracked, untrackedFiles: untracked };
  }, [status]);

  // Group tracked files by status
  const groupedTrackedFiles = useMemo(() => {
    return trackedFiles.reduce((acc, file) => {
      const group = file.status;
      if (!acc[group]) acc[group] = [];
      acc[group].push(file);
      return acc;
    }, {} as Record<FileStatus, FileChange[]>);
  }, [trackedFiles]);

  const toggleGroup = (status: FileStatus) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">No working copy status</p>
      </div>
    );
  }

  const statusOrder: FileStatus[] = ['modified', 'added', 'deleted', 'renamed', 'conflict', 'untracked'];

  return (
    <div className="h-full flex flex-col">
      {/* Summary header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Working Copy</h3>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {status.changeId.slice(0, 8)}
          </span>
        </div>

        {/* Status summary */}
        <div className="flex flex-wrap gap-2">
          {status.summary.modified > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              {status.summary.modified} modified
            </span>
          )}
          {status.summary.added > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
              {status.summary.added} added
            </span>
          )}
          {status.summary.deleted > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
              {status.summary.deleted} deleted
            </span>
          )}
          {status.summary.untracked > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {status.summary.untracked} untracked
            </span>
          )}
          {status.summary.conflicts > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
              {status.summary.conflicts} conflicts
            </span>
          )}
        </div>

        {/* Conflict warning */}
        {status.hasConflicts && (
          <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs text-orange-700 dark:text-orange-300">
              Repository has conflicts that need resolution
            </span>
          </div>
        )}

        {/* Discard all button */}
        {status.files.length > 0 && (
          <button
            onClick={() => setShowDiscardConfirm(true)}
            className="mt-2 w-full py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            Discard All Changes
          </button>
        )}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto">
        {status.files.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Working copy is clean</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Tracked files section */}
            {trackedFiles.length > 0 && (
              <>
                {statusOrder.filter(s => s !== 'untracked').map((fileStatus) => {
                  const files = groupedTrackedFiles[fileStatus];
                  if (!files || files.length === 0) return null;

                  const isExpanded = expandedGroups.has(fileStatus);

                  return (
                    <div key={fileStatus}>
                      {/* Group header */}
                      <button
                        onClick={() => toggleGroup(fileStatus)}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <FileStatusBadge status={fileStatus} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {files.length} file{files.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </button>

                      {/* File list */}
                      {isExpanded && (
                        <ul className="bg-gray-50 dark:bg-gray-800/50">
                          {files.map((file) => (
                            <li
                              key={file.path}
                              className="flex items-center justify-between px-4 py-1.5 hover:bg-white dark:hover:bg-gray-700"
                            >
                              <span className="text-xs font-mono truncate flex-1" title={file.path}>
                                {file.oldPath ? (
                                  <>
                                    <span className="text-gray-500 dark:text-gray-400">{file.oldPath}</span>
                                    <span className="text-gray-400 dark:text-gray-500 mx-1">→</span>
                                    <span>{file.path}</span>
                                  </>
                                ) : (
                                  file.path
                                )}
                              </span>

                              {/* Actions */}
                              <div className="flex items-center gap-1 ml-2">
                                {file.status === 'deleted' && (
                                  <button
                                    onClick={() => onRestoreFile(file.path)}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                    title="Restore file"
                                  >
                                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => onDiscardFile(file.path)}
                                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                                  title="Discard changes"
                                >
                                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Untracked files section - dedicated area */}
            {untrackedFiles.length > 0 && (
              <div className="border-t-2 border-gray-300 dark:border-gray-600">
                {/* Untracked header */}
                <button
                  onClick={() => setShowUntracked(!showUntracked)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-3 h-3 transition-transform ${showUntracked ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9a3 3 0 011.828-2.828 3 3 0 013.344 0 3 3 0 011.828 2.828M9 12h6m-3-3v6" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Untracked Files</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {untrackedFiles.length} file{untrackedFiles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add all untracked to .gitignore
                      untrackedFiles.forEach((f) => onAddToGitignore(f.path));
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Ignore All
                  </button>
                </button>

                {/* Untracked file list */}
                {showUntracked && (
                  <ul className="bg-gray-50 dark:bg-gray-800/30">
                    {untrackedFiles.map((file) => (
                      <li
                        key={file.path}
                        className="flex items-center justify-between px-4 py-1.5 hover:bg-white dark:hover:bg-gray-700"
                      >
                        <span className="text-xs font-mono truncate flex-1 text-gray-600 dark:text-gray-400" title={file.path}>
                          {file.path}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => onAddToGitignore(file.path)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Add to .gitignore"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDiscardFile(file.path)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                            title="Delete file"
                          >
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Discard confirmation modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm mx-4">
            <h4 className="text-lg font-medium mb-2">Discard All Changes?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will discard all changes in the working copy. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDiscardAll();
                  setShowDiscardConfirm(false);
                }}
                className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Discard All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * File status badge component
 */
function FileStatusBadge({ status }: { status: FileStatus }) {
  const styles: Record<FileStatus, string> = {
    added: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    modified: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    deleted: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    renamed: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
    conflict: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    untracked: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  };

  const labels: Record<FileStatus, string> = {
    added: 'Added',
    modified: 'Modified',
    deleted: 'Deleted',
    renamed: 'Renamed',
    conflict: 'Conflict',
    untracked: 'Untracked',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default WorkingCopyPanel;
