## MODIFIED Requirements

### Requirement: 图形区域使用弹性宽度
系统 SHALL 根据实际分支数量自动计算图形区域宽度，以实现紧凑且自适应的布局。

#### Scenario: 单轨道宽度配置
- **WHEN** 系统初始化图形布局选项
- **THEN** `trackWidth`（单轨道宽度）的默认值 SHALL 为 32px
- **AND** `rowHeight` 的默认值 SHALL 为 48px

#### Scenario: 弹性宽度计算
- **WHEN** 存在 N 个分支列
- **THEN** 图形区域的总宽度 SHALL 自动计算为 `N × trackWidth`
- **AND** 单分支时图形宽度 SHALL 为 32px
- **AND** 5 个分支时图形宽度 SHALL 为 160px

#### Scenario: 最大宽度限制
- **WHEN** 分支数量过多（如超过 25 个）
- **THEN** 图形区域宽度 SHALL 不超过 `maxGraphWidth`（默认 800px）
- **AND** 超出部分 SHALL 启用水平滚动
