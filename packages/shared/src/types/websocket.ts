/**
 * WebSocket message types for real-time updates
 */

import type { FileStatus } from './entities.js';

// Client -> Server messages
export type ClientMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | PingMessage;

export interface SubscribeMessage {
  type: 'subscribe';
  repoPath: string;
}

export interface UnsubscribeMessage {
  type: 'unsubscribe';
  repoPath: string;
}

export interface PingMessage {
  type: 'ping';
  timestamp: number;
}

// Server -> Client messages
export type ServerMessage =
  | PongMessage
  | FileChangedMessage
  | FileAddedMessage
  | FileDeletedMessage
  | CommitCreatedMessage
  | CommitUpdatedMessage
  | OperationRecordedMessage
  | BookmarkChangedMessage
  | WorkingCopyChangedMessage
  | ConflictDetectedMessage
  | RepoStateChangedMessage
  | ErrorMessage;

export interface PongMessage {
  type: 'pong';
  timestamp: number;
}

export interface FileChangedMessage {
  type: 'file:changed';
  path: string;
  status?: FileStatus;
}

export interface FileAddedMessage {
  type: 'file:added';
  path: string;
}

export interface FileDeletedMessage {
  type: 'file:deleted';
  path: string;
}

export interface CommitCreatedMessage {
  type: 'commit:created';
  commit: {
    id: string;
    changeId: string;
    parents: string[];
    description: string;
  };
}

export interface CommitUpdatedMessage {
  type: 'commit:updated';
  commitId: string;
  changes: {
    description?: string;
    bookmarks?: string[];
  };
}

export interface OperationRecordedMessage {
  type: 'operation:recorded';
  operation: {
    id: string;
    command: string;
    timestamp: number;
  };
}

export interface BookmarkChangedMessage {
  type: 'bookmark:changed';
  name: string;
  oldTarget?: string;
  newTarget?: string;
  action: 'created' | 'moved' | 'deleted';
}

export interface WorkingCopyChangedMessage {
  type: 'working_copy:changed';
  summary: {
    added: number;
    modified: number;
    deleted: number;
    untracked: number;
    conflicts: number;
  };
}

export interface ConflictDetectedMessage {
  type: 'conflict:detected';
  path: string;
  conflictType: 'file' | 'content';
}

export interface RepoStateChangedMessage {
  type: 'repo:state_changed';
  state: 'clean' | 'dirty' | 'conflict';
}

export interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

// Connection state
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketStatus {
  state: ConnectionState;
  lastConnected?: number;
  reconnectAttempts: number;
}
