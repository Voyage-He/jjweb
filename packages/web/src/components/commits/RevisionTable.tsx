import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Commit } from '@jujutsu-gui/shared';
import { useUIStore } from '../../stores';
import { RevisionCell } from './RevisionCell';
import { CommitContextMenu } from './CommitContextMenu';
import { ColumnBookmarkHeader } from './ColumnBookmarkHeader';

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

interface ColumnBookmarkInfo {
  columnIndex: number;
  firstBookmark: string | null;
  allBookmarks: string[];
}

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
  const bookmarkHeaderRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [scrollLeft, setScrollLeft] = useState(0);

  // Compute column bookmark mapping (tasks 1.1-1.3)
  // Groups bookmarks by column, sorts by row, extracts first bookmark per column
  const columnBookmarks = useMemo<ColumnBookmarkInfo[]>(() => {
    const columnMap = new Map<number, { bookmarks: string[]; row: number }[]>();

    // DEBUG: Log commits with bookmarks
    const bookmarkedCommits = commits.filter(c => c.bookmarks && c.bookmarks.length > 0);
    console.log('[ColumnBookmarkHeader] Commits with bookmarks:', bookmarkedCommits.length, '/', commits.length);
    bookmarkedCommits.forEach(c => {
      console.log(`[ColumnBookmarkHeader] Commit ${c.changeId.slice(0, 8)}: column=${c.column}, row=${c.row}, bookmarks=`, c.bookmarks?.map(b => b.name));
    });

    // Group commits by column, collecting bookmarks
    commits.forEach((commit) => {
      if (commit.column === undefined || commit.row === undefined) return;
      if (!commit.bookmarks || commit.bookmarks.length === 0) return;

      if (!columnMap.has(commit.column)) {
        columnMap.set(commit.column, []);
      }
      columnMap.get(commit.column)!.push({
        bookmarks: commit.bookmarks.map((b) => b.name),
        row: commit.row,
      });
    });

    // Process each column: sort by row, extract first bookmark and collect all
    const result: ColumnBookmarkInfo[] = [];
    columnMap.forEach((entries, columnIndex) => {
      // Sort by row ascending (top-most first)
      entries.sort((a, b) => a.row - b.row);

      const allBookmarks: string[] = [];
      let firstBookmark: string | null = null;

      entries.forEach((entry) => {
        entry.bookmarks.forEach((name) => {
          if (!allBookmarks.includes(name)) {
            allBookmarks.push(name);
          }
        });
        // Take the first bookmark from the top-most row entry
        if (firstBookmark === null && entry.bookmarks.length > 0) {
          firstBookmark = entry.bookmarks[0];
        }
      });

      result.push({
        columnIndex,
        firstBookmark,
        allBookmarks,
      });
    });

    // Sort by column index
    result.sort((a, b) => a.columnIndex - b.columnIndex);
    return result;
  }, [commits]);

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

  // Build column headers array for all columns (0 to maxCol)
  const columnHeaders = useMemo(() => {
    const headers: { firstBookmark: string | null; allBookmarks: string[] }[] = [];
    const bookmarkMap = new Map(columnBookmarks.map((b) => [b.columnIndex, b]));

    for (let i = 0; i <= metrics.maxCol; i++) {
      const bookmarkInfo = bookmarkMap.get(i);
      headers.push({
        firstBookmark: bookmarkInfo?.firstBookmark ?? null,
        allBookmarks: bookmarkInfo?.allBookmarks ?? [],
      });
    }

    // DEBUG: Log final headers
    console.log('[ColumnBookmarkHeader] metrics:', metrics);
    console.log('[ColumnBookmarkHeader] columnBookmarks:', columnBookmarks);
    console.log('[ColumnBookmarkHeader] columnHeaders:', headers);
    console.log('[ColumnBookmarkHeader] gridLayoutOptions:', gridLayoutOptions);

    return headers;
  }, [columnBookmarks, metrics.maxCol]);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-950">
      {/* Column header row - fixed at top (tasks 3.1, 3.2) */}
      <div
        ref={bookmarkHeaderRef}
        className="flex shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 sticky top-0 z-20"
        style={{
          width: (metrics.maxCol + 1) * gridLayoutOptions.columnWidth,
          minWidth: '100%',
          transform: `translateX(${-scrollLeft}px)`,
        }}
      >
        {columnHeaders.map((header, index) => (
          <ColumnBookmarkHeader
            key={index}
            firstBookmark={header.firstBookmark}
            allBookmarks={header.allBookmarks}
            width={gridLayoutOptions.columnWidth}
          />
        ))}
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
    </div>
  );
};
