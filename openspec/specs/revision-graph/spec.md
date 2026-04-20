# revision-graph Specification

## Purpose
TBD - created by archiving change optimize-revision-display. Update Purpose after archive.
## Requirements
### Requirement: 图形区域使用弹性宽度
系统 SHALL 根据实际分支数量自动计算图形区域宽度，以实现紧凑且自适应的布局。

#### Scenario: 单轨道宽度配置
- **WHEN** 系统初始化图形布局选项
- **THEN** `trackWidth`（单轨道宽度）的默认值 SHALL 为 60px
- **AND** `rowHeight` 的默认值 SHALL 保持 64px 不变

#### Scenario: 弹性宽度计算
- **WHEN** 存在 N 个分支列
- **THEN** 图形区域的总宽度 SHALL 自动计算为 `N × trackWidth`
- **AND** 单分支时图形宽度 SHALL 为 60px
- **AND** 5 个分支时图形宽度 SHALL 为 300px

#### Scenario: 最大宽度限制
- **WHEN** 分支数量过多（如超过 20 个）
- **THEN** 图形区域宽度 SHALL 不超过 `maxGraphWidth`（默认 800px）
- **AND** 超出部分 SHALL 启用水平滚动

### Requirement: 图形节点在紧凑布局中保持可见
系统 SHALL 确保在紧凑轨道宽度下，commit graph 的节点和连线依然清晰可见。

#### Scenario: 节点尺寸适配
- **WHEN** 系统渲染 commit graph 节点
- **THEN** 节点圆点半径 SHALL 不超过轨道宽度的 1/6（约 5px）
- **AND** 连线宽度 SHALL 保持在 2-3px 范围内

#### Scenario: 连线曲率适配
- **WHEN** 系统绘制跨列连线
- **THEN** 贝塞尔曲线的控制点 SHALL 根据轨道宽度适当调整
- **AND** 连线 SHALL 不与相邻列的节点重叠

