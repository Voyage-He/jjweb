/**
 * Bookmark Context Menu Component
 * Right-click menu for bookmark operations
 */

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Bookmark } from '@jujutsu-gui/shared';
import { GitBranch, ArrowRight, Trash2, Upload, RefreshCw } from 'lucide-react';

interface BookmarkContextMenuProps {
  bookmark: Bookmark | null;
  children: React.ReactNode;
  onMove?: () => void;
  onDelete?: () => void;
  onPush?: () => void;
  onFetch?: () => void;
  onTrack?: () => void;
}

export function BookmarkContextMenu({
  bookmark,
  children,
  onMove,
  onDelete,
  onPush,
  onFetch,
  onTrack,
}: BookmarkContextMenuProps) {
  if (!bookmark) {
    return <>{children}</>;
  }

  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {/* Move bookmark */}
        <DropdownMenuItem onClick={handleAction(onMove || (() => {}))}>
          <ArrowRight className="mr-2 h-4 w-4" />
          <span>Move to...</span>
        </DropdownMenuItem>

        {/* Delete bookmark */}
        <DropdownMenuItem
          onClick={handleAction(onDelete || (() => {}))}
          className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Remote operations */}
        {bookmark.isRemote ? (
          <>
            {/* Fetch updates */}
            <DropdownMenuItem onClick={handleAction(onFetch || (() => {}))}>
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Fetch</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {/* Push to remote */}
            <DropdownMenuItem onClick={handleAction(onPush || (() => {}))}>
              <Upload className="mr-2 h-4 w-4" />
              <span>Push to Remote</span>
            </DropdownMenuItem>

            {/* Track remote */}
            {!bookmark.isTracked && (
              <DropdownMenuItem onClick={handleAction(onTrack || (() => {}))}>
                <GitBranch className="mr-2 h-4 w-4" />
                <span>Track Remote</span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default BookmarkContextMenu;
