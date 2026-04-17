"use strict";
/**
 * JJ Output Parsers
 * Parse JSON output from jj CLI commands
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLog = parseLog;
exports.parseStatus = parseStatus;
exports.parseDiff = parseDiff;
exports.parseOperationLog = parseOperationLog;
exports.parseBookmarks = parseBookmarks;
var jjExecutor_js_1 = require("./jjExecutor.js");
/**
 * Parse jj log output
 * Note: jj doesn't have a built-in JSON template, so we build our own
 */
function parseLog(cwd_1, revset_1) {
    return __awaiter(this, arguments, void 0, function (cwd, revset, limit, offset) {
        var jsonTemplate, args, result, lines, commits;
        if (limit === void 0) { limit = 100; }
        if (offset === void 0) { offset = 0; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jsonTemplate = [
                        '"{\\"commit_id\\":\\""',
                        ' ++ commit_id',
                        ' ++ "\\"",\\"change_id\\":\\"',
                        ' ++ change_id',
                        ' ++ "\\"",\\"parents\\":["',
                        ' ++ parents.map(|c| "\\"" ++ c.commit_id() ++ "\\"").join(",")',
                        ' ++ "],\\"author\\":{\\"name\\":\\""',
                        ' ++ author.name().escape_json()',
                        ' ++ "\\"",\\"email\\":\\""',
                        ' ++ author.email().escape_json()',
                        ' ++ "\\"",\\"timestamp\\":\\""',
                        ' ++ author.timestamp()',
                        ' ++ "\\""},\\"committer\\":{\\"name\\":\\""',
                        ' ++ committer.name().escape_json()',
                        ' ++ "\\"",\\"email\\":\\""',
                        ' ++ committer.email().escape_json()',
                        ' ++ "\\"",\\"timestamp\\":\\""',
                        ' ++ committer.timestamp()',
                        ' ++ "\\""},\\"description\\":',
                        ' ++ if(description, "\\"" ++ description.escape_json() ++ "\\"", "null")',
                        ' ++ ",\\"bookmarks\\":["',
                        ' ++ bookmarks().map(|b| "\\"" ++ b.name().escape_json() ++ "\\"").join(",")',
                        ' ++ "],\\"local_bookmarks\\":["',
                        ' ++ local_bookmarks().map(|b| "\\"" ++ b.name().escape_json() ++ "\\"").join(",")',
                        ' ++ "],\\"remote_bookmarks\\":["',
                        ' ++ remote_bookmarks().map(|b| "{\\"name\\":\\"" ++ b.name().escape_json() ++ "\\",\\"remote\\":\\"" ++ if(b.remote(), b.remote().escape_json(), "") ++ "\\"}").join(",")',
                        ' ++ "],\\"tags\\":["',
                        ' ++ tags().map(|t| "\\"" ++ t.name().escape_json() ++ "\\"").join(",")',
                        ' ++ "],\\"working_copy\\":',
                        ' ++ if(self.current_working_copy(), "true", "false")',
                        ' ++ ",\\"divergent\\":',
                        ' ++ if(divergent(), "true", "false")',
                        ' ++ ",\\"conflict\\":',
                        ' ++ if(conflict(), "true", "false")',
                        ' ++ ",\\"empty\\":',
                        ' ++ if(empty(), "true", "false")',
                        ' ++ "}\\""',
                    ].join('');
                    args = [
                        'log',
                        '--no-pager',
                        '--no-graph',
                        '-r',
                        revset !== null && revset !== void 0 ? revset : 'all()',
                        '-n', String(limit + offset),
                        '-T', jsonTemplate,
                    ];
                    return [4 /*yield*/, jjExecutor_js_1.jjExecutor.execute(args, { cwd: cwd })];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error("Failed to get log: ".concat(result.stderr));
                    }
                    try {
                        lines = result.stdout.trim().split('\n').filter(function (line) { return line.trim(); });
                        commits = lines.map(function (line) { return JSON.parse(line); });
                        // Handle offset by slicing (since jj doesn't have --skip)
                        if (offset > 0) {
                            commits = commits.slice(offset);
                        }
                        return [2 /*return*/, commits.map(parseCommitFromJson)];
                    }
                    catch (e) {
                        console.error('Failed to parse log output:', e);
                        console.error('Raw stdout (first 500 chars):', result.stdout.slice(0, 500));
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function parseCommitFromJson(json) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // Combine local and remote bookmarks, marking remote ones appropriately
    var allBookmarks = [];
    // Add local bookmarks
    for (var _i = 0, _k = (_b = (_a = json.local_bookmarks) !== null && _a !== void 0 ? _a : json.bookmarks) !== null && _b !== void 0 ? _b : []; _i < _k.length; _i++) {
        var name_1 = _k[_i];
        allBookmarks.push({
            name: name_1,
            target: json.commit_id,
            isRemote: false,
        });
    }
    // Add remote bookmarks
    for (var _l = 0, _m = (_c = json.remote_bookmarks) !== null && _c !== void 0 ? _c : []; _l < _m.length; _l++) {
        var rb = _m[_l];
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
        description: (_d = json.description) !== null && _d !== void 0 ? _d : '',
        timestamp: parseTimestamp(json.author.timestamp),
        bookmarks: allBookmarks,
        tags: (_e = json.tags) !== null && _e !== void 0 ? _e : [],
        isWorkingCopy: (_f = json.working_copy) !== null && _f !== void 0 ? _f : false,
        isDivergent: (_g = json.divergent) !== null && _g !== void 0 ? _g : false,
        hasConflicts: (_h = json.conflict) !== null && _h !== void 0 ? _h : false,
        isEmpty: (_j = json.empty) !== null && _j !== void 0 ? _j : false,
    };
}
/**
 * Parse timestamp from jj output
 * jj timestamp format: "2024-01-15 10:30:00 -08:00" or ISO format
 */
function parseTimestamp(timestamp) {
    // jj outputs timestamps in format like "2024-01-15 10:30:00 -08:00"
    // This can be parsed by Date constructor
    var date = new Date(timestamp);
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
function parseStatus(cwd) {
    return __awaiter(this, void 0, void 0, function () {
        var args, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = ['status', '--no-pager'];
                    return [4 /*yield*/, jjExecutor_js_1.jjExecutor.execute(args, { cwd: cwd })];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error("Failed to get status: ".concat(result.stderr));
                    }
                    try {
                        return [2 /*return*/, parseStatusFromText(result.stdout)];
                    }
                    catch (e) {
                        console.error('Failed to parse status output:', e);
                        return [2 /*return*/, {
                                changeId: '',
                                files: [],
                                hasConflicts: false,
                                summary: { added: 0, modified: 0, deleted: 0, untracked: 0, conflicts: 0 },
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Parse jj status text output
 * Example output:
 *   Parent commit: xxxxxx xxxx
 *   Working copy : xxxxxx xxxx
 *   Parent commit: xxxxxx xxxx (conflict)
 *   A file1.txt
 *   M file2.txt
 *   D file3.txt
 *   ? file4.txt
 */
function parseStatusFromText(output) {
    var files = [];
    var changeId = '';
    var hasConflicts = false;
    var summary = { added: 0, modified: 0, deleted: 0, untracked: 0, conflicts: 0 };
    var lines = output.split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        // Extract change ID from "Working copy : xxxxxx description"
        if (line.startsWith('Working copy')) {
            var match = line.match(/Working copy\s*:\s*(\w+)/);
            if (match) {
                changeId = match[1];
            }
            // Check for conflict marker
            if (line.includes('(conflict)')) {
                hasConflicts = true;
            }
        }
        // Parse file status lines (indented with status code)
        // Format: "A added_file.txt" or "M modified_file.txt" etc.
        var statusMatch = trimmed.match(/^([AMDR?])\s+(.+)$/);
        if (statusMatch) {
            var statusChar = statusMatch[1], path = statusMatch[2];
            var status_1 = 'modified';
            switch (statusChar) {
                case 'A':
                    status_1 = 'added';
                    summary.added++;
                    break;
                case 'M':
                    status_1 = 'modified';
                    summary.modified++;
                    break;
                case 'D':
                    status_1 = 'deleted';
                    summary.deleted++;
                    break;
                case 'R':
                    status_1 = 'renamed';
                    summary.modified++;
                    break;
                case '?':
                    status_1 = 'untracked';
                    summary.untracked++;
                    break;
                default:
                    summary.modified++;
            }
            files.push({ path: path, status: status_1, hunks: [] });
        }
        // Check for conflict indicators in the output
        if (trimmed.includes('conflict') || line.includes('Conflict')) {
            hasConflicts = true;
        }
    }
    summary.conflicts = hasConflicts ? files.filter(function (f) { return f.status === 'conflict'; }).length : 0;
    return {
        changeId: changeId,
        files: files,
        hasConflicts: hasConflicts,
        summary: summary,
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
function parseDiff(cwd, path, from, to) {
    return __awaiter(this, void 0, void 0, function () {
        var args, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = ['diff', '--no-pager', '--git'];
                    if (from && to) {
                        args.push('-r', "".concat(from, "..").concat(to));
                    }
                    args.push(path);
                    return [4 /*yield*/, jjExecutor_js_1.jjExecutor.execute(args, { cwd: cwd })];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error("Failed to get diff: ".concat(result.stderr));
                    }
                    try {
                        return [2 /*return*/, parseGitDiff(result.stdout)];
                    }
                    catch (e) {
                        console.error('Failed to parse diff output:', e);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Parse git-style unified diff output
 */
function parseGitDiff(diffText) {
    var hunks = [];
    var lines = diffText.split('\n');
    var currentHunk = null;
    var hunkContent = [];
    for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
        var line = lines_2[_i];
        // Match hunk header: @@ -start,count +start,count @@ optional_text
        var hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
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
function parseOperationLog(cwd_1) {
    return __awaiter(this, arguments, void 0, function (cwd, limit) {
        var jsonTemplate, args, result, lines;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jsonTemplate = [
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
                    args = [
                        'op', 'log',
                        '--no-pager',
                        '-n', String(limit),
                        '-T', jsonTemplate,
                    ];
                    return [4 /*yield*/, jjExecutor_js_1.jjExecutor.execute(args, { cwd: cwd })];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error("Failed to get operation log: ".concat(result.stderr));
                    }
                    try {
                        lines = result.stdout.trim().split('\n').filter(function (line) { return line.trim(); });
                        return [2 /*return*/, lines.map(function (line) { return parseOperationFromJson(JSON.parse(line)); })];
                    }
                    catch (e) {
                        console.error('Failed to parse operation log:', e);
                        console.error('Raw stdout (first 500 chars):', result.stdout.slice(0, 500));
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function parseOperationFromJson(json) {
    var _a, _b, _c;
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
        isCurrent: (_a = json.current) !== null && _a !== void 0 ? _a : false,
        isSnapshot: (_b = json.snapshot) !== null && _b !== void 0 ? _b : false,
        workspaceName: (_c = json.workspace_name) !== null && _c !== void 0 ? _c : '',
        metadata: {
            command: '', // Will be populated from description parsing
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
function parseBookmarks(cwd) {
    return __awaiter(this, void 0, void 0, function () {
        var jsonTemplate, args, result, lines;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jsonTemplate = [
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
                    args = ['bookmark', 'list', '--no-pager', '-T', jsonTemplate];
                    return [4 /*yield*/, jjExecutor_js_1.jjExecutor.execute(args, { cwd: cwd })];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error("Failed to get bookmarks: ".concat(result.stderr));
                    }
                    try {
                        lines = result.stdout.trim().split('\n').filter(function (line) { return line.trim(); });
                        return [2 /*return*/, lines.map(function (line) {
                                var _a;
                                var b = JSON.parse(line);
                                return {
                                    name: b.name,
                                    target: '', // Target commit is not directly available in bookmark list
                                    isRemote: b.remote != null,
                                    remoteName: (_a = b.remote) !== null && _a !== void 0 ? _a : undefined,
                                    isConflict: b.conflict,
                                    isTracked: b.tracked,
                                    isSynced: b.synced,
                                    isPresent: b.present,
                                };
                            })];
                    }
                    catch (e) {
                        console.error('Failed to parse bookmarks:', e);
                        console.error('Raw stdout (first 500 chars):', result.stdout.slice(0, 500));
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
