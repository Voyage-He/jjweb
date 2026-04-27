# 代码审查问题合并报告

来源文件：
- `problem_by_gpt.md`
- `problem_by_ds.md`

合并原则：
- 相同问题只保留一条，合并双方的描述和修复建议。
- 严重级别按实际影响统一为 `P0` 到 `P3`。
- 文件路径和行号以原报告提供的信息为准。

## P0 - 阻断核心功能

### 1. 缺少提交详情 API：`GET /api/repo/show/:revision`

涉及文件：
- `packages/web/src/api/client.ts`
- `packages/web/src/App.tsx`
- `packages/web/src/components/commits/CommitDetail.tsx`
- `packages/server/src/routes/api.ts`

前端会通过 `apiClient.getCommitDetail(changeId)` 请求 `/api/repo/show/:revision`，选择提交后也依赖该接口加载提交详情和文件变更列表。但服务端目前没有定义对应路由，运行时会返回 404，导致提交详情视图不可用。

建议修复：
- 在服务端新增 `GET /api/repo/show/:revision` 路由。
- 基于 `jj show` 和现有解析器返回提交详情及文件变更数据。
- 或修改前端调用，改为使用当前已存在且受支持的接口。

### 2. 时间戳单位不一致导致日期显示错误

涉及文件：
- `packages/server/src/services/jjParsers.ts`
- `packages/web/src/components/commits/CommitDetail.tsx`
- `packages/web/src/components/commits/RevisionInfo.tsx`
- `packages/web/src/components/operations/OperationLog.tsx`

`parseTimestamp()` 返回的是毫秒级时间戳，但前端消费方将其当作秒级时间戳再乘以 `1000`。这会导致提交日期、操作时间等显示成明显错误的未来时间。

建议修复：
- 统一时间戳契约。
- 可选择让服务端返回秒级时间戳，或删除前端所有多余的 `* 1000`。
- 增加覆盖提交详情、修订信息、操作日志时间显示的测试。

## P1 - 安全和主要操作失败

### 3. 冲突解析接口可能写入仓库外部路径

涉及文件：
- `packages/server/src/routes/api.ts`
- `packages/server/src/utils/sanitize.ts`

冲突解析写入手动解决内容时直接拼接 `${repoPath}/${filePath}`，没有规范化目标路径，也没有校验最终路径仍位于已打开仓库目录内。恶意或错误请求可构造绝对路径、`../` 路径或其他目录穿越路径，尝试写入仓库外部文件。

建议修复：
- 写入前使用 `path.resolve(repoPath, filePath)` 或等价安全逻辑得到目标路径。
- 拒绝绝对路径和目录穿越路径。
- 确认解析后的目标路径仍位于 `repoPath` 内。
- 复用并补齐现有 `validatePath()` 校验。

### 4. jj 子进程未使用安全环境变量

涉及文件：
- `packages/server/src/utils/sanitize.ts`
- `packages/server/src/services/jjExecutor.ts`

`sanitize.ts` 中定义了 `createSafeEnv()`，用于剔除 `EDITOR`、`VISUAL`、`JJ_EDITOR` 等危险环境变量，并设置非交互环境。但 `jjExecutor.execute()` 直接展开 `process.env`，导致 jj 子进程继承完整宿主环境。非交互服务端执行 jj 时，这会增加编辑器调用、环境污染和命令注入风险。

建议修复：
- 在 `jjExecutor.execute()` 中使用 `createSafeEnv(env)` 生成子进程环境。
- 确保 `TERM=dumb`、编辑器变量清理、必要环境白名单或黑名单策略生效。
- 增加测试覆盖传入危险环境变量时的清理行为。

### 5. rebase/move 接口使用了不存在的 jj 命令

涉及文件：
- `packages/server/src/routes/api.ts`

服务端构造了 `jj move -r <id> --after|--before <destination>`。当前 jj CLI 使用 `rebase` 完成该类提交重排操作，并没有 `move` 命令。前端重排提交或相关 rebase 操作会在运行时失败。

建议修复：
- 将该操作映射为 `jj rebase -r <id> --insert-after <destination>`。
- 对应的 before 操作映射为 `jj rebase -r <id> --insert-before <destination>`。
- 为 API 到 jj 命令参数的转换增加测试。

### 6. amend 接口使用了不存在的 jj 命令

涉及文件：
- `packages/server/src/routes/api.ts`

服务端调用 `jj amend -r <id>`，但当前 jj CLI 没有 `amend` 命令。任何现有或未来调用该接口的功能都会失败。

建议修复：
- 明确该接口的真实语义。
- 如果目标是把工作副本修改并入某个修订，改用有效的 jj 工作流，例如 `squash` 或 `absorb`。
- 如果能力暂不支持，应移除接口或让接口返回明确的未支持错误。

### 7. split 接口可能触发交互式输入

涉及文件：
- `packages/server/src/routes/api.ts`

服务端调用 `jj split -r <id> <files...>` 时没有传入提交说明。拆分已有描述的 change 时，jj 可能要求输入新描述或打开编辑器。服务端以非交互方式运行 jj，该命令在部分场景下会失败或卡住。

建议修复：
- 避免服务端调用会打开编辑器的 jj 命令。
- 通过 `-m` 提供确定性的非交互描述，或改用可控的非交互工作流。
- 对需要交互式选择的 split 场景先禁用或返回明确错误。

## P2 - 数据正确性和状态一致性

### 8. 分页 `hasMore` 判断逻辑不准确

涉及文件：
- `packages/server/src/routes/api.ts`

服务端向 jj 请求 `limit + offset` 条记录后再通过 `slice(offset)` 取当前页，但 `hasMore` 使用截断后的 `commits.length === limit` 判断。这不能可靠表示是否还有下一页，可能在刚好返回 `limit` 条时误判，也可能在 offset 场景下漏判。

建议修复：
- 保留截断前的原始数量用于判断。
- 或多请求一条数据，使用 `rawCommits.length > offset + limit` 计算 `hasMore`。
- 增加刚好满页、少于一页、offset 后还有数据等分页测试。

### 9. 关闭仓库只更新前端状态，服务端状态残留

涉及文件：
- `packages/web/src/App.tsx`
- `packages/web/src/api/client.ts`

前端关闭仓库时只调用 `setRepoOpen(false)`，未调用 `apiClient.closeRepo()`。服务端 `currentRepo` 仍可能保存已关闭仓库，后续操作存在使用过期仓库状态的风险。

建议修复：
- 关闭仓库时调用 `apiClient.closeRepo()`。
- 成功后再清理前端仓库状态，失败时给出可恢复的错误提示。

### 10. 前端路径参数未一致进行 URL 编码

涉及文件：
- `packages/web/src/api/client.ts`

diff、丢弃/恢复文件、冲突解析等请求直接把文件路径拼接到 URL 中。包含空格、`#`、`?`、`%` 或其他保留字符的路径会生成错误请求，可能导致接口无法命中或路径被截断。

建议修复：
- 对 path segment 使用 `encodeURIComponent`。
- 更稳妥的做法是将文件路径放入 query 参数或 JSON body，避免把任意文件路径直接作为 URL path 片段。
- 增加包含特殊字符文件名的 API 客户端测试。

### 11. `sanitizeCommand(null)` 测试暴露空值处理问题

涉及文件：
- `packages/server/src/utils/sanitize.test.ts`
- `packages/server/src/utils/sanitize.ts`

测试传入 `sanitizeCommand(null as unknown as string[])`，当前实现只检查 `!args || args.length === 0` 一类输入时可能触发空值访问问题。该测试会在运行时失败或无法表达清晰契约。

建议修复：
- 在 `sanitizeCommand()` 中显式处理 `null` 和 `undefined`。
- 测试期望应与安全策略一致：要么返回拒绝结果，要么抛出受控错误。

## P3 - 工程质量和维护性

### 12. 测试导入路径错误，导致模块收集阶段失败

涉及文件：
- `packages/server/src/routes/api.test.ts`
- `packages/web/src/components/repo/RepoSwitcher.test.tsx`
- 其他位于 `src` 目录下的测试文件

多个测试文件位于 `src` 目录下，但使用类似 `../src/...` 的路径导入模块，解析后会指向不存在的嵌套路径。测试在模块收集阶段失败，掩盖真实回归。

建议修复：
- 按测试文件所在位置修正相对导入路径。
- 或配置并统一使用测试路径别名，例如 `@/`。
- 先修复测试收集失败，再评估真实测试失败。

### 13. lint 基线失败

涉及文件：
- 多处源码和测试文件

`npm run lint` 当前报告多个错误和警告，包括未使用变量、未使用导入、空代码块、TypeScript 中使用 `require`、不必要的转义字符等。lint 不能作为可靠发布门禁。

建议修复：
- 清理未使用代码和导入。
- 将 `require` 替换为 ESM import。
- 移除不必要的正则转义。
- 调整测试 mock，避免空代码块。

### 14. typecheck 通过，但 test 和 lint 不能作为可靠门禁

当前 `npm run typecheck` 可以通过，但 `npm test` 和 `npm run lint` 仍失败。这意味着本地或 CI 校验无法可靠区分新回归和既有失败。

建议修复：
- 优先修复测试收集失败和 lint 基线问题。
- 将 `typecheck`、`test`、`lint` 作为合并前必须通过的检查。

### 15. 重复定义 `cn()` 工具函数

涉及文件：
- `packages/web/src/components/commits/RevisionTable.tsx`
- `packages/web/src/components/commits/RevisionInfo.tsx`
- `packages/web/src/components/commits/RevisionColumnHeader.tsx`
- `packages/web/src/lib/utils.ts`

多个组件重复定义相同的 `cn()` 函数，而 `packages/web/src/lib/utils.ts` 已导出标准版本。

建议修复：
- 统一从 `@/lib/utils` 导入 `cn`。
- 删除组件内重复实现。

### 16. `WorkingCopyPanel` 重复遍历文件数据

涉及文件：
- `packages/web/src/components/working-copy/WorkingCopyPanel.tsx`

`status.files` 被多次遍历，其中 `groupedFiles` 计算后未在渲染路径中使用。该问题影响可读性和轻微性能，容易让后续维护者误判数据流。

建议修复：
- 删除未使用的 `groupedFiles`。
- 将跟踪状态分离和分组逻辑合并为一次清晰遍历。

### 17. 代码中混用 `branch` 和 `bookmark` 术语

涉及文件：
- 多处注释、变量名和接口命名

jj 使用 `bookmark` 概念，但代码中部分注释和变量仍使用 Git 术语 `branch`。目前不影响运行时行为，但会增加理解成本。

建议修复：
- 将用户可见文案、注释和新接口命名统一到 `bookmark`。
- 对兼容旧接口的内部变量，可逐步迁移，避免一次性大范围重命名引入风险。

## 建议修复顺序

1. 先修复 P0：提交详情 API、时间戳单位。
2. 再处理 P1：路径安全、jj 安全环境、无效 jj 命令和交互式命令。
3. 接着处理 P2：分页、关闭仓库状态、路径编码、sanitize 空值。
4. 最后清理 P3：测试收集、lint 基线、重复工具函数和术语一致性。
