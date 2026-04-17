/**
 * Commit context menu component
 * Provides right-click actions for commits
 */

import { useState, useCallback } from 'react';
import type { Commit } from '@jujutsu-gui/shared';
import {
  GitBranch,
  Pencil,
  Trash2,
  GitMerge,
  ChevronRight,
  Split,
} from 'lucide-react';

interface CommitContextMenuProps {
  commit: Commit | null;
  children: React.ReactNode;
  onNewChange?: () => void;
  onEditDescription?: () => void;
  onAbandon?: () => void;
  onRebase?: () => void;
  onSquash?: () => void;
  onSplit?: () => void;
  onCreateBookmark?: () => void;
}

interface MenuPosition {
  x: number;
  y: number;
}

export function CommitContextMenu({
  commit,
  children,
  onNewChange,
  onEditDescription,
  onAbandon,
  onRebase,
  onSquash,
  onSplit,
  onCreateBookmark,
}: CommitContextMenuProps) {
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleClose = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const handleAction = useCallback((action: () => void) => {
    return () => {
      action();
      handleClose();
    };
  }, [handleClose]);

  // Close menu when clicking outside
  const handleOverlayClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  if (!commit) {
    return <>{children}</>;
  }

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>

      {/* Context menu overlay */}
      {menuPosition && (
        <>
          {/* Invisible overlay to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleOverlayClick}
            onContextMenu={(e) => {
              e.preventDefault();
              handleOverlayClick();
            }}
          />

          {/* Context menu */}
          <div
            className="fixed z-50 min-w-[180px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg animate-in fade-in-0 zoom-in-95"
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
            }}
          >
            <div className="p-1">
              {/* Create new change after this one */}
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={handleAction(onNewChange || (() => {}))}
              >
                <ChevronRight className="h-4 w-4" />
                <span>New Change After</span>
              </button>

              {/* Edit description */}
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={handleAction(onEditDescription || (() => {}))}
              >
                <Pencil className="h-4 w-4" />
                <span>Edit Description</span>
              </button>

              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

              {/* Create bookmark */}
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={handleAction(onCreateBookmark || (() => {}))}
              >
                <GitBranch className="h-4 w-4" />
                <span>Create Bookmark</span>
              </button>

              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

              {/* Rebase - move this change */}
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={handleAction(onRebase || (() => {}))}
              >
                <GitMerge className="h-4 w-4" />
                <span>Rebase Change</span>
              </button>

              {/* Squash into parent */}
              {commit.parents.length > 0 && (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={handleAction(onSquash || (() => {}))}
                >
                  <GitMerge className="h-4 w-4 rotate-90" />
                  <span>Squash into Parent</span>
                </button>
              )}

              {/* Split change */}
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={handleAction(onSplit || (() => {}))}
              >
                <Split className="h-4 w-4" />
                <span>Split Change</span>
              </button>

              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

              {/* Abandon change */}
              <button
                className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                onClick={handleAction(onAbandon || (() => {}))}
              >
                <Trash2 className="h-4 w-4" />
                <span>Abandon Change</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default CommitContextMenu;
