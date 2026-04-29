import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Commit } from '@jujutsu-gui/shared';
import { CommitDetail } from './CommitDetail';

const epochMilliseconds = 1704067200000;

const makeCommit = (overrides: Partial<Commit> = {}): Commit => ({
  id: 'commit-1',
  changeId: 'change123456789',
  parents: [],
  author: {
    name: 'Test Author',
    email: 'test@example.com',
    timestamp: epochMilliseconds,
  },
  committer: {
    name: 'Test Author',
    email: 'test@example.com',
    timestamp: epochMilliseconds,
  },
  description: 'Default message',
  timestamp: epochMilliseconds,
  bookmarks: [],
  tags: [],
  ...overrides,
});

const renderCommitDetail = (commit: Commit) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CommitDetail commit={commit} fileChanges={[]} />
    </QueryClientProvider>
  );
};

describe('CommitDetail', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats commit dates from epoch milliseconds without producing future years', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    renderCommitDetail(makeCommit());

    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });
});
