/**
 * Commit graph layout algorithm
 * Positions commits in a DAG layout suitable for Git/jj-style visualization
 */

import type { Commit } from '@jujutsu-gui/shared';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  lane: number;
}

interface CommitData {
  commit: Commit;
  children: string[];
  parents: string[];
}

/**
 * Layout commits using a modified topological sort
 * Assigns lanes to avoid edge crossings where possible
 */
export function layoutCommits(commits: Commit[]): LayoutNode[] {
  if (commits.length === 0) return [];

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

  // Assign lanes using a greedy algorithm
  const lanes = new Map<string, number>();
  const laneOccupancy: number[] = []; // Track which lanes are occupied at each y position

  sorted.forEach((id, y) => {
    const data = commitMap.get(id);
    if (!data) return;

    // Find available lane
    let lane = 0;

    // If has parents, try to use a lane close to them
    if (data.parents.length > 0) {
      const parentLanes = data.parents
        .map((p) => lanes.get(p))
        .filter((l) => l !== undefined) as number[];

      if (parentLanes.length > 0) {
        // Use the maximum parent lane (most to the right)
        lane = Math.max(...parentLanes);
      }
    }

    // Check if lane is available at this y position
    while (laneOccupancy[y] !== undefined && laneOccupancy[y] >= lane) {
      lane++;
    }

    lanes.set(id, lane);
    laneOccupancy[y] = lane;
  });

  // Build layout nodes
  const layoutNodes: LayoutNode[] = sorted.map((id, y) => ({
    id,
    x: lanes.get(id) || 0,
    y,
    lane: lanes.get(id) || 0,
  }));

  return layoutNodes;
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
      [...commit.parents, ...commitMap.values()
        .filter((c) => c.parents.includes(id))
        .map((c) => c.id)]
        .forEach((nextId) => {
          if (!visited.has(nextId)) {
            queue.push({ id: nextId, path: [...path, nextId] });
          }
        });
    }
  }

  return [];
}

export default layoutCommits;
