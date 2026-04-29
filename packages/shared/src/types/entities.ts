/**
 * Core entity types for Jujutsu GUI
 */

/**
 * Unix epoch timestamp in milliseconds, matching Date#getTime() and Date.now().
 */
export type EpochMilliseconds = number;

export interface Commit {
  id: string;
  changeId: string;
  parents: string[];
  author: Author;
  committer: Author;
  description: string;
  timestamp: EpochMilliseconds;
  bookmarks: Bookmark[];
  tags: string[];
  isWorkingCopy?: boolean;
  isDivergent?: boolean;
  hasConflicts?: boolean;
  isEmpty?: boolean;
  row?: number;
  column?: number;
}

export interface Author {
  name: string;
  email: string;
  timestamp: EpochMilliseconds;
}

export interface Bookmark {
  name: string;
  target: string;
  isRemote: boolean;
  remoteName?: string;
  isConflict?: boolean;
  isTracked?: boolean;
  isSynced?: boolean;
  isPresent?: boolean;
}

export interface Operation {
  id: string;
  operationId: string;
  description?: string;
  user?: string;
  time?: OperationTime;
  isCurrent?: boolean;
  isSnapshot?: boolean;
  workspaceName?: string;
  metadata: OperationMetadata;
  timestamp: EpochMilliseconds;
}

export interface OperationTime {
  start: EpochMilliseconds;
  end: EpochMilliseconds;
  duration: string;
}

export interface OperationMetadata {
  command: string;
  args: string[];
  cwd: string;
  timestamp: string;
}

export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'conflict' | 'untracked';

export interface FileChange {
  path: string;
  oldPath?: string; // For renames
  status: FileStatus;
  hunks: Hunk[];
}

export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

export interface Conflict {
  path: string;
  conflictType: 'file' | 'content';
  sides: ConflictSide[];
  base?: ConflictContent;
}

export interface ConflictSide {
  name: string;
  content: ConflictContent;
}

export interface ConflictContent {
  path: string;
  commit: string;
  content?: string;
}

export interface Repository {
  path: string;
  name: string;
  rootCommit: string;
  currentChange: string;
  jjVersion: string;
}

export interface WorkingCopyStatus {
  changeId: string;
  files: FileChange[];
  hasConflicts: boolean;
  summary: {
    added: number;
    modified: number;
    deleted: number;
    untracked: number;
    conflicts: number;
  };
}
