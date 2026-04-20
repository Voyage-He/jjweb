import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Commit } from '@jujutsu-gui/shared';
import { useUIStore } from '../../stores';
import { RevisionInfo } from './RevisionInfo';
import { CommitContextMenu } from './CommitContextMenu';
import { RevisionColumnHeader } from './RevisionColumnHeader';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RevisionTableProps {
  commits: Commit[];
  selectedCommit: Commit | null;
  onCommitSelect: (commit: Commit) => void;
  onCommitEdit?: (commit: Commit) => void;
  onNewChange?: () => void;
  onEditDescription?: () => void;
  onAbandon?: () => void;
  onRebase?: () => void;
  onSquash?: () => void;
  onSplit?: () => void;
  onCreateBookmark?: () => void;
}

const VIRTUAL_BUFFER = 10; // Extra rows to render above and below viewport
export const CURVE_SPREAD_FACTOR = 0.3;
const MAX_CURVE_SPREAD_FACTOR = 0.5;

export function calculateCommitLinePath(
  childColumn: number,
  childRow: number,
  parentColumn: number,
  parentRow: number,
  options: { rowHeight: number; trackWidth: number },
  spreadFactor = CURVE_SPREAD_FACTOR
): string {
  const { rowHeight, trackWidth } = options;
  const childX = childColumn * trackWidth + trackWidth / 2;
  const childY = childRow * rowHeight + rowHeight / 2;
  const parentX = parentColumn * trackWidth + trackWidth / 2;
  const parentY = parentRow * rowHeight + rowHeight / 2;

  if (childColumn === parentColumn) {
    return `M ${childX} ${childY} L ${parentX} ${parentY}`;
  }

  const direction = childX > parentX ? 1 : -1;
  const spread = trackWidth * Math.min(Math.max(spreadFactor, 0), MAX_CURVE_SPREAD_FACTOR);
  const cp1x = childX;
  const cp2x = parentX + direction * spread;
  const cp1y = childY + (parentY - childY) / 2;
  const cp2y = childY + (parentY - childY) / 2;

  return `M ${childX} ${childY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${parentX} ${parentY}`;
}

const CommitLines: React.FC<{
  commits: Commit[];
  metrics: { maxCol: number; maxRow: number };
  options: { rowHeight: number; trackWidth: number };
}> = ({ commits, metrics, options }) => {
  const { rowHeight, trackWidth } = options;
  const commitMap = useMemo(() => {
    const map = new Map<string, Commit>();
    commits.forEach((c) => map.set(c.id, c));
    return map;
  }, [commits]);

  const paths = useMemo(() => {
    const p: React.ReactNode[] = [];
    commits.forEach((child) => {
      if (child.row === undefined || child.column === undefined) return;

      const childColumn = child.column;
      const childRow = child.row;
      const childX = childColumn * trackWidth + trackWidth / 2;
      const childY = childRow * rowHeight + rowHeight / 2;

      child.parents.forEach((parentId) => {
        const parent = commitMap.get(parentId);
        if (!parent || parent.row === undefined || parent.column === undefined) return;

        const pathData = calculateCommitLinePath(
          childColumn,
          childRow,
          parent.column,
          parent.row,
          { rowHeight, trackWidth }
        );

        p.push(
          <path
            key={`${child.id}-${parent.id}`}
            d={pathData}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 dark:text-gray-500 opacity-60 transition-opacity hover:opacity-100"
          />
        );
      });

      // Draw a dot at the revision's own position
      p.push(
        <circle
          key={`${child.id}-dot`}
          cx={childX}
          cy={childY}
          r={5}
          fill="currentColor"
          className="text-gray-400 dark:text-gray-500"
        />
      );
    });
    return p;
  }, [commits, commitMap, rowHeight, trackWidth]);

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={(metrics.maxCol + 1) * trackWidth}
      height={(metrics.maxRow + 1) * rowHeight}
      style={{ zIndex: 5 }}
    >
      {paths}
    </svg>
  );
};

export const RevisionTable: React.FC<RevisionTableProps> = ({
  commits,
  selectedCommit,
  onCommitSelect,
  onCommitEdit,
  onNewChange,
  onEditDescription,
  onAbandon,
  onRebase,
  onSquash,
  onSplit,
  onCreateBookmark,
}) => {
  const { gridLayoutOptions, maxGraphWidth, revisionColumns } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [scrollLeft, setScrollLeft] = useState(0);

  // Update visible range on scroll
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const { scrollTop, scrollLeft, clientHeight } = containerRef.current;
        const startRow = Math.max(0, Math.floor(scrollTop / gridLayoutOptions.rowHeight) - VIRTUAL_BUFFER);
        const endRow = Math.min(commits.length - 1, Math.ceil((scrollTop + clientHeight) / gridLayoutOptions.rowHeight) + VIRTUAL_BUFFER);
        setVisibleRange({ start: startRow, end: endRow });
        setScrollLeft(scrollLeft);
        rafId = null;
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      // Initial calculation
      handleScroll();
    }
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      container?.removeEventListener('scroll', handleScroll);
    };
  }, [commits.length, gridLayoutOptions.rowHeight]);

  const metrics = useMemo(() => {
    let maxCol = 0;
    let maxRow = 0;
    commits.forEach((c) => {
      if (c.column !== undefined && c.column > maxCol) maxCol = c.column;
      if (c.row !== undefined && c.row > maxRow) maxRow = c.row;
    });
    return { maxCol, maxRow };
  }, [commits]);

  // Calculate graph width based on branch count with max limit
  const graphWidth = Math.min((metrics.maxCol + 1) * gridLayoutOptions.trackWidth, maxGraphWidth);

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `${graphWidth}px 1fr`,
    gridAutoRows: `${gridLayoutOptions.rowHeight}px`,
    width: '100%',
    minWidth: graphWidth + 200, // min-width for graph + some space for info
    height: (metrics.maxRow + 1) * gridLayoutOptions.rowHeight,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 10,
  };

  // Filter commits to only those in the visible range
  const visibleCommits = useMemo(() => {
    return commits.filter(c => 
      c.row !== undefined && 
      c.row >= visibleRange.start && 
      c.row <= visibleRange.end
    );
  }, [commits, visibleRange]);

  return (
    <div data-testid="revision-table" className="flex flex-col h-full w-full bg-white dark:bg-gray-950">
      {/* Column header row - fixed at top */}
      <div
        className="grid shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 sticky top-0 z-20"
        style={{
          gridTemplateColumns: gridStyle.gridTemplateColumns,
          width: gridStyle.width,
          minWidth: gridStyle.minWidth,
          transform: `translateX(${-scrollLeft}px)`,
        }}
      >
        {/* Graph column header intentionally stays blank. */}
        <div
          data-testid="revision-graph-header"
          className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700"
          aria-hidden="true"
        />
        {/* Revision info column headers */}
        <RevisionColumnHeader columns={revisionColumns} />
      </div>

      {/* Scrollable content area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        <div className="relative min-h-full p-0">
          <CommitLines
            commits={commits}
            metrics={metrics}
            options={gridLayoutOptions}
          />

          <div style={gridStyle}>
            {visibleCommits.map((commit) => {
              const row = commit.row !== undefined ? commit.row + 1 : 'auto';
              const isSelected = selectedCommit?.id === commit.id;

              return (
                <React.Fragment key={commit.id}>
                  {/* Full-width background for selection and hover */}
                  <div
                    onClick={() => onCommitSelect(commit)}
                    onDoubleClick={() => onCommitEdit?.(commit)}
                    style={{
                      gridRow: row,
                      gridColumn: '1 / -1',
                      zIndex: 1,
                    }}
                    className={cn(
                      "transition-colors border-b border-gray-100 dark:border-gray-800 cursor-pointer group",
                      isSelected 
                        ? 'bg-blue-50/80 dark:bg-blue-900/20' 
                        : 'bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                    )}
                  />

                  {/* Revision Info (Metadata) - placed in the second column */}
                  <div
                    style={{
                      gridRow: row,
                      gridColumn: 2,
                      zIndex: 10,
                      position: 'relative',
                      pointerEvents: 'none', // Let clicks through to background
                    }}
                  >
                    <CommitContextMenu
                      commit={commit}
                      onNewChange={onNewChange}
                      onEditDescription={onEditDescription}
                      onAbandon={onAbandon}
                      onRebase={onRebase}
                      onSquash={onSquash}
                      onSplit={onSplit}
                      onCreateBookmark={onCreateBookmark}
                    >
                      <div className="w-full h-full pointer-events-auto">
                        <RevisionInfo
                          commit={commit}
                          isSelected={isSelected}
                          onSelect={onCommitSelect}
                          onEdit={onCommitEdit}
                          columns={revisionColumns}
                        />
                      </div>
                    </CommitContextMenu>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
