## ADDED Requirements

### Requirement: 数值型时间戳使用毫秒级 epoch
系统 SHALL 将跨 server、shared types、REST API、WebSocket message 和 web UI 传递的数值型 `timestamp` 字段定义为毫秒级 Unix epoch。

#### Scenario: 服务端解析 jj 提交时间
- **WHEN** 服务端从 `jj` 输出中解析提交作者、提交者或提交时间
- **THEN** 返回的 `author.timestamp`, `committer.timestamp` 和 commit `timestamp` SHALL 为 `Date#getTime()` 等价的毫秒级数值
- **AND** 返回值 MUST NOT 为秒级 epoch

#### Scenario: 服务端解析 jj operation 时间
- **WHEN** 服务端从 `jj op log` 输出中解析 operation start/end 时间
- **THEN** 返回的 `operation.time.start`, `operation.time.end` 和 `operation.timestamp` SHALL 为毫秒级数值
- **AND** `operation.metadata.timestamp` SHALL 保留原始字符串时间戳

#### Scenario: API 和类型契约
- **WHEN** 文档、shared types 或测试 fixture 描述数值型 `timestamp`
- **THEN** 它们 SHALL 使用毫秒级 epoch 示例和语义
- **AND** 秒级 epoch 示例 MUST NOT 用于数值型 `timestamp` 字段

### Requirement: 前端按毫秒级时间戳显示日期
系统 SHALL 在用户可见的日期和相对时间显示中直接按毫秒级 timestamp 构造 `Date` 或计算时间差。

#### Scenario: Revision 信息日期显示
- **GIVEN** revision author timestamp 为 `1704067200000`
- **WHEN** revision 列表或 revision 信息组件格式化该时间
- **THEN** 组件 SHALL 使用 `new Date(1704067200000)` 等价逻辑
- **AND** 显示结果 MUST NOT 因再次乘以 `1000` 而落入异常未来日期

#### Scenario: 提交详情日期显示
- **GIVEN** commit author timestamp 为毫秒级 epoch
- **WHEN** 提交详情组件显示相对时间或完整日期
- **THEN** 组件 SHALL 直接使用该毫秒值计算日期
- **AND** 相对时间计算 MUST NOT 把毫秒值当作秒值转换

#### Scenario: Operation log 相对时间显示
- **GIVEN** operation timestamp 为毫秒级 epoch
- **WHEN** operation log 计算 `just now`, `m ago`, `h ago` 或 `d ago`
- **THEN** 差值 SHALL 使用 `Date.now() - operation.timestamp`
- **AND** 差值 MUST NOT 使用 `operation.timestamp * 1000`

### Requirement: 时间戳单位回归测试
系统 SHALL 用测试覆盖时间戳单位契约，确保服务端解析和前端显示保持一致。

#### Scenario: 服务端 parser 测试覆盖毫秒值
- **WHEN** parser 测试使用固定 `jj` 时间字符串
- **THEN** 断言 SHALL 比较对应的毫秒级 epoch
- **AND** 测试 MUST fail 如果 parser 返回秒级 epoch

#### Scenario: 前端显示测试覆盖毫秒输入
- **WHEN** commit UI 或 operation log 测试传入毫秒级 timestamp fixture
- **THEN** 测试 SHALL 验证显示结果来自真实日期或正确相对时间
- **AND** 测试 MUST fail 如果组件仍执行秒级乘法转换
