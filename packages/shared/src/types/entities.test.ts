import { describe, it, expect } from 'vitest';
import type {
  Commit,
  Author,
  Bookmark,
  Operation,
  OperationMetadata,
  FileChange,
  Hunk,
  Conflict,
  ConflictSide,
  ConflictContent,
  Repository,
  WorkingCopyStatus,
  FileStatus,
} from '../src/types/entities';

describe('Entity Types', () => {
  describe('Author', () => {
    it('should create a valid author object', () => {
      const author: Author = {
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: 1704067200,
      };

      expect(author.name).toBe('John Doe');
      expect(author.email).toBe('john@example.com');
      expect(author.timestamp).toBe(1704067200);
    });
  });

  describe('Commit', () => {
    it('should create a valid commit object', () => {
      const author: Author = {
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: 1704067200,
      };

      const commit: Commit = {
        id: 'abc123def456',
        changeId: 'xyz789',
        parents: ['parent1', 'parent2'],
        author,
        committer: author,
        description: 'Initial commit',
        timestamp: 1704067200,
        bookmarks: [],
        tags: [],
      };

      expect(commit.id).toBe('abc123def456');
      expect(commit.changeId).toBe('xyz789');
      expect(commit.parents).toHaveLength(2);
      expect(commit.description).toBe('Initial commit');
      expect(commit.isWorkingCopy).toBeUndefined();
    });

    it('should support working copy flag', () => {
      const author: Author = {
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: 1704067200,
      };

      const workingCopyCommit: Commit = {
        id: 'working',
        changeId: 'working_copy',
        parents: ['parent1'],
        author,
        committer: author,
        description: 'Working copy',
        timestamp: 1704067200,
        bookmarks: [],
        tags: [],
        isWorkingCopy: true,
      };

      expect(workingCopyCommit.isWorkingCopy).toBe(true);
    });
  });

  describe('Bookmark', () => {
    it('should create a local bookmark', () => {
      const bookmark: Bookmark = {
        name: 'main',
        target: 'commit123',
        isRemote: false,
      };

      expect(bookmark.name).toBe('main');
      expect(bookmark.target).toBe('commit123');
      expect(bookmark.isRemote).toBe(false);
      expect(bookmark.remoteName).toBeUndefined();
    });

    it('should create a remote bookmark', () => {
      const bookmark: Bookmark = {
        name: 'main',
        target: 'commit123',
        isRemote: true,
        remoteName: 'origin',
      };

      expect(bookmark.isRemote).toBe(true);
      expect(bookmark.remoteName).toBe('origin');
    });
  });

  describe('Operation', () => {
    it('should create a valid operation object', () => {
      const metadata: OperationMetadata = {
        command: 'commit',
        args: ['-m', 'test message'],
        cwd: '/path/to/repo',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const operation: Operation = {
        id: 'op123',
        operationId: 'operation-uuid',
        metadata,
        timestamp: 1704067200,
      };

      expect(operation.id).toBe('op123');
      expect(operation.metadata.command).toBe('commit');
      expect(operation.metadata.args).toContain('-m');
    });
  });

  describe('FileChange', () => {
    it('should create a file change for added file', () => {
      const hunk: Hunk = {
        oldStart: 0,
        oldLines: 0,
        newStart: 1,
        newLines: 10,
        content: '@@ -0,0 +1,10 @@',
      };

      const fileChange: FileChange = {
        path: 'src/new-file.ts',
        status: 'added',
        hunks: [hunk],
      };

      expect(fileChange.path).toBe('src/new-file.ts');
      expect(fileChange.status).toBe('added');
      expect(fileChange.oldPath).toBeUndefined();
    });

    it('should create a file change for renamed file', () => {
      const fileChange: FileChange = {
        path: 'src/new-name.ts',
        oldPath: 'src/old-name.ts',
        status: 'renamed',
        hunks: [],
      };

      expect(fileChange.status).toBe('renamed');
      expect(fileChange.oldPath).toBe('src/old-name.ts');
    });
  });

  describe('FileStatus', () => {
    it('should support all file status values', () => {
      const statuses: FileStatus[] = [
        'added',
        'modified',
        'deleted',
        'renamed',
        'conflict',
        'untracked',
      ];

      expect(statuses).toHaveLength(6);
    });
  });

  describe('Conflict', () => {
    it('should create a content conflict', () => {
      const baseContent: ConflictContent = {
        path: 'file.ts',
        commit: 'base-commit',
        content: 'base content',
      };

      const side1: ConflictSide = {
        name: 'ours',
        content: {
          path: 'file.ts',
          commit: 'commit1',
          content: 'our changes',
        },
      };

      const conflict: Conflict = {
        path: 'file.ts',
        conflictType: 'content',
        sides: [side1],
        base: baseContent,
      };

      expect(conflict.path).toBe('file.ts');
      expect(conflict.conflictType).toBe('content');
      expect(conflict.sides).toHaveLength(1);
    });
  });

  describe('Repository', () => {
    it('should create a valid repository object', () => {
      const repo: Repository = {
        path: '/path/to/repo',
        name: 'my-repo',
        rootCommit: 'abc123',
        currentChange: 'xyz789',
        jjVersion: '0.15.0',
      };

      expect(repo.path).toBe('/path/to/repo');
      expect(repo.name).toBe('my-repo');
      expect(repo.jjVersion).toBe('0.15.0');
    });
  });

  describe('WorkingCopyStatus', () => {
    it('should create a working copy status', () => {
      const status: WorkingCopyStatus = {
        changeId: 'working123',
        files: [],
        hasConflicts: false,
        summary: {
          added: 1,
          modified: 2,
          deleted: 0,
          untracked: 3,
          conflicts: 0,
        },
      };

      expect(status.changeId).toBe('working123');
      expect(status.hasConflicts).toBe(false);
      expect(status.summary.added).toBe(1);
      expect(status.summary.modified).toBe(2);
    });

    it('should indicate conflicts', () => {
      const status: WorkingCopyStatus = {
        changeId: 'working123',
        files: [],
        hasConflicts: true,
        summary: {
          added: 0,
          modified: 1,
          deleted: 0,
          untracked: 0,
          conflicts: 2,
        },
      };

      expect(status.hasConflicts).toBe(true);
      expect(status.summary.conflicts).toBe(2);
    });
  });
});
