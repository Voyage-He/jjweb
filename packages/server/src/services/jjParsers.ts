/**
 * JJ Output Parsers
 * Parse JSON output from jj CLI commands
 */

import type { Commit, FileChange, Operation, WorkingCopyStatus, Hunk, Bookmark } from '@jujutsu-gui/shared';
import { jjExecutor } from './jjExecutor.js';

/**
 * Parse jj log output
 * Uses jj's built-in JSON serialization for reliable output
 */
export async function parseLog(
  cwd: string,
  revset?: string,
  limit: number = 100,
  offset: number = 0
): Promise<Commit[]> {
  // Use jj's built-in json() function to serialize commits
  // The json() function handles all escaping and formatting correctly
  // Each commit is output as a JSON object on its own line
  const jsonTemplate = 'json(self) ++ "\n"';

  // Build args - jj doesn't have --skip, so we use a revset approach for pagination
  const args = [
    'log',
    '--no-pager',
    '--no-graph',
    '-r', revset ?? 'all()',
    '-n', String(limit + offset),
    '-T', jsonTemplate,
  ];

  const result = await jjExecutor.execute(args, { cwd });
  if (!result.success) {
    throw new Error(`Failed to get log: ${result.stderr}`);
  }

  try {
    // Parse each line as a JSON object
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());

    // If no output but command succeeded, return empty array (empty repo case)
    if (lines.length === 0) {
      return [];
    }

    let commits = lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error(`Failed to parse line ${index + 1}:`, line.slice(0, 200));
        throw new Error(`JSON parse error at line ${index + 1}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    });

    // Handle offset by slicing (since jj doesn't have --skip)
    if (offset > 0) {
      commits = commits.slice(offset);
    }
    return commits.map(parseCommitFromJson);
  } catch (e) {
    // Re-throw with more context - don't silently return empty array
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('Failed to parse log output:', errorMessage);
    console.error('Raw stdout (first 500 chars):', result.stdout.slice(0, 500));
    throw new Error(`Failed to parse jj log output: ${errorMessage}`);
  }
}

// Interface for jj's built-in JSON output (from json(self) template)
// jj uses snake_case field names in JSON output
interface JJCommitJson {
  change_id: string;
  commit_id: string;
  parents: string[];
  author: { name: string; email: string; timestamp: string };
  committer: { name: string; email: string; timestamp: string };
  description: string | null;
  bookmarks?: string[];
  local_bookmarks?: string[];
  remote_bookmarks?: Array<{ name: string; remote: string }>;
  tags?: string[];
  working_copy?: boolean;
  divergent?: boolean;
  conflict?: boolean;
  empty?: boolean;
}

function parseCommitFromJson(json: JJCommitJson): Commit {
  // Combine local and remote bookmarks, marking remote ones appropriately
  const allBookmarks: Bookmark[] = [];

  // Add local bookmarks
  for (const name of json.local_bookmarks ?? json.bookmarks ?? []) {
    allBookmarks.push({
      name,
      target: json.commit_id,
      isRemote: false,
    });
  }

  // Add remote bookmarks
  for (const rb of json.remote_bookmarks ?? []) {
    allBookmarks.push({
      name: rb.name,
      target: json.commit_id,
      isRemote: true,
      remoteName: rb.remote,
    });
  }

  return {
    id: json.commit_id,
    changeId: json.change_id,
    parents: json.parents,
    author: {
      name: json.author.name,
      email: json.author.email,
      timestamp: parseTimestamp(json.author.timestamp),
    },
    committer: {
      name: json.committer.name,
      email: json.committer.email,
      timestamp: parseTimestamp(json.committer.timestamp),
    },
    description: json.description ?? '',
    timestamp: parseTimestamp(json.author.timestamp),
    bookmarks: allBookmarks,
    tags: json.tags ?? [],
    isWorkingCopy: json.working_copy ?? false,
    isDivergent: json.divergent ?? false,
    hasConflicts: json.conflict ?? false,
    isEmpty: json.empty ?? false,
  };
}

/**
 * Parse timestamp from jj output
 * jj timestamp format: "2024-01-15 10:30:00 -08:00" or ISO format
 */
function parseTimestamp(timestamp: string): number {
  // jj outputs timestamps in format like "2024-01-15 10:30:00 -08:00"
  // This can be parsed by Date constructor
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    // Fallback to current time if parsing fails
    return Date.now();
  }
  return date.getTime();
}

/**
 * Parse jj status output
 * Note: jj status doesn't support JSON output, so we parse text format
 */
export async function parseStatus(cwd: string): Promise<WorkingCopyStatus> {
  const args = ['status', '--no-pager'];

  const result = await jjExecutor.execute(args, { cwd });
  if (!result.success) {
    throw new Error(`Failed to get status: ${result.stderr}`);
  }

  try {
    return parseStatusFromText(result.stdout);
  } catch (e) {
    console.error('Failed to parse status output:', e);
    return {
      changeId: '',
      files: [],
      hasConflicts: false,
      summary: { added: 0, modified: 0, deleted: 0, untracked: 0, conflicts: 0 },
    };
  }
}

/**
 * Parse jj status text output
 * Example output (jj 0.39+):
 *   Working copy changes:
 *   A file1.txt
 *   M file2.txt
 *   D file3.txt
 *   ? file4.txt
 *   Working copy  (@) : xxxxxx xxxxxxxx description
 *   Parent commit (@-): xxxxxx xxxxxxxx description
 *
 * Or older format:
 *   Parent commit: xxxxxx xxxx
 *   Working copy : xxxxxx xxxx
 *   Parent commit: xxxxxx xxxx (conflict)
 *   A file1.txt
 *   M file2.txt
 *   D file3.txt
 *   ? file4.txt
 */
function parseStatusFromText(output: string): WorkingCopyStatus {
  const files: FileChange[] = [];
  let changeId = '';
  let hasConflicts = false;
  const summary = { added: 0, modified: 0, deleted: 0, untracked: 0, conflicts: 0 };

  const lines = output.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Extract change ID from "Working copy  (@) : xxxxxx xxxxxxxx description"
    // This is the newer format
    const newFormatMatch = line.match(/Working copy\s+\(@\)\s*:\s*(\w+)/);
    if (newFormatMatch) {
      changeId = newFormatMatch[1];
      continue;
    }

    // Also try older format: "Working copy : xxxxxx description"
    const oldFormatMatch = line.match(/Working copy\s*:\s*(\w+)/);
    if (oldFormatMatch && !changeId) {
      changeId = oldFormatMatch[1];
    }

    // Check for conflict marker
    if (line.includes('(conflict)')) {
      hasConflicts = true;
    }

    // Parse file status lines (indented with status code)
    // Format: "A added_file.txt" or "M modified_file.txt" etc.
    const statusMatch = trimmed.match(/^([AMDR?])\s+(.+)$/);
    if (statusMatch) {
      const [, statusChar, path] = statusMatch;
      let status: FileChange['status'] = 'modified';

      switch (statusChar) {
        case 'A':
          status = 'added';
          summary.added++;
          break;
        case 'M':
          status = 'modified';
          summary.modified++;
          break;
        case 'D':
          status = 'deleted';
          summary.deleted++;
          break;
        case 'R':
          status = 'renamed';
          summary.modified++;
          break;
        case '?':
          status = 'untracked';
          summary.untracked++;
          break;
        default:
          summary.modified++;
      }

      files.push({ path, status, hunks: [] });
    }

    // Check for conflict indicators in the output
    if (trimmed.includes('conflict') || line.includes('Conflict')) {
      hasConflicts = true;
    }
  }

  summary.conflicts = hasConflicts ? files.filter(f => f.status === 'conflict').length : 0;

  return {
    changeId,
    files,
    hasConflicts,
    summary,
  };
}

/**
 * Parse jj diff output
 * Note: jj diff doesn't have a simple -T json option that produces hunks
 * According to jj_templates.md, TreeDiff type has:
 * - .files() -> List<TreeDiffEntry>
 * - .color_words() -> Template
 * - .git() -> Template
 * - .stat() -> DiffStats
 * - .summary() -> Template
 *
 * We use .git() format which produces unified diff output
 */
export async function parseDiff(
  cwd: string,
  path: string,
  from?: string,
  to?: string
): Promise<Hunk[]> {
  // Use git diff format which we can parse
  const args = ['diff', '--no-pager', '--git'];

  if (from && to) {
    args.push('-r', `${from}..${to}`);
  }

  args.push(path);

  const result = await jjExecutor.execute(args, { cwd });
  if (!result.success) {
    throw new Error(`Failed to get diff: ${result.stderr}`);
  }

  try {
    return parseGitDiff(result.stdout);
  } catch (e) {
    console.error('Failed to parse diff output:', e);
    return [];
  }
}

/**
 * Parse git-style unified diff output
 */
function parseGitDiff(diffText: string): Hunk[] {
  const hunks: Hunk[] = [];
  const lines = diffText.split('\n');

  let currentHunk: Hunk | null = null;
  let hunkContent: string[] = [];

  for (const line of lines) {
    // Match hunk header: @@ -start,count +start,count @@ optional_text
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch) {
      // Save previous hunk if exists
      if (currentHunk) {
        currentHunk.content = hunkContent.join('\n');
        hunks.push(currentHunk);
      }

      // Start new hunk
      currentHunk = {
        oldStart: parseInt(hunkMatch[1], 10),
        oldLines: parseInt(hunkMatch[2] || '1', 10),
        newStart: parseInt(hunkMatch[3], 10),
        newLines: parseInt(hunkMatch[4] || '1', 10),
        content: '',
      };
      hunkContent = [line];
      continue;
    }

    // Add line to current hunk
    if (currentHunk) {
      hunkContent.push(line);
    }
  }

  // Save last hunk
  if (currentHunk) {
    currentHunk.content = hunkContent.join('\n');
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Parse jj operation log
 * Note: jj op log doesn't have a built-in JSON template, so we build our own
 * Based on jj_templates.md, Operation type has:
 * - .id() -> OperationId (has .short() method)
 * - .description() -> String
 * - .time() -> TimestampRange (has .start(), .end(), .duration())
 * - .user() -> String
 * - .current_operation() -> Boolean
 * - .snapshot() -> Boolean
 * - .workspace_name() -> String
 * - .root() -> Boolean
 * - .parents() -> List<Operation>
 */
export async function parseOperationLog(
  cwd: string,
  limit: number = 50
): Promise<Operation[]> {
  // Build a custom JSON template for operation log
  // Operation type is Serialize: yes, but we build explicit template for control
  const jsonTemplate = [
    '"{\\"id\\":\\""',
    ' ++ self.id()',
    ' ++ "\\",\\"description\\":\\""',
    ' ++ description.escape_json()',
    ' ++ "\\",\\"user\\":\\""',
    ' ++ user.escape_json()',
    ' ++ "\\",\\"time\\":{\\"start\\":\\""',
    ' ++ time.start()',
    ' ++ "\\",\\"end\\":\\""',
    ' ++ time.end()',
    ' ++ "\\",\\"duration\\":\\""',
    ' ++ time.duration()',
    ' ++ "\\"},\\"current\\":',
    ' ++ if(self.current_operation(), "true", "false")',
    ' ++ ",\\"snapshot\\":',
    ' ++ if(self.snapshot(), "true", "false")',
    ' ++ ",\\"workspace_name\\":\\""',
    ' ++ self.workspace_name().escape_json()',
    ' ++ "}\\""',
  ].join('');

  const args = [
    'op', 'log',
    '--no-pager',
    '-n', String(limit),
    '-T', jsonTemplate,
  ];

  const result = await jjExecutor.execute(args, { cwd });
  if (!result.success) {
    throw new Error(`Failed to get operation log: ${result.stderr}`);
  }

  try {
    // Parse each line as a JSON object
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());
    return lines.map(line => parseOperationFromJson(JSON.parse(line)));
  } catch (e) {
    console.error('Failed to parse operation log:', e);
    console.error('Raw stdout (first 500 chars):', result.stdout.slice(0, 500));
    return [];
  }
}

interface JJOperationJson {
  id: string;
  description: string;
  user: string;
  time: {
    start: string;
    end: string;
    duration: string;
  };
  current?: boolean;
  snapshot?: boolean;
  workspace_name?: string;
}

function parseOperationFromJson(json: JJOperationJson): Operation {
  return {
    id: json.id,
    operationId: json.id,
    description: json.description,
    user: json.user,
    time: {
      start: parseTimestamp(json.time.start),
      end: parseTimestamp(json.time.end),
      duration: json.time.duration,
    },
    isCurrent: json.current ?? false,
    isSnapshot: json.snapshot ?? false,
    workspaceName: json.workspace_name ?? '',
    metadata: {
      command: '',  // Will be populated from description parsing
      args: [],
      cwd: '',
      timestamp: json.time.start,
    },
    timestamp: parseTimestamp(json.time.start),
  };
}

/**
 * Parse jj bookmark list
 * Note: jj bookmark list outputs CommitRef objects
 * According to jj_templates.md, CommitRef has:
 * - .name() -> RefSymbol
 * - .remote() -> Option<RefSymbol>
 * - .present() -> Boolean
 * - .conflict() -> Boolean
 * - .tracked() -> Boolean
 * - .synced() -> Boolean
 * - .tracking_ahead_count() -> SizeHint
 * - .tracking_behind_count() -> SizeHint
 */
export async function parseBookmarks(cwd: string): Promise<Bookmark[]> {
  // Build a custom JSON template for bookmark list
  const jsonTemplate = [
    '"{\\"name\\":\\""',
    ' ++ self.name().escape_json()',
    ' ++ "\\",\\"remote\\":',
    ' ++ if(self.remote(), "\\"" ++ self.remote().escape_json() ++ "\\"", "null")',
    ' ++ ",\\"present\\":',
    ' ++ if(self.present(), "true", "false")',
    ' ++ ",\\"conflict\\":',
    ' ++ if(self.conflict(), "true", "false")',
    ' ++ ",\\"tracked\\":',
    ' ++ if(self.tracked(), "true", "false")',
    ' ++ ",\\"synced\\":',
    ' ++ if(self.synced(), "true", "false")',
    ' ++ "}\\""',
  ].join('');

  const args = ['bookmark', 'list', '--no-pager', '-T', jsonTemplate];

  const result = await jjExecutor.execute(args, { cwd });
  if (!result.success) {
    throw new Error(`Failed to get bookmarks: ${result.stderr}`);
  }

  try {
    // Parse each line as a JSON object
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());
    return lines.map(line => {
      const b = JSON.parse(line) as JJBookmarkJson;
      return {
        name: b.name,
        target: '', // Target commit is not directly available in bookmark list
        isRemote: b.remote != null,
        remoteName: b.remote ?? undefined,
        isConflict: b.conflict,
        isTracked: b.tracked,
        isSynced: b.synced,
        isPresent: b.present,
      };
    });
  } catch (e) {
    console.error('Failed to parse bookmarks:', e);
    console.error('Raw stdout (first 500 chars):', result.stdout.slice(0, 500));
    return [];
  }
}

interface JJBookmarkJson {
  name: string;
  remote: string | null;
  present: boolean;
  conflict: boolean;
  tracked: boolean;
  synced: boolean;
}
