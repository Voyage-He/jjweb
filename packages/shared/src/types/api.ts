/**
 * API request and response types
 */

import type { Commit, FileChange, Operation, Repository, WorkingCopyStatus, Bookmark, Conflict } from './entities.js';

// Repository API
export interface OpenRepoRequest {
  path: string;
}

export interface OpenRepoResponse {
  repository: Repository;
}

export interface CloneRepoRequest {
  url: string;
  path: string;
  credentials?: Credentials;
}

export interface CloneRepoResponse {
  repository: Repository;
}

export interface InitRepoRequest {
  path: string;
  git?: boolean;
}

export interface InitRepoResponse {
  repository: Repository;
}

export interface RepoStatusResponse {
  repository: Repository | null;
}

// Commit/Log API
export interface LogRequest {
  revset?: string;
  limit?: number;
  offset?: number;
}

export interface LogResponse {
  commits: Commit[];
  hasMore: boolean;
  total: number;
}

export interface CommitDetailResponse {
  commit: Commit;
  files: FileChange[];
}

// File API
export interface FilesRequest {
  path?: string;
  status?: string[];
}

export interface FilesResponse {
  files: FileChange[];
  rootPath: string;
}

export interface DiffRequest {
  path: string;
  from?: string;
  to?: string;
}

export interface DiffResponse {
  path: string;
  hunks: import('./entities.js').Hunk[];
  oldContent?: string;
  newContent?: string;
}

// Working Copy API
export interface WorkingCopyStatusResponse {
  status: WorkingCopyStatus;
}

export interface DiscardChangesRequest {
  path: string;
  hunks?: number[]; // Indices of hunks to discard
}

export interface RestoreFileRequest {
  path: string;
}

export interface StageRequest {
  path: string;
  hunks?: number[];
}

export interface IgnoreRequest {
  path?: string;
  pattern?: string;
}

export interface IgnoreResponse {
  success: boolean;
  entry: string;
  message?: string;
}

// Change Operations API
export interface NewChangeRequest {
  description?: string;
  after?: string;
}

export interface NewChangeResponse {
  commit: Commit;
}

export interface EditDescriptionRequest {
  id: string;
  description: string;
}

export interface MoveChangeRequest {
  id: string;
  destination: string;
  insertAfter?: boolean;
}

export interface SquashRequest {
  id: string;
  description?: string;
  keepOriginal?: boolean;
}

export interface SplitRequest {
  id: string;
  files: string[];
}

// Operations API
export interface OperationsResponse {
  operations: Operation[];
  hasMore: boolean;
}

export interface OperationDetailResponse {
  operation: Operation;
  before: Commit[];
  after: Commit[];
}

export interface UndoRequest {
  operationId?: string; // If omitted, undo last operation
}

export interface RedoRequest {
  // No parameters needed
}

// Bookmarks API
export interface BookmarksResponse {
  bookmarks: Bookmark[];
}

export interface CreateBookmarkRequest {
  name: string;
  target: string;
}

export interface MoveBookmarkRequest {
  name: string;
  target: string;
}

// Conflicts API
export interface ConflictsResponse {
  conflicts: Conflict[];
}

export interface ConflictDetailResponse {
  conflict: Conflict;
}

export interface ResolveConflictRequest {
  path: string;
  resolution: 'ours' | 'theirs' | 'base' | 'manual';
  content?: string;
}

// Settings API
export interface SettingsResponse {
  config: Record<string, unknown>;
  guiConfig: GuiConfig;
}

export interface GuiConfig {
  theme: 'light' | 'dark' | 'system';
  editor: string;
  diffTool?: string;
  mergeTool?: string;
  keybindings: Record<string, string>;
}

export interface UpdateSettingsRequest {
  config?: Record<string, unknown>;
  guiConfig?: Partial<GuiConfig>;
}

export interface AliasesResponse {
  aliases: Alias[];
}

export interface Alias {
  name: string;
  command: string;
}

export interface CreateAliasRequest {
  name: string;
  command: string;
}

// Credentials
export interface Credentials {
  username?: string;
  password?: string;
  sshKey?: string;
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}
