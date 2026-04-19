import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ColumnBookmarkHeaderProps {
  firstBookmark: string | null;
  allBookmarks: string[];
  width: number;
}

/**
 * ColumnBookmarkHeader - Displays bookmark name at the top of each column
 *
 * Shows the first bookmark (top-most by row) for the column.
 * On hover, displays all bookmarks in the column via title attribute.
 */
export const ColumnBookmarkHeader: React.FC<ColumnBookmarkHeaderProps> = ({
  firstBookmark,
  allBookmarks,
  width,
}) => {
  const hasBookmark = firstBookmark !== null;
  const tooltipText = allBookmarks.length > 1
    ? allBookmarks.join('\n')
    : undefined;

  console.log('[ColumnBookmarkHeader] Rendering:', { firstBookmark, allBookmarks, width, hasBookmark });

  return (
    <div
      className={cn(
        'flex items-center justify-center px-2 py-1',
        'border-r border-b border-gray-200 dark:border-gray-700',
        'bg-gray-100 dark:bg-gray-800',  // More visible background
        hasBookmark && 'bg-blue-100 dark:bg-blue-900/30'
      )}
      style={{ width: `${width}px`, minWidth: `${width}px`, height: '28px' }}  // Fixed height
      title={tooltipText}
    >
      {hasBookmark ? (
        <span
          className={cn(
            'text-xs font-medium truncate',
            'text-blue-600 dark:text-blue-400',
            'bg-blue-200 dark:bg-blue-700',
            'px-2 py-0.5 rounded'
          )}
        >
          {firstBookmark}
        </span>
      ) : (
        <span className="text-xs text-gray-400 select-none">-</span>
      )}
    </div>
  );
};
