/**
 * Branch Tracking Status Component
 * Shows ahead/behind/diverged status for tracked branches
 */

import React from 'react';
import { ArrowUp, ArrowDown, GitBranch, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bookmark } from '@jujutsu-gui/shared';

interface BranchTrackingStatusProps {
  bookmark: Bookmark;
  className?: string;
}

export function BranchTrackingStatus({ bookmark, className }: BranchTrackingStatusProps) {
  // Only show for non-remote bookmarks that are tracked
  if (bookmark.isRemote || !bookmark.isTracked) {
    return null;
  }

  // Determine tracking status
  const status = getTrackingStatus(bookmark);

  return (
    <div className={cn('flex items-center gap-1 text-xs', className)}>
      <StatusIndicator status={status} />
    </div>
  );
}

interface TrackingStatusInfo {
  type: 'synced' | 'ahead' | 'behind' | 'diverged' | 'conflict';
  label: string;
  color: string;
  icon?: React.ReactNode;
}

function getTrackingStatus(bookmark: Bookmark): TrackingStatusInfo {
  // Check for conflict
  if (bookmark.isConflict) {
    return {
      type: 'conflict',
      label: 'Conflict',
      color: 'text-orange-500',
      icon: <AlertCircle className="w-3 h-3" />,
    };
  }

  // Check for sync status
  if (bookmark.isSynced) {
    return {
      type: 'synced',
      label: 'Synced',
      color: 'text-green-500',
      icon: <GitBranch className="w-3 h-3" />,
    };
  }

  // Check if present
  if (!bookmark.isPresent) {
    return {
      type: 'behind',
      label: 'Behind',
      color: 'text-blue-500',
      icon: (
        <>
          <ArrowDown className="w-3 h-3" />
        </>
      ),
    };
  }

  // Default to ahead (local has commits not on remote)
  return {
    type: 'ahead',
    label: 'Ahead',
    color: 'text-amber-500',
    icon: <ArrowUp className="w-3 h-3" />,
  };
}

function StatusIndicator({ status }: { status: TrackingStatusInfo }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
        status.type === 'synced' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        status.type === 'ahead' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        status.type === 'behind' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        status.type === 'diverged' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        status.type === 'conflict' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      )}
      title={status.label}
    >
      {status.icon}
      <span className="hidden sm:inline">{status.label}</span>
    </span>
  );
}

/**
 * Detailed tracking status display
 */
export function BranchTrackingDetails({ bookmark }: { bookmark: Bookmark }) {
  if (bookmark.isRemote) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Remote branch on {bookmark.remoteName || 'origin'}
      </div>
    );
  }

  if (!bookmark.isTracked) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Not tracking any remote branch
      </div>
    );
  }

  const status = getTrackingStatus(bookmark);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <StatusIndicator status={status} />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {getStatusDescription(status.type)}
        </span>
      </div>

      {bookmark.isConflict && (
        <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Conflict detected - manual resolution required
        </div>
      )}
    </div>
  );
}

function getStatusDescription(type: TrackingStatusInfo['type']): string {
  switch (type) {
    case 'synced':
      return 'Local and remote are in sync';
    case 'ahead':
      return 'Local has unpushed commits';
    case 'behind':
      return 'Remote has new commits';
    case 'diverged':
      return 'Local and remote have diverged';
    case 'conflict':
      return 'Tracking conflict detected';
    default:
      return '';
  }
}

export default BranchTrackingStatus;
