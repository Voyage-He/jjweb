/**
 * Command sanitization and security utilities
 */

// Allowed jj commands that can be executed through the API
const ALLOWED_COMMANDS = new Set([
  // Repository operations
  'init',
  'clone',
  'version',
  'root',

  // Log and status
  'log',
  'show',
  'status',
  'diff',

  // File operations
  'file',
  'files',

  // Commit operations
  'new',
  'describe',
  'abandon',
  'edit',
  'squash',
  'split',
  'move',

  // Bookmark operations
  'bookmark',
  'branch', // alias

  // Operation log
  'op',
  'undo',
  'redo',

  // Remote operations
  'git',
  'remote',
  'push',
  'pull',
  'fetch',

  // Configuration
  'config',

  // Workspace
  'workspace',

  // Stash-like
  'commit',

  // Debug
  'debug',
]);

// Commands that require additional validation
const SENSITIVE_COMMANDS = new Set([
  'git',
  'push',
  'remote',
]);

// Dangerous arguments that should never be allowed
const FORBIDDEN_ARGS = [
  /\$\(/,           // Command substitution
  /\|/,             // Pipe
  /;/,              // Command separator
  /&&/,             // AND operator
  /\|\|/,           // OR operator
  />/,              // Redirect
  /</,              // Redirect
  /`/,              // Backticks
  /\$\{/,           // Variable expansion
  /\\x[0-9a-fA-F]/, // Hex escape
];

// Maximum allowed argument length
const MAX_ARG_LENGTH = 4096;

/**
 * Sanitization result
 */
export interface SanitizationResult {
  valid: boolean;
  error?: string;
  sanitizedArgs?: string[];
}

/**
 * Validate and sanitize jj command arguments
 */
export function sanitizeCommand(args: string[]): SanitizationResult {
  if (!args || args.length === 0) {
    return { valid: false, error: 'No command provided' };
  }

  const [command, ...commandArgs] = args;

  // Check if command is allowed
  if (!ALLOWED_COMMANDS.has(command)) {
    return {
      valid: false,
      error: `Command "${command}" is not allowed`,
    };
  }

  // Validate each argument
  const sanitizedArgs: string[] = [command];

  for (const arg of commandArgs) {
    // Check argument length
    if (arg.length > MAX_ARG_LENGTH) {
      return {
        valid: false,
        error: `Argument exceeds maximum length of ${MAX_ARG_LENGTH} characters`,
      };
    }

    // Check for forbidden patterns
    for (const pattern of FORBIDDEN_ARGS) {
      if (pattern.test(arg)) {
        return {
          valid: false,
          error: `Argument contains forbidden pattern: ${pattern.source}`,
        };
      }
    }

    // Additional validation for sensitive commands
    if (SENSITIVE_COMMANDS.has(command)) {
      const validated = validateSensitiveArg(arg);
      if (!validated.valid) {
        return validated;
      }
    }

    sanitizedArgs.push(arg);
  }

  return { valid: true, sanitizedArgs };
}

/**
 * Additional validation for sensitive command arguments
 */
function validateSensitiveArg(arg: string): SanitizationResult {
  // Don't allow URLs with credentials
  if (/^https?:\/\/[^:]+:[^@]+@/.test(arg)) {
    return {
      valid: false,
      error: 'URLs with embedded credentials are not allowed',
    };
  }

  return { valid: true };
}

/**
 * Validate a path argument to prevent path traversal
 */
export function validatePath(pathArg: string, repoRoot: string): boolean {
  const path = require('path');
  const resolved = path.resolve(repoRoot, pathArg);

  // Ensure the resolved path is within the repository
  return resolved.startsWith(repoRoot);
}

/**
 * Create a safe execution environment
 */
export function createSafeEnv(additionalEnv: Record<string, string> = {}): Record<string, string> {
  // Only include necessary environment variables
  const safeEnv: Record<string, string> = {
    PATH: process.env.PATH || '',
    HOME: process.env.HOME || '',
    USER: process.env.USER || '',
    LANG: process.env.LANG || 'en_US.UTF-8',
    TERM: 'dumb', // Disable terminal features
    ...additionalEnv,
  };

  // Remove potentially dangerous variables
  delete safeEnv.JJ_EDITOR;
  delete safeEnv.EDITOR;
  delete safeEnv.VISUAL;

  return safeEnv;
}
