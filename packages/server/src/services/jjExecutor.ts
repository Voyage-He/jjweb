/**
 * JJ Command Executor Service
 * Handles spawning and managing jj CLI processes
 */

import { spawn, ChildProcess } from 'child_process';

export interface ExecuteOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface StreamOptions extends ExecuteOptions {
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

class JJExecutor {
  private jjPath: string;
  private defaultTimeout = 30000; // 30 seconds

  constructor(jjPath: string = 'jj') {
    this.jjPath = jjPath;
  }

  /**
   * Execute a jj command and return the result
   */
  async execute(args: string[], options: ExecuteOptions = {}): Promise<ExecuteResult> {
    const { cwd = process.cwd(), timeout = this.defaultTimeout, env = {} } = options;

    return new Promise((resolve, reject) => {
      const processEnv: Record<string, string> = {
        ...process.env,
        ...env,
      } as Record<string, string>;

      const proc = spawn(this.jjPath, args, {
        cwd,
        env: processEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      proc.on('close', (code: number | null) => {
        clearTimeout(timeoutId);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
          success: code === 0,
        });
      });

      proc.on('error', (err: Error) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }

  /**
   * Execute a jj command with streaming output
   */
  executeStream(args: string[], options: StreamOptions = {}): ChildProcess {
    const { cwd = process.cwd(), env = {}, onStdout, onStderr } = options;

    const processEnv: Record<string, string> = {
      ...process.env,
      ...env,
    } as Record<string, string>;

    const proc = spawn(this.jjPath, args, {
      cwd,
      env: processEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (onStdout) {
      proc.stdout?.on('data', (data: Buffer) => {
        onStdout(data.toString());
      });
    }

    if (onStderr) {
      proc.stderr?.on('data', (data: Buffer) => {
        onStderr(data.toString());
      });
    }

    return proc;
  }

  /**
   * Check if jj is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.execute(['--version'], { timeout: 5000 });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get jj version
   */
  async getVersion(): Promise<string | null> {
    try {
      const result = await this.execute(['--version'], { timeout: 5000 });
      if (result.success) {
        return result.stdout.trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get repository root path
   */
  async getRepoRoot(cwd: string): Promise<string | null> {
    try {
      const result = await this.execute(['root'], { cwd, timeout: 5000 });
      if (result.success) {
        return result.stdout.trim();
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const jjExecutor = new JJExecutor();

export default JJExecutor;
