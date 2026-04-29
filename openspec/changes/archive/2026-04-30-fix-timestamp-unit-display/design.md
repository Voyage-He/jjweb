## Context

项目中 `parseTimestamp()` 将 `jj` 输出时间解析为 `Date#getTime()`，即毫秒级 Unix epoch。API 文档示例、WebSocket `Date.now()` 和现有 server operation parser 也都使用毫秒级数值时间戳。但前端部分组件把这些数值当作秒级 epoch，调用 `new Date(timestamp * 1000)` 或用 `Date.now() - timestamp * 1000` 计算相对时间，导致日期显示偏移到遥远未来或相对时间失真。

受影响的路径集中在 `packages/server/src/services/jjParsers.ts`、共享 entity 类型、commit UI 和 operation log UI。该修复需要把“数值型 timestamp 是毫秒级”的契约写清楚，并让消费方按同一契约显示。

## Goals / Non-Goals

**Goals:**

- 明确所有数值型 `timestamp` 字段使用毫秒级 Unix epoch。
- 保持 server parser 返回 `Date#getTime()`，让 API、WebSocket、测试 fixture 与 `Date.now()` 语义一致。
- 修复 commit 详情、revision 信息和 operation log 的日期/相对时间显示。
- 增加回归测试覆盖服务端解析和前端显示，防止后续重新引入秒/毫秒混用。

**Non-Goals:**

- 不重命名 `timestamp` 字段，不新增并行字段。
- 不改变 `metadata.timestamp` 等字符串型原始时间戳字段的格式。
- 不改造全局日期格式、本地化策略或用户时区设置。
- 不修改与本问题无关的 WebSocket 心跳时间戳生成逻辑。

## Decisions

1. **以毫秒级 epoch 作为统一契约**

   继续让服务端 `parseTimestamp()` 返回 `date.getTime()`。这与 JavaScript `Date` API、`Date.now()`、当前 API 文档示例和 operation parser 的 `time.start/end` 字段保持一致。

   备选方案是让服务端返回秒级 epoch，然后保留前端 `* 1000`。该方案会改变 API 示例和所有消费者预期，也会让 WebSocket `Date.now()` 与 domain entity timestamp 分裂，因此不采用。

2. **在前端边界集中移除秒级转换**

   `CommitDetail`, `RevisionInfo`, `OperationLog` 应直接把数值型 timestamp 传给 `new Date(timestamp)` 或直接与 `Date.now()` 相减。这样修复范围局限在已确认的错误消费点，不需要改动数据获取流程或 store。

   备选方案是新增 `normalizeTimestamp()` 同时兼容秒和毫秒。该方案会掩盖契约不清的问题，并可能让错误数据静默通过，因此不作为主修复。

3. **用测试和类型注释固化契约**

   共享类型或邻近文档应说明 `timestamp` 为 epoch milliseconds；测试应使用毫秒级 fixture，例如 `1704067200000`，并断言 UI 显示 2024 年附近的真实日期，而不是因重复乘法产生异常未来日期。

   备选方案是只改实现不改测试数据。这样无法防止后续贡献者按秒级 fixture 继续编写代码，因此不采用。

## Risks / Trade-offs

- [Risk] 仍有未搜索到的 `timestamp * 1000` 或秒级 fixture 残留，导致局部 UI 继续错误显示 -> Mitigation: 使用 `rg` 全量检查 `timestamp * 1000`、`new Date(... * 1000)` 和秒级测试数据，并补齐相关测试。
- [Risk] 某些调用方实际传入秒级 timestamp，修复后会显示 1970 年附近日期 -> Mitigation: 服务端 parser、API 文档和 shared tests 统一为毫秒级，并在测试中暴露秒级 fixture。
- [Risk] Operation metadata 的字符串时间戳与数值型 timestamp 同名概念容易混淆 -> Mitigation: 保留字符串字段原样，只在类型注释和测试中区分 `metadata.timestamp` 与 `operation.timestamp`。
- [Risk] 日期格式测试受本地时区影响 -> Mitigation: 优先断言相对时间计算或使用稳定 timestamp 范围，必要时 mock `Date.now()`，避免依赖具体本地化字符串。

## Migration Plan

- 这是内部契约修复，不需要数据迁移。
- 部署后已有 API 响应结构保持不变，前端会按毫秒级正确显示历史提交和操作时间。
- 如需回滚，只需恢复前端格式化逻辑；服务端契约和响应字段不发生破坏性变化。

## Open Questions

- 无。
