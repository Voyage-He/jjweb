import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Commit } from '@jujutsu-gui/shared';
import { useUIStore } from '../../stores';
import { RevisionCell } from './RevisionCell';
import { CommitContextMenu } from './CommitContextMenu';

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

const CommitLines: React.FC<{
  commits: Commit[];
  metrics: { maxCol: number; maxRow: number };
  options: { rowHeight: number; columnWidth: number };
}> = ({ commits, metrics, options }) => {
  const { rowHeight, columnWidth } = options;
  const commitMap = useMemo(() => {
    const map = new Map<string, Commit>();
    commits.forEach((c) => map.set(c.id, c));
    return map;
  }, [commits]);

  const paths = useMemo(() => {
    const p: React.ReactNode[] = [];
    commits.forEach((child) => {
      if (child.row === undefined || child.column === undefined) return;

      const childX = child.column * columnWidth + columnWidth / 2;
      const childY = child.row * rowHeight + rowHeight / 2;

      child.parents.forEach((parentId) => {
        const parent = commitMap.get(parentId);
        if (!parent || parent.row === undefined || parent.column === undefined) return;

        const parentX = parent.column * columnWidth + columnWidth / 2;
        const parentY = parent.row * rowHeight + rowHeight / 2;

        // Draw a straight line if in the same column, otherwise use a curve
        let pathData: string;
        if (child.column === parent.column) {
          pathData = `M ${childX} ${childY} L ${parentX} ${parentY}`;
        } else {
          const cp1y = childY + (parentY - childY) / 2;
          const cp2y = childY + (parentY - childY) / 2;
          pathData = `M ${childX} ${childY} C ${childX} ${cp1y}, ${parentX} ${cp2y}, ${parentX} ${parentY}`;
        }

        p.push(
          <path
            key={`${child.id}-${parent.id}`}
            d={pathData}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
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
          r={4}
          fill="currentColor"
          className="text-gray-400 dark:text-gray-500"
        />
      );
    });
    return p;
  }, [commits, commitMap, rowHeight, columnWidth]);

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={(metrics.maxCol + 1) * columnWidth}
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
  const { showGridLines, gridLayoutOptions } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  // Update visible range on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, clientHeight } = containerRef.current;
      const startRow = Math.max(0, Math.floor(scrollTop / gridLayoutOptions.rowHeight) - VIRTUAL_BUFFER);
      const endRow = Math.min(commits.length - 1, Math.ceil((scrollTop + clientHeight) / gridLayoutOptions.rowHeight) + VIRTUAL_BUFFER);
      setVisibleRange({ start: startRow, end: endRow });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial calculation
      handleScroll();
    }
    return () => container?.removeEventListener('scroll', handleScroll);
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

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${metrics.maxCol + 1}, ${gridLayoutOptions.columnWidth}px)`,
    gridAutoRows: `${gridLayoutOptions.rowHeight}px`,
    width: (metrics.maxCol + 1) * gridLayoutOptions.columnWidth,
    height: (metrics.maxRow + 1) * gridLayoutOptions.rowHeight,
    minWidth: (metrics.maxCol + 1) * gridLayoutOptions.columnWidth,
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
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto bg-white dark:bg-gray-950"
    >
      <div className="relative min-h-full p-0">
        <CommitLines 
          commits={commits} 
          metrics={metrics} 
          options={gridLayoutOptions} 
        />
        
        <div style={gridStyle}>
          {visibleCommits.map((commit) => (
            <div
              key={commit.id}
              style={{
                gridRow: commit.row !== undefined ? commit.row + 1 : 'auto',
                gridColumn: commit.column !== undefined ? commit.column + 1 : 'auto',
                position: 'relative',
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
                <RevisionCell
                  commit={commit}
                  isSelected={selectedCommit?.id === commit.id}
                  onSelect={onCommitSelect}
                  onEdit={onCommitEdit}
                  showGridLines={showGridLines}
                />
              </CommitContextMenu>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
