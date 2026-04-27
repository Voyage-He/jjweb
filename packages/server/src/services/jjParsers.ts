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
  // NOTE: json(self) does NOT include bookmarks, so we append them separately
  // Format: <json>|||BOOKMARKS|||<bookmark1>:::<bookmark2>:::...
  const jsonTemplate = 'json(self) ++ "|||BOOKMARKS|||" ++ bookmarks.map(|b| b.name()).join(":::") ++ "\n"';

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
    // Parse each line as a JSON object with appended bookmarks
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());

    // If no output but command succeeded, return empty array (empty repo case)
    if (lines.length === 0) {
      return [];
    }

    // Parse each line: <json>|||BOOKMARKS|||<bookmark1>:::<bookmark2>:::...
    let commits = lines.map((line, index) => {
      try {
        // Split by our custom separator
        const separator = '|||BOOKMARKS|||';
        const sepIndex = line.indexOf(separator);
        const jsonPart = sepIndex >= 0 ? line.slice(0, sepIndex) : line;
        const bookmarksPart = sepIndex >= 0 ? line.slice(sepIndex + separator.length) : '';

        const json = JSON.parse(jsonPart);
        // Extract bookmarks from the appended part
        const localBookmarks = bookmarksPart ? bookmarksPart.split(':::').filter(b => b.trim()) : undefined;

        // Add appended bookmarks when present while preserving JSON-provided bookmarks in tests.
        return {
          ...json,
          ...(localBookmarks ? { local_bookmarks: localBookmarks } : {}),
        };
      } catch (parseError) {
        console.error(`Failed to parse line ${index + 1}:`, line.slice(0, 200));
        throw new Error(`JSON parse error at line ${index + 1}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    });

    // Handle offset by slicing (since jj doesn't have --skip)
    if (offset > 0) {
      commits = commits.slice(offset);
    }
    const parsedCommits = commits.map(parseCommitFromJson);
    return calculateLayout(parsedCommits);
  } catch (e) {
    // Re-throw with more context - don't silently return empty array
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('Failed to parse log output:', errorMessage);
    console.error('Raw stdout (first 500 chars):', result.stdout.slice(0, 500));
    throw new Error(`Failed to parse jj log output: ${errorMessage}`);
  }
}

/**
 * Calculate grid coordinates (row, column) for commits
 */
/**
 * Calculate grid coordinates (row, column) for commits
 */
function calculateLayout(commits: Commit[]): Commit[] {
  if (commits.length === 0) return [];

  const commitToChange = new Map<string, string>();
  const changeToIndex = new Map<string, number>();
  const commitByChange = new Map<string, Commit>();
  for (let i = 0; i < commits.length; i++) {
    commitToChange.set(commits[i].id, commits[i].changeId);
    changeToIndex.set(commits[i].changeId, i);
    commitByChange.set(commits[i].changeId, commits[i]);
  }
  const getStableId = (cid: string) => commitToChange.get(cid) || cid;

  const scores = new Map<string, number>();
  const primaryChildrenMap = new Map<string, string[]>();
  const secondaryChildrenMap = new Map<string, string[]>();
  const mainlinePriority = new Map<string, number>();

  function getCommitMainlinePriority(commit: Commit): number {
    if (commit.isWorkingCopy) return 1000;

    let priority = 0;
    for (const bookmark of commit.bookmarks) {
      const name = bookmark.name.toLowerCase();
      if (name === 'main' || name.endsWith('/main')) priority = Math.max(priority, 900);
      else if (name === 'master' || name.endsWith('/master')) priority = Math.max(priority, 800);
      else if (name === 'trunk' || name.endsWith('/trunk')) priority = Math.max(priority, 700);
      else if (name === 'default' || name.endsWith('/default')) priority = Math.max(priority, 600);
      else if (name === '@') priority = Math.max(priority, 500);
      else priority = Math.max(priority, 100);
    }
    return priority;
  }

  for (const commit of commits) {
    const myId = commit.changeId;
    const priority = getCommitMainlinePriority(commit);
    const score = Math.max(1, priority);
    scores.set(myId, score);
    mainlinePriority.set(myId, priority);

    if (commit.parents.length > 0) {
      const primaryParentId = getStableId(commit.parents[0]);
      if (!primaryChildrenMap.has(primaryParentId)) primaryChildrenMap.set(primaryParentId, []);
      primaryChildrenMap.get(primaryParentId)!.push(myId);

      for (const parentId of commit.parents.slice(1).map(getStableId)) {
        if (!secondaryChildrenMap.has(parentId)) secondaryChildrenMap.set(parentId, []);
        secondaryChildrenMap.get(parentId)!.push(myId);
      }
    }
  }

  // Propagate scores UP
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const currentScore = scores.get(commit.changeId) || 0;
    if (commit.parents.length > 0) {
      const primaryParentId = getStableId(commit.parents[0]);
      scores.set(primaryParentId, Math.max(scores.get(primaryParentId) || 0, currentScore));
    }
  }

  function findPinnedMainline(): Set<string> {
    const head = commits
      .map((commit, index) => ({ commit, index, priority: mainlinePriority.get(commit.changeId) ?? 0 }))
      .filter(candidate => candidate.priority > 0)
      .sort((a, b) => {
        const priorityDiff = b.priority - a.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return a.index - b.index;
      })[0]?.commit;

    const pinned = new Set<string>();
    let current: Commit | undefined = head;
    while (current && !pinned.has(current.changeId)) {
      pinned.add(current.changeId);
      const primaryParent = current.parents[0];
      current = primaryParent ? commitByChange.get(getStableId(primaryParent)) : undefined;
    }
    return pinned;
  }

  const pinnedMainline = findPinnedMainline();

  const forkParents = Array.from(primaryChildrenMap.entries())
    .filter(([, children]) => children.length > 1)
    .map(([parent]) => parent);
  const childOrderOverrides = new Map<string, string[]>();

  const sortPrimaryChildren = (children: string[]) => {
    return [...children].sort((a, b) => {
      const pinnedDiff = Number(pinnedMainline.has(b)) - Number(pinnedMainline.has(a));
      if (pinnedDiff !== 0) return pinnedDiff;
      const sDiff = (scores.get(b) || 0) - (scores.get(a) || 0);
      if (sDiff !== 0) return sDiff;
      return (changeToIndex.get(a) || 0) - (changeToIndex.get(b) || 0);
    });
  };

  interface RowInterval {
    start: number;
    end: number;
  }

  interface LayoutCost {
    pinPenalty: number;
    mainlineContinuityPenalty: number;
    columnCount: number;
    crossings: number;
    horizontalDistance: number;
    orderDeviation: number;
  }

  function assignColumns(overrides: Map<string, string[]>): Map<string, number> {
    const assignedColumns = new Map<string, number>();
    const laneReservations = new Map<number, RowInterval[]>();

    function rowFor(changeId: string, fallback = 0): number {
      return changeToIndex.get(changeId) ?? fallback;
    }

    function nodeInterval(changeId: string): RowInterval {
      const row = rowFor(changeId);
      return { start: row, end: row + 1 };
    }

    function edgeInterval(childId: string, parentId: string): RowInterval {
      const childRow = rowFor(childId);
      const parentRow = rowFor(parentId, commits.length);
      return {
        start: Math.min(childRow, parentRow),
        end: Math.max(childRow, parentRow),
      };
    }

    function initialInterval(commit: Commit): RowInterval {
      const primaryParentId = commit.parents[0] ? getStableId(commit.parents[0]) : undefined;
      return primaryParentId ? edgeInterval(commit.changeId, primaryParentId) : nodeInterval(commit.changeId);
    }

    function intervalsOverlap(a: RowInterval, b: RowInterval): boolean {
      return a.start < b.end && b.start < a.end;
    }

    function reserveLane(col: number, interval: RowInterval): void {
      if (interval.end <= interval.start) return;
      const reservations = laneReservations.get(col) ?? [];
      reservations.push(interval);
      laneReservations.set(col, reservations);
    }

    function reservePrimaryEdge(childId: string, parentId: string, col: number): void {
      reserveLane(col, edgeInterval(childId, parentId));
    }

    function reserveParentEdge(childId: string, parentId: string, col: number): void {
      reserveLane(col, edgeInterval(childId, parentId));
    }

    function laneIsFree(col: number, interval: RowInterval): boolean {
      return !(laneReservations.get(col) ?? []).some(reservation => intervalsOverlap(reservation, interval));
    }

    function allocateLane(interval: RowInterval, startCol: number): number {
      let col = startCol;
      while (!laneIsFree(col, interval)) col++;
      reserveLane(col, interval);
      return col;
    }

    // Process from roots upwards to assign branches.
    for (let i = commits.length - 1; i >= 0; i--) {
      const commit = commits[i];
      const myId = commit.changeId;

      if (!assignedColumns.has(myId)) {
        const interval = initialInterval(commit);
        const col = pinnedMainline.has(myId)
          ? 0
          : allocateLane(interval, pinnedMainline.size > 0 ? 1 : 0);
        assignedColumns.set(myId, col);
        if (pinnedMainline.has(myId)) {
          reserveLane(col, interval);
        }
      }

      const myCol = assignedColumns.get(myId)!;
      for (const secondaryChildId of secondaryChildrenMap.get(myId) ?? []) {
        reserveParentEdge(secondaryChildId, myId, myCol);
      }

      const primaryChildren = primaryChildrenMap.get(myId) || [];

      if (primaryChildren.length > 0) {
        const orderedChildren = overrides.get(myId) || sortPrimaryChildren(primaryChildren);

        const pinnedChild = orderedChildren.find(childId => pinnedMainline.has(myId) && pinnedMainline.has(childId));
        if (pinnedChild) {
          assignedColumns.set(pinnedChild, myCol);
          reservePrimaryEdge(pinnedChild, myId, myCol);
        }

        const firstChild = pinnedChild ?? orderedChildren[0];
        assignedColumns.set(firstChild, myCol);
        if (firstChild !== pinnedChild) {
          reservePrimaryEdge(firstChild, myId, myCol);
        }

        for (let k = 0; k < orderedChildren.length; k++) {
          const cid = orderedChildren[k];
          if (cid === firstChild) continue;
          const newCol = allocateLane(edgeInterval(cid, myId), myCol + 1);
          assignedColumns.set(cid, newCol);
        }
      }
    }

    return assignedColumns;
  }

  function countEdgeCrossings(columns: Map<string, number>): number {
    const edges = commits.flatMap((commit, childRow) => {
      const childColumn = columns.get(commit.changeId) ?? 0;
      return commit.parents.map((parentId) => {
        const parentChangeId = getStableId(parentId);
        return {
          childId: commit.changeId,
          parentId: parentChangeId,
          y1: childRow,
          x1: childColumn,
          y2: changeToIndex.get(parentChangeId) ?? childRow,
          x2: columns.get(parentChangeId) ?? 0,
        };
      }).filter(edge => edge.y1 !== edge.y2);
    });

    let crossings = 0;
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i];
        const b = edges[j];
        if (
          a.childId === b.childId ||
          a.childId === b.parentId ||
          a.parentId === b.childId ||
          a.parentId === b.parentId
        ) {
          continue;
        }

        const yStart = Math.max(Math.min(a.y1, a.y2), Math.min(b.y1, b.y2));
        const yEnd = Math.min(Math.max(a.y1, a.y2), Math.max(b.y1, b.y2));
        if (yStart >= yEnd) continue;

        const startY = yStart + 0.001;
        const endY = yEnd - 0.001;
        const axStart = interpolateX(a.x1, a.y1, a.x2, a.y2, startY);
        const bxStart = interpolateX(b.x1, b.y1, b.x2, b.y2, startY);
        const axEnd = interpolateX(a.x1, a.y1, a.x2, a.y2, endY);
        const bxEnd = interpolateX(b.x1, b.y1, b.x2, b.y2, endY);

        if ((axStart - bxStart) * (axEnd - bxEnd) < 0) {
          crossings++;
        }
      }
    }
    return crossings;
  }

  function interpolateX(x1: number, y1: number, x2: number, y2: number, y: number): number {
    return x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);
  }

  function columnCount(columns: Map<string, number>): number {
    if (columns.size === 0) return 0;
    return Math.max(...columns.values()) + 1;
  }

  function layoutCost(columns: Map<string, number>, overrides: Map<string, string[]>): LayoutCost {
    let horizontalDistance = 0;
    let pinPenalty = 0;
    let mainlineContinuityPenalty = 0;
    let orderDeviation = 0;

    for (const [parentId, order] of overrides) {
      const stableOrder = sortPrimaryChildren(primaryChildrenMap.get(parentId) || []);
      for (let i = 0; i < order.length; i++) {
        orderDeviation += Math.abs(i - stableOrder.indexOf(order[i]));
      }
    }

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const commitColumn = columns.get(commit.changeId) ?? 0;
      if (pinnedMainline.has(commit.changeId) && commitColumn !== 0) {
        pinPenalty += 100000;
      }
      for (const parentId of commit.parents) {
        const parentChangeId = getStableId(parentId);
        const parentColumn = columns.get(parentChangeId) ?? 0;
        horizontalDistance += Math.abs(commitColumn - parentColumn);
        if (pinnedMainline.has(commit.changeId) && pinnedMainline.has(parentChangeId) && commitColumn !== parentColumn) {
          mainlineContinuityPenalty += 1;
        }
      }
    }
    return {
      pinPenalty,
      mainlineContinuityPenalty,
      columnCount: columnCount(columns),
      crossings: countEdgeCrossings(columns),
      horizontalDistance,
      orderDeviation,
    };
  }

  function compareLayoutCost(a: LayoutCost, b: LayoutCost): number {
    const keys: Array<keyof LayoutCost> = [
      'pinPenalty',
      'mainlineContinuityPenalty',
      'columnCount',
      'crossings',
      'horizontalDistance',
      'orderDeviation',
    ];

    for (const key of keys) {
      const diff = a[key] - b[key];
      if (diff !== 0) return diff;
    }
    return 0;
  }

  function candidateOrders(children: string[]): string[][] {
    const sorted = sortPrimaryChildren(children);
    if (children.length <= 4) {
      return permutations(sorted);
    }
    return [
      sorted,
      ...sorted.map((child) => [child, ...sorted.filter((candidate) => candidate !== child)]),
    ];
  }

  function permutations(items: string[]): string[][] {
    if (items.length <= 1) return [items];
    const result: string[][] = [];
    for (let i = 0; i < items.length; i++) {
      const head = items[i];
      const rest = [...items.slice(0, i), ...items.slice(i + 1)];
      for (const tail of permutations(rest)) {
        result.push([head, ...tail]);
      }
    }
    return result;
  }

  for (const parentId of forkParents) {
    const children = primaryChildrenMap.get(parentId) || [];
    let bestOrder = sortPrimaryChildren(children);
    let bestCost = layoutCost(assignColumns(childOrderOverrides), childOrderOverrides);

    for (const order of candidateOrders(children)) {
      const candidateOverrides = new Map(childOrderOverrides);
      candidateOverrides.set(parentId, order);
      const candidateCost = layoutCost(assignColumns(candidateOverrides), candidateOverrides);
      if (compareLayoutCost(candidateCost, bestCost) < 0) {
        bestCost = candidateCost;
        bestOrder = order;
      }
    }

    childOrderOverrides.set(parentId, bestOrder);
  }

  function normalizeColumns(columns: Map<string, number>): Map<string, number> {
    const usedColumns = [...new Set(columns.values())].sort((a, b) => a - b);
    const normalizedByColumn = new Map(usedColumns.map((col, index) => [col, index]));
    return new Map([...columns].map(([changeId, col]) => [changeId, normalizedByColumn.get(col) ?? col]));
  }

  const assignedColumns = normalizeColumns(assignColumns(childOrderOverrides));

  for (let i = 0; i < commits.length; i++) {
    commits[i].row = i;
    commits[i].column = assignedColumns.get(commits[i].changeId) ?? 0;
  }
  return commits;
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
