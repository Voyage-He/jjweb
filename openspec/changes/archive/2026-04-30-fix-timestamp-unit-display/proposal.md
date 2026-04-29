## Why

当前提交列表、提交详情和操作日志对 `timestamp` 的单位理解不一致：服务端解析 `jj` 时间后返回毫秒级 epoch，但前端部分显示逻辑按秒级 epoch 再乘以 `1000`。这会把真实时间显示成明显错误的未来日期，属于 P0 级用户可见数据错误。

## What Changes

- 明确应用内部和 API 中的数值型 `timestamp` 使用毫秒级 Unix epoch，与 `Date.now()` 和现有 API 文档保持一致。
- 修正提交详情、修订信息和操作日志中的时间格式化逻辑，避免把毫秒值再次按秒转换。
- 保留字符串型 metadata 时间戳的现有 ISO/原始字符串语义，不混入数值型 epoch 契约。
- 增加覆盖提交详情、修订信息、操作日志和服务端时间解析的回归测试。
- 不引入外部依赖，不改变字段名称或响应结构。

## Capabilities

### New Capabilities

- `timestamp-contract`: 定义数值型时间戳的单位、跨层传递规则和用户可见时间显示要求。

### Modified Capabilities

- 无

## Impact

- 影响服务端 `packages/server/src/services/jjParsers.ts` 的时间解析契约和测试断言。
- 影响共享类型与 API 文档对 `Commit`, `Author`, `Operation`, WebSocket message 中数值型 `timestamp` 的说明。
- 影响前端 `packages/web/src/components/commits/CommitDetail.tsx`、`packages/web/src/components/commits/RevisionInfo.tsx`、`packages/web/src/components/operations/OperationLog.tsx` 的日期格式化逻辑。
- 需要补充或更新相关 unit tests，防止秒/毫秒单位再次混用。
