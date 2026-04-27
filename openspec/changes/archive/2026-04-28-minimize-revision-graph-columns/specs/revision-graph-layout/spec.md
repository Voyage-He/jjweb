## ADDED Requirements

### Requirement: 空闲列复用

系统 SHALL 以 revision graph 中仍活跃的节点链和跨行连线为准复用空闲列，避免已经结束的分支永久占用 graph 列。

#### Scenario: 非重叠短分支复用同一列
- **GIVEN** 两个 side branch 的节点和 parent-child 连线在行区间上不重叠
- **WHEN** 系统计算 revision graph 列布局
- **THEN** 两个 side branch SHALL 可以使用同一个非主线列
- **AND** graph 的最大列号 SHALL 不因第二个 side branch 增加

#### Scenario: Merge 后释放 side branch 列
- **GIVEN** side branch 已经 merge 回主线或其他 branch
- **AND** 该 side branch 的节点和跨行连线在后续行区间不再活跃
- **WHEN** 系统为后续 revision 分配列
- **THEN** 系统 SHALL 将该 side branch 曾使用的列视为可复用

#### Scenario: 输出列号连续
- **WHEN** 系统完成 revision graph 列布局
- **THEN** 已使用列号 SHALL 从 0 开始连续排列
- **AND** graph MUST NOT 保留没有任何节点或连线占用的中间空列

## MODIFIED Requirements

### Requirement: 交叉感知列分配

系统 SHALL 在分叉时先满足主线固定和最少列数，再使用连线交叉代价优化 child 顺序，减少 revision graph 中可见的连线交叉。

#### Scenario: 新分支默认优先近列
- **GIVEN** 父节点有多个子节点形成分叉
- **AND** 候选顺序具有相同最少列数、连线交叉数量和横向跨度
- **WHEN** 分配列位置
- **THEN** 时间上较新的分支（index 较小）优先分配较小的列号

#### Scenario: 最少列数优先
- **GIVEN** 父节点有多个子节点形成分叉
- **AND** 多个候选顺序都满足主线固定要求
- **AND** 不同候选顺序会产生不同的 graph 列数
- **WHEN** 分配列位置
- **THEN** 系统 SHALL 优先选择使用列数更少的 child 顺序

#### Scenario: 相同列数内交叉更少的顺序优先
- **GIVEN** 父节点有多个子节点形成分叉
- **AND** 多个候选顺序使用相同的最少列数
- **AND** 不同 child 顺序会产生不同数量的连线交叉
- **WHEN** 分配列位置
- **THEN** 系统优先选择连线交叉数量更少的 child 顺序

#### Scenario: 横向跨度作为次级目标
- **GIVEN** 多个候选 child 顺序具有相同的最少列数和连线交叉数量
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

### Requirement: 稳定分叉排序

系统 SHALL 在保持最少列布局的同时保持分叉 child 排序确定，避免等价布局在刷新后抖动。

#### Scenario: 最少列优先于交叉排序
- **GIVEN** 父节点有多个 primary children
- **AND** 候选排序产生不同的 graph 列数
- **WHEN** 系统选择 child 顺序
- **THEN** 系统 SHALL 选择使用列数更少的排序
- **AND** 系统 MUST NOT 仅为了减少非主线连线交叉而选择更宽的布局

#### Scenario: 相同列数内交叉更少仍优先
- **GIVEN** 父节点有多个 primary children
- **AND** 候选排序使用相同的最少列数
- **AND** 候选排序产生不同数量的连线交叉
- **WHEN** 系统选择 child 顺序
- **THEN** 系统 SHALL 选择连线交叉数量更少的排序

#### Scenario: 等价列数和交叉使用稳定代价
- **GIVEN** 多个候选排序具有相同的最少列数和连线交叉数量
- **WHEN** 系统选择 child 顺序
- **THEN** 系统 SHALL 依次比较主线连续性、横向跨度、原始拓扑顺序偏离程度
- **AND** 系统 SHALL 对相同输入返回相同列布局

#### Scenario: 主线 child 保持父列
- **GIVEN** 父节点的多个 children 中包含固定主线上的 child
- **WHEN** 系统分配 children 列
- **THEN** 固定主线 child SHALL 继承父节点列
- **AND** 其他 children SHALL 分配到相邻可用列
