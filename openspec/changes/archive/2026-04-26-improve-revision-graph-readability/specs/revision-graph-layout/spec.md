## ADDED Requirements

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
