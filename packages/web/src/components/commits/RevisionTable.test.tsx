import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Commit } from '@jujutsu-gui/shared';
import { calculateCommitLinePath, RevisionTable } from './RevisionTable';

vi.mock('../../stores', () => ({
  useUIStore: vi.fn(() => ({
    gridLayoutOptions: {
      rowHeight: 48,
      trackWidth: 32,
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

const renderRevisionTable = (commits: Commit[], selectedCommit: Commit | null = null) => {
  const onCommitSelect = vi.fn();

  render(
    <div style={{ height: 400, width: 900 }}>
      <RevisionTable
        commits={commits}
        selectedCommit={selectedCommit}
        onCommitSelect={onCommitSelect}
      />
    </div>
  );

  return { onCommitSelect };
};

const svgClass = (testId: string) => screen.getByTestId(testId).getAttribute('class') ?? '';

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
      calculateCommitLinePath(1, 0, 0, 1, { rowHeight: 48, trackWidth: 32 })
    ).toBe('M 48 24 C 48 48, 25.6 48, 16 72');
  });

  it('calculates outward curve controls for commits branching to the left', () => {
    expect(
      calculateCommitLinePath(0, 0, 1, 1, { rowHeight: 48, trackWidth: 32 })
    ).toBe('M 16 24 C 16 48, 38.4 48, 48 72');
  });

  it('keeps same-column commit lines straight', () => {
    expect(
      calculateCommitLinePath(0, 0, 0, 1, { rowHeight: 48, trackWidth: 32 })
    ).toBe('M 16 24 L 16 72');
  });

  it('caps the curve spread factor at half the track width', () => {
    expect(
      calculateCommitLinePath(1, 0, 0, 1, { rowHeight: 48, trackWidth: 32 }, 0.8)
    ).toBe('M 48 24 C 48 48, 32 48, 16 72');
  });

  it('uses bus routing for cross-column edges that span multiple rows', () => {
    expect(
      calculateCommitLinePath(3, 0, 0, 4, { rowHeight: 48, trackWidth: 32 })
    ).toBe('M 112 24 L 112 199.2 L 16 199.2 L 16 216');
  });

  it('uses curves for adjacent-column edges that span multiple rows', () => {
    expect(
      calculateCommitLinePath(1, 0, 0, 4, { rowHeight: 48, trackWidth: 32 })
    ).toBe('M 48 24 C 48 120, 25.6 120, 16 216');
  });

  it('separates multi-parent bus routes near the parent row', () => {
    const firstParentPath = calculateCommitLinePath(
      3,
      0,
      0,
      4,
      { rowHeight: 48, trackWidth: 32 },
      0.3,
      { parentIndex: 0, parentCount: 3 }
    );
    const lastParentPath = calculateCommitLinePath(
      3,
      0,
      0,
      4,
      { rowHeight: 48, trackWidth: 32 },
      0.3,
      { parentIndex: 2, parentCount: 3 }
    );

    expect(firstParentPath).toBe('M 107 24 L 107 195.36 L 16 195.36 L 16 216');
    expect(lastParentPath).toBe('M 117 24 L 117 203.04 L 16 203.04 L 16 216');
  });

  it('offsets multi-parent edges so they do not share the same path', () => {
    const firstParentPath = calculateCommitLinePath(
      1,
      0,
      0,
      1,
      { rowHeight: 48, trackWidth: 32 },
      0.3,
      { parentIndex: 0, parentCount: 2 }
    );
    const secondParentPath = calculateCommitLinePath(
      1,
      0,
      0,
      1,
      { rowHeight: 48, trackWidth: 32 },
      0.3,
      { parentIndex: 1, parentCount: 2 }
    );

    expect(firstParentPath).toBe('M 45.5 24 C 45.5 48, 23.1 48, 16 72');
    expect(secondParentPath).toBe('M 50.5 24 C 50.5 48, 28.1 48, 16 72');
    expect(firstParentPath).not.toBe(secondParentPath);
  });

  it('keeps same-column multi-parent edges straight', () => {
    expect(
      calculateCommitLinePath(
        0,
        0,
        0,
        1,
        { rowHeight: 48, trackWidth: 32 },
        0.3,
        { parentIndex: 0, parentCount: 2 }
      )
    ).toBe('M 16 24 L 16 72');
  });

  it('marks merge edges with a weaker default visual class', () => {
    const merge = makeCommit({
      id: 'merge',
      changeId: 'merge-change',
      parents: ['parent-1', 'parent-2'],
      description: 'Merge commit',
      row: 0,
      column: 1,
    });
    const parent1 = makeCommit({
      id: 'parent-1',
      changeId: 'parent-1-change',
      description: 'Primary parent',
      row: 1,
      column: 1,
    });
    const parent2 = makeCommit({
      id: 'parent-2',
      changeId: 'parent-2-change',
      description: 'Merge parent',
      row: 2,
      column: 0,
    });

    renderRevisionTable([merge, parent1, parent2]);

    expect(svgClass('revision-graph-edge-merge-parent-1')).toContain('opacity-70');
    expect(svgClass('revision-graph-edge-merge-parent-2')).toContain('opacity-45');
  });

  it('keeps selected revision relationships highlighted', () => {
    const child = makeCommit({
      id: 'child',
      changeId: 'child-change',
      parents: ['parent'],
      description: 'Child',
      row: 0,
      column: 0,
    });
    const parent = makeCommit({
      id: 'parent',
      changeId: 'parent-change',
      description: 'Parent',
      row: 1,
      column: 0,
    });
    const unrelated = makeCommit({
      id: 'unrelated',
      changeId: 'unrelated-change',
      description: 'Unrelated',
      row: 2,
      column: 1,
    });

    renderRevisionTable([child, parent, unrelated], child);

    expect(svgClass('revision-graph-edge-child-parent')).toContain('opacity-100');
    expect(svgClass('revision-graph-node-unrelated')).toContain('opacity-25');
  });

  it('uses hover relationships before returning to selected relationships', () => {
    const selected = makeCommit({
      id: 'selected',
      changeId: 'selected-change',
      parents: ['selected-parent'],
      description: 'Selected',
      row: 0,
      column: 0,
    });
    const selectedParent = makeCommit({
      id: 'selected-parent',
      changeId: 'selected-parent-change',
      description: 'Selected parent',
      row: 1,
      column: 0,
    });
    const hovered = makeCommit({
      id: 'hovered',
      changeId: 'hovered-change',
      parents: ['hovered-parent'],
      description: 'Hovered',
      row: 2,
      column: 1,
    });
    const hoveredParent = makeCommit({
      id: 'hovered-parent',
      changeId: 'hovered-parent-change',
      description: 'Hovered parent',
      row: 3,
      column: 1,
    });

    renderRevisionTable([selected, selectedParent, hovered, hoveredParent], selected);

    expect(svgClass('revision-graph-edge-selected-selected-parent')).toContain('opacity-100');

    fireEvent.mouseEnter(screen.getByTestId('revision-graph-node-hovered'));
    expect(svgClass('revision-graph-edge-hovered-hovered-parent')).toContain('opacity-100');
    expect(svgClass('revision-graph-edge-selected-selected-parent')).toContain('opacity-20');

    fireEvent.mouseLeave(screen.getByTestId('revision-graph-node-hovered'));
    expect(svgClass('revision-graph-edge-selected-selected-parent')).toContain('opacity-100');
  });
});
