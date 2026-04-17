import { describe, it, expect } from 'vitest';
import { sanitizeCommand, validatePath, createSafeEnv } from '../src/utils/sanitize';
import path from 'path';

describe('Command Sanitization', () => {
  describe('sanitizeCommand', () => {
    it('should reject empty command', () => {
      const result = sanitizeCommand([]);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No command provided');
    });

    it('should reject undefined/null args', () => {
      const result = sanitizeCommand(null as unknown as string[]);

      expect(result.valid).toBe(false);
    });

    it('should accept allowed commands', () => {
      const allowedCommands = ['log', 'status', 'diff', 'commit', 'new', 'describe'];

      for (const cmd of allowedCommands) {
        const result = sanitizeCommand([cmd]);
        expect(result.valid).toBe(true);
        expect(result.sanitizedArgs?.[0]).toBe(cmd);
      }
    });

    it('should reject disallowed commands', () => {
      const result = sanitizeCommand(['rm']);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject command substitution', () => {
      const result = sanitizeCommand(['log', '$(rm -rf /)']);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('forbidden pattern');
    });

    it('should reject pipe operator', () => {
      const result = sanitizeCommand(['log', '| cat']);

      expect(result.valid).toBe(false);
    });

    it('should reject semicolon', () => {
      const result = sanitizeCommand(['log', '; rm -rf /']);

      expect(result.valid).toBe(false);
    });

    it('should reject AND operator', () => {
      const result = sanitizeCommand(['log', '&& rm -rf /']);

      expect(result.valid).toBe(false);
    });

    it('should reject OR operator', () => {
      const result = sanitizeCommand(['log', '|| echo hacked']);

      expect(result.valid).toBe(false);
    });

    it('should reject redirect operators', () => {
      const result1 = sanitizeCommand(['log', '> /etc/passwd']);
      const result2 = sanitizeCommand(['log', '< /etc/passwd']);

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
    });

    it('should reject backticks', () => {
      const result = sanitizeCommand(['log', '`rm -rf /`']);

      expect(result.valid).toBe(false);
    });

    it('should reject variable expansion', () => {
      const result = sanitizeCommand(['log', '${PATH}']);

      expect(result.valid).toBe(false);
    });

    it('should reject hex escape sequences', () => {
      const result = sanitizeCommand(['log', '\\x00']);

      expect(result.valid).toBe(false);
    });

    it('should reject arguments exceeding max length', () => {
      const longArg = 'a'.repeat(5000);
      const result = sanitizeCommand(['log', longArg]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximum length');
    });

    it('should reject URLs with embedded credentials', () => {
      const result = sanitizeCommand(['git', 'https://user:pass@github.com/repo.git']);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('embedded credentials');
    });

    it('should accept valid arguments', () => {
      const result = sanitizeCommand(['log', '-r', 'main', '-n', '50']);

      expect(result.valid).toBe(true);
      expect(result.sanitizedArgs).toEqual(['log', '-r', 'main', '-n', '50']);
    });

    it('should accept paths as arguments', () => {
      const result = sanitizeCommand(['status', 'src/file.ts']);

      expect(result.valid).toBe(true);
      expect(result.sanitizedArgs).toContain('src/file.ts');
    });
  });

  describe('validatePath', () => {
    it('should accept paths within repo root', () => {
      const repoRoot = '/home/user/repo';

      expect(validatePath('src/file.ts', repoRoot)).toBe(true);
      expect(validatePath('./src/file.ts', repoRoot)).toBe(true);
      expect(validatePath('subdir/../src/file.ts', repoRoot)).toBe(true);
    });

    it('should reject path traversal attempts', () => {
      const repoRoot = '/home/user/repo';

      expect(validatePath('../../../etc/passwd', repoRoot)).toBe(false);
      expect(validatePath('src/../../../etc/passwd', repoRoot)).toBe(false);
    });
  });

  describe('createSafeEnv', () => {
    it('should create safe environment with necessary variables', () => {
      const env = createSafeEnv();

      expect(env.PATH).toBeDefined();
      expect(env.HOME).toBeDefined();
      expect(env.TERM).toBe('dumb');
    });

    it('should include additional environment variables', () => {
      const env = createSafeEnv({ CUSTOM_VAR: 'test' });

      expect(env.CUSTOM_VAR).toBe('test');
    });

    it('should remove dangerous variables', () => {
      const env = createSafeEnv();

      expect(env.JJ_EDITOR).toBeUndefined();
      expect(env.EDITOR).toBeUndefined();
      expect(env.VISUAL).toBeUndefined();
    });

    it('should not allow overriding dangerous variables', () => {
      const env = createSafeEnv({ EDITOR: 'vim' });

      expect(env.EDITOR).toBeUndefined();
    });
  });
});
