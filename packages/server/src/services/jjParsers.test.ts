/**
 * Tests for JJ Output Parsers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jjExecutor
vi.mock('../src/services/jjExecutor', () => ({
  jjExecutor: {
    execute: vi.fn(),
  },
}));

import { jjExecutor } from '../src/services/jjExecutor';
import { parseLog, parseStatus, parseDiff, parseBookmarks } from '../src/services/jjParsers';

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
