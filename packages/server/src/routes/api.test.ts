import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import router from '../src/routes/api';

// Mock the jjExecutor
vi.mock('../src/services/jjExecutor.js', () => ({
  jjExecutor: {
    execute: vi.fn(),
    getVersion: vi.fn(),
    getRepoRoot: vi.fn(),
    isAvailable: vi.fn(),
  },
}));

// Mock the parsers
vi.mock('../src/services/jjParsers.js', () => ({
  parseLog: vi.fn(),
  parseStatus: vi.fn(),
  parseDiff: vi.fn(),
  parseOperationLog: vi.fn(),
  parseBookmarks: vi.fn(),
}));

import { jjExecutor } from '../src/services/jjExecutor.js';
import { parseLog, parseStatus, parseDiff, parseOperationLog, parseBookmarks } from '../src/services/jjParsers.js';

const mockExecutor = vi.mocked(jjExecutor);
const mockParseLog = vi.mocked(parseLog);
const mockParseStatus = vi.mocked(parseStatus);
const mockParseDiff = vi.mocked(parseDiff);
const mockParseOperationLog = vi.mocked(parseOperationLog);
const mockParseBookmarks = vi.mocked(parseBookmarks);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/health', () => {
    it('should return health status without repository', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.repoPath).toBeNull();
    });
  });

  describe('GET /api/repo/status', () => {
    it('should return null repository when no repo is open', async () => {
      const response = await request(app).get('/api/repo/status');

      expect(response.status).toBe(200);
      expect(response.body.repository).toBeNull();
    });
  });

  describe('POST /api/repo/open', () => {
    it('should open a valid repository', async () => {
      mockExecutor.getRepoRoot.mockResolvedValue('/path/to/repo');
      mockExecutor.getVersion.mockResolvedValue('0.15.0');
      mockParseStatus.mockResolvedValue({
        changeId: 'abc123',
        files: [],
        hasConflicts: false,
        summary: { added: 0, modified: 0, deleted: 0, untracked: 0, conflicts: 0 },
      });

      const response = await request(app)
        .post('/api/repo/open')
        .send({ path: '/path/to/repo' });

      expect(response.status).toBe(200);
      expect(response.body.repository.path).toBe('/path/to/repo');
      expect(response.body.repository.jjVersion).toBe('0.15.0');
    });

    it('should reject missing path', async () => {
      const response = await request(app)
        .post('/api/repo/open')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('invalid_input');
    });

    it('should reject invalid repository', async () => {
      mockExecutor.getRepoRoot.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/repo/open')
        .send({ path: '/invalid/path' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('not_a_repo');
    });
  });

  describe('POST /api/repo/init', () => {
    it('should initialize a new repository', async () => {
      mockExecutor.execute.mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0,
        success: true,
      });
      mockExecutor.getVersion.mockResolvedValue('0.15.0');

      const response = await request(app)
        .post('/api/repo/init')
        .send({ path: '/new/repo' });

      expect(response.status).toBe(200);
      expect(response.body.repository.path).toBe('/new/repo');
      expect(mockExecutor.execute).toHaveBeenCalledWith(['init', '/new/repo']);
    });

    it('should initialize with git flag', async () => {
      mockExecutor.execute.mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0,
        success: true,
      });
      mockExecutor.getVersion.mockResolvedValue('0.15.0');

      const response = await request(app)
        .post('/api/repo/init')
        .send({ path: '/new/repo', git: true });

      expect(response.status).toBe(200);
      expect(mockExecutor.execute).toHaveBeenCalledWith(['init', '/new/repo', '--git']);
    });

    it('should reject missing path', async () => {
      const response = await request(app)
        .post('/api/repo/init')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('invalid_input');
    });
  });

  describe('POST /api/repo/clone', () => {
    it('should clone a repository', async () => {
      mockExecutor.execute.mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0,
        success: true,
      });
      mockExecutor.getVersion.mockResolvedValue('0.15.0');

      const response = await request(app)
        .post('/api/repo/clone')
        .send({ url: 'https://github.com/user/repo.git', path: '/local/repo' });

      expect(response.status).toBe(200);
      expect(mockExecutor.execute).toHaveBeenCalledWith(
        ['clone', 'https://github.com/user/repo.git', '/local/repo'],
        { timeout: 120000 }
      );
    });

    it('should reject missing URL or path', async () => {
      const response = await request(app)
        .post('/api/repo/clone')
        .send({ url: 'https://github.com/user/repo.git' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('invalid_input');
    });
  });

  describe('GET /api/repo/log', () => {
    it('should return 404 when no repo is open', async () => {
      const response = await request(app).get('/api/repo/log');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('no_repo');
    });
  });

  describe('GET /api/bookmarks', () => {
    it('should return 404 when no repo is open', async () => {
      const response = await request(app).get('/api/bookmarks');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('no_repo');
    });
  });

  describe('POST /api/changes/new', () => {
    it('should return 404 when no repo is open', async () => {
      const response = await request(app)
        .post('/api/changes/new')
        .send({ description: 'New change' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('no_repo');
    });
  });

  describe('POST /api/operations/undo', () => {
    it('should return 404 when no repo is open', async () => {
      const response = await request(app)
        .post('/api/operations/undo')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('no_repo');
    });
  });

  describe('GET /api/conflicts', () => {
    it('should return 404 when no repo is open', async () => {
      const response = await request(app).get('/api/conflicts');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('no_repo');
    });
  });

  describe('GET /api/working-copy/status', () => {
    it('should return 404 when no repo is open', async () => {
      const response = await request(app).get('/api/working-copy/status');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('no_repo');
    });
  });

  describe('GET /api/settings', () => {
    it('should return 404 when no repo is open', async () => {
      const response = await request(app).get('/api/settings');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('no_repo');
    });
  });
});
