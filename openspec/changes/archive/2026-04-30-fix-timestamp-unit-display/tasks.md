## 1. 时间戳契约梳理

- [x] 1.1 全量搜索 `timestamp * 1000`, `new Date(... * 1000)` 和秒级 timestamp fixture，确认所有受影响位置
- [x] 1.2 在 `packages/shared/src/types/entities.ts` 中为数值型 `timestamp` 字段补充 epoch milliseconds 语义说明
- [x] 1.3 更新 shared entity 测试中的秒级 fixture，统一使用毫秒级 epoch
- [x] 1.4 检查 `docs/API.md` 中 timestamp 示例，确保 REST API 和 WebSocket 示例均保持毫秒级 epoch

## 2. 服务端解析回归覆盖

- [x] 2.1 保持 `packages/server/src/services/jjParsers.ts` 中 `parseTimestamp()` 返回 `Date#getTime()` 毫秒值，并更新注释说明
- [x] 2.2 在 `jjParsers.test.ts` 中增加或更新 commit parser 断言，验证 author、committer 和 commit timestamp 为毫秒级 epoch
- [x] 2.3 在 `jjParsers.test.ts` 中增加或更新 operation parser 断言，验证 `time.start`, `time.end` 和 `timestamp` 为毫秒级 epoch
- [x] 2.4 确认 `metadata.timestamp` 仍保留原始字符串时间戳，不被数值化

## 3. 前端显示修复

- [x] 3.1 修复 `packages/web/src/components/commits/RevisionInfo.tsx`，使用毫秒级 timestamp 直接构造 `Date`
- [x] 3.2 修复 `packages/web/src/components/commits/CommitDetail.tsx`，移除对毫秒级 timestamp 的秒级乘法转换
- [x] 3.3 修复 `packages/web/src/components/operations/OperationLog.tsx`，使用 `Date.now() - timestamp` 计算相对时间
- [x] 3.4 更新 commit/revision 相关前端测试，使用毫秒级 fixture 并覆盖不会显示异常未来日期
- [x] 3.5 为 operation log 相对时间补充测试，覆盖毫秒级 timestamp 下的 `m ago`, `h ago` 或 `d ago`

## 4. 验证

- [x] 4.1 运行 shared 类型相关测试并修复失败
- [x] 4.2 运行 server parser 相关测试并修复失败
- [x] 4.3 运行 web commit 和 operation log 相关测试并修复失败
- [x] 4.4 再次执行 `rg` 检查，确认前端没有残留把数值型 `timestamp` 当秒级 epoch 的转换
