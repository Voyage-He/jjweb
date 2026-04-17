import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommandPalette, useCommandPalette, createDefaultCommands } from '../components/command-palette/CommandPalette';

// Helper to create a wrapper with QueryClient
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

describe('CommandPalette', () => {
  const mockCommands = [
    { id: 'test-1', label: 'Test Command 1', action: vi.fn() },
    { id: 'test-2', label: 'Test Command 2', action: vi.fn(), shortcut: 'Ctrl+T' },
    { id: 'test-3', label: 'Another Command', action: vi.fn(), category: 'Custom' },
  ];

  it('should not render when closed', () => {
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('Search commands...')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Search commands...')).toBeInTheDocument();
  });

  it('should display all commands', () => {
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Test Command 1')).toBeInTheDocument();
    expect(screen.getByText('Test Command 2')).toBeInTheDocument();
    expect(screen.getByText('Another Command')).toBeInTheDocument();
  });

  it('should display shortcuts', () => {
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Ctrl+T')).toBeInTheDocument();
  });

  it('should filter commands by query', () => {
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Search commands...');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(screen.getByText('Test Command 1')).toBeInTheDocument();
    expect(screen.getByText('Test Command 2')).toBeInTheDocument();
    expect(screen.queryByText('Another Command')).not.toBeInTheDocument();
  });

  it('should show no results message when no matches', () => {
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Search commands...');
    fireEvent.change(input, { target: { value: 'xyz' } });

    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  it('should execute command on click', () => {
    const mockAction = vi.fn();
    const mockClose = vi.fn();
    const commands = [
      { id: 'test', label: 'Test', action: mockAction },
    ];

    render(
      <CommandPalette
        commands={commands}
        isOpen={true}
        onClose={mockClose}
      />
    );

    fireEvent.click(screen.getByText('Test'));

    expect(mockAction).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should close on Escape key', () => {
    const mockClose = vi.fn();
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={true}
        onClose={mockClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockClose).toHaveBeenCalled();
  });

  it('should navigate with arrow keys', () => {
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // First command should be selected by default
    const buttons = screen.getAllByRole('button');

    // Navigate down
    fireEvent.keyDown(buttons[0], { key: 'ArrowDown' });

    // Navigate up
    fireEvent.keyDown(buttons[0], { key: 'ArrowUp' });
  });

  it('should execute command on Enter', () => {
    const mockAction = vi.fn();
    const mockClose = vi.fn();
    const commands = [
      { id: 'test', label: 'Test', action: mockAction },
    ];

    render(
      <CommandPalette
        commands={commands}
        isOpen={true}
        onClose={mockClose}
      />
    );

    fireEvent.keyDown(screen.getByText('Test'), { key: 'Enter' });

    expect(mockAction).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should group commands by category', () => {
    render(
      <CommandPalette
        commands={mockCommands}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });
});

describe('useCommandPalette', () => {
  it('should start closed', () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.isOpen).toBe(false);
  });

  it('should open with open()', () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should close with close()', () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.open();
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle with toggle()', () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });
});

describe('createDefaultCommands', () => {
  it('should create default commands with callbacks', () => {
    const onNewChange = vi.fn();
    const onCommit = vi.fn();

    const commands = createDefaultCommands({
      onNewChange,
      onCommit,
    });

    expect(commands.length).toBeGreaterThan(0);

    const newChangeCmd = commands.find(c => c.id === 'new-change');
    expect(newChangeCmd).toBeDefined();
    expect(newChangeCmd?.label).toBe('Create new change');

    // Execute action
    newChangeCmd?.action();
    expect(onNewChange).toHaveBeenCalled();
  });

  it('should have categories', () => {
    const commands = createDefaultCommands({});

    const categories = new Set(commands.map(c => c.category).filter(Boolean));
    expect(categories.has('Changes')).toBe(true);
    expect(categories.has('Operations')).toBe(true);
    expect(categories.has('Application')).toBe(true);
  });

  it('should have shortcuts for important commands', () => {
    const commands = createDefaultCommands({});

    const commandsWithShortcuts = commands.filter(c => c.shortcut);
    expect(commandsWithShortcuts.length).toBeGreaterThan(0);

    const newChangeCmd = commands.find(c => c.id === 'new-change');
    expect(newChangeCmd?.shortcut).toBeDefined();
  });
});

// Need to import these for the hook tests
import { renderHook, act } from '@testing-library/react';
