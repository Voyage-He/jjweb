# revision-graph-layout Specification

## Purpose
Define deterministic revision graph layout behavior, including branch ordering, mainline stability, and edge curvature.

## Requirements

### Requirement: 贝塞尔曲线分叉展开

系统 SHALL 在绘制分叉连线时，使曲线在分叉处向外展开，增加视觉间距。

#### Scenario: 分叉向右展开
- **WHEN** 子节点在父节点右侧（childX > parentX）
- **THEN** 父节点侧曲线控制点向右偏移，曲线向外弯曲
- **AND** 子节点侧曲线控制点保持在 childX，避免连线从子节点向外偏移

#### Scenario: 分叉向左展开
- **WHEN** 子节点在父节点左侧（childX < parentX）
- **THEN** 父节点侧曲线控制点向左偏移，曲线向外弯曲
- **AND** 子节点侧曲线控制点保持在 childX，避免连线从子节点向外偏移

#### Scenario: 同列直线
- **WHEN** 子节点与父节点在同一列
- **THEN** 使用直线连接，不应用曲线展开

### Requirement: 交叉感知列分配

系统 SHALL 在分叉时使用连线交叉代价优化 child 顺序，减少 revision graph 中可见的连线交叉。

#### Scenario: 新分支默认优先近列
- **GIVEN** 父节点有多个子节点形成分叉
- **AND** 候选顺序不会改变连线交叉数量
- **WHEN** 分配列位置
- **THEN** 时间上较新的分支（index 较小）优先分配较小的列号

#### Scenario: 交叉更少的顺序优先
- **GIVEN** 父节点有多个子节点形成分叉
- **AND** 不同 child 顺序会产生不同数量的连线交叉
- **WHEN** 分配列位置
- **THEN** 系统优先选择连线交叉数量更少的 child 顺序

#### Scenario: 横向跨度作为次级目标
- **GIVEN** 多个候选 child 顺序具有相同连线交叉数量
- **WHEN** 分配列位置
- **THEN** 系统优先选择父子连线横向跨度更短的顺序

#### Scenario: 主分支保持列 0
- **GIVEN** 存在 main/master/trunk 分支
- **WHEN** 计算布局
- **THEN** 主分支始终保持在列 0

#### Scenario: Working copy 保持列 0
- **GIVEN** 存在 working copy 节点
- **WHEN** 计算布局
- **THEN** working copy 及其祖先链保持在列 0

### Requirement: 曲线参数可配置

系统 SHALL 使用可配置的展开系数控制曲线弯曲程度。

#### Scenario: 默认展开系数
- **WHEN** 未指定展开系数
- **THEN** 使用 trackWidth * 0.3 作为默认值

#### Scenario: 展开系数上限
- **WHEN** 计算展开系数
- **THEN** 系数不超过 trackWidth * 0.5，防止曲线超出边界

### Requirement: 稳定主线列固定

系统 SHALL 在计算 revision graph 布局时，将优先主线固定在稳定主列，减少复杂结构中的横向跳动。

#### Scenario: Working copy 祖先链优先
- **GIVEN** revision graph 中存在 working copy 节点
- **WHEN** 系统计算列布局
- **THEN** working copy 及其第一 parent 祖先链 SHALL 优先保持在列 0
- **AND** main/master/trunk/default bookmark 不得抢占 working copy 祖先链的列 0

#### Scenario: 主 bookmark 祖先链固定
- **GIVEN** revision graph 中不存在 working copy 节点
- **AND** 存在 main、master、trunk、default 或 @ bookmark
- **WHEN** 系统计算列布局
- **THEN** 最高优先级 bookmark 所在 revision 及其第一 parent 祖先链 SHALL 保持在列 0

#### Scenario: 主线冲突使用确定优先级
- **GIVEN** revision graph 中存在多个可作为主线的 bookmark
- **WHEN** 系统选择固定主线
- **THEN** 系统 SHALL 按 working copy、main、master、trunk、default、@、其他 bookmark、时间顺序的优先级选择主线

### Requirement: 稳定分叉排序

系统 SHALL 在减少连线交叉的同时保持分叉 child 排序确定，避免等价布局在刷新后抖动。

#### Scenario: 交叉更少仍优先
- **GIVEN** 父节点有多个 primary children
- **AND** 候选排序产生不同数量的连线交叉
- **WHEN** 系统选择 child 顺序
- **THEN** 系统 SHALL 选择连线交叉数量更少的排序

#### Scenario: 等价交叉使用稳定代价
- **GIVEN** 多个候选排序具有相同连线交叉数量
- **WHEN** 系统选择 child 顺序
- **THEN** 系统 SHALL 依次比较主线连续性、横向跨度、原始拓扑顺序偏离程度
- **AND** 系统 SHALL 对相同输入返回相同列布局

#### Scenario: 主线 child 保持父列
- **GIVEN** 父节点的多个 children 中包含固定主线上的 child
- **WHEN** 系统分配 children 列
- **THEN** 固定主线 child SHALL 继承父节点列
- **AND** 其他 children SHALL 分配到相邻可用列
