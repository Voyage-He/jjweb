import React from 'react';
import type { Commit } from '@jujutsu-gui/shared';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RevisionCellProps {
  commit: Commit;
  isSelected: boolean;
  onSelect: (commit: Commit) => void;
  onEdit?: (commit: Commit) => void;
  showGridLines: boolean;
}

export const RevisionCell: React.FC<RevisionCellProps> = ({
  commit,
  isSelected,
  onSelect,
  onEdit,
  showGridLines,
}) => {
  return (
    <div
      className="relative bg-transparent transition-colors flex flex-col justify-center min-w-0 h-full w-full"
      onClick={() => onSelect(commit)}
      onDoubleClick={() => onEdit?.(commit)}
    >
      <div 
        className={cn(
          "absolute inset-0 transition-colors pointer-events-none",
          isSelected 
            ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
            : 'border-gray-100 dark:border-gray-800',
          showGridLines && 'border-r border-b'
        )}
      />
      <div className="relative p-3 flex flex-col gap-1 w-full h-full overflow-hidden select-none">
        <div className="flex items-center justify-between min-w-0 w-full">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
              {commit.changeId.slice(0, 8)}
            </span>
          </div>
          <div className="text-[10px] font-mono text-gray-300 dark:text-gray-600 bg-gray-100/50 dark:bg-gray-800/50 px-1 rounded shrink-0">
            ({commit.row}, {commit.column})
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate whitespace-nowrap">
            {commit.author.name}
          </span>
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate whitespace-nowrap">
          {commit.description || <span className="italic text-gray-400 dark:text-gray-500">No description</span>}
        </div>
      </div>
    </div>
  );
};
