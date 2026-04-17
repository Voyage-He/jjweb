# API Documentation

This document describes the REST API endpoints and WebSocket messages for the Jujutsu GUI backend.

## Base URL

- Development: `http://localhost:3001/api`
- Production: `/api`

## Authentication

The current version assumes single-user local use and does not require authentication.

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "suggestion": "Optional suggestion for resolution"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `no_repo` | No repository is currently open |
| `not_a_repo` | The specified path is not a valid jj repository |
| `invalid_input` | Request validation failed |
| `not_found` | Resource not found |
| `conflict` | Operation conflicts with current state |
| `command_failed` | jj command execution failed |

---

## Repository Endpoints

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "repoPath": "/path/to/repo" | null
}
```

### GET /api/repo/status

Get current repository status.

**Response:**
```json
{
  "repository": {
    "path": "/path/to/repo",
    "name": "repo-name",
    "rootCommit": "abc123...",
    "currentChange": "xyz789...",
    "jjVersion": "0.15.0"
  },
  "workingCopy": {
    "changeId": "xyz789",
    "files": [],
    "hasConflicts": false,
    "summary": {
      "added": 0,
      "modified": 2,
      "deleted": 0,
      "untracked": 1,
      "conflicts": 0
    }
  }
}
```

### GET /api/repo/log

Get commit history with pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Maximum commits to return |
| `offset` | number | 0 | Number of commits to skip |
| `revset` | string | all() | jj revset expression |

**Response:**
```json
{
  "commits": [
    {
      "id": "abc123...",
      "changeId": "xyz789...",
      "parents": ["parent1", "parent2"],
      "author": {
        "name": "John Doe",
        "email": "john@example.com",
        "timestamp": 1704067200000
      },
      "committer": {
        "name": "John Doe",
        "email": "john@example.com",
        "timestamp": 1704067200000
      },
      "description": "Commit message",
      "timestamp": 1704067200000,
      "bookmarks": [],
      "tags": [],
      "isWorkingCopy": false
    }
  ],
  "hasMore": true,
  "total": 150
}
```

### GET /api/repo/files

Get file tree with status.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Filter by path prefix |
| `status` | string[] | Filter by status values |

**Response:**
```json
{
  "files": [
    {
      "path": "src/file.ts",
      "status": "modified",
      "hunks": []
    }
  ],
  "rootPath": "/path/to/repo"
}
```

### GET /api/repo/diff/:path

Get diff for a specific file.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Source commit |
| `to` | string | Target commit |

**Response:**
```json
{
  "path": "src/file.ts",
  "hunks": [
    {
      "oldStart": 1,
      "oldLines": 5,
      "newStart": 1,
      "newLines": 7,
      "content": "@@ -1,5 +1,7 @@\n-removed line\n+added line\n"
    }
  ],
  "oldContent": "original content",
  "newContent": "new content"
}
```

### GET /api/repo/operations

Get operation log.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Maximum operations to return |

**Response:**
```json
{
  "operations": [
    {
      "id": "op123",
      "operationId": "abc456",
      "metadata": {
        "command": "commit",
        "args": ["-m", "message"],
        "cwd": "/path/to/repo",
        "timestamp": "2024-01-01T00:00:00Z"
      },
      "timestamp": 1704067200000
    }
  ],
  "hasMore": false
}
```

### POST /api/repo/init

Initialize a new repository.

**Request Body:**
```json
{
  "path": "/path/to/new/repo",
  "git": false
}
```

**Response:**
```json
{
  "repository": {
    "path": "/path/to/new/repo",
    "name": "repo",
    "rootCommit": "",
    "currentChange": "",
    "jjVersion": "0.15.0"
  }
}
```

### POST /api/repo/clone

Clone a repository.

**Request Body:**
```json
{
  "url": "https://github.com/user/repo.git",
  "path": "/local/path"
}
```

**Response:**
```json
{
  "repository": {
    "path": "/local/path",
    "name": "repo",
    "rootCommit": "abc123",
    "currentChange": "xyz789",
    "jjVersion": "0.15.0"
  }
}
```

### POST /api/repo/open

Open an existing repository.

**Request Body:**
```json
{
  "path": "/path/to/repo"
}
```

**Response:**
```json
{
  "repository": {
    "path": "/path/to/repo",
    "name": "repo",
    "rootCommit": "abc123",
    "currentChange": "xyz789",
    "jjVersion": "0.15.0"
  },
  "workingCopy": { ... }
}
```

---

## Changes Endpoints

### POST /api/changes/new

Create a new change.

**Request Body:**
```json
{
  "description": "Optional description",
  "after": "parent-change-id"
}
```

**Response:**
```json
{
  "success": true,
  "changeId": "xyz789"
}
```

### PUT /api/changes/:id/description

Edit change description.

**Request Body:**
```json
{
  "description": "New description"
}
```

**Response:**
```json
{
  "success": true
}
```

### DELETE /api/changes/:id

Abandon a change.

**Response:**
```json
{
  "success": true
}
```

### POST /api/changes/:id/move

Move/rebase a change.

**Request Body:**
```json
{
  "destination": "target-change-id",
  "insertAfter": true
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/changes/:id/squash

Squash change into parent.

**Request Body:**
```json
{
  "description": "Optional new description",
  "keepOriginal": false
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/changes/:id/split

Split a change.

**Request Body:**
```json
{
  "files": ["src/a.ts", "src/b.ts"]
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/changes/:id/amend

Amend change with working copy.

**Response:**
```json
{
  "success": true
}
```

---

## Bookmarks Endpoints

### GET /api/bookmarks

List all bookmarks.

**Response:**
```json
{
  "bookmarks": [
    {
      "name": "main",
      "target": "abc123",
      "isRemote": false,
      "remoteName": null
    }
  ]
}
```

### POST /api/bookmarks

Create a bookmark.

**Request Body:**
```json
{
  "name": "feature-branch",
  "target": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "name": "feature-branch"
}
```

### PUT /api/bookmarks/:name

Move a bookmark.

**Request Body:**
```json
{
  "target": "new-commit-id"
}
```

**Response:**
```json
{
  "success": true
}
```

### DELETE /api/bookmarks/:name

Delete a bookmark.

**Response:**
```json
{
  "success": true
}
```

---

## Operations Endpoints

### GET /api/operations/:id

Get operation details.

**Response:**
```json
{
  "operation": {
    "id": "op123",
    "operationId": "abc456",
    "metadata": { ... }
  }
}
```

### POST /api/operations/undo

Undo operation(s).

**Request Body:**
```json
{
  "operationId": "optional-specific-operation-id"
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/operations/redo

Redo undone operation.

**Response:**
```json
{
  "success": true
}
```

---

## Working Copy Endpoints

### GET /api/working-copy/status

Get working copy status.

**Response:**
```json
{
  "status": {
    "changeId": "xyz789",
    "files": [ ... ],
    "hasConflicts": false,
    "summary": { ... }
  }
}
```

### DELETE /api/working-copy/files/:path

Discard file changes.

**Response:**
```json
{
  "success": true
}
```

### POST /api/working-copy/files/:path

Restore deleted file.

**Response:**
```json
{
  "success": true
}
```

---

## Conflicts Endpoints

### GET /api/conflicts

List conflicting files.

**Response:**
```json
{
  "conflicts": [
    {
      "path": "conflicted-file.ts",
      "status": "conflict"
    }
  ]
}
```

### GET /api/conflicts/:path

Get conflict details.

**Response:**
```json
{
  "path": "conflicted-file.ts",
  "conflict": {
    "path": "conflicted-file.ts",
    "conflictType": "content",
    "sides": [ ... ]
  }
}
```

### PUT /api/conflicts/:path/resolve

Resolve a conflict.

**Request Body:**
```json
{
  "resolution": "ours" | "theirs" | "base" | "manual",
  "content": "Optional manual resolution content"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Settings Endpoints

### GET /api/settings

Get configuration.

**Response:**
```json
{
  "config": {
    "user.name": "John Doe",
    "user.email": "john@example.com"
  },
  "guiConfig": {
    "theme": "system",
    "editor": "code",
    "keybindings": {}
  }
}
```

### PUT /api/settings

Update configuration.

**Request Body:**
```json
{
  "config": { "user.name": "New Name" }
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/settings/aliases

List aliases.

**Response:**
```json
{
  "aliases": [
    { "name": "st", "command": "status" }
  ]
}
```

### POST /api/settings/aliases

Create alias.

**Request Body:**
```json
{
  "name": "co",
  "command": "commit"
}
```

**Response:**
```json
{
  "success": true
}
```

### DELETE /api/settings/aliases/:name

Delete alias.

**Response:**
```json
{
  "success": true
}
```

---

## WebSocket Messages

Connect to `ws://localhost:3001/ws` for real-time updates.

### Client → Server Messages

#### Subscribe to Repository
```json
{
  "type": "subscribe",
  "repoPath": "/path/to/repo"
}
```

#### Unsubscribe from Repository
```json
{
  "type": "unsubscribe",
  "repoPath": "/path/to/repo"
}
```

#### Ping
```json
{
  "type": "ping",
  "timestamp": 1704067200000
}
```

### Server → Client Messages

#### Pong
```json
{
  "type": "pong",
  "timestamp": 1704067200000
}
```

#### File Changed
```json
{
  "type": "file:changed",
  "path": "src/file.ts",
  "status": "modified"
}
```

#### Commit Created
```json
{
  "type": "commit:created",
  "commit": {
    "id": "abc123",
    "changeId": "xyz789",
    "parents": ["parent"],
    "description": "message"
  }
}
```

#### Working Copy Changed
```json
{
  "type": "working_copy:changed",
  "summary": {
    "added": 1,
    "modified": 2,
    "deleted": 0,
    "untracked": 0,
    "conflicts": 0
  }
}
```

#### Conflict Detected
```json
{
  "type": "conflict:detected",
  "path": "conflicted-file.ts",
  "conflictType": "content"
}
```

#### Error
```json
{
  "type": "error",
  "code": "ERROR_CODE",
  "message": "Error description"
}
```
