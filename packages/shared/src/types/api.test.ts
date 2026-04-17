import { describe, it, expect } from 'vitest';
import type {
  OpenRepoRequest,
  OpenRepoResponse,
  CloneRepoRequest,
  InitRepoRequest,
  LogRequest,
  LogResponse,
  DiffRequest,
  DiffResponse,
  WorkingCopyStatusResponse,
  NewChangeRequest,
  EditDescriptionRequest,
  MoveChangeRequest,
  SquashRequest,
  SplitRequest,
  OperationsResponse,
  UndoRequest,
  BookmarksResponse,
  CreateBookmarkRequest,
  ConflictsResponse,
  ResolveConflictRequest,
  SettingsResponse,
  GuiConfig,
  AliasesResponse,
  CreateAliasRequest,
  ErrorResponse,
} from '../src/types/api';

describe('API Types', () => {
  describe('Repository API', () => {
    it('should create OpenRepoRequest', () => {
      const request: OpenRepoRequest = {
        path: '/path/to/repo',
      };

      expect(request.path).toBe('/path/to/repo');
    });

    it('should create CloneRepoRequest with credentials', () => {
      const request: CloneRepoRequest = {
        url: 'https://github.com/user/repo.git',
        path: '/local/path',
        credentials: {
          username: 'user',
          password: 'token',
        },
      };

      expect(request.url).toBe('https://github.com/user/repo.git');
      expect(request.credentials?.username).toBe('user');
    });

    it('should create InitRepoRequest with git option', () => {
      const request: InitRepoRequest = {
        path: '/new/repo',
        git: true,
      };

      expect(request.git).toBe(true);
    });
  });

  describe('Log API', () => {
    it('should create LogRequest with defaults', () => {
      const request: LogRequest = {};

      expect(request.revset).toBeUndefined();
      expect(request.limit).toBeUndefined();
    });

    it('should create LogRequest with pagination', () => {
      const request: LogRequest = {
        revset: 'main',
        limit: 50,
        offset: 100,
      };

      expect(request.limit).toBe(50);
      expect(request.offset).toBe(100);
    });

    it('should create LogResponse', () => {
      const response: LogResponse = {
        commits: [],
        hasMore: true,
        total: 150,
      };

      expect(response.commits).toHaveLength(0);
      expect(response.hasMore).toBe(true);
      expect(response.total).toBe(150);
    });
  });

  describe('Diff API', () => {
    it('should create DiffRequest', () => {
      const request: DiffRequest = {
        path: 'src/file.ts',
        from: 'parent-commit',
        to: 'current-commit',
      };

      expect(request.path).toBe('src/file.ts');
      expect(request.from).toBe('parent-commit');
    });

    it('should create DiffResponse with hunks', () => {
      const response: DiffResponse = {
        path: 'src/file.ts',
        hunks: [
          {
            oldStart: 1,
            oldLines: 5,
            newStart: 1,
            newLines: 7,
            content: '@@ -1,5 +1,7 @@',
          },
        ],
        oldContent: 'original content',
        newContent: 'new content',
      };

      expect(response.hunks).toHaveLength(1);
      expect(response.oldContent).toBe('original content');
    });
  });

  describe('Change Operations API', () => {
    it('should create NewChangeRequest', () => {
      const request: NewChangeRequest = {
        description: 'New feature',
        after: 'parent-change',
      };

      expect(request.description).toBe('New feature');
      expect(request.after).toBe('parent-change');
    });

    it('should create EditDescriptionRequest', () => {
      const request: EditDescriptionRequest = {
        id: 'change123',
        description: 'Updated description',
      };

      expect(request.id).toBe('change123');
    });

    it('should create MoveChangeRequest', () => {
      const request: MoveChangeRequest = {
        id: 'change123',
        destination: 'target-change',
        insertAfter: true,
      };

      expect(request.insertAfter).toBe(true);
    });

    it('should create SquashRequest', () => {
      const request: SquashRequest = {
        id: 'change123',
        description: 'Squashed commit',
        keepOriginal: false,
      };

      expect(request.keepOriginal).toBe(false);
    });

    it('should create SplitRequest', () => {
      const request: SplitRequest = {
        id: 'change123',
        files: ['src/a.ts', 'src/b.ts'],
      };

      expect(request.files).toHaveLength(2);
    });
  });

  describe('Operations API', () => {
    it('should create OperationsResponse', () => {
      const response: OperationsResponse = {
        operations: [],
        hasMore: false,
      };

      expect(response.operations).toHaveLength(0);
      expect(response.hasMore).toBe(false);
    });

    it('should create UndoRequest with specific operation', () => {
      const request: UndoRequest = {
        operationId: 'op123',
      };

      expect(request.operationId).toBe('op123');
    });

    it('should create UndoRequest for last operation', () => {
      const request: UndoRequest = {};

      expect(request.operationId).toBeUndefined();
    });
  });

  describe('Bookmarks API', () => {
    it('should create BookmarksResponse', () => {
      const response: BookmarksResponse = {
        bookmarks: [
          { name: 'main', target: 'commit1', isRemote: false },
          { name: 'develop', target: 'commit2', isRemote: false },
        ],
      };

      expect(response.bookmarks).toHaveLength(2);
    });

    it('should create CreateBookmarkRequest', () => {
      const request: CreateBookmarkRequest = {
        name: 'feature-branch',
        target: 'commit123',
      };

      expect(request.name).toBe('feature-branch');
    });
  });

  describe('Conflicts API', () => {
    it('should create ConflictsResponse', () => {
      const response: ConflictsResponse = {
        conflicts: [],
      };

      expect(response.conflicts).toHaveLength(0);
    });

    it('should create ResolveConflictRequest with manual content', () => {
      const request: ResolveConflictRequest = {
        path: 'conflicted-file.ts',
        resolution: 'manual',
        content: 'resolved content here',
      };

      expect(request.resolution).toBe('manual');
      expect(request.content).toBeDefined();
    });
  });

  describe('Settings API', () => {
    it('should create GuiConfig', () => {
      const config: GuiConfig = {
        theme: 'dark',
        editor: 'code',
        diffTool: 'vscode-diff',
        mergeTool: 'vscode-merge',
        keybindings: {
          'new-change': 'ctrl+n',
          'commit': 'ctrl+enter',
        },
      };

      expect(config.theme).toBe('dark');
      expect(config.keybindings['new-change']).toBe('ctrl+n');
    });

    it('should create SettingsResponse', () => {
      const response: SettingsResponse = {
        config: {
          'user.name': 'John Doe',
          'user.email': 'john@example.com',
        },
        guiConfig: {
          theme: 'system',
          editor: 'code',
          keybindings: {},
        },
      };

      expect(response.config['user.name']).toBe('John Doe');
    });
  });

  describe('Aliases API', () => {
    it('should create AliasesResponse', () => {
      const response: AliasesResponse = {
        aliases: [
          { name: 'st', command: 'status' },
          { name: 'co', command: 'commit' },
        ],
      };

      expect(response.aliases).toHaveLength(2);
    });

    it('should create CreateAliasRequest', () => {
      const request: CreateAliasRequest = {
        name: 'br',
        command: 'bookmark',
      };

      expect(request.name).toBe('br');
    });
  });

  describe('Error Response', () => {
    it('should create ErrorResponse', () => {
      const error: ErrorResponse = {
        error: 'NOT_FOUND',
        message: 'Repository not found',
        details: { path: '/invalid/path' },
      };

      expect(error.error).toBe('NOT_FOUND');
      expect(error.details).toBeDefined();
    });
  });
});
