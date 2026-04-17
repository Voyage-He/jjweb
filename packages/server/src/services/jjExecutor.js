"use strict";
/**
 * JJ Command Executor Service
 * Handles spawning and managing jj CLI processes
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.jjExecutor = void 0;
var child_process_1 = require("child_process");
var JJExecutor = /** @class */ (function () {
    function JJExecutor(jjPath) {
        if (jjPath === void 0) { jjPath = 'jj'; }
        this.defaultTimeout = 30000; // 30 seconds
        this.jjPath = jjPath;
    }
    /**
     * Execute a jj command and return the result
     */
    JJExecutor.prototype.execute = function (args_1) {
        return __awaiter(this, arguments, void 0, function (args, options) {
            var _a, cwd, _b, timeout, _c, env;
            var _this = this;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                _a = options.cwd, cwd = _a === void 0 ? process.cwd() : _a, _b = options.timeout, timeout = _b === void 0 ? this.defaultTimeout : _b, _c = options.env, env = _c === void 0 ? {} : _c;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var _a, _b;
                        var processEnv = __assign(__assign({}, process.env), env);
                        var proc = (0, child_process_1.spawn)(_this.jjPath, args, {
                            cwd: cwd,
                            env: processEnv,
                            stdio: ['ignore', 'pipe', 'pipe'],
                        });
                        var stdout = '';
                        var stderr = '';
                        (_a = proc.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                            stdout += data.toString();
                        });
                        (_b = proc.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                            stderr += data.toString();
                        });
                        // Set timeout
                        var timeoutId = setTimeout(function () {
                            proc.kill('SIGTERM');
                            reject(new Error("Command timed out after ".concat(timeout, "ms")));
                        }, timeout);
                        proc.on('close', function (code) {
                            clearTimeout(timeoutId);
                            resolve({
                                stdout: stdout,
                                stderr: stderr,
                                exitCode: code !== null && code !== void 0 ? code : 1,
                                success: code === 0,
                            });
                        });
                        proc.on('error', function (err) {
                            clearTimeout(timeoutId);
                            reject(err);
                        });
                    })];
            });
        });
    };
    /**
     * Execute a jj command with streaming output
     */
    JJExecutor.prototype.executeStream = function (args, options) {
        var _a, _b;
        if (options === void 0) { options = {}; }
        var _c = options.cwd, cwd = _c === void 0 ? process.cwd() : _c, _d = options.env, env = _d === void 0 ? {} : _d, onStdout = options.onStdout, onStderr = options.onStderr;
        var processEnv = __assign(__assign({}, process.env), env);
        var proc = (0, child_process_1.spawn)(this.jjPath, args, {
            cwd: cwd,
            env: processEnv,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        if (onStdout) {
            (_a = proc.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                onStdout(data.toString());
            });
        }
        if (onStderr) {
            (_b = proc.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                onStderr(data.toString());
            });
        }
        return proc;
    };
    /**
     * Check if jj is available
     */
    JJExecutor.prototype.isAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.execute(['--version'], { timeout: 5000 })];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, result.success];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get jj version
     */
    JJExecutor.prototype.getVersion = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.execute(['--version'], { timeout: 5000 })];
                    case 1:
                        result = _b.sent();
                        if (result.success) {
                            return [2 /*return*/, result.stdout.trim()];
                        }
                        return [2 /*return*/, null];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get repository root path
     */
    JJExecutor.prototype.getRepoRoot = function (cwd) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.execute(['root'], { cwd: cwd, timeout: 5000 })];
                    case 1:
                        result = _b.sent();
                        if (result.success) {
                            return [2 /*return*/, result.stdout.trim()];
                        }
                        return [2 /*return*/, null];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return JJExecutor;
}());
// Singleton instance
exports.jjExecutor = new JJExecutor();
exports.default = JJExecutor;
