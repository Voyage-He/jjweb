/**
 * Conflict File Display Component
 * Special display for files with merge conflicts
 */

import React, { useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { FileChange } from '@jujutsu-gui/shared';
import { cn } from '@/lib/utils';

interface ConflictFileDisplayProps {
  file: FileChange;
  isExpanded?: boolean;
  onToggle?: () => void;
  onResolve?: (resolution: 'ours' | 'theirs' | 'base') => void;
  onViewConflict?: () => void;
}

export function ConflictFileDisplay({
  file,
  isExpanded = false,
  onToggle,
  onResolve,
  onViewConflict,
}: ConflictFileDisplayProps) {
  // Parse conflict markers from content if available
  const conflictSections = useMemo(() => {
    if (!file.hunks || file.hunks.length === 0) return [];
    return file.hunks;
  }, [file]);

  return (
    <div className="border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/30 cursor-pointer',
          'hover:bg-orange-100 dark:hover:bg-orange-900/50'
        )}
        onClick={onToggle}
      >
        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="font-mono text-sm flex-1 truncate">{file.path}</span>
        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
          CONFLICT
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3 space-y-3 bg-white dark:bg-gray-800">
          {/* Conflict info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            This file has merge conflicts that need to be resolved before the change can be completed.
          </div>

          {/* Conflict sections preview */}
          {conflictSections.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Conflict Sections ({conflictSections.length})
              </div>
              <ul className="space-y-1">
                {conflictSections.slice(0, 3).map((hunk, idx) => (
                  <li
                    key={idx}
                    className="text-xs font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded"
                  >
                    Lines {hunk.oldStart}-{hunk.oldStart + hunk.oldLines} → {hunk.newStart}-
                    {hunk.newStart + hunk.newLines}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewConflict?.();
              }}
              className="px-3 py-1.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              View Conflict
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve?.('ours');
              }}
              className="px-3 py-1.5 text-xs rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
            >
              Keep Ours
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve?.('theirs');
              }}
              className="px-3 py-1.5 text-xs rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
            >
              Keep Theirs
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve?.('base');
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Keep Base
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Conflict Badge Component
 * Small badge indicating conflict status
 */
export function ConflictBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
      <AlertTriangle className="w-3 h-3" />
      {count} conflict{count !== 1 ? 's' : ''}
    </span>
  );
}

export default ConflictFileDisplay;
