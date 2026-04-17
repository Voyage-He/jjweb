import { describe, it, expect } from 'vitest';
import { parseJJError, createErrorResponse } from '../src/utils/errors';
import type { JJError } from '../src/utils/errors';

describe('Error Parsing', () => {
  describe('parseJJError', () => {
    it('should parse "not a repository" error', () => {
      const stderr = 'Error: Could not find a repository at the current location';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('not_a_repository');
      expect(error.suggestion).toContain('jj init');
    });

    it('should parse conflict error', () => {
      const stderr = 'Error: There are unresolved conflicts in the working copy';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('conflict');
      expect(error.suggestion).toContain('Resolve conflicts');
    });

    it('should parse uncommitted changes error', () => {
      const stderr = 'Error: Working copy is dirty';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('uncommitted_changes');
    });

    it('should parse bookmark not found error', () => {
      const stderr = 'Error: No bookmark named "nonexistent" found';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('bookmark_not_found');
    });

    it('should parse commit not found error', () => {
      const stderr = 'Error: Commit abc123 not found';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('commit_not_found');
    });

    it('should parse revision not found error', () => {
      const stderr = 'Error: Revision "invalid-ref" not found';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('invalid_revision');
    });

    it('should parse permission denied error', () => {
      const stderr = 'Permission denied: cannot access /repo';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('permission_denied');
    });

    it('should parse generic command failed error', () => {
      const stderr = 'Error: Something went wrong with the command';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('command_failed');
    });

    it('should return unknown for unrecognized errors', () => {
      const stderr = 'Some random error message';
      const error = parseJJError(stderr, 1);

      expect(error.code).toBe('unknown');
      expect(error.message).toBe('Some random error message');
    });

    it('should handle empty stderr', () => {
      const error = parseJJError('', 1);

      expect(error.code).toBe('unknown');
      expect(error.message).toBe('An unknown error occurred');
    });

    it('should preserve raw error', () => {
      const stderr = 'Error: Could not find a repository';
      const error = parseJJError(stderr, 1);

      expect(error.rawError).toBe(stderr);
    });
  });

  describe('createErrorResponse', () => {
    it('should create response from JJError', () => {
      const jjError: JJError = {
        code: 'conflict',
        message: 'There are unresolved conflicts',
        rawError: 'Error: There are unresolved conflicts',
        suggestion: 'Resolve conflicts before proceeding.',
      };

      const response = createErrorResponse(jjError);

      expect(response.error).toBe('conflict');
      expect(response.message).toBe('There are unresolved conflicts');
      expect(response.suggestion).toBe('Resolve conflicts before proceeding.');
    });

    it('should create response from generic Error', () => {
      const error = new Error('Something unexpected happened');
      const response = createErrorResponse(error);

      expect(response.error).toBe('unknown');
      expect(response.message).toBe('Something unexpected happened');
      expect(response.suggestion).toBeUndefined();
    });

    it('should handle JJError without suggestion', () => {
      const jjError: JJError = {
        code: 'command_failed',
        message: 'Command failed',
        rawError: 'Error output',
      };

      const response = createErrorResponse(jjError);

      expect(response.suggestion).toBeUndefined();
    });
  });
});
