## MODIFIED Requirements

### Requirement: 修订版本以稳定的表格单元格展示
系统 SHALL 将每个修订版本放置在独立的行中，以列表形式展示提交历史，其中左侧预留给图形轨道，右侧用于展示元数据。

#### Scenario: 基于 ChangeId 的稳定性
- **WHEN** 系统渲染修订版本列表
- **THEN** 系统使用 `change_id` 作为该修订版的稳定标识符
- **AND** 即使底层 `commit_id` 发生变化，该修订版在行中的顺序 SHALL 保持不变

#### Scenario: 严谨的行对齐
- **WHEN** 系统配置行布局
- **THEN** 系统 SHALL 使用固定高度的行（Fixed Height）
- **AND** 行内内容 SHALL 垂直居中，以确保左侧图形节点与右侧文本信息在同一水平线上

### Requirement: 表格视图支持列头区域

系统 SHALL 在表格视图中预留列头区域，用于显示各列（如图形区、消息、作者等）的元信息。

#### Scenario: 列头与行内容对齐
- **WHEN** 系统渲染表格视图列头
- **THEN** 列头区域与下方行内各列宽度精确对齐
- **AND** 图形区的列头宽度 SHALL 与图形预留轨道总宽度一致

#### Scenario: 列头不影响行布局
- **WHEN** 系统渲染表格视图
- **THEN** 列头区域独立于行容器
- **AND** 列表的虚拟滚动功能保持正常工作
