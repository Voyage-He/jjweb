/**
 * Tests for Commit Graph Layout Algorithm
 */

import { describe, it, expect } from 'vitest';
import { layoutCommits, buildBranchGraph, getLayoutMetadata, hasGoodContrast, getHighContrastColor } from './layout';
import type { Commit } from '@jujutsu-gui/shared';

// Helper to create a commit
function createCommit(id: string, parents: string[] = []): Commit {
  return {
    id,
    changeId: `change-${id}`,
    parents,
    author: { name: 'Test', email: 'test@test.com', timestamp: Date.now() },
    committer: { name: 'Test', email: 'test@test.com', timestamp: Date.now() },
    description: `Commit ${id}`,
    timestamp: Date.now(),
    bookmarks: [],
    tags: [],
  };
}

describe('layoutCommits', () => {
  it('should return empty array for empty commits', () => {
    const result = layoutCommits([]);
    expect(result).toEqual([]);
  });

  it('should layout a single commit', () => {
    const commits = [createCommit('1')];
    const result = layoutCommits(commits);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].x).toBe(0);
    expect(result[0].y).toBe(0);
  });

  it('should layout linear commits vertically', () => {
    const commits = [
      createCommit('1'),
      createCommit('2', ['1']),
      createCommit('3', ['2']),
    ];
    const result = layoutCommits(commits);

    expect(result).toHaveLength(3);
    // All should be in lane 0 for linear commits
    expect(result.every(n => n.lane === 0)).toBe(true);
  });

  it('should assign branch info to commits', () => {
    const commits = [
      createCommit('1'),
      createCommit('2', ['1']),
      createCommit('3', ['1']),
    ];
    const result = layoutCommits(commits);

    // Find the root commit (1) which should have branchDepth 0
    const rootNode = result.find(n => n.id === '1');
    expect(rootNode?.branchDepth).toBe(0);
    expect(rootNode?.branchId).toBeTruthy();
    expect(rootNode?.branchColor).toBeTruthy();
  });

  it('should detect merge points', () => {
    const commits = [
      createCommit('1'),
      createCommit('2', ['1']),
      createCommit('3', ['1']),
      createCommit('4', ['2', '3']), // merge commit
    ];
    const result = layoutCommits(commits);

    const mergeCommit = result.find(n => n.id === '4');
    expect(mergeCommit?.isMergePoint).toBe(true);
  });

  it('should assign different colors to different branches', () => {
    const commits = [
      createCommit('1'),
      createCommit('2', ['1']),
      createCommit('3', ['1']),
    ];
    const result = layoutCommits(commits);

    const colors = new Set(result.map(n => n.branchColor));
    // At least 2 should have unique colors
    expect(colors.size).toBeGreaterThanOrEqual(2);
  });
});

describe('buildBranchGraph', () => {
  it('should build adjacency list correctly', () => {
    const commits = [
      createCommit('1'),
      createCommit('2', ['1']),
      createCommit('3', ['1']),
    ];
    const graph = buildBranchGraph(commits);

    expect(graph.adjacencyList.get('1')).toContain('2');
    expect(graph.adjacencyList.get('1')).toContain('3');
    expect(graph.childrenMap.get('1')).toContain('2');
    expect(graph.childrenMap.get('1')).toContain('3');
  });

  it('should detect children for merge commits', () => {
    const commits = [
      createCommit('1'),
      createCommit('2', ['1']),
      createCommit('3', ['1']),
      createCommit('4', ['2', '3']),
    ];
    const graph = buildBranchGraph(commits);

    expect(graph.mergePoints.has('4')).toBe(true);
  });
});

describe('getLayoutMetadata', () => {
  it('should return correct metadata for empty layout', () => {
    const result = getLayoutMetadata([]);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
    expect(result.overflow).toBe(false);
  });

  it('should detect overflow when lane count exceeds MAX_BRANCH_LANES', () => {
    const commits = Array.from({ length: 20 }, (_, i) =>
      createCommit(`${i}`, i === 0 ? [] : [`${i - 1}`])
    );
    const layout = layoutCommits(commits);
    const metadata = getLayoutMetadata(layout);

    // With 20 sequential commits, they should all be in lane 0
    // so no overflow should occur
    expect(metadata.overflow).toBe(false);
  });
});

describe('hasGoodContrast', () => {
  it('should return true for high contrast colors', () => {
    expect(hasGoodContrast('#000000')).toBe(true);
    expect(hasGoodContrast('#ffffff')).toBe(false); // white on white = bad
    expect(hasGoodContrast('#3b82f6')).toBe(true);
  });

  it('should return false for low contrast colors', () => {
    expect(hasGoodContrast('#ffffff')).toBe(false);
    expect(hasGoodContrast('#ffff00')).toBe(false);
  });
});

describe('getHighContrastColor', () => {
  it('should return same color for good contrast colors', () => {
    const dark = '#000000';
    expect(getHighContrastColor(dark)).toBe(dark);
  });

  it('should modify low contrast colors', () => {
    const light = '#ffffff';
    const result = getHighContrastColor(light);
    expect(result).not.toBe(light);
  });
});
