import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Commit } from '@jujutsu-gui/shared';
import { calculateCommitLinePath, RevisionTable } from './RevisionTable';

vi.mock('../../stores', () => ({
  useUIStore: vi.fn(() => ({
    gridLayoutOptions: {
      rowHeight: 64,
      trackWidth: 60,
    },
    maxGraphWidth: 800,
    revisionColumns: [
      { id: 'changeId', label: 'Change ID', width: 100, visible: true },
      { id: 'message', label: 'Message', width: 'flex', visible: true },
      { id: 'author', label: 'Author', width: 120, visible: true },
      { id: 'date', label: 'Date', width: 140, visible: true },
    ],
  })),
}));

const makeCommit = (overrides: Partial<Commit> = {}): Commit => ({
  id: 'commit-1',
  changeId: 'change123456789',
  parents: [],
  author: {
    name: 'Test Author',
    email: 'test@example.com',
    timestamp: 1710000000,
  },
  committer: {
    name: 'Test Author',
    email: 'test@example.com',
    timestamp: 1710000000,
  },
  description: 'Default message',
  timestamp: 1710000000,
  bookmarks: [],
  tags: [],
  row: 0,
  column: 0,
  ...overrides,
});

const renderRevisionTable = (commits: Commit[]) => {
  const onCommitSelect = vi.fn();

  render(
    <div style={{ height: 400, width: 900 }}>
      <RevisionTable
        commits={commits}
        selectedCommit={null}
        onCommitSelect={onCommitSelect}
      />
    </div>
  );

  return { onCommitSelect };
};

describe('RevisionTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows only the first line of a multiline message', () => {
    const commit = makeCommit({
      description: 'First line summary\n\nBody line that should stay hidden',
    });

    renderRevisionTable([commit]);

    expect(screen.getByText('First line summary')).toBeInTheDocument();
    expect(screen.queryByText('Body line that should stay hidden')).not.toBeInTheDocument();
    expect(commit.description).toBe('First line summary\n\nBody line that should stay hidden');
  });

  it('shows bookmarks at the left of the Message cell and not in the graph header', () => {
    const commit = makeCommit({
      description: 'Add bookmark display',
      bookmarks: [
        {
          name: 'main',
          target: 'commit-1',
          isRemote: false,
        },
      ],
    });

    renderRevisionTable([commit]);

    const graphHeader = screen.getByTestId('revision-graph-header');
    expect(within(graphHeader).queryByText('main')).not.toBeInTheDocument();

    const messageCell = screen.getByTestId('revision-message-cell-commit-1');
    expect(within(messageCell).getByText('main')).toBeInTheDocument();
    expect(within(messageCell).getByText('Add bookmark display')).toBeInTheDocument();
    expect(messageCell.textContent?.indexOf('main')).toBeLessThan(
      messageCell.textContent?.indexOf('Add bookmark display') ?? -1
    );
  });

  it('allows clicking actions in the revision context menu', () => {
    const commit = makeCommit({
      description: 'Open context menu',
    });
    const onNewChange = vi.fn();

    render(
      <div style={{ height: 400, width: 900 }}>
        <RevisionTable
          commits={[commit]}
          selectedCommit={null}
          onCommitSelect={vi.fn()}
          onNewChange={onNewChange}
        />
      </div>
    );

    fireEvent.contextMenu(screen.getByTestId('revision-message-cell-commit-1'));
    fireEvent.click(screen.getByText('New Change After'));

    expect(onNewChange).toHaveBeenCalledTimes(1);
  });

  it('calculates outward curve controls for commits branching to the right', () => {
    expect(
      calculateCommitLinePath(1, 0, 0, 1, { rowHeight: 64, trackWidth: 60 })
    ).toBe('M 90 32 C 90 64, 48 64, 30 96');
  });

  it('calculates outward curve controls for commits branching to the left', () => {
    expect(
      calculateCommitLinePath(0, 0, 1, 1, { rowHeight: 64, trackWidth: 60 })
    ).toBe('M 30 32 C 30 64, 72 64, 90 96');
  });

  it('keeps same-column commit lines straight', () => {
    expect(
      calculateCommitLinePath(0, 0, 0, 1, { rowHeight: 64, trackWidth: 60 })
    ).toBe('M 30 32 L 30 96');
  });

  it('caps the curve spread factor at half the track width', () => {
    expect(
      calculateCommitLinePath(1, 0, 0, 1, { rowHeight: 64, trackWidth: 60 }, 0.8)
    ).toBe('M 90 32 C 90 64, 60 64, 30 96');
  });
});
