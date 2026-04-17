/**
 * Tests for JJ Command Executor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import JJExecutor from '../src/services/jjExecutor';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('JJExecutor', () => {
  let executor: InstanceType<typeof JJExecutor>;

  beforeEach(() => {
    executor = new JJExecutor('jj');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute', () => {
    it('should execute a command and return the result', async () => {
      const mockProcess = {
        stdout: { on: vi.fn((event, cb) => { if (event === 'data') cb(Buffer.from('output')); }) },
        stderr: { on: vi.fn((event, cb) => { if (event === 'data') cb(Buffer.from('')); }) },
        on: vi.fn((event, cb) => {
          if (event === 'close') cb(0);
          if (event === 'error') {}
        }),
        kill: vi.fn(),
      };

      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const result = await executor.execute(['--version']);

      expect(spawn).toHaveBeenCalledWith('jj', ['--version'], expect.any(Object));
      expect(result.stdout).toBe('output');
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('should handle command failure', async () => {
      const mockProcess = {
        stdout: { on: vi.fn((event, cb) => { if (event === 'data') cb(Buffer.from('')); }) },
        stderr: { on: vi.fn((event, cb) => { if (event === 'data') cb(Buffer.from('error message')); }) },
        on: vi.fn((event, cb) => {
          if (event === 'close') cb(1);
          if (event === 'error') {}
        }),
        kill: vi.fn(),
      };

      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const result = await executor.execute(['invalid-command']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toBe('error message');
    });

    it('should timeout long-running commands', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'error') {}
          // Don't call close to simulate hanging
        }),
        kill: vi.fn(),
      };

      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      await expect(executor.execute(['long-command'], { timeout: 100 })).rejects.toThrow('timed out');
      expect(mockProcess.kill).toHaveBeenCalled();
    });
  });

  describe('isAvailable', () => {
    it('should return true when jj is available', async () => {
      const mockProcess = {
        stdout: { on: vi.fn((event, cb) => { if (event === 'data') cb(Buffer.from('jj 0.15.0')); }) },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') cb(0);
          if (event === 'error') {}
        }),
        kill: vi.fn(),
      };

      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const available = await executor.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when jj is not available', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') cb(127);
          if (event === 'error') {}
        }),
        kill: vi.fn(),
      };

      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const available = await executor.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('getVersion', () => {
    it('should return the version string', async () => {
      const mockProcess = {
        stdout: { on: vi.fn((event, cb) => { if (event === 'data') cb(Buffer.from('jj 0.15.1\n')); }) },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') cb(0);
          if (event === 'error') {}
        }),
        kill: vi.fn(),
      };

      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const version = await executor.getVersion();
      expect(version).toBe('jj 0.15.1');
    });
  });

  describe('executeStream', () => {
    it('should return a child process with streaming output', () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };

      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const onStdout = vi.fn();
      const onStderr = vi.fn();

      const proc = executor.executeStream(['log'], { onStdout, onStderr });

      expect(spawn).toHaveBeenCalled();
      expect(proc).toBe(mockProcess);
    });
  });
});
