/**
 * API Routes
 */

import { Router, Request, Response } from 'express';
import { jjExecutor } from '../services/jjExecutor.js';
import { parseLog, parseStatus, parseDiff, parseOperationLog, parseBookmarks } from '../services/jjParsers.js';
import { parseJJError, createErrorResponse } from '../utils/errors.js';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Store current repository state
let currentRepo: { path: string; name: string } | null = null;

// Recent repos storage path
const RECENT_REPOS_FILE = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.jjgui-recent.json');
const MAX_RECENT_REPOS = 10;

interface RecentRepo {
  path: string;
  name: string;
  lastOpened: number;
}

// Load recent repos from file
async function loadRecentRepos(): Promise<RecentRepo[]> {
  try {
    const data = await fs.readFile(RECENT_REPOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save recent repos to file
async function saveRecentRepos(repos: RecentRepo[]): Promise<void> {
  await fs.writeFile(RECENT_REPOS_FILE, JSON.stringify(repos, null, 2), 'utf-8');
}

// Add repo to recent list
async function addToRecentRepos(repoPath: string, name: string): Promise<void> {
  let repos = await loadRecentRepos();

  // Remove existing entry for this path
  repos = repos.filter(r => r.path !== repoPath);

  // Add to beginning
  repos.unshift({
    path: repoPath,
    name,
    lastOpened: Date.now(),
  });

  // Limit to MAX_RECENT_REPOS
  repos = repos.slice(0, MAX_RECENT_REPOS);

  await saveRecentRepos(repos);
}

// Remove repo from recent list
async function removeFromRecentRepos(repoPath: string): Promise<void> {
  let repos = await loadRecentRepos();
  repos = repos.filter(r => r.path !== repoPath);
  await saveRecentRepos(repos);
}

// Helper to get repository path
function getRepoPath(): string | null {
  return currentRepo?.path ?? null;
}

// Helper to handle errors
function handleError(res: Response, error: unknown): void {
  if (error instanceof Error) {
    const jjError = parseJJError(error.message, 1);
    res.status(400).json(createErrorResponse(jjError));
  } else {
    res.status(500).json({ error: 'unknown', message: 'An unknown error occurred' });
  }
}

// ============ Repository API ============

/**
 * GET /api/health - Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', repoPath: currentRepo?.path ?? null });
});

/**
 * GET /api/repo/status - Current repository status
 */
router.get('/repo/status', async (_req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.json({ repository: null });
      return;
    }

    const version = await jjExecutor.getVersion();
    const status = await parseStatus(repoPath);

    res.json({
      repository: {
        path: repoPath,
        name: currentRepo?.name ?? '',
        rootCommit: '',
        currentChange: status.changeId,
        jjVersion: version ?? 'unknown',
      },
      workingCopy: status,
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/repo/log - Commit history with pagination
 */
router.get('/repo/log', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const revset = req.query.revset as string | undefined;

    const commits = await parseLog(repoPath, revset, limit, offset);

    res.json({
      commits,
      hasMore: commits.length === limit,
      total: commits.length,
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/repo/files - File tree with status
 */
router.get('/repo/files', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const status = await parseStatus(repoPath);
    const filterPath = req.query.path as string | undefined;

    let files = status.files;
    if (filterPath) {
      files = files.filter(f => f.path.startsWith(filterPath));
    }

    res.json({
      files,
      rootPath: repoPath,
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/repo/diff/:path - File diff
 */
router.get('/repo/diff/*', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const filePath = req.params[0];
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const hunks = await parseDiff(repoPath, filePath, from, to);

    res.json({
      path: filePath,
      hunks,
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/repo/operations - Operation log
 */
router.get('/repo/operations', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const operations = await parseOperationLog(repoPath, limit);

    res.json({
      operations,
      hasMore: operations.length === limit,
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/repo/init - Initialize repository
 */
router.post('/repo/init', async (req: Request, res: Response) => {
  try {
    const { path: repoPath, git } = req.body;
    if (!repoPath) {
      res.status(400).json({ error: 'invalid_input', message: 'Path is required' });
      return;
    }

    const args = ['init', repoPath];
    if (git) {
      args.push('--git');
    }

    const result = await jjExecutor.execute(args);
    if (!result.success) {
      throw new Error(result.stderr);
    }

    const name = repoPath.split('/').pop() ?? repoPath;
    currentRepo = { path: repoPath, name };
    const version = await jjExecutor.getVersion();

    // Add to recent repos
    await addToRecentRepos(repoPath, name);

    res.json({
      repository: {
        path: repoPath,
        name,
        rootCommit: '',
        currentChange: '',
        jjVersion: version ?? 'unknown',
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/repo/clone - Clone repository
 */
router.post('/repo/clone', async (req: Request, res: Response) => {
  try {
    const { url, path: destPath } = req.body;
    if (!url || !destPath) {
      res.status(400).json({ error: 'invalid_input', message: 'URL and path are required' });
      return;
    }

    const result = await jjExecutor.execute(['clone', url, destPath], { timeout: 120000 });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    const name = destPath.split('/').pop() ?? destPath;
    currentRepo = { path: destPath, name };
    const version = await jjExecutor.getVersion();

    // Add to recent repos
    await addToRecentRepos(destPath, name);

    res.json({
      repository: {
        path: destPath,
        name,
        rootCommit: '',
        currentChange: '',
        jjVersion: version ?? 'unknown',
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/repo/open - Open existing repository
 */
router.post('/repo/open', async (req: Request, res: Response) => {
  try {
    const { path: repoPath } = req.body;
    if (!repoPath) {
      res.status(400).json({ error: 'invalid_input', message: 'Path is required' });
      return;
    }

    // Verify it's a valid jj repository
    const root = await jjExecutor.getRepoRoot(repoPath);
    if (!root) {
      res.status(400).json({ error: 'not_a_repo', message: 'Not a valid Jujutsu repository' });
      return;
    }

    const name = root.split('/').pop() ?? root;
    currentRepo = { path: root, name };
    const version = await jjExecutor.getVersion();
    const status = await parseStatus(root);

    // Add to recent repos
    await addToRecentRepos(root, name);

    res.json({
      repository: {
        path: root,
        name,
        rootCommit: '',
        currentChange: status.changeId,
        jjVersion: version ?? 'unknown',
      },
      workingCopy: status,
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/repo/close - Close current repository
 */
router.post('/repo/close', async (_req: Request, res: Response) => {
  try {
    currentRepo = null;
    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/repo/recent - Get recent repositories
 */
router.get('/repo/recent', async (_req: Request, res: Response) => {
  try {
    const repos = await loadRecentRepos();
    res.json({ repos });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * DELETE /api/repo/recent/:path - Remove recent repository
 */
router.delete('/repo/recent/*', async (req: Request, res: Response) => {
  try {
    const repoPath = decodeURIComponent(req.params[0]);
    await removeFromRecentRepos(repoPath);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

// ============ Bookmarks API ============

/**
 * GET /api/bookmarks - List bookmarks
 */
router.get('/bookmarks', async (_req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const bookmarks = await parseBookmarks(repoPath);
    res.json({ bookmarks });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/bookmarks - Create bookmark
 */
router.post('/bookmarks', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { name, target } = req.body;
    if (!name) {
      res.status(400).json({ error: 'invalid_input', message: 'Bookmark name is required' });
      return;
    }

    const args = ['bookmark', 'create', name];
    if (target) {
      args.push('-r', target);
    }

    const result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true, name });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * DELETE /api/bookmarks/:name - Delete bookmark
 */
router.delete('/bookmarks/:name', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { name } = req.params;
    const result = await jjExecutor.execute(['bookmark', 'delete', name], { cwd: repoPath });

    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

// ============ Operations API ============

/**
 * POST /api/operations/undo - Undo operation(s)
 */
router.post('/operations/undo', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { operationId } = req.body;
    const args = ['undo'];
    if (operationId) {
      args.push(operationId);
    }

    const result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/operations/redo - Redo undone operation
 */
router.post('/operations/redo', async (_req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const result = await jjExecutor.execute(['redo'], { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

// ============ Changes API ============

/**
 * POST /api/changes/new - Create new change
 */
router.post('/changes/new', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { description, after } = req.body;
    const args = ['new'];

    if (after) {
      args.push(after);
    }

    let result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    // Set description if provided
    if (description) {
      result = await jjExecutor.execute(['describe', '-m', description], { cwd: repoPath });
    }

    const status = await parseStatus(repoPath);
    res.json({ success: true, changeId: status.changeId });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * PUT /api/changes/:id/description - Edit description
 */
router.put('/changes/:id/description', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { id } = req.params;
    const { description } = req.body;

    const result = await jjExecutor.execute(['describe', '-r', id, '-m', description], { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * DELETE /api/changes/:id - Abandon change
 */
router.delete('/changes/:id', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { id } = req.params;
    const result = await jjExecutor.execute(['abandon', '-r', id], { cwd: repoPath });

    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/changes/:id/move - Move/rebase change
 */
router.post('/changes/:id/move', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { id } = req.params;
    const { destination, insertAfter } = req.body;

    if (!destination) {
      res.status(400).json({ error: 'invalid_input', message: 'Destination is required' });
      return;
    }

    const args = ['move', '-r', id];
    if (insertAfter !== false) {
      args.push('--after', destination);
    } else {
      args.push('--before', destination);
    }

    const result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/changes/:id/squash - Squash into parent
 */
router.post('/changes/:id/squash', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { id } = req.params;
    const { description } = req.body;

    const args = ['squash', '-r', id];
    if (description) {
      args.push('-m', description);
    }

    const result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/changes/:id/split - Split change
 */
router.post('/changes/:id/split', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { id } = req.params;
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'invalid_input', message: 'Files array is required' });
      return;
    }

    // jj split requires interactive mode, we'll use file-based approach
    const args = ['split', '-r', id];
    for (const file of files) {
      args.push(file);
    }

    const result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/changes/:id/amend - Amend with working copy
 */
router.post('/changes/:id/amend', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { id } = req.params;
    const result = await jjExecutor.execute(['amend', '-r', id], { cwd: repoPath });

    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

// ============ Operations Detail API ============

/**
 * GET /api/operations/:id - Operation details
 */
router.get('/operations/:id', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { id } = req.params;
    const args = ['op', 'show', id, '--template', 'json'];

    const result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    const operation = JSON.parse(result.stdout);
    res.json({ operation });
  } catch (error) {
    handleError(res, error);
  }
});

// ============ Bookmark Move API ============

/**
 * PUT /api/bookmarks/:name - Move bookmark
 */
router.put('/bookmarks/:name', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { name } = req.params;
    const { target } = req.body;

    if (!target) {
      res.status(400).json({ error: 'invalid_input', message: 'Target is required' });
      return;
    }

    const result = await jjExecutor.execute(['bookmark', 'move', name, '-r', target], { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

// ============ Conflicts API ============

/**
 * GET /api/conflicts - List conflicting files
 */
router.get('/conflicts', async (_req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const status = await parseStatus(repoPath);
    const conflicts = status.files.filter(f => f.status === 'conflict');

    res.json({ conflicts: conflicts.map(f => ({ path: f.path, status: f.status })) });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/conflicts/:path - Conflict details
 */
router.get('/conflicts/*', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const filePath = req.params[0];
    const args = ['resolve', '--list', filePath];

    const result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    // Parse conflict information
    res.json({
      path: filePath,
      conflict: {
        path: filePath,
        conflictType: 'content',
        sides: [],
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * PUT /api/conflicts/:path/resolve - Resolve conflict
 */
router.put('/conflicts/*', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const filePath = req.params[0];
    const { resolution, content } = req.body;

    if (resolution === 'manual' && content) {
      // Write resolved content to file
      const fs = await import('fs/promises');
      await fs.writeFile(`${repoPath}/${filePath}`, content, 'utf-8');
    }

    const args = ['resolve', filePath];
    const result = await jjExecutor.execute(args, { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

// ============ Working Copy API ============

/**
 * GET /api/working-copy/status - Working copy status
 */
router.get('/working-copy/status', async (_req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const status = await parseStatus(repoPath);
    res.json({ status });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * DELETE /api/working-copy/files/:path - Discard file changes
 */
router.delete('/working-copy/files/*', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const filePath = req.params[0];
    const result = await jjExecutor.execute(['restore', filePath], { cwd: repoPath });

    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/working-copy/files/:path/restore - Restore deleted file
 */
router.post('/working-copy/files/*', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const filePath = req.params[0];
    const result = await jjExecutor.execute(['restore', filePath], { cwd: repoPath });

    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * PUT /api/working-copy/files/:path/stage - Stage file/hunks (jj doesn't have staging, this is a no-op)
 */
router.put('/working-copy/files/*', async (_req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    // jj doesn't have a staging concept like git
    // All changes are automatically tracked
    res.json({ success: true, message: 'Changes are automatically tracked in jj' });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/ignore - Add path to .gitignore
 */
router.post('/ignore', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { path: ignorePath, pattern } = req.body;
    if (!ignorePath && !pattern) {
      res.status(400).json({ error: 'invalid_input', message: 'Path or pattern is required' });
      return;
    }

    // Determine what to add to .gitignore
    const entry = pattern || ignorePath;

    // Read existing .gitignore or create new one
    const fs = await import('fs/promises');
    const gitignorePath = `${repoPath}/.gitignore`;
    let existingContent = '';

    try {
      existingContent = await fs.readFile(gitignorePath, 'utf-8');
    } catch {
      // File doesn't exist, will create it
    }

    // Check if entry already exists
    const lines = existingContent.split('\n');
    if (lines.includes(entry)) {
      res.json({ success: true, message: 'Entry already in .gitignore' });
      return;
    }

    // Append new entry
    const newContent = existingContent
      ? `${existingContent.trimEnd()}\n${entry}\n`
      : `${entry}\n`;

    await fs.writeFile(gitignorePath, newContent, 'utf-8');

    res.json({ success: true, entry });
  } catch (error) {
    handleError(res, error);
  }
});

// ============ Settings API ============

/**
 * GET /api/settings - Get configuration
 */
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const result = await jjExecutor.execute(['config', 'list', '--template', 'json'], { cwd: repoPath });
    let config = {};
    if (result.success && result.stdout) {
      try {
        config = JSON.parse(result.stdout);
      } catch {
        // If not JSON, return empty config
      }
    }

    res.json({
      config,
      guiConfig: {
        theme: 'system',
        editor: 'code',
        keybindings: {},
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * PUT /api/settings - Update configuration
 */
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { config } = req.body;
    if (config) {
      for (const [key, value] of Object.entries(config)) {
        await jjExecutor.execute(['config', 'set', key, String(value)], { cwd: repoPath });
      }
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/settings/aliases - List aliases
 */
router.get('/settings/aliases', async (_req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const result = await jjExecutor.execute(['config', 'get', 'aliases'], { cwd: repoPath });
    let aliases: Array<{ name: string; command: string }> = [];

    if (result.success && result.stdout) {
      try {
        const aliasConfig = JSON.parse(result.stdout);
        aliases = Object.entries(aliasConfig).map(([name, command]) => ({
          name,
          command: String(command),
        }));
      } catch {
        // If parsing fails, return empty aliases
      }
    }

    res.json({ aliases });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/settings/aliases - Create alias
 */
router.post('/settings/aliases', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { name, command } = req.body;
    if (!name || !command) {
      res.status(400).json({ error: 'invalid_input', message: 'Name and command are required' });
      return;
    }

    const result = await jjExecutor.execute(['config', 'set', `aliases.${name}`, command], { cwd: repoPath });
    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * DELETE /api/settings/aliases/:name - Delete alias
 */
router.delete('/settings/aliases/:name', async (req: Request, res: Response) => {
  try {
    const repoPath = getRepoPath();
    if (!repoPath) {
      res.status(404).json({ error: 'no_repo', message: 'No repository open' });
      return;
    }

    const { name } = req.params;
    const result = await jjExecutor.execute(['config', 'unset', `aliases.${name}`], { cwd: repoPath });

    if (!result.success) {
      throw new Error(result.stderr);
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
