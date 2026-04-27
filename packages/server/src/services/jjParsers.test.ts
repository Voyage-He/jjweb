/**
 * Tests for JJ Output Parsers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Commit } from '@jujutsu-gui/shared';

// Mock jjExecutor
vi.mock('./jjExecutor.js', () => ({
  jjExecutor: {
    execute: vi.fn(),
  },
}));

import { jjExecutor } from './jjExecutor.js';
import { parseLog, parseStatus, parseDiff, parseBookmarks } from './jjParsers.js';

const makeLogCommit = (overrides: Record<string, unknown> = {}) => ({
  change_id: 'change',
  commit_id: 'commit',
  parents: [],
  author: { name: 'X', email: 'x', timestamp: '2024-01-01 10:00:00 +00:00' },
  committer: { name: 'X', email: 'x', timestamp: '2024-01-01 10:00:00 +00:00' },
  description: 'Commit',
  ...overrides,
});

const commitLine = (commit: Record<string, unknown>, bookmarks: string[] = []) =>
  `${JSON.stringify(commit)}|||BOOKMARKS|||${bookmarks.join(':::')}`;

const findCommit = (commits: Commit[], id: string) => commits.find((commit: Commit) => commit.id === id);

const maxColumn = (commits: Commit[]) => Math.max(...commits.map(commit => commit.column ?? 0));

const countCommitLineCrossings = (commits: Commit[]) => {
  const commitMap = new Map(commits.map(commit => [commit.id, commit]));
  const edges = commits.flatMap((commit) => {
    if (commit.row === undefined || commit.column === undefined) return [];
    return commit.parents.map((parentId) => {
      const parent = commitMap.get(parentId);
      if (!parent || parent.row === undefined || parent.column === undefined) return null;
      return {
        childId: commit.id,
        parentId,
        x1: commit.column,
        y1: commit.row,
        x2: parent.column,
        y2: parent.row,
      };
    }).filter(edge => edge !== null);
  });

  let crossings = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const a = edges[i]!;
      const b = edges[j]!;
      if (
        a.childId === b.childId ||
        a.childId === b.parentId ||
        a.parentId === b.childId ||
        a.parentId === b.parentId
      ) {
        continue;
      }

      const yStart = Math.max(Math.min(a.y1, a.y2), Math.min(b.y1, b.y2));
      const yEnd = Math.min(Math.max(a.y1, a.y2), Math.max(b.y1, b.y2));
      if (yStart >= yEnd) continue;

      const axStart = interpolateTestX(a.x1, a.y1, a.x2, a.y2, yStart + 0.001);
      const bxStart = interpolateTestX(b.x1, b.y1, b.x2, b.y2, yStart + 0.001);
      const axEnd = interpolateTestX(a.x1, a.y1, a.x2, a.y2, yEnd - 0.001);
      const bxEnd = interpolateTestX(b.x1, b.y1, b.x2, b.y2, yEnd - 0.001);
      if ((axStart - bxStart) * (axEnd - bxEnd) < 0) {
        crossings++;
      }
    }
  }
  return crossings;
};

const interpolateTestX = (x1: number, y1: number, x2: number, y2: number, y: number) =>
  x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);

describe('JJ Parsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseLog', () => {
    it('should parse jj log JSON output', async () => {
      const mockOutput = JSON.stringify({
        change_id: 'z1234567890',
        commit_id: 'a1b2c3d4e5f6',
        parents: ['p1a2b3c4d5e6'],
        author: { name: 'Test Author', email: 'test@example.com', timestamp: '2024-01-15 10:30:00 -08:00' },
        committer: { name: 'Test Author', email: 'test@example.com', timestamp: '2024-01-15 10:30:00 -08:00' },
        description: 'Test commit',
        local_bookmarks: ['main'],
        tags: [],
        working_copy: false,
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: mockOutput + '\n',
        stderr: '',
        exitCode: 0,
        success: true,
      });

      const commits = await parseLog('/test/repo');

      expect(commits).toHaveLength(1);
      expect(commits[0].changeId).toBe('z1234567890');
      expect(commits[0].id).toBe('a1b2c3d4e5f6');
      expect(commits[0].description).toBe('Test commit');
      expect(commits[0].bookmarks).toHaveLength(1);
      expect(commits[0].bookmarks[0].name).toBe('main');
    });

    it('should handle empty repository', async () => {
      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0,
        success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(commits).toHaveLength(0);
    });

    it('should throw on parse error', async () => {
      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: 'invalid json\n',
        stderr: '',
        exitCode: 0,
        success: true,
      });

      await expect(parseLog('/test/repo')).rejects.toThrow();
    });

    it('should calculate correct grid coordinates for linear history', async () => {
      const commitA = {
        change_id: 'a', commit_id: 'A', parents: ['B'],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 10:00:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 10:00:00 +00:00' },
        description: 'A'
      };
      const commitB = {
        change_id: 'b', commit_id: 'B', parents: ['C'],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 09:00:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 09:00:00 +00:00' },
        description: 'B'
      };
      const commitC = {
        change_id: 'c', commit_id: 'C', parents: [],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 08:00:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 08:00:00 +00:00' },
        description: 'C'
      };

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: JSON.stringify(commitA) + '\n' + JSON.stringify(commitB) + '\n' + JSON.stringify(commitC) + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(commits).toHaveLength(3);
      expect(commits[0].row).toBe(0); expect(commits[0].column).toBe(0);
      expect(commits[1].row).toBe(1); expect(commits[1].column).toBe(0);
      expect(commits[2].row).toBe(2); expect(commits[2].column).toBe(0);
    });

    it('should calculate correct grid coordinates for a fork', async () => {
      // Fork: A and B both have parent C
      const commitA = {
        change_id: 'a', commit_id: 'A', parents: ['C'],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 10:00:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 10:00:00 +00:00' },
        description: 'A'
      };
      const commitB = {
        change_id: 'b', commit_id: 'B', parents: ['C'],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 09:30:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 09:30:00 +00:00' },
        description: 'B'
      };
      const commitC = {
        change_id: 'c', commit_id: 'C', parents: [],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 08:00:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 08:00:00 +00:00' },
        description: 'C'
      };

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: JSON.stringify(commitA) + '\n' + JSON.stringify(commitB) + '\n' + JSON.stringify(commitC) + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(commits[0].id).toBe('A');
      expect(commits[0].column).toBe(0);
      expect(commits[1].id).toBe('B');
      expect(commits[1].column).toBe(1);
      expect(commits[2].id).toBe('C');
      expect(commits[2].column).toBe(0); // Should claim lane 0
    });

    it('should assign the newest fork child to the closest column when scores are tied', async () => {
      const newestBranch = makeLogCommit({
        change_id: 'newest',
        commit_id: 'NEW',
        parents: ['BASE'],
        description: 'Newest branch',
      });
      const olderBranch = makeLogCommit({
        change_id: 'older',
        commit_id: 'OLD',
        parents: ['BASE'],
        description: 'Older branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [newestBranch, olderBranch, base].map(commit => commitLine(commit)).join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'NEW')?.column).toBe(0);
      expect(findCommit(commits, 'OLD')?.column).toBe(1);
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
    });

    it('should keep the main branch in column 0 over a newer unbookmarked branch', async () => {
      const newerBranch = makeLogCommit({
        change_id: 'newer',
        commit_id: 'NEW',
        parents: ['BASE'],
        description: 'Newer branch',
      });
      const mainBranch = makeLogCommit({
        change_id: 'main',
        commit_id: 'MAIN',
        parents: ['BASE'],
        description: 'Main branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(newerBranch),
          commitLine(mainBranch, ['main']),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'MAIN')?.column).toBe(0);
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
      expect(findCommit(commits, 'NEW')?.column).toBe(1);
    });

    it('should keep the working copy and its primary ancestor chain in column 0', async () => {
      const workingCopy = makeLogCommit({
        change_id: 'wc',
        commit_id: 'WC',
        parents: ['BASE'],
        description: 'Working copy',
        working_copy: true,
      });
      const mainBranch = makeLogCommit({
        change_id: 'main',
        commit_id: 'MAIN',
        parents: ['BASE'],
        description: 'Main branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(workingCopy),
          commitLine(mainBranch, ['main']),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'WC')?.column).toBe(0);
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
      expect(findCommit(commits, 'MAIN')?.column).toBe(1);
    });

    it('should choose main before master when pinning a bookmark mainline', async () => {
      const masterBranch = makeLogCommit({
        change_id: 'master',
        commit_id: 'MASTER',
        parents: ['BASE'],
        description: 'Master branch',
      });
      const mainBranch = makeLogCommit({
        change_id: 'main',
        commit_id: 'MAIN',
        parents: ['BASE'],
        description: 'Main branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(masterBranch, ['master']),
          commitLine(mainBranch, ['main']),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'MAIN')?.column).toBe(0);
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
      expect(findCommit(commits, 'MASTER')?.column).toBe(1);
    });

    it('should keep the pinned mainline child on its parent column', async () => {
      const sideBranch = makeLogCommit({
        change_id: 'side',
        commit_id: 'SIDE',
        parents: ['BASE'],
        description: 'Side branch',
      });
      const mainBranch = makeLogCommit({
        change_id: 'main',
        commit_id: 'MAIN',
        parents: ['BASE'],
        description: 'Main branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(sideBranch),
          commitLine(mainBranch, ['main']),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
      expect(findCommit(commits, 'MAIN')?.column).toBe(findCommit(commits, 'BASE')?.column);
      expect(findCommit(commits, 'SIDE')?.column).toBe(1);
    });

    it('should reuse a side column for non-overlapping short branches', async () => {
      const mainTip = makeLogCommit({
        change_id: 'main-tip',
        commit_id: 'MAIN_TIP',
        parents: ['MAIN_BASE'],
        description: 'Main tip',
      });
      const newerSide = makeLogCommit({
        change_id: 'newer-side',
        commit_id: 'NEWER_SIDE',
        parents: ['MAIN_BASE'],
        description: 'Newer short side branch',
      });
      const mainBase = makeLogCommit({
        change_id: 'main-base',
        commit_id: 'MAIN_BASE',
        parents: ['BASE'],
        description: 'Main base',
      });
      const olderSide = makeLogCommit({
        change_id: 'older-side',
        commit_id: 'OLDER_SIDE',
        parents: ['BASE'],
        description: 'Older short side branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(mainTip, ['main']),
          commitLine(newerSide),
          commitLine(mainBase),
          commitLine(olderSide),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'MAIN_TIP')?.column).toBe(0);
      expect(findCommit(commits, 'MAIN_BASE')?.column).toBe(0);
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
      expect(findCommit(commits, 'OLDER_SIDE')?.column).toBe(1);
      expect(findCommit(commits, 'NEWER_SIDE')?.column).toBe(1);
      expect(maxColumn(commits)).toBe(1);
    });

    it('should release a merged side branch column for later branches', async () => {
      const mainHead = makeLogCommit({
        change_id: 'main-head',
        commit_id: 'MAIN_HEAD',
        parents: ['AFTER_MERGE'],
        description: 'Main head',
      });
      const laterSide = makeLogCommit({
        change_id: 'later-side',
        commit_id: 'LATER_SIDE',
        parents: ['AFTER_MERGE'],
        description: 'Later side branch',
      });
      const afterMerge = makeLogCommit({
        change_id: 'after-merge',
        commit_id: 'AFTER_MERGE',
        parents: ['MERGE'],
        description: 'Main after merge',
      });
      const merge = makeLogCommit({
        change_id: 'merge',
        commit_id: 'MERGE',
        parents: ['MAIN_BEFORE', 'SIDE'],
        description: 'Merge side into main',
      });
      const mainBefore = makeLogCommit({
        change_id: 'main-before',
        commit_id: 'MAIN_BEFORE',
        parents: ['BASE'],
        description: 'Main before merge',
      });
      const side = makeLogCommit({
        change_id: 'side',
        commit_id: 'SIDE',
        parents: ['BASE'],
        description: 'Merged side branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(mainHead, ['main']),
          commitLine(laterSide),
          commitLine(afterMerge),
          commitLine(merge),
          commitLine(mainBefore),
          commitLine(side),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'MAIN_HEAD')?.column).toBe(0);
      expect(findCommit(commits, 'AFTER_MERGE')?.column).toBe(0);
      expect(findCommit(commits, 'MERGE')?.column).toBe(0);
      expect(findCommit(commits, 'MAIN_BEFORE')?.column).toBe(0);
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
      expect(findCommit(commits, 'SIDE')?.column).toBe(1);
      expect(findCommit(commits, 'LATER_SIDE')?.column).toBe(1);
      expect(maxColumn(commits)).toBe(1);
    });

    it('should keep a merge parent lane occupied until the merge edge ends', async () => {
      const mainHead = makeLogCommit({
        change_id: 'main-head',
        commit_id: 'MAIN_HEAD',
        parents: ['AFTER_MERGE'],
        description: 'Main head',
      });
      const laterSide = makeLogCommit({
        change_id: 'later-side',
        commit_id: 'LATER_SIDE',
        parents: ['AFTER_MERGE'],
        description: 'Later side branch',
      });
      const afterMerge = makeLogCommit({
        change_id: 'after-merge',
        commit_id: 'AFTER_MERGE',
        parents: ['MERGE'],
        description: 'Main after merge',
      });
      const merge = makeLogCommit({
        change_id: 'merge',
        commit_id: 'MERGE',
        parents: ['MAIN_BEFORE', 'SIDE'],
        description: 'Merge side into main',
      });
      const blockedSide = makeLogCommit({
        change_id: 'blocked-side',
        commit_id: 'BLOCKED_SIDE',
        parents: ['MAIN_BEFORE'],
        description: 'Side branch while merge edge is active',
      });
      const mainBefore = makeLogCommit({
        change_id: 'main-before',
        commit_id: 'MAIN_BEFORE',
        parents: ['BASE'],
        description: 'Main before merge',
      });
      const side = makeLogCommit({
        change_id: 'side',
        commit_id: 'SIDE',
        parents: ['BASE'],
        description: 'Merged side branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(mainHead, ['main']),
          commitLine(laterSide),
          commitLine(afterMerge),
          commitLine(merge),
          commitLine(blockedSide),
          commitLine(mainBefore),
          commitLine(side),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'SIDE')?.column).toBe(1);
      expect(findCommit(commits, 'LATER_SIDE')?.column).toBe(1);
      expect(findCommit(commits, 'BLOCKED_SIDE')?.column).toBe(2);
      expect(maxColumn(commits)).toBe(2);
    });

    it('should keep the working copy pinned while reusing released side columns', async () => {
      const workingCopy = makeLogCommit({
        change_id: 'wc',
        commit_id: 'WC',
        parents: ['MAIN_TIP'],
        description: 'Working copy',
        working_copy: true,
      });
      const mainTip = makeLogCommit({
        change_id: 'main-tip',
        commit_id: 'MAIN_TIP',
        parents: ['MAIN_BASE'],
        description: 'Main tip',
      });
      const olderSide = makeLogCommit({
        change_id: 'older-side',
        commit_id: 'OLDER_SIDE',
        parents: ['BASE'],
        description: 'Older side branch',
      });
      const mainBase = makeLogCommit({
        change_id: 'main-base',
        commit_id: 'MAIN_BASE',
        parents: ['BASE'],
        description: 'Main base',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(workingCopy),
          commitLine(mainTip, ['main']),
          commitLine(olderSide),
          commitLine(mainBase),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'WC')?.column).toBe(0);
      expect(findCommit(commits, 'MAIN_TIP')?.column).toBe(0);
      expect(findCommit(commits, 'MAIN_BASE')?.column).toBe(0);
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
      expect(findCommit(commits, 'OLDER_SIDE')?.column).toBe(1);
      expect(maxColumn(commits)).toBe(1);
    });

    it('should keep a compact graph for working copy, fork, merge, and short branch history', async () => {
      const workingCopy = makeLogCommit({
        change_id: 'wc',
        commit_id: 'WC',
        parents: ['MAIN_HEAD'],
        description: 'Working copy',
        working_copy: true,
      });
      const shortSide = makeLogCommit({
        change_id: 'short-side',
        commit_id: 'SHORT_SIDE',
        parents: ['MAIN_HEAD'],
        description: 'Short side branch after merge',
      });
      const mainHead = makeLogCommit({
        change_id: 'main-head',
        commit_id: 'MAIN_HEAD',
        parents: ['AFTER_MERGE'],
        description: 'Main head',
      });
      const afterMerge = makeLogCommit({
        change_id: 'after-merge',
        commit_id: 'AFTER_MERGE',
        parents: ['MERGE'],
        description: 'Main after merge',
      });
      const merge = makeLogCommit({
        change_id: 'merge',
        commit_id: 'MERGE',
        parents: ['MAIN_BEFORE', 'SIDE'],
        description: 'Merge side into main',
      });
      const mainBefore = makeLogCommit({
        change_id: 'main-before',
        commit_id: 'MAIN_BEFORE',
        parents: ['BASE'],
        description: 'Main before merge',
      });
      const side = makeLogCommit({
        change_id: 'side',
        commit_id: 'SIDE',
        parents: ['BASE'],
        description: 'Side branch',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          commitLine(workingCopy),
          commitLine(shortSide),
          commitLine(mainHead, ['main']),
          commitLine(afterMerge),
          commitLine(merge),
          commitLine(mainBefore),
          commitLine(side),
          commitLine(base),
        ].join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(findCommit(commits, 'WC')?.column).toBe(0);
      expect(findCommit(commits, 'MAIN_HEAD')?.column).toBe(0);
      expect(findCommit(commits, 'AFTER_MERGE')?.column).toBe(0);
      expect(findCommit(commits, 'MERGE')?.column).toBe(0);
      expect(findCommit(commits, 'MAIN_BEFORE')?.column).toBe(0);
      expect(findCommit(commits, 'BASE')?.column).toBe(0);
      expect(findCommit(commits, 'SIDE')?.column).toBe(1);
      expect(findCommit(commits, 'SHORT_SIDE')?.column).toBe(1);
      expect(maxColumn(commits)).toBe(1);
    });

    it('should return stable columns for repeated equivalent layouts', async () => {
      const branchA = makeLogCommit({
        change_id: 'a',
        commit_id: 'A',
        parents: ['BASE'],
        description: 'Branch A',
      });
      const branchB = makeLogCommit({
        change_id: 'b',
        commit_id: 'B',
        parents: ['BASE'],
        description: 'Branch B',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });
      const stdout = [branchA, branchB, base].map(commit => commitLine(commit)).join('\n') + '\n';

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout,
        stderr: '', exitCode: 0, success: true,
      });

      const first = await parseLog('/test/repo');
      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout,
        stderr: '', exitCode: 0, success: true,
      });

      const second = await parseLog('/test/repo');
      expect(first.map(commit => [commit.id, commit.column])).toEqual(second.map(commit => [commit.id, commit.column]));
    });

    it('should reorder fork children when it reduces line crossings', async () => {
      const mergeA = makeLogCommit({
        change_id: 'merge-a',
        commit_id: 'MA',
        parents: ['A', 'C'],
        description: 'Merge C into A',
      });
      const mergeB = makeLogCommit({
        change_id: 'merge-b',
        commit_id: 'MB',
        parents: ['B', 'A'],
        description: 'Merge A into B',
      });
      const branchA = makeLogCommit({
        change_id: 'a',
        commit_id: 'A',
        parents: ['BASE'],
        description: 'Branch A',
      });
      const branchB = makeLogCommit({
        change_id: 'b',
        commit_id: 'B',
        parents: ['BASE'],
        description: 'Branch B',
      });
      const branchC = makeLogCommit({
        change_id: 'c',
        commit_id: 'C',
        parents: ['BASE'],
        description: 'Branch C',
      });
      const base = makeLogCommit({
        change_id: 'base',
        commit_id: 'BASE',
        description: 'Base',
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: [
          mergeA,
          mergeB,
          branchA,
          branchB,
          branchC,
          base,
        ].map(commit => commitLine(commit)).join('\n') + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(countCommitLineCrossings(commits)).toBe(0);
      expect(maxColumn(commits)).toBe(2);
      expect(findCommit(commits, 'B')?.column).toBe(0);
      expect(findCommit(commits, 'A')?.column).toBe(1);
      expect(findCommit(commits, 'C')?.column).toBe(2);
    });

    it('should calculate correct grid coordinates for a merge', async () => {
      // Merge: A has parents B and C
      const commitA = {
        change_id: 'a', commit_id: 'A', parents: ['B', 'C'],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 10:00:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 10:00:00 +00:00' },
        description: 'A'
      };
      const commitB = {
        change_id: 'b', commit_id: 'B', parents: ['D'],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 09:30:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 09:30:00 +00:00' },
        description: 'B'
      };
      const commitC = {
        change_id: 'c', commit_id: 'C', parents: ['D'],
        author: { name: 'X', email: 'x', timestamp: '2024-01-01 09:00:00 +00:00' },
        committer: { name: 'X', email: 'x', timestamp: '2024-01-01 09:00:00 +00:00' },
        description: 'C'
      };

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: JSON.stringify(commitA) + '\n' + JSON.stringify(commitB) + '\n' + JSON.stringify(commitC) + '\n',
        stderr: '', exitCode: 0, success: true,
      });

      const commits = await parseLog('/test/repo');
      expect(commits[0].id).toBe('A');
      expect(commits[0].column).toBe(1);
      expect(commits[1].id).toBe('B');
      expect(commits[1].column).toBe(1);
      expect(commits[2].id).toBe('C');
      expect(commits[2].column).toBe(0);
    });
  });

  describe('parseStatus', () => {
    it('should parse jj status text output', async () => {
      const mockOutput = `
Parent commit: p1234567 Parent message
Working copy : w1234567 Working copy message
A added_file.txt
M modified_file.txt
D deleted_file.txt
? untracked_file.txt
`;

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: mockOutput,
        stderr: '',
        exitCode: 0,
        success: true,
      });

      const status = await parseStatus('/test/repo');

      expect(status.changeId).toBe('w1234567');
      expect(status.files).toHaveLength(4);
      expect(status.summary.added).toBe(1);
      expect(status.summary.modified).toBe(1);
      expect(status.summary.deleted).toBe(1);
      expect(status.summary.untracked).toBe(1);
    });

    it('should detect conflicts', async () => {
      const mockOutput = `
Parent commit: p1234567 (conflict)
Working copy : w1234567 Working copy message
`;

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: mockOutput,
        stderr: '',
        exitCode: 0,
        success: true,
      });

      const status = await parseStatus('/test/repo');
      expect(status.hasConflicts).toBe(true);
    });
  });

  describe('parseDiff', () => {
    it('should parse git-style diff output', async () => {
      const mockDiff = `diff --git a/test.txt b/test.txt
index 1234567..abcdefg 100644
--- a/test.txt
+++ b/test.txt
@@ -1,3 +1,4 @@
 line1
+new line
 line2
 line3
`;

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: mockDiff,
        stderr: '',
        exitCode: 0,
        success: true,
      });

      const hunks = await parseDiff('/test/repo', 'test.txt');

      expect(hunks).toHaveLength(1);
      expect(hunks[0].oldStart).toBe(1);
      expect(hunks[0].oldLines).toBe(3);
      expect(hunks[0].newStart).toBe(1);
      expect(hunks[0].newLines).toBe(4);
    });

    it('should handle empty diff', async () => {
      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0,
        success: true,
      });

      const hunks = await parseDiff('/test/repo', 'test.txt');
      expect(hunks).toHaveLength(0);
    });
  });

  describe('parseBookmarks', () => {
    it('should parse bookmark list', async () => {
      const mockOutput = JSON.stringify({
        name: 'main',
        remote: null,
        present: true,
        conflict: false,
        tracked: true,
        synced: true,
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: mockOutput + '\n',
        stderr: '',
        exitCode: 0,
        success: true,
      });

      const bookmarks = await parseBookmarks('/test/repo');

      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].name).toBe('main');
      expect(bookmarks[0].isRemote).toBe(false);
      expect(bookmarks[0].isTracked).toBe(true);
      expect(bookmarks[0].isSynced).toBe(true);
    });

    it('should parse remote bookmarks', async () => {
      const mockOutput = JSON.stringify({
        name: 'main',
        remote: 'origin',
        present: true,
        conflict: false,
        tracked: false,
        synced: false,
      });

      vi.mocked(jjExecutor.execute).mockResolvedValue({
        stdout: mockOutput + '\n',
        stderr: '',
        exitCode: 0,
        success: true,
      });

      const bookmarks = await parseBookmarks('/test/repo');

      expect(bookmarks[0].isRemote).toBe(true);
      expect(bookmarks[0].remoteName).toBe('origin');
    });
  });
});
