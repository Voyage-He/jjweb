import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Operation } from '@jujutsu-gui/shared';
import { OperationLog } from './OperationLog';

const now = 1704074400000;

const makeOperation = (overrides: Partial<Operation> = {}): Operation => ({
  id: 'op-1',
  operationId: 'op-1',
  description: 'commit abc123',
  user: 'Test User',
  metadata: {
    command: 'commit',
    args: ['-m', 'message'],
    cwd: '/repo',
    timestamp: '2024-01-01T00:00:00Z',
  },
  timestamp: now - 5 * 60 * 1000,
  ...overrides,
});

const renderOperationLog = (operations: Operation[]) => render(
  <OperationLog
    operations={operations}
    selectedOperationId={null}
    onSelect={vi.fn()}
    onUndo={vi.fn()}
    onRedo={vi.fn()}
    canUndo
    canRedo={false}
  />
);

describe('OperationLog', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats relative time from epoch milliseconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));

    renderOperationLog([
      makeOperation({ id: 'minutes', operationId: 'minutes', timestamp: now - 5 * 60 * 1000 }),
      makeOperation({ id: 'hours', operationId: 'hours', timestamp: now - 2 * 60 * 60 * 1000 }),
      makeOperation({ id: 'days', operationId: 'days', timestamp: now - 3 * 24 * 60 * 60 * 1000 }),
    ]);

    expect(screen.getByText('5m ago')).toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });
});
