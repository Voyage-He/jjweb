/**
 * Conflict Warning Component
 * Displays warnings when operations might cause conflicts
 */

import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConflictWarningProps {
  type: 'rebase' | 'squash' | 'split' | 'abandon';
  conflicts: ConflictInfo[];
  onDismiss: () => void;
  onProceed?: () => void;
}

export interface ConflictInfo {
  path: string;
  reason: string;
  severity: 'warning' | 'error';
}

export function ConflictWarning({ type, conflicts, onDismiss, onProceed }: ConflictWarningProps) {
  const hasErrors = conflicts.some((c) => c.severity === 'error');

  const typeLabels: Record<string, string> = {
    rebase: 'Rebase',
    squash: 'Squash',
    split: 'Split',
    abandon: 'Abandon',
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {typeLabels[type]} Operation Warning
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {hasErrors
              ? 'This operation cannot proceed due to conflicts:'
              : 'This operation may result in conflicts:'}
          </p>

          {/* Conflict list */}
          <ul className="mt-3 space-y-2">
            {conflicts.map((conflict, index) => (
              <li
                key={index}
                className={`flex items-start gap-2 text-sm ${
                  conflict.severity === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <span className="font-mono text-xs bg-amber-100 dark:bg-amber-800 px-1 rounded">
                  {conflict.path}
                </span>
                <span>{conflict.reason}</span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="border-amber-300 dark:border-amber-700"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            {!hasErrors && onProceed && (
              <Button
                size="sm"
                onClick={onProceed}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Proceed Anyway
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Check for potential conflicts before an operation
 */
export function checkOperationConflicts(
  type: 'rebase' | 'squash' | 'split' | 'abandon',
  sourceCommit: { hasConflicts?: boolean; isEmpty?: boolean },
  targetCommit?: { hasConflicts?: boolean; isEmpty?: boolean },
  files?: { path: string; status: string }[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  switch (type) {
    case 'rebase':
      if (sourceCommit.hasConflicts) {
        conflicts.push({
          path: 'source',
          reason: 'Source commit has unresolved conflicts',
          severity: 'error',
        });
      }
      if (targetCommit?.hasConflicts) {
        conflicts.push({
          path: 'target',
          reason: 'Target commit has unresolved conflicts',
          severity: 'warning',
        });
      }
      break;

    case 'squash':
      if (sourceCommit.hasConflicts) {
        conflicts.push({
          path: 'source',
          reason: 'Source commit has unresolved conflicts that will be lost',
          severity: 'error',
        });
      }
      if (sourceCommit.isEmpty) {
        conflicts.push({
          path: 'source',
          reason: 'Source commit is empty',
          severity: 'warning',
        });
      }
      break;

    case 'split':
      if (sourceCommit.hasConflicts) {
        conflicts.push({
          path: 'source',
          reason: 'Cannot split a commit with unresolved conflicts',
          severity: 'error',
        });
      }
      break;

    case 'abandon':
      if (sourceCommit.hasConflicts) {
        conflicts.push({
          path: 'source',
          reason: 'Commit has unresolved conflicts that will be lost',
          severity: 'warning',
        });
      }
      break;
  }

  return conflicts;
}

export default ConflictWarning;
