/**
 * Operation Log Panel
 * Displays the history of jj operations with undo/redo functionality
 */

import React, { useState, useMemo } from 'react';
import type { Operation } from '@jujutsu-gui/shared';

interface OperationLogProps {
  operations: Operation[];
  selectedOperationId: string | null;
  onSelect: (operationId: string) => void;
  onUndo: (operationId?: string) => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

type OperationType = 'commit' | 'abandon' | 'new' | 'move' | 'squash' | 'split' | 'undo' | 'redo' | 'other';

export function OperationLog({
  operations,
  selectedOperationId,
  onSelect,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: OperationLogProps) {
  const [filterType, setFilterType] = useState<OperationType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter operations by type
  const filteredOperations = useMemo(() => {
    if (filterType === 'all') return operations;
    return operations.filter((op) => getOperationType(op) === filterType);
  }, [operations, filterType]);

  // Get unique operation types
  const operationTypes = useMemo(() => {
    const types = new Set<OperationType>();
    operations.forEach((op) => types.add(getOperationType(op)));
    return Array.from(types).sort();
  }, [operations]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with undo/redo */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h3 className="text-sm font-medium">Operation Log</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUndo()}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Undo last operation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Redo undone operation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter dropdown */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as OperationType | 'all')}
          className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1"
        >
          <option value="all">All operations</option>
          {operationTypes.map((type) => (
            <option key={type} value={type}>
              {formatOperationType(type)}
            </option>
          ))}
        </select>
      </div>

      {/* Operation list */}
      <div className="flex-1 overflow-auto">
        {filteredOperations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">No operations found</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredOperations.map((operation) => (
              <OperationItem
                key={operation.id}
                operation={operation}
                isSelected={selectedOperationId === operation.id}
                isExpanded={expandedId === operation.id}
                onSelect={onSelect}
                onToggleExpand={() => setExpandedId(expandedId === operation.id ? null : operation.id)}
                onUndo={onUndo}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface OperationItemProps {
  operation: Operation;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (operationId: string) => void;
  onToggleExpand: () => void;
  onUndo: (operationId?: string) => void;
}

function OperationItem({
  operation,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onUndo,
}: OperationItemProps) {
  const opType = getOperationType(operation);
  const icon = getOperationIcon(opType);
  const color = getOperationColor(opType);

  return (
    <li className={`${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
      <button
        onClick={() => onSelect(operation.id)}
        onDoubleClick={onToggleExpand}
        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="flex items-start gap-2">
          {/* Icon */}
          <span className={`flex-shrink-0 w-6 h-6 rounded-full ${color} flex items-center justify-center`}>
            {icon}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">
                {formatOperationType(opType)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {formatTimestamp(operation.timestamp)}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {operation.metadata.command} {operation.metadata.args.slice(0, 2).join(' ')}
            </p>
          </div>

          {/* Undo button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUndo(operation.operationId);
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            title="Undo this operation"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <dl className="text-xs space-y-1">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Operation ID</dt>
                <dd className="font-mono text-gray-700 dark:text-gray-300">{operation.operationId}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Command</dt>
                <dd className="font-mono text-gray-700 dark:text-gray-300">{operation.metadata.command}</dd>
              </div>
              {operation.metadata.args.length > 0 && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Arguments</dt>
                  <dd className="font-mono text-gray-700 dark:text-gray-300 break-all">
                    {operation.metadata.args.join(' ')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Working Directory</dt>
                <dd className="font-mono text-gray-700 dark:text-gray-300 truncate">
                  {operation.metadata.cwd}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Timestamp</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {new Date(operation.metadata.timestamp).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </button>
    </li>
  );
}

/**
 * Get operation type from metadata
 */
function getOperationType(operation: Operation): OperationType {
  const cmd = operation.metadata.command.toLowerCase();

  if (cmd === 'commit') return 'commit';
  if (cmd === 'abandon') return 'abandon';
  if (cmd === 'new') return 'new';
  if (cmd === 'move') return 'move';
  if (cmd === 'squash') return 'squash';
  if (cmd === 'split') return 'split';
  if (cmd === 'undo') return 'undo';
  if (cmd === 'redo') return 'redo';

  return 'other';
}

/**
 * Format operation type for display
 */
function formatOperationType(type: OperationType): string {
  const labels: Record<OperationType, string> = {
    commit: 'Commit',
    abandon: 'Abandon',
    new: 'New Change',
    move: 'Move',
    squash: 'Squash',
    split: 'Split',
    undo: 'Undo',
    redo: 'Redo',
    other: 'Other',
  };
  return labels[type];
}

/**
 * Get icon for operation type
 */
function getOperationIcon(type: OperationType): React.ReactNode {
  const iconClass = 'w-3 h-3 text-white';

  switch (type) {
    case 'commit':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'abandon':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'new':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case 'move':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'squash':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    case 'split':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12m-12 5h12M4 7v.01M4 12v.01M4 17v.01" />
        </svg>
      );
    case 'undo':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      );
    case 'redo':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

/**
 * Get background color for operation type
 */
function getOperationColor(type: OperationType): string {
  const colors: Record<OperationType, string> = {
    commit: 'bg-green-500',
    abandon: 'bg-red-500',
    new: 'bg-blue-500',
    move: 'bg-amber-500',
    squash: 'bg-purple-500',
    split: 'bg-indigo-500',
    undo: 'bg-orange-500',
    redo: 'bg-teal-500',
    other: 'bg-gray-500',
  };
  return colors[type];
}

/**
 * Format timestamp to relative time
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export default OperationLog;
