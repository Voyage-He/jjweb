/**
 * Tests for RepoSwitcher Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RepoSwitcher } from '../src/components/repo/RepoSwitcher';
import * as apiClient from '../src/api/client';

// Mock API client
vi.mock('../src/api/client', () => ({
  apiClient: {
    getRecentRepos: vi.fn(),
    openRepo: vi.fn(),
    closeRepo: vi.fn(),
  },
}));

// Mock stores
vi.mock('../src/stores', () => ({
  useRepoStore: vi.fn((selector) => {
    const state = {
      repository: { name: 'test-repo', path: '/path/to/repo', jjVersion: '0.15.0' },
      setRepository: vi.fn(),
      reset: vi.fn(),
    };
    return selector(state);
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('RepoSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display current repository name', () => {
    vi.mocked(apiClient.apiClient.getRecentRepos).mockResolvedValue({ repos: [] });

    render(<RepoSwitcher />, { wrapper: createWrapper() });

    expect(screen.getByText('test-repo')).toBeInTheDocument();
  });

  it('should open dropdown on click', async () => {
    vi.mocked(apiClient.apiClient.getRecentRepos).mockResolvedValue({ repos: [] });

    render(<RepoSwitcher />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /test-repo/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Open Repository...')).toBeInTheDocument();
    });
  });

  it('should show recent repositories', async () => {
    vi.mocked(apiClient.apiClient.getRecentRepos).mockResolvedValue({
      repos: [
        { name: 'other-repo', path: '/path/to/other', lastOpened: Date.now() },
      ],
    });

    render(<RepoSwitcher />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /test-repo/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('other-repo')).toBeInTheDocument();
    });
  });

  it('should switch repository when clicking on recent repo', async () => {
    vi.mocked(apiClient.apiClient.getRecentRepos).mockResolvedValue({
      repos: [
        { name: 'other-repo', path: '/path/to/other', lastOpened: Date.now() },
      ],
    });
    vi.mocked(apiClient.apiClient.openRepo).mockResolvedValue({
      repository: { name: 'other-repo', path: '/path/to/other', jjVersion: '0.15.0' },
    });

    render(<RepoSwitcher />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /test-repo/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('other-repo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('other-repo'));

    await waitFor(() => {
      expect(apiClient.apiClient.openRepo).toHaveBeenCalledWith({ path: '/path/to/other' });
    });
  });

  it('should close repository when clicking close', async () => {
    vi.mocked(apiClient.apiClient.getRecentRepos).mockResolvedValue({ repos: [] });
    vi.mocked(apiClient.apiClient.closeRepo).mockResolvedValue({ success: true });

    render(<RepoSwitcher />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /test-repo/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Close Repository')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Repository'));

    await waitFor(() => {
      expect(apiClient.apiClient.closeRepo).toHaveBeenCalled();
    });
  });
});
