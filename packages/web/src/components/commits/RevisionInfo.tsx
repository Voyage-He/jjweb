import React from 'react';
import type { Commit } from '@jujutsu-gui/shared';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RevisionInfoProps {
  commit: Commit;
  isSelected: boolean;
  onSelect: (commit: Commit) => void;
  onEdit?: (commit: Commit) => void;
}

export const RevisionInfo: React.FC<RevisionInfoProps> = ({
  commit,
  isSelected,
  onSelect,
  onEdit,
}) => {
  return (
    <div
      className="relative bg-transparent flex items-center gap-4 px-4 h-full w-full cursor-pointer select-none overflow-hidden"
      onClick={() => onSelect(commit)}
      onDoubleClick={() => onEdit?.(commit)}
    >
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
          {commit.changeId.slice(0, 8)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
          {commit.author.name}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm truncate block",
          isSelected ? "text-blue-900 dark:text-blue-100 font-medium" : "text-gray-900 dark:text-gray-100"
        )}>
          {commit.description || <span className="italic text-gray-400 dark:text-gray-500">No description</span>}
        </span>
      </div>

      <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        ({commit.row}, {commit.column})
      </div>
    </div>
  );
};
