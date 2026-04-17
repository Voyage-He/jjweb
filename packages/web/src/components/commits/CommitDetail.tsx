/**
 * Commit detail panel component
 * Displays detailed information about a selected commit
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Commit, FileChange } from '@jujutsu-gui/shared';
import { FileChangesList } from './FileChangesList';
import { CommitContextMenu } from './CommitContextMenu';
import { apiClient } from '@/api/client';

interface CommitDetailProps {
  commit: Commit | null;
  fileChanges?: FileChange[];
  loading?: boolean;
  onFileClick?: (path: string) => void;
  onNewChange?: () => void;
  onEditDescription?: () => void;
  onAbandon?: () => void;
  onRebase?: () => void;
  onSquash?: () => void;
  onSplit?: () => void;
  onCreateBookmark?: () => void;
}

export function CommitDetail({
  commit,
  fileChanges: propFileChanges,
  loading,
  onFileClick,
  onNewChange,
  onEditDescription,
  onAbandon,
  onRebase,
  onSquash,
  onSplit,
  onCreateBookmark,
}: CommitDetailProps) {
  // Fetch commit details including file changes when commit changes
  const { data: commitDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['commitDetail', commit?.id],
    queryFn: () => apiClient.getCommitDetail(commit!.changeId),
    enabled: !!commit && !propFileChanges,
  });

  const fileChanges = propFileChanges ?? commitDetail?.files ?? [];

  if (loading || detailLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (!commit) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
        <svg
          className="w-12 h-12 mx-auto mb-2 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>Select a commit to view details</p>
      </div>
    );
  }

  const shortId = commit.id.slice(0, 12);
  const shortChangeId = commit.changeId.slice(0, 12);

  return (
    <CommitContextMenu
      commit={commit}
      onNewChange={onNewChange}
      onEditDescription={onEditDescription}
      onAbandon={onAbandon}
      onRebase={onRebase}
      onSquash={onSquash}
      onSplit={onSplit}
      onCreateBookmark={onCreateBookmark}
    >
      <div className="p-4 space-y-4">
        {/* Commit ID */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Commit ID
          </label>
          <p className="font-mono text-sm text-gray-900 dark:text-gray-100 mt-1">
            {shortId}
          </p>
        </div>

        {/* Change ID */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Change ID
          </label>
          <p className="font-mono text-sm text-gray-900 dark:text-gray-100 mt-1">
            {shortChangeId}
          </p>
        </div>

        {/* Author */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Author
          </label>
          <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
            {commit.author.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {commit.author.email}
          </p>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Date
          </label>
          <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
            {formatDate(commit.author.timestamp)}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Description
          </label>
          <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
            {commit.description || '(no description)'}
          </p>
        </div>

        {/* Parents */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Parents
          </label>
          <div className="mt-1 space-y-1">
            {commit.parents.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Root commit</p>
            ) : (
              commit.parents.map((parentId) => (
                <p key={parentId} className="font-mono text-xs text-gray-600 dark:text-gray-400">
                  {parentId.slice(0, 12)}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Bookmarks */}
        {commit.bookmarks.length > 0 && (
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Bookmarks
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {commit.bookmarks.map((bookmark) => (
                <span
                  key={bookmark.name}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    bookmark.isRemote
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                      : 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300'
                  }`}
                >
                  {bookmark.name}
                  {bookmark.isRemote && ` (${bookmark.remoteName})`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {commit.tags.length > 0 && (
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Tags
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {commit.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Working copy indicator */}
        {commit.isWorkingCopy && (
          <div className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-900/30">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-700 dark:text-green-300">Working Copy</span>
          </div>
        )}

        {/* File changes */}
        {fileChanges && fileChanges.length > 0 && (
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Changed Files ({fileChanges.length})
            </label>
            <FileChangesList files={fileChanges} onFileClick={onFileClick} />
          </div>
        )}
      </div>
    </CommitContextMenu>
  );
}

/**
 * Format timestamp to human-readable date
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Relative time for recent commits
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) return 'just now';
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  // Full date for older commits
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default CommitDetail;
