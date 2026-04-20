import React from 'react';
import type { RevisionColumn } from '../../stores';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RevisionColumnHeaderProps {
  columns: RevisionColumn[];
}

/**
 * RevisionColumnHeader - Displays column headers for revision info
 *
 * Renders labels for each visible column (Change ID, Message, Author, Date)
 */
export const RevisionColumnHeader: React.FC<RevisionColumnHeaderProps> = ({
  columns,
}) => {
  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div className="flex w-full">
      {visibleColumns.map((column) => {
        const isFlex = column.width === 'flex';
        const style: React.CSSProperties = isFlex
          ? { flex: 1, minWidth: 100 }
          : { width: column.width, minWidth: column.width };

        return (
          <div
            key={column.id}
            className={cn(
              'flex items-center px-3 py-1',
              'border-r border-b border-gray-200 dark:border-gray-700',
              'bg-gray-50 dark:bg-gray-900/50',
              'text-xs font-medium text-gray-500 dark:text-gray-400',
              'uppercase tracking-wider'
            )}
            style={style}
          >
            {column.label}
          </div>
        );
      })}
    </div>
  );
};
