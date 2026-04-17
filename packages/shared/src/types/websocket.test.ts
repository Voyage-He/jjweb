import { describe, it, expect } from 'vitest';
import type {
  ClientMessage,
  ServerMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  PingMessage,
  PongMessage,
  FileChangedMessage,
  CommitCreatedMessage,
  CommitUpdatedMessage,
  OperationRecordedMessage,
  BookmarkChangedMessage,
  WorkingCopyChangedMessage,
  ConflictDetectedMessage,
  RepoStateChangedMessage,
  ErrorMessage,
  ConnectionState,
  WebSocketStatus,
} from '../src/types/websocket';

describe('WebSocket Types', () => {
  describe('Client Messages', () => {
    it('should create SubscribeMessage', () => {
      const message: SubscribeMessage = {
        type: 'subscribe',
        repoPath: '/path/to/repo',
      };

      expect(message.type).toBe('subscribe');
      expect(message.repoPath).toBe('/path/to/repo');
    });

    it('should create UnsubscribeMessage', () => {
      const message: UnsubscribeMessage = {
        type: 'unsubscribe',
        repoPath: '/path/to/repo',
      };

      expect(message.type).toBe('unsubscribe');
    });

    it('should create PingMessage', () => {
      const message: PingMessage = {
        type: 'ping',
        timestamp: Date.now(),
      };

      expect(message.type).toBe('ping');
      expect(message.timestamp).toBeGreaterThan(0);
    });

    it('should support all client message types', () => {
      const messages: ClientMessage[] = [
        { type: 'subscribe', repoPath: '/repo' },
        { type: 'unsubscribe', repoPath: '/repo' },
        { type: 'ping', timestamp: 12345 },
      ];

      expect(messages).toHaveLength(3);
    });
  });

  describe('Server Messages', () => {
    it('should create PongMessage', () => {
      const message: PongMessage = {
        type: 'pong',
        timestamp: Date.now(),
      };

      expect(message.type).toBe('pong');
    });

    it('should create FileChangedMessage', () => {
      const message: FileChangedMessage = {
        type: 'file:changed',
        path: 'src/file.ts',
        status: 'modified',
      };

      expect(message.type).toBe('file:changed');
      expect(message.status).toBe('modified');
    });

    it('should create CommitCreatedMessage', () => {
      const message: CommitCreatedMessage = {
        type: 'commit:created',
        commit: {
          id: 'commit123',
          changeId: 'change123',
          parents: ['parent1'],
          description: 'New commit',
        },
      };

      expect(message.type).toBe('commit:created');
      expect(message.commit.id).toBe('commit123');
    });

    it('should create CommitUpdatedMessage', () => {
      const message: CommitUpdatedMessage = {
        type: 'commit:updated',
        commitId: 'commit123',
        changes: {
          description: 'Updated description',
          bookmarks: ['main', 'develop'],
        },
      };

      expect(message.type).toBe('commit:updated');
      expect(message.changes.bookmarks).toHaveLength(2);
    });

    it('should create OperationRecordedMessage', () => {
      const message: OperationRecordedMessage = {
        type: 'operation:recorded',
        operation: {
          id: 'op123',
          command: 'commit',
          timestamp: Date.now(),
        },
      };

      expect(message.type).toBe('operation:recorded');
      expect(message.operation.command).toBe('commit');
    });

    it('should create BookmarkChangedMessage for creation', () => {
      const message: BookmarkChangedMessage = {
        type: 'bookmark:changed',
        name: 'feature',
        newTarget: 'commit123',
        action: 'created',
      };

      expect(message.action).toBe('created');
      expect(message.oldTarget).toBeUndefined();
    });

    it('should create BookmarkChangedMessage for move', () => {
      const message: BookmarkChangedMessage = {
        type: 'bookmark:changed',
        name: 'main',
        oldTarget: 'old-commit',
        newTarget: 'new-commit',
        action: 'moved',
      };

      expect(message.action).toBe('moved');
      expect(message.oldTarget).toBe('old-commit');
    });

    it('should create BookmarkChangedMessage for deletion', () => {
      const message: BookmarkChangedMessage = {
        type: 'bookmark:changed',
        name: 'old-branch',
        oldTarget: 'commit123',
        action: 'deleted',
      };

      expect(message.action).toBe('deleted');
      expect(message.newTarget).toBeUndefined();
    });

    it('should create WorkingCopyChangedMessage', () => {
      const message: WorkingCopyChangedMessage = {
        type: 'working_copy:changed',
        summary: {
          added: 2,
          modified: 3,
          deleted: 1,
          untracked: 5,
          conflicts: 0,
        },
      };

      expect(message.type).toBe('working_copy:changed');
      expect(message.summary.added).toBe(2);
    });

    it('should create ConflictDetectedMessage', () => {
      const message: ConflictDetectedMessage = {
        type: 'conflict:detected',
        path: 'conflicted-file.ts',
        conflictType: 'content',
      };

      expect(message.type).toBe('conflict:detected');
      expect(message.conflictType).toBe('content');
    });

    it('should create RepoStateChangedMessage', () => {
      const message: RepoStateChangedMessage = {
        type: 'repo:state_changed',
        state: 'dirty',
      };

      expect(message.type).toBe('repo:state_changed');
      expect(message.state).toBe('dirty');
    });

    it('should support all repo states', () => {
      const states: Array<'clean' | 'dirty' | 'conflict'> = [
        'clean',
        'dirty',
        'conflict',
      ];

      expect(states).toHaveLength(3);
    });

    it('should create ErrorMessage', () => {
      const message: ErrorMessage = {
        type: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      };

      expect(message.type).toBe('error');
      expect(message.code).toBe('INTERNAL_ERROR');
    });

    it('should support all server message types', () => {
      const messages: ServerMessage[] = [
        { type: 'pong', timestamp: 12345 },
        { type: 'file:changed', path: 'file.ts', status: 'modified' },
        { type: 'commit:created', commit: { id: 'c1', changeId: 'ch1', parents: [], description: '' } },
        { type: 'commit:updated', commitId: 'c1', changes: {} },
        { type: 'operation:recorded', operation: { id: 'o1', command: 'test', timestamp: 123 } },
        { type: 'bookmark:changed', name: 'main', action: 'created' },
        { type: 'working_copy:changed', summary: { added: 0, modified: 0, deleted: 0, untracked: 0, conflicts: 0 } },
        { type: 'conflict:detected', path: 'file.ts', conflictType: 'content' },
        { type: 'repo:state_changed', state: 'clean' },
        { type: 'error', code: 'ERR', message: 'Error' },
      ];

      expect(messages).toHaveLength(10);
    });
  });

  describe('Connection State', () => {
    it('should support all connection states', () => {
      const states: ConnectionState[] = [
        'connecting',
        'connected',
        'disconnected',
        'reconnecting',
      ];

      expect(states).toHaveLength(4);
    });
  });

  describe('WebSocket Status', () => {
    it('should create WebSocketStatus for connected state', () => {
      const status: WebSocketStatus = {
        state: 'connected',
        lastConnected: Date.now(),
        reconnectAttempts: 0,
      };

      expect(status.state).toBe('connected');
      expect(status.reconnectAttempts).toBe(0);
    });

    it('should create WebSocketStatus for reconnecting', () => {
      const status: WebSocketStatus = {
        state: 'reconnecting',
        reconnectAttempts: 3,
      };

      expect(status.state).toBe('reconnecting');
      expect(status.reconnectAttempts).toBe(3);
      expect(status.lastConnected).toBeUndefined();
    });

    it('should create WebSocketStatus for disconnected', () => {
      const status: WebSocketStatus = {
        state: 'disconnected',
        reconnectAttempts: 0,
      };

      expect(status.state).toBe('disconnected');
    });
  });
});
