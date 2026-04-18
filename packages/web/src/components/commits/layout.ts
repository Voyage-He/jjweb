/**
 * Commit graph layout algorithm
 * Positions commits in a DAG layout suitable for Git/jj-style visualization
 * Supports H-Tree branch layout for visualizing branch structures
 */

import type { Commit } from '@jujutsu-gui/shared';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  lane: number;
  // Branch information for branch visualization
  branchDepth: number;
  siblingIndex: number;
  isMergePoint: boolean;
  branchId: string;
  branchColor: string;
}

export interface BranchInfo {
  branchId: string;
  branchDepth: number;
  siblingIndex: number;
  color: string;
}

export interface BranchGraph {
  adjacencyList: Map<string, string[]>;
  childrenMap: Map<string, string[]>;
  parentMap: Map<string, string[]>;
  mergePoints: Set<string>;
  branchInfo: Map<string, BranchInfo>;
}

interface CommitData {
  commit: Commit;
  children: string[];
  parents: string[];
}

// Maximum number of branch lanes before triggering overflow handling
const MAX_BRANCH_LANES = 12;

/**
 * Simple string hash function for generating consistent branch colors
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Build branch graph structure from commits
 * Creates adjacency list and detects merge points
 */
export function buildBranchGraph(commits: Commit[]): BranchGraph {
  const adjacencyList = new Map<string, string[]>();
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();
  const mergePoints = new Set<string>();

  // Initialize maps
  commits.forEach((commit) => {
    adjacencyList.set(commit.id, []);
    childrenMap.set(commit.id, []);
    parentMap.set(commit.id, commit.parents);
  });

  // Build adjacency list (child -> parents) and children map (parent -> children)
  commits.forEach((commit) => {
    commit.parents.forEach((parentId) => {
      if (adjacencyList.has(parentId)) {
        adjacencyList.get(parentId)!.push(commit.id);
      }
      if (childrenMap.has(parentId)) {
        childrenMap.get(parentId)!.push(commit.id);
      }
    });

    // Detect merge points: a commit is a merge point if it has multiple children
    const children = childrenMap.get(commit.id) || [];
    if (children.length > 1) {
      mergePoints.add(commit.id);
    }
  });

  // Detect merge targets: a commit is a merge target if it has multiple parents
  commits.forEach((commit) => {
    if (commit.parents.length > 1) {
      mergePoints.add(commit.id);
    }
  });

  // Assign branch IDs and track branch info
  const branchInfo = new Map<string, BranchInfo>();
  const branchColors = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  // Traverse commits to assign branch IDs
  const visited = new Set<string>();

  // Find root commits
  const roots: Commit[] = [];
  commits.forEach((commit) => {
    if (commit.parents.length === 0 || commit.parents.every((p) => !adjacencyList.has(p))) {
      roots.push(commit);
    }
  });

  // BFS to assign branch IDs
  const queue: { commitId: string; branchId: string; branchDepth: number; siblingIndex: number }[] = [];
  roots.forEach((root, index) => {
    const branchId = `branch-${index}`;
    branchInfo.set(root.id, {
      branchId,
      branchDepth: 0,
      siblingIndex: 0,
      color: branchColors[index % branchColors.length],
    });
    queue.push({ commitId: root.id, branchId, branchDepth: 0, siblingIndex: 0 });
  });

  while (queue.length > 0) {
    const { commitId, branchId, branchDepth, siblingIndex } = queue.shift()!;
    if (visited.has(commitId)) continue;
    visited.add(commitId);

    const children = childrenMap.get(commitId) || [];
    children.forEach((childId, index) => {
      if (!visited.has(childId)) {
        // Determine branch assignment
        const siblings = children.length;
        const childBranchId = siblings > 1 ? `${branchId}-${index}` : branchId;
        const childBranchDepth = siblings > 1 ? branchDepth + 1 : branchDepth;
        const childSiblingIndex = siblings > 1 ? index : siblingIndex;

        branchInfo.set(childId, {
          branchId: childBranchId,
          branchDepth: childBranchDepth,
          siblingIndex: childSiblingIndex,
          color: branchColors[Math.abs(hashString(childBranchId)) % branchColors.length],
        });
        queue.push({
          commitId: childId,
          branchId: childBranchId,
          branchDepth: childBranchDepth,
          siblingIndex: childSiblingIndex,
        });
      }
    });
  }

  return {
    adjacencyList,
    childrenMap,
    parentMap,
    mergePoints,
    branchInfo,
  };
}

/**
 * Layout commits using H-Tree branch layout
 * Assigns branch-aware positions: horizontal for branches, vertical for time
 */
export function layoutCommits(commits: Commit[]): LayoutNode[] {
  if (commits.length === 0) return [];

  const branchGraph = buildBranchGraph(commits);

  // Build commit data with parent/child relationships
  const commitMap = new Map<string, CommitData>();
  commits.forEach((commit) => {
    commitMap.set(commit.id, {
      commit,
      children: [],
      parents: commit.parents,
    });
  });

  // Build child relationships
  commits.forEach((commit) => {
    commit.parents.forEach((parentId) => {
      const parent = commitMap.get(parentId);
      if (parent) {
        parent.children.push(commit.id);
      }
    });
  });

  // Find root commits (no parents or parents not in our set)
  const roots: string[] = [];
  commits.forEach((commit) => {
    if (commit.parents.length === 0) {
      roots.push(commit.id);
    } else {
      const hasParentInSet = commit.parents.some((p) => commitMap.has(p));
      if (!hasParentInSet) {
        roots.push(commit.id);
      }
    }
  });

  // Topological sort (BFS from roots)
  const sorted: string[] = [];
  const visited = new Set<string>();
  const queue = [...roots];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;

    visited.add(id);
    sorted.push(id);

    // Add children to queue (they can now be processed)
    const data = commitMap.get(id);
    if (data) {
      data.children.forEach((childId) => {
        // Only add if all parents are visited
        const childData = commitMap.get(childId);
        if (childData && childData.parents.every((p) => visited.has(p))) {
          queue.push(childId);
        }
      });
    }
  }

  // Add any unvisited commits (handles disconnected components)
  commits.forEach((commit) => {
    if (!visited.has(commit.id)) {
      sorted.push(commit.id);
    }
  });

  // Reverse to get commits from newest to oldest
  sorted.reverse();

  // Assign positions using H-Tree layout
  // x represents horizontal position (branch lanes)
  // y represents vertical position (time)
  const positions = new Map<string, { x: number; y: number }>();
  const laneOccupancy: Map<number, number> = new Map(); // lane -> last y position

  // Track branch-specific lanes
  const branchLanes = new Map<string, number>();

  sorted.forEach((id, y) => {
    const data = commitMap.get(id);
    if (!data) return;

    const branchInfo = branchGraph.branchInfo.get(id);
    const branchDepth = branchInfo?.branchDepth ?? 0;

    // Calculate x position based on branch depth and sibling index
    // H-Tree: siblings branch out horizontally from parent
    let x: number;

    if (data.parents.length === 0) {
      // Root commit
      x = 0;
      branchLanes.set(id, 0);
    } else if (data.parents.length === 1) {
      // Single parent: continue in same lane or branch
      const parentId = data.parents[0];
      const parentLane = branchLanes.get(parentId);
      if (parentLane !== undefined) {
        x = parentLane;
      } else {
        x = branchDepth;
      }
      branchLanes.set(id, x);
    } else {
      // Multiple parents (merge): use lane based on branch
      const parentLanes = data.parents
        .map((p) => branchLanes.get(p))
        .filter((l) => l !== undefined) as number[];

      if (parentLanes.length > 0) {
        // Take the maximum lane of all parents
        x = Math.max(...parentLanes) + 1;
      } else {
        x = branchDepth;
      }
      branchLanes.set(id, x);
    }

    // Ensure no lane conflicts at the same y position
    while (laneOccupancy.has(x) && laneOccupancy.get(x)! >= y) {
      x++;
    }
    laneOccupancy.set(x, y);

    positions.set(id, { x, y });
  });

  // Build layout nodes
  const layoutNodes: LayoutNode[] = sorted.map((id) => {
    const pos = positions.get(id)!;
    const branchInfo = branchGraph.branchInfo.get(id);
    return {
      id,
      x: pos.x,
      y: pos.y,
      lane: pos.x,
      branchDepth: branchInfo?.branchDepth ?? 0,
      siblingIndex: branchInfo?.siblingIndex ?? 0,
      isMergePoint: branchGraph.mergePoints.has(id),
      branchId: branchInfo?.branchId ?? 'default',
      branchColor: branchInfo?.color ?? '#6b7280',
    };
  });

  return layoutNodes;
}

/**
 * Calculate layout metadata including whether branch width overflow occurred
 */
export function getLayoutMetadata(nodes: LayoutNode[]): {
  width: number;
  height: number;
  laneCount: number;
  overflow: boolean;
  scaleFactor: number;
} {
  if (nodes.length === 0) {
    return { width: 0, height: 0, laneCount: 0, overflow: false, scaleFactor: 1 };
  }

  const maxX = Math.max(...nodes.map((n) => n.x));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const laneCount = maxX + 1;
  const overflow = laneCount > MAX_BRANCH_LANES;
  const scaleFactor = overflow ? MAX_BRANCH_LANES / laneCount : 1;

  return {
    width: maxX + 1,
    height: maxY + 1,
    laneCount,
    overflow,
    scaleFactor,
  };
}

/**
 * Get scaled layout nodes for rendering when branch width exceeds maximum
 * Applies horizontal compression to fit within MAX_BRANCH_LANES
 */
export function getScaledLayoutNodes(nodes: LayoutNode[]): LayoutNode[] {
  const metadata = getLayoutMetadata(nodes);
  if (!metadata.overflow) return nodes;

  // Scale x positions to fit within MAX_BRANCH_LANES
  return nodes.map((node) => ({
    ...node,
    x: Math.round(node.x * metadata.scaleFactor),
  }));
}

/**
 * Calculate the bounding box of the layout
 */
export function getLayoutBounds(nodes: LayoutNode[]): { width: number; height: number } {
  if (nodes.length === 0) return { width: 0, height: 0 };

  const maxX = Math.max(...nodes.map((n) => n.x));
  const maxY = Math.max(...nodes.map((n) => n.y));

  return {
    width: maxX + 1,
    height: maxY + 1,
  };
}

/**
 * Find the path between two commits
 */
export function findPath(
  commits: Commit[],
  fromId: string,
  toId: string
): string[] {
  const commitMap = new Map<string, Commit>();
  commits.forEach((c) => commitMap.set(c.id, c));

  // BFS from 'from' to 'to'
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    if (id === toId) {
      return path;
    }

    const commit = commitMap.get(id);
    if (commit) {
      // Search both parents and children
      const children = Array.from(commitMap.values())
        .filter((c) => c.parents.includes(id))
        .map((c) => c.id);
      [...commit.parents, ...children]
        .forEach((nextId) => {
          if (!visited.has(nextId)) {
            queue.push({ id: nextId, path: [...path, nextId] });
          }
        });
    }
  }

  return [];
}

/**
 * Check if a color meets WCAG contrast requirements for accessibility
 * Returns true if the color has sufficient contrast with a white background
 */
export function hasGoodContrast(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;

  // Calculate relative luminance using WCAG formula
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Calculate contrast ratio with white background (luminance 1)
  // WCAG formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter
  const whiteLuminance = 1;
  const contrastRatio = (Math.max(luminance, whiteLuminance) + 0.05) / (Math.min(luminance, whiteLuminance) + 0.05);

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  return contrastRatio >= 3;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Get a high-contrast alternative color if needed
 * Returns a darker or lighter version of the color for better contrast
 */
export function getHighContrastColor(hexColor: string): string {
  if (hasGoodContrast(hexColor)) return hexColor;

  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#6b7280'; // fallback gray

  // Calculate relative luminance
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // If color is too light, darken it; if too dark, lighten it
  if (luminance > 0.5) {
    // Darken - reduce each channel
    return `#${Math.round(rgb.r * 0.6).toString(16).padStart(2, '0')}${Math.round(rgb.g * 0.6).toString(16).padStart(2, '0')}${Math.round(rgb.b * 0.6).toString(16).padStart(2, '0')}`;
  } else {
    // Lighten - approach white
    const lift = 0.4;
    const nr = Math.round(rgb.r + (255 - rgb.r) * lift);
    const ng = Math.round(rgb.g + (255 - rgb.g) * lift);
    const nb = Math.round(rgb.b + (255 - rgb.b) * lift);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  }
}

export default layoutCommits;
