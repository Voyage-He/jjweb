# revision-table-layout Specification

## Purpose
TBD - created by archiving change optimize-revision-display. Update Purpose after archive.
## Requirements
### Requirement: Revision 信息以独立列展示
系统 SHALL 将每个 revision 的信息字段以独立的列形式展示，每个列具有独立的表头和宽度配置。

#### Scenario: 默认列配置
- **WHEN** 系统初始化 revision 表格
- **THEN** 系统 SHALL 显示以下默认列（按顺序）：
  - 图形列（graph）：显示 commit graph 节点和连线
  - Change ID 列：显示 revision 的 changeId（截断显示）
  - Message 列：显示 revision 的描述信息
  - Author 列：显示作者名称
  - Date 列：显示提交时间

#### Scenario: 列宽配置
- **WHEN** 系统渲染 revision 表格
- **THEN** 每列 SHALL 具有可配置的宽度
- **AND** Message 列默认使用弹性宽度（flex）以填充剩余空间
- **AND** 其他列使用固定宽度

### Requirement: 列头区域显示字段标签
系统 SHALL 在表格顶部显示列头区域，每个列头显示对应字段的标签。

#### Scenario: 列头标签
- **WHEN** 系统渲染列头
- **THEN** 每个信息列 SHALL 显示对应的标签文本（如 "Change ID"、"Message"、"Author"、"Date"）
- **AND** 图形列的列头 SHALL 保持空白或显示分支书签信息

#### Scenario: 列头与内容对齐
- **WHEN** 系统渲染表格
- **THEN** 列头区域的各列宽度 SHALL 与下方内容行的对应列精确对齐
- **AND** 列头在水平滚动时 SHALL 保持同步滚动

### Requirement: 列配置存储
系统 SHALL 将 revision 列配置持久化存储，在用户重新打开应用时恢复配置。

#### Scenario: 配置持久化
- **WHEN** 用户修改列配置（如调整列宽、列顺序）
- **THEN** 系统 SHALL 将配置保存到本地存储
- **AND** 下次启动时 SHALL 恢复用户配置

