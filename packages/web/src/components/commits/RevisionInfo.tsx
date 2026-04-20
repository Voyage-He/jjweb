import React from 'react';
import type { Commit } from '@jujutsu-gui/shared';
import type { RevisionColumn } from '../../stores';
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
  columns: RevisionColumn[];
}

// Individual cell components
const ChangeIdCell: React.FC<{ commit: Commit }> = ({ commit }) => (
  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
    {commit.changeId.slice(0, 8)}
  </span>
);

const getFirstMessageLine = (description: string) => description.split(/\r?\n/, 1)[0];

const MessageCell: React.FC<{ commit: Commit; isSelected: boolean }> = ({ commit, isSelected }) => {
  const firstLine = getFirstMessageLine(commit.description);
  const bookmarkNames = commit.bookmarks.map((bookmark) => bookmark.name);
  const hasBookmarks = bookmarkNames.length > 0;
  const bookmarkTitle = hasBookmarks ? bookmarkNames.join('\n') : undefined;

  return (
    <div
      data-testid={`revision-message-cell-${commit.id}`}
      className="flex min-w-0 w-full items-center gap-2 overflow-hidden whitespace-nowrap"
    >
      {hasBookmarks && (
        <div
          className="flex min-w-0 max-w-[40%] shrink-0 items-center gap-1 overflow-hidden"
          title={bookmarkTitle}
        >
          {bookmarkNames.map((name) => (
            <span
              key={name}
              className={cn(
                'min-w-0 max-w-32 truncate rounded px-1.5 py-0.5 text-xs font-medium leading-4',
                isSelected
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
              )}
            >
              {name}
            </span>
          ))}
        </div>
      )}
      <span
        className={cn(
          'block min-w-0 flex-1 truncate text-sm',
          isSelected ? 'font-medium text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
        )}
        title={commit.description || undefined}
      >
        {firstLine || <span className="italic text-gray-400 dark:text-gray-500">No description</span>}
      </span>
    </div>
  );
};

const AuthorCell: React.FC<{ commit: Commit }> = ({ commit }) => (
  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
    {commit.author.name}
  </span>
);

const DateCell: React.FC<{ commit: Commit }> = ({ commit }) => {
  const dateStr = commit.author.timestamp
    ? new Date(commit.author.timestamp * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
      {dateStr}
    </span>
  );
};

// Map column id to cell component
const CellComponents: Record<string, React.FC<{ commit: Commit; isSelected: boolean }>> = {
  changeId: ({ commit }) => <ChangeIdCell commit={commit} />,
  message: ({ commit, isSelected }) => <MessageCell commit={commit} isSelected={isSelected} />,
  author: ({ commit }) => <AuthorCell commit={commit} />,
  date: ({ commit }) => <DateCell commit={commit} />,
};

export const RevisionInfo: React.FC<RevisionInfoProps> = ({
  commit,
  isSelected,
  onSelect,
  onEdit,
  columns,
}) => {
  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div
      className="relative bg-transparent flex items-center h-full w-full cursor-pointer select-none overflow-hidden"
      onClick={() => onSelect(commit)}
      onDoubleClick={() => onEdit?.(commit)}
    >
      {visibleColumns.map((column) => {
        const isFlex = column.width === 'flex';
        const style: React.CSSProperties = isFlex
          ? { flex: 1, minWidth: 100 }
          : { width: column.width, minWidth: column.width };

        const CellComponent = CellComponents[column.id];
        if (!CellComponent) return null;

        return (
          <div
            key={column.id}
            className={cn(
              'flex min-w-0 items-center px-3 h-full overflow-hidden',
              'border-r border-gray-100 dark:border-gray-800'
            )}
            style={style}
          >
            <CellComponent commit={commit} isSelected={isSelected} />
          </div>
        );
      })}
    </div>
  );
};
