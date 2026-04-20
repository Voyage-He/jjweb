## ADDED Requirements

### Requirement: 修订版本行的两栏布局
系统 SHALL 为每一个修订版本渲染一个包含图形区（最左列）和信息区（剩余列）的行布局。

#### Scenario: 图形区位于最左侧
- **WHEN** 系统渲染修订版本行
- **THEN** 左侧区域 SHALL 被预留给 commit graph 的渲染轨道
- **AND** 该区域的宽度 SHALL 基于图形的最大列数计算

#### Scenario: 信息区位于右侧剩余列
- **WHEN** 系统渲染修订版本行
- **THEN** 右侧区域 SHALL 用于展示修订版本的元数据，如 `message`, `author`, `date` 等
- **AND** 文本内容 SHALL 被限制在单行，超长部分 SHALL 截断

### Requirement: 行内垂直对齐
系统 SHALL 确保图形节点与元数据文本在行内垂直居中对齐。

#### Scenario: 节点对齐
- **WHEN** 渲染 commit graph 节点
- **THEN** 节点的中心点坐标 SHALL 等于 `rowHeight / 2`
- **AND** 后随的文本基线 SHALL 相应调整以维持视觉居中
