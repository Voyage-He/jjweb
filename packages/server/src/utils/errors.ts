/**
 * JJ Error types and parser
 */

export type JJErrorCode =
  | 'not_a_repository'
  | 'conflict'
  | 'uncommitted_changes'
  | 'bookmark_not_found'
  | 'commit_not_found'
  | 'invalid_revision'
  | 'permission_denied'
  | 'command_failed'
  | 'timeout'
  | 'unknown';

export interface JJError {
  code: JJErrorCode;
  message: string;
  rawError: string;
  suggestion?: string;
}

// Error patterns to detect specific error types
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  code: JJErrorCode;
  suggestion?: string;
}> = [
  {
    pattern: /Error: Could not find a repository/i,
    code: 'not_a_repository',
    suggestion: 'Initialize a repository with "jj init" or navigate to a repository.',
  },
  {
    pattern: /Error: There are unresolved conflicts/i,
    code: 'conflict',
    suggestion: 'Resolve conflicts before proceeding.',
  },
  {
    pattern: /Error: Working copy is dirty/i,
    code: 'uncommitted_changes',
    suggestion: 'Commit or discard working copy changes first.',
  },
  {
    pattern: /Error: No bookmark named/i,
    code: 'bookmark_not_found',
    suggestion: 'Check available bookmarks with "jj bookmark list".',
  },
  {
    pattern: /Error: Commit .* not found/i,
    code: 'commit_not_found',
    suggestion: 'Check the commit ID with "jj log".',
  },
  {
    pattern: /Error: Revision .* not found/i,
    code: 'invalid_revision',
    suggestion: 'Check the revision expression with "jj log".',
  },
  {
    pattern: /Permission denied/i,
    code: 'permission_denied',
    suggestion: 'Check file permissions or run with appropriate privileges.',
  },
];

/**
 * Parse jj error output into structured error
 */
export function parseJJError(stderr: string, exitCode: number): JJError {
  // Try to match known error patterns
  for (const { pattern, code, suggestion } of ERROR_PATTERNS) {
    if (pattern.test(stderr)) {
      return {
        code,
        message: extractErrorMessage(stderr),
        rawError: stderr,
        suggestion,
      };
    }
  }

  // Check for generic error indicators
  if (exitCode === 1 && stderr.includes('Error:')) {
    return {
      code: 'command_failed',
      message: extractErrorMessage(stderr),
      rawError: stderr,
    };
  }

  // Unknown error
  return {
    code: 'unknown',
    message: stderr || 'An unknown error occurred',
    rawError: stderr,
  };
}

/**
 * Extract the main error message from stderr
 */
function extractErrorMessage(stderr: string): string {
  // Try to extract the first error line
  const lines = stderr.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Error:')) {
      return trimmed.replace('Error:', '').trim();
    }
    if (trimmed.length > 0 && !trimmed.startsWith('hint:')) {
      return trimmed;
    }
  }
  return stderr.trim();
}

/**
 * Create a user-friendly error response
 */
export function createErrorResponse(error: JJError | Error): {
  error: string;
  message: string;
  suggestion?: string;
} {
  if ('code' in error) {
    // JJError
    return {
      error: error.code,
      message: error.message,
      suggestion: error.suggestion,
    };
  }

  // Generic Error
  return {
    error: 'unknown',
    message: error.message,
  };
}
