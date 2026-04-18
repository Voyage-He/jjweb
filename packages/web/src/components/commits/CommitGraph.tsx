/**
 * Canvas-based commit graph renderer
 * Uses HTML Canvas for efficient rendering of large commit graphs
 * Supports virtual scrolling, keyboard navigation, search/filter, and fold/expand
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type { Commit, Bookmark } from '@jujutsu-gui/shared';
import { layoutCommits, getScaledLayoutNodes, type LayoutNode } from './layout';

interface CommitGraphProps {
  commits: Commit[];
  selectedCommit: Commit | null;
  onCommitSelect: (commit: Commit) => void;
  onCommitEdit?: (commit: Commit) => void;
  onRebase?: (sourceId: string, targetId: string, insertAfter?: boolean) => void;
  width?: number;
  height?: number;
  searchQuery?: string;
  filterBookmarks?: string[];
  loading?: boolean;
  error?: string | null;
}

interface GraphNode extends LayoutNode {
  commit: Commit;
  visible: boolean;
  highlighted: boolean;
  collapsed: boolean;
  hasCollapsedChildren: boolean;
  branchColor: string;
  isBranchStart: boolean;
}

interface GraphMetrics {
  nodeRadius: number;
  nodeSpacingX: number;
  nodeSpacingY: number;
  paddingX: number;
  paddingY: number;
  fontSize: number;
  bookmarkHeight: number;
}

const DEFAULT_METRICS: GraphMetrics = {
  nodeRadius: 4,
  nodeSpacingX: 60,
  nodeSpacingY: 40,
  paddingX: 40,
  paddingY: 30,
  fontSize: 12,
  bookmarkHeight: 20,
};

// Buffer for virtual scrolling (rows to render outside viewport)
const VIRTUAL_SCROLL_BUFFER = 5;

export function CommitGraph({
  commits,
  selectedCommit,
  onCommitSelect,
  onCommitEdit,
  onRebase,
  width: propWidth,
  height: propHeight,
  searchQuery = '',
  filterBookmarks = [],
  loading = false,
  error = null,
}: CommitGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [focused, setFocused] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Drag and drop state
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [dropTargetNode, setDropTargetNode] = useState<GraphNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Build commit map for relationship lookups
  const commitMap = useMemo(() => {
    const map = new Map<string, Commit>();
    commits.forEach((commit) => map.set(commit.id, commit));
    return map;
  }, [commits]);

  // Get all descendant IDs of a commit
  const getDescendants = useCallback((commitId: string): Set<string> => {
    const descendants = new Set<string>();
    const queue = [commitId];

    while (queue.length > 0) {
      const id = queue.shift()!;
      const commit = commitMap.get(id);
      if (commit) {
        commit.parents.forEach((parentId) => {
          if (!descendants.has(parentId)) {
            descendants.add(parentId);
            queue.push(parentId);
          }
        });
      }
    }

    return descendants;
  }, [commitMap]);

  // Get direct children (commits that have this commit as parent)
  const getChildren = useCallback((commitId: string): string[] => {
    return commits
      .filter((c) => c.parents.includes(commitId))
      .map((c) => c.id);
  }, [commits]);

  // Toggle collapse state for a node
  const toggleCollapse = useCallback((commitId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(commitId)) {
        next.delete(commitId);
      } else {
        next.add(commitId);
      }
      return next;
    });
  }, []);

  // Calculate layout for commits with search/filter/collapse support
  const graphNodes = useMemo(() => {
    const layout = getScaledLayoutNodes(layoutCommits(commits));

    // Build a set of matching commits for search
    const searchLower = searchQuery.toLowerCase();
    const matchingIds = new Set<string>();

    if (searchQuery) {
      commits.forEach((commit) => {
        if (
          commit.id.toLowerCase().includes(searchLower) ||
          commit.changeId.toLowerCase().includes(searchLower) ||
          commit.description.toLowerCase().includes(searchLower) ||
          commit.author.name.toLowerCase().includes(searchLower) ||
          commit.author.email.toLowerCase().includes(searchLower) ||
          commit.bookmarks.some((b) => b.name.toLowerCase().includes(searchLower))
        ) {
          matchingIds.add(commit.id);
        }
      });
    }

    // Build a set of commits matching bookmark filter
    const bookmarkFilterIds = new Set<string>();
    if (filterBookmarks.length > 0) {
      commits.forEach((commit) => {
        if (commit.bookmarks.some((b) => filterBookmarks.includes(b.name))) {
          bookmarkFilterIds.add(commit.id);
        }
      });
    }

    // Calculate which nodes are hidden due to collapsing
    const hiddenByCollapse = new Set<string>();
    collapsedNodes.forEach((collapsedId) => {
      const descendants = getDescendants(collapsedId);
      descendants.forEach((id) => hiddenByCollapse.add(id));
    });

    return layout.map((node) => {
      const commit = commits.find((c) => c.id === node.id)!;
      const highlighted = searchQuery ? matchingIds.has(node.id) : false;
      const isVisibleByFilter = !filterBookmarks.length || bookmarkFilterIds.has(node.id);
      const isHiddenByCollapse = hiddenByCollapse.has(node.id);
      const isCollapsed = collapsedNodes.has(node.id);
      const children = getChildren(node.id);
      const hasCollapsedChildren = children.length > 0;
      const branchColor = node.branchColor || '#6b7280';
      const isBranchStart = node.branchDepth > 0 && node.siblingIndex === 0;

      return {
        ...node,
        commit,
        visible: isVisibleByFilter && !isHiddenByCollapse,
        highlighted,
        collapsed: isCollapsed,
        hasCollapsedChildren,
        branchColor,
        isBranchStart,
      };
    });
  }, [commits, searchQuery, filterBookmarks, collapsedNodes, getDescendants, getChildren]);

  // Calculate canvas dimensions based on layout
  const canvasSize = useMemo(() => {
    if (graphNodes.length === 0) return { width: 800, height: 600 };

    const maxX = Math.max(...graphNodes.map((n) => n.x));
    const maxY = Math.max(...graphNodes.map((n) => n.y));

    return {
      width: Math.max(800, (maxX + 1) * DEFAULT_METRICS.nodeSpacingX + DEFAULT_METRICS.paddingX * 2),
      height: Math.max(600, (maxY + 1) * DEFAULT_METRICS.nodeSpacingY + DEFAULT_METRICS.paddingY * 2),
    };
  }, [graphNodes]);

  // Use provided dimensions or calculated ones
  const width = propWidth || dimensions.width;
  const height = propHeight || dimensions.height;

  // Resize observer for container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Convert commit ID to color
  const getCommitColor = useCallback((commit: Commit, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return '#3b82f6'; // blue-500
    if (isHovered) return '#60a5fa'; // blue-400
    if (commit.isWorkingCopy) return '#22c55e'; // green-500
    if (commit.bookmarks.length > 0) return '#8b5cf6'; // violet-500
    return '#6b7280'; // gray-500
  }, []);

  // Draw the graph with virtual scrolling
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size with DPR
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    // Scale context for DPR
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#111827' : '#f9fafb';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const { nodeRadius, nodeSpacingX, nodeSpacingY, paddingX, paddingY, fontSize, bookmarkHeight } = DEFAULT_METRICS;

    // Calculate visible range for virtual scrolling
    const visibleMinY = Math.max(0, Math.floor(scrollOffset.y / nodeSpacingY) - VIRTUAL_SCROLL_BUFFER);
    const visibleMaxY = Math.min(
      Math.max(...graphNodes.map((n) => n.y)),
      Math.ceil((scrollOffset.y + dimensions.height) / nodeSpacingY) + VIRTUAL_SCROLL_BUFFER
    );

    // Filter visible nodes (virtual scrolling + visibility filter)
    const visibleNodes = graphNodes.filter(
      (node) => node.visible && node.y >= visibleMinY && node.y <= visibleMaxY
    );

    // Apply scroll offset
    ctx.save();
    ctx.translate(-scrollOffset.x, -scrollOffset.y);

    // Build commit map for parent lookup
    const commitMap = new Map<string, GraphNode>();
    graphNodes.forEach((node) => commitMap.set(node.id, node));

    // Draw edges (connections between nodes) with branch colors
    visibleNodes.forEach((node) => {
      const x = node.x * nodeSpacingX + paddingX;
      const y = node.y * nodeSpacingY + paddingY;

      node.commit.parents.forEach((parentId) => {
        const parentNode = commitMap.get(parentId);
        if (parentNode && parentNode.visible) {
          const parentX = parentNode.x * nodeSpacingX + paddingX;
          const parentY = parentNode.y * nodeSpacingY + paddingY;

          // Use branch color for edge
          ctx.strokeStyle = node.branchColor;
          ctx.lineWidth = node.isMergePoint ? 3 : 2;

          // Use dashed line for merge edges (when commit has multiple parents)
          if (node.commit.parents.length > 1) {
            ctx.setLineDash([5, 5]);
          } else {
            ctx.setLineDash([]);
          }

          ctx.beginPath();
          ctx.moveTo(x, y);

          // Draw helper dots for each row the edge passes through
          const minY = Math.min(y, parentY);
          const maxY = Math.max(y, parentY);
          for (let intermediateY = minY + nodeSpacingY; intermediateY < maxY; intermediateY += nodeSpacingY) {
            // Simple linear interpolation for x position of the dot
            // For a bezier curve, this is an approximation, but for vertical segments it's exact
            const t = (intermediateY - y) / (parentY - y);
            // We'll use a simple approximation for the x position on the curve
            // For vertical lines (x === parentX), this is exact
            const interX = x + (parentX - x) * t; 
            
            ctx.save();
            ctx.fillStyle = node.branchColor;
            ctx.globalAlpha = 0.5; // Make intermediate dots slightly fainter
            ctx.beginPath();
            ctx.arc(interX, intermediateY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Draw curved line
          const midY = (y + parentY) / 2;
          ctx.bezierCurveTo(
            x, midY,
            parentX, midY,
            parentX, parentY
          );
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    });

    // Draw nodes
    visibleNodes.forEach((node) => {
      const x = node.x * nodeSpacingX + paddingX;
      const y = node.y * nodeSpacingY + paddingY;
      const isSelected = selectedCommit?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // Draw highlight background for search matches
      if (node.highlighted) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.2)'; // amber with opacity
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw branch start indicator (small circle) if this is a branch start point
      if (node.isBranchStart) {
        ctx.fillStyle = node.branchColor;
        ctx.beginPath();
        ctx.arc(x - nodeRadius - 8, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw merge point highlight ring
      if (node.isMergePoint) {
        ctx.strokeStyle = node.branchColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw collapse indicator if node has children
      if (node.hasCollapsedChildren) {
        const collapseX = x - nodeRadius - 12;
        const collapseY = y;

        // Draw collapse button background
        ctx.fillStyle = node.collapsed ? '#3b82f6' : '#6b7280';
        ctx.beginPath();
        ctx.arc(collapseX, collapseY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw collapse icon (chevron)
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 10px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.collapsed ? '+' : '−', collapseX, collapseY);
      }

      // Draw node circle with branch color
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      // Use branch color for non-selected nodes
      let nodeColor = node.branchColor;
      if (isSelected) nodeColor = '#3b82f6'; // blue-500
      else if (isHovered) nodeColor = '#60a5fa'; // blue-400
      else if (node.commit.isWorkingCopy) nodeColor = '#22c55e'; // green-500
      else if (node.commit.bookmarks.length > 0) nodeColor = '#8b5cf6'; // violet-500
      ctx.fillStyle = nodeColor;
      ctx.fill();

      // Draw border for selected/hovered
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? '#1d4ed8' : '#93c5fd';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
      }

      // Draw commit ID (short)
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151';
      ctx.font = `${fontSize}px ui-monospace, monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const shortId = node.commit.changeId.slice(0, 8);
      ctx.fillText(shortId, x + nodeRadius + 8, y);

      // If collapsed, show count of hidden commits
      if (node.collapsed) {
        const hiddenCount = getDescendants(node.id).size;
        if (hiddenCount > 0) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = `${fontSize - 1}px sans-serif`;
          ctx.fillText(` (+${hiddenCount} hidden)`, x + nodeRadius + 80, y);
        }
      }

      // Draw bookmarks
      if (node.commit.bookmarks.length > 0) {
        node.commit.bookmarks.forEach((bookmark, index) => {
          const bookmarkY = y - nodeRadius - bookmarkHeight - index * (bookmarkHeight + 4);

          // Draw bookmark background
          ctx.fillStyle = getBookmarkColor(bookmark);
          const bookmarkWidth = ctx.measureText(bookmark.name).width + 16;
          roundRect(ctx, x - bookmarkWidth / 2, bookmarkY, bookmarkWidth, bookmarkHeight, 4);
          ctx.fill();

          // Draw bookmark text
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${fontSize - 1}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(bookmark.name, x, bookmarkY + bookmarkHeight / 2);
        });
      }
    });

    ctx.restore();
  }, [graphNodes, selectedCommit, hoveredNode, scrollOffset, canvasSize, getCommitColor, dimensions.height, getDescendants, draggedNode, dropTargetNode, isDragging]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollOffset({
      x: target.scrollLeft,
      y: target.scrollTop,
    });
  }, []);

  // Handle drag move - must be defined before handleMouseMove
  const handleDragMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset.x;
    const y = e.clientY - rect.top + scrollOffset.y;

    const { nodeSpacingX, nodeSpacingY, paddingX, paddingY, nodeRadius } = DEFAULT_METRICS;

    // Find drop target node (different from dragged node)
    let found: GraphNode | null = null;
    for (const node of graphNodes) {
      if (node.id === draggedNode.id) continue;

      const nodeX = node.x * nodeSpacingX + paddingX;
      const nodeY = node.y * nodeSpacingY + paddingY;

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= nodeRadius + 8) {
        found = node;
        break;
      }
    }

    setDropTargetNode(found);
  }, [isDragging, draggedNode, graphNodes, scrollOffset]);

  // Handle mouse move for hover detection and dragging
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // If dragging, handle drag move
    if (isDragging) {
      handleDragMove(e);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset.x;
    const y = e.clientY - rect.top + scrollOffset.y;

    const { nodeSpacingX, nodeSpacingY, paddingX, paddingY, nodeRadius } = DEFAULT_METRICS;

    // Find hovered node
    let found: GraphNode | null = null;
    for (const node of graphNodes) {
      const nodeX = node.x * nodeSpacingX + paddingX;
      const nodeY = node.y * nodeSpacingY + paddingY;

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= nodeRadius + 4) {
        found = node;
        break;
      }
    }

    setHoveredNode(found);
    // Show grab cursor for draggable nodes
    if (found && found.commit.parents.length > 0) {
      canvas.style.cursor = 'grab';
    } else if (found) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  }, [graphNodes, scrollOffset, isDragging, handleDragMove]);

  // Handle click for selection and collapse toggle
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollOffset.x;
    const clickY = e.clientY - rect.top + scrollOffset.y;

    const { nodeSpacingX, nodeSpacingY, paddingX, paddingY, nodeRadius } = DEFAULT_METRICS;

    // Check if clicking on collapse button
    for (const node of graphNodes) {
      if (!node.visible || !node.hasCollapsedChildren) continue;

      const nodeX = node.x * nodeSpacingX + paddingX;
      const nodeY = node.y * nodeSpacingY + paddingY;
      const collapseX = nodeX - nodeRadius - 12;
      const collapseY = nodeY;

      const distance = Math.sqrt((clickX - collapseX) ** 2 + (clickY - collapseY) ** 2);
      if (distance <= 6) {
        toggleCollapse(node.id);
        return;
      }
    }

    // Otherwise, select the node
    if (hoveredNode) {
      onCommitSelect(hoveredNode.commit);
    }
  }, [graphNodes, scrollOffset, hoveredNode, onCommitSelect, toggleCollapse]);

  // Handle double click for editing (switching working copy)
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCommitEdit) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollOffset.x;
    const clickY = e.clientY - rect.top + scrollOffset.y;

    const { nodeSpacingX, nodeSpacingY, paddingX, paddingY, nodeRadius } = DEFAULT_METRICS;

    // Find the node being double-clicked
    for (const node of graphNodes) {
      if (!node.visible) continue;

      const nodeX = node.x * nodeSpacingX + paddingX;
      const nodeY = node.y * nodeSpacingY + paddingY;

      const distance = Math.sqrt((clickX - nodeX) ** 2 + (clickY - nodeY) ** 2);
      if (distance <= nodeRadius + 4) {
        onCommitEdit(node.commit);
        return;
      }
    }
  }, [graphNodes, scrollOffset, onCommitEdit]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hoveredNode || !onRebase) return;

    // Only allow dragging non-immutable commits (not root, not immutable)
    if (hoveredNode.commit.parents.length === 0) return;

    setDraggedNode(hoveredNode);
    setIsDragging(true);
  }, [hoveredNode, onRebase]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (isDragging && draggedNode && dropTargetNode && onRebase) {
      // Perform rebase: move dragged node to after drop target
      onRebase(draggedNode.commit.changeId, dropTargetNode.commit.changeId, true);
    }

    setIsDragging(false);
    setDraggedNode(null);
    setDropTargetNode(null);
  }, [isDragging, draggedNode, dropTargetNode, onRebase]);

  // Scroll to a specific node
  const scrollToNode = useCallback((node: GraphNode) => {
    const container = containerRef.current;
    if (!container) return;

    const { nodeSpacingX, nodeSpacingY, paddingX, paddingY } = DEFAULT_METRICS;
    const x = node.x * nodeSpacingX + paddingX;
    const y = node.y * nodeSpacingY + paddingY;

    // Center the node in the viewport
    const targetX = x - dimensions.width / 2;
    const targetY = y - dimensions.height / 2;

    container.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: 'smooth',
    });
  }, [dimensions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (graphNodes.length === 0) return;

    const visibleNodes = graphNodes.filter((n) => n.visible);
    if (visibleNodes.length === 0) return;

    // Find current selection index
    const currentIndex = selectedCommit
      ? visibleNodes.findIndex((n) => n.id === selectedCommit.id)
      : -1;

    let nextNode: GraphNode | null = null;

    switch (e.key) {
      case 'ArrowDown':
      case 'j': // vim-style
        e.preventDefault();
        if (currentIndex < visibleNodes.length - 1) {
          nextNode = visibleNodes[currentIndex + 1];
        } else if (currentIndex === -1) {
          nextNode = visibleNodes[0];
        }
        break;

      case 'ArrowUp':
      case 'k': // vim-style
        e.preventDefault();
        if (currentIndex > 0) {
          nextNode = visibleNodes[currentIndex - 1];
        } else if (currentIndex === -1) {
          nextNode = visibleNodes[0];
        }
        break;

      case 'ArrowLeft':
      case 'h': // vim-style
        e.preventDefault();
        if (selectedCommit) {
          // Move to parent
          const current = visibleNodes.find((n) => n.id === selectedCommit.id);
          if (current && current.commit.parents.length > 0) {
            nextNode = visibleNodes.find((n) => n.id === current.commit.parents[0]) || null;
          }
        }
        break;

      case 'ArrowRight':
      case 'l': // vim-style
        e.preventDefault();
        if (selectedCommit) {
          // Move to first child
          const current = visibleNodes.find((n) => n.id === selectedCommit.id);
          if (current) {
            const children = visibleNodes.filter((n) =>
              n.commit.parents.includes(selectedCommit.id)
            );
            if (children.length > 0) {
              nextNode = children[0];
            }
          }
        }
        break;

      case 'Home':
      case 'g': // vim-style
        e.preventDefault();
        nextNode = visibleNodes[0];
        break;

      case 'End':
      case 'G': // vim-style
        e.preventDefault();
        nextNode = visibleNodes[visibleNodes.length - 1];
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        // Toggle collapse for selected commit if it has children
        if (selectedCommit) {
          const selectedNode = graphNodes.find((n) => n.id === selectedCommit.id);
          if (selectedNode && selectedNode.hasCollapsedChildren) {
            toggleCollapse(selectedNode.id);
          }
        }
        break;

      case 'c':
        e.preventDefault();
        // Toggle collapse for selected commit
        if (selectedCommit) {
          toggleCollapse(selectedCommit.id);
        }
        break;
    }

    if (nextNode) {
      onCommitSelect(nextNode.commit);
      scrollToNode(nextNode);
    }
  }, [graphNodes, selectedCommit, onCommitSelect, scrollToNode, toggleCollapse]);

  // Show error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-500 dark:text-red-400 max-w-md p-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium">Error loading commits</p>
          <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">Check the server logs for more details.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg className="animate-spin w-12 h-12 mx-auto mb-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">Loading commits...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no commits
  if (commits.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium">No commits to display</p>
          <p className="text-sm mt-2">The repository may be empty or loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto outline-none"
      onScroll={handleScroll}
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseLeave={() => {
          setHoveredNode(null);
          handleMouseUp();
        }}
      />
      {/* Drag indicator overlay */}
      {isDragging && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">
          Drag to rebase
        </div>
      )}
    </div>
  );
}

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper to get bookmark color
function getBookmarkColor(bookmark: Bookmark): string {
  if (bookmark.isRemote) {
    return '#059669'; // emerald-600
  }
  return '#7c3aed'; // violet-600
}

export default CommitGraph;
