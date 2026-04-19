/**
 * Playwright E2E Tests for Jujutsu GUI
 */

import { test, expect } from '@playwright/test';

test.describe('Jujutsu GUI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show welcome page when no repository is open', async ({ page }) => {
    // Check for welcome page elements
    await expect(page.getByRole('heading', { name: 'Jujutsu GUI' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Initialize' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clone' })).toBeVisible();
  });

  test('should open repository dialog when clicking Open button', async ({ page }) => {
    await page.getByRole('button', { name: 'Open' }).click();

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/path/i)).toBeVisible();
  });

  test('should show recent repositories list', async ({ page }) => {
    // Mock recent repos API
    await page.route('**/api/repo/recent', async (route) => {
      await route.fulfill({
        json: {
          repos: [
            { name: 'test-repo', path: '/path/to/test-repo', lastOpened: Date.now() },
          ],
        },
      });
    });

    await page.reload();

    // Should show recent repos section
    await expect(page.getByText('Recent Repositories')).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Check initial theme
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('class');

    // Click theme toggle (if available in header)
    const themeToggle = page.getByRole('button', { name: /theme/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // Theme should change
      const newTheme = await html.getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
    }
  });
});

test.describe('Repository Management', () => {
  test('should initialize a new repository', async ({ page }) => {
    await page.goto('/');

    // Click Initialize button
    await page.getByRole('button', { name: 'Initialize' }).click();

    // Fill in path
    await page.getByLabel(/path/i).fill('/tmp/test-repo');

    // Submit
    await page.getByRole('button', { name: /initialize/i }).click();

    // Should navigate to main view
    await expect(page.getByRole('heading', { name: 'Working Copy' })).toBeVisible();
  });

  test('should open existing repository', async ({ page }) => {
    // Mock open repo API
    await page.route('**/api/repo/open', async (route) => {
      await route.fulfill({
        json: {
          repository: {
            name: 'test-repo',
            path: '/path/to/test-repo',
            jjVersion: '0.15.0',
          },
        },
      });
    });

    await page.goto('/');

    await page.getByRole('button', { name: 'Open' }).click();
    await page.getByLabel(/path/i).fill('/path/to/test-repo');
    await page.getByRole('button', { name: /open/i }).click();

    // Should show repository view
    await expect(page.getByText('test-repo')).toBeVisible();
  });
});

test.describe('Commit Graph', () => {
  test.beforeEach(async ({ page }) => {
    // Mock a repository being open
    await page.route('**/api/repo/status', async (route) => {
      await route.fulfill({
        json: {
          repository: {
            name: 'test-repo',
            path: '/path/to/test-repo',
            jjVersion: '0.15.0',
          },
        },
      });
    });

    await page.route('**/api/repo/log**', async (route) => {
      await route.fulfill({
        json: {
          commits: [
            {
              id: 'a1b2c3d4',
              changeId: 'z1234567',
              description: 'Initial commit',
              author: { name: 'Test', email: 'test@example.com', timestamp: Date.now() },
              parents: [],
              bookmarks: [{ name: 'main', target: 'a1b2c3d4', isRemote: false }],
              tags: [],
            },
          ],
          hasMore: false,
          total: 1,
        },
      });
    });

    await page.goto('/');
  });

  test('should display commit table', async ({ page }) => {
    // Wait for revision table to render
    const table = page.locator('[data-testid="revision-table"]');
    await expect(table).toBeVisible();
  });

  test('should show commit details on selection', async ({ page }) => {
    // Click on a row in the revision table
    const table = page.locator('[data-testid="revision-table"]');
    await table.click({ position: { x: 50, y: 50 } });

    // Detail panel should show commit info
    await expect(page.getByText('Initial commit')).toBeVisible();
  });
});

test.describe('Working Copy', () => {
  test.beforeEach(async ({ page }) => {
    // Mock working copy status
    await page.route('**/api/working-copy/status', async (route) => {
      await route.fulfill({
        json: {
          status: {
            changeId: 'z1234567',
            files: [
              { path: 'modified.txt', status: 'modified', hunks: [] },
              { path: 'added.txt', status: 'added', hunks: [] },
            ],
            hasConflicts: false,
            summary: { added: 1, modified: 1, deleted: 0, untracked: 0, conflicts: 0 },
          },
        },
      });
    });

    await page.goto('/');
  });

  test('should show working copy files', async ({ page }) => {
    await expect(page.getByText('modified.txt')).toBeVisible();
    await expect(page.getByText('added.txt')).toBeVisible();
  });

  test('should show file status badges', async ({ page }) => {
    await expect(page.getByText('Modified')).toBeVisible();
    await expect(page.getByText('Added')).toBeVisible();
  });
});

test.describe('Command Palette', () => {
  test('should open command palette with keyboard shortcut', async ({ page }) => {
    await page.goto('/');

    // Press Cmd/Ctrl + K
    await page.keyboard.press('Meta+k');

    // Command palette should open
    await expect(page.getByPlaceholder(/search commands/i)).toBeVisible();
  });

  test('should filter commands by search', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Meta+k');

    const searchInput = page.getByPlaceholder(/search commands/i);
    await searchInput.fill('new');

    // Should show matching commands
    await expect(page.getByText(/new change/i)).toBeVisible();
  });
});
