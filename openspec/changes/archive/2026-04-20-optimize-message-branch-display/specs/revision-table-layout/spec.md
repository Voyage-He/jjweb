## MODIFIED Requirements

### Requirement: Revision 信息以独立列展示
系统 SHALL 将每个 revision 的信息字段以独立的列形式展示，每个列具有独立的表头和宽度配置。

#### Scenario: 默认列配置
- **WHEN** 系统初始化 revision 表格
- **THEN** 系统 SHALL 显示以下默认列（按顺序）：
  - 图形列（graph）：显示 commit graph 节点和连线
  - Change ID 列：显示 revision 的 changeId（截断显示）
  - Message 列：在 message 第一行左侧显示 revision 关联的分支名，并只显示 message 第一行文本
  - Author 列：显示作者名称
  - Date 列：显示提交时间

#### Scenario: 列宽配置
- **WHEN** 系统渲染 revision 表格
- **THEN** 每列 SHALL 具有可配置的宽度
- **AND** Message 列默认使用弹性宽度（flex）以填充剩余空间
- **AND** 其他列使用固定宽度

#### Scenario: Message 单行展示
- **WHEN** revision 的 message 包含换行
- **THEN** Message 列 SHALL 只显示第一行内容
- **AND** 换行后的正文内容 MUST NOT 在 revision 表格行中显示
- **AND** 原始完整 message 数据 MUST 保持不变

#### Scenario: 分支名行内展示
- **WHEN** revision 存在关联分支名
- **THEN** Message 列 SHALL 在 message 第一行文本左侧显示分支名
- **AND** 分支名与 message 文本 SHALL 在同一行内展示
- **AND** 分支名或 message 过长时 SHALL 截断显示且 MUST NOT 改变行高

### Requirement: 列头区域显示字段标签
系统 SHALL 在表格顶部显示列头区域，每个列头显示对应字段的标签。

#### Scenario: 列头标签
- **WHEN** 系统渲染列头
- **THEN** 每个信息列 SHALL 显示对应的标签文本（如 "Change ID"、"Message"、"Author"、"Date"）
- **AND** 图形列的列头 SHALL 保持空白
- **AND** 顶部列头区域 MUST NOT 显示分支名

#### Scenario: 列头与内容对齐
- **WHEN** 系统渲染表格
- **THEN** 列头区域的各列宽度 SHALL 与下方内容行的对应列精确对齐
- **AND** 列头在水平滚动时 SHALL 保持同步滚动
