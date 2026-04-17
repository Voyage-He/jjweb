import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RepoSelectView } from '../components/repo/RepoSelectView';

// Mock the API client
vi.mock('../../api/client', () => ({
  apiClient: {
    openRepo: vi.fn(),
    initRepo: vi.fn(),
    cloneRepo: vi.fn(),
  },
}));

// Mock the store
vi.mock('../../stores', () => ({
  useRepoStore: vi.fn(() => ({
    setRepository: vi.fn(),
  })),
}));

import { apiClient } from '../../api/client';
import { useRepoStore } from '../../stores';

const mockApiClient = vi.mocked(apiClient);
const mockUseRepoStore = vi.mocked(useRepoStore);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('RepoSelectView', () => {
  const mockOnRepoOpen = vi.fn();
  const mockSetRepository = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRepoStore.mockReturnValue({
      setRepository: mockSetRepository,
      repository: null,
    });
  });

  it('should render the component', () => {
    render(
      <RepoSelectView onRepoOpen={mockOnRepoOpen} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Jujutsu GUI')).toBeInTheDocument();
  });

  it('should have three mode tabs', () => {
    render(
      <RepoSelectView onRepoOpen={mockOnRepoOpen} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('init')).toBeInTheDocument();
    expect(screen.getByText('clone')).toBeInTheDocument();
  });

  it('should switch to init mode', () => {
    render(
      <RepoSelectView onRepoOpen={mockOnRepoOpen} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('init'));

    expect(screen.getByPlaceholderText('/path/to/new/repository')).toBeInTheDocument();
  });

  it('should switch to clone mode', () => {
    render(
      <RepoSelectView onRepoOpen={mockOnRepoOpen} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('clone'));

    expect(screen.getByPlaceholderText('https://github.com/user/repo.git')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('/path/to/clone')).toBeInTheDocument();
  });

  it('should show open form by default', () => {
    render(
      <RepoSelectView onRepoOpen={mockOnRepoOpen} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByPlaceholderText('/path/to/repository')).toBeInTheDocument();
    expect(screen.getByText('Open Repository')).toBeInTheDocument();
  });

  it('should submit open form', async () => {
    mockApiClient.openRepo.mockResolvedValueOnce({
      repository: {
        path: '/test/repo',
        name: 'repo',
        rootCommit: '',
        currentChange: '',
        jjVersion: '0.15.0',
      },
    });

    render(
      <RepoSelectView onRepoOpen={mockOnRepoOpen} />,
      { wrapper: createWrapper() }
    );

    const input = screen.getByPlaceholderText('/path/to/repository');
    fireEvent.change(input, { target: { value: '/test/repo' } });

    const button = screen.getByText('Open Repository');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockApiClient.openRepo).toHaveBeenCalledWith({ path: '/test/repo' });
    });
  });

  it('should show loading state', async () => {
    mockApiClient.openRepo.mockImplementation(() =>
      new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(
      <RepoSelectView onRepoOpen={mockOnRepoOpen} />,
      { wrapper: createWrapper() }
    );

    const input = screen.getByPlaceholderText('/path/to/repository');
    fireEvent.change(input, { target: { value: '/test/repo' } });

    const button = screen.getByText('Open Repository');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});
