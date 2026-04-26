## ADDED Requirements

### Requirement: 复杂边路由

系统 SHALL 根据 parent-child 关系的几何特征和边类型生成可区分的 graph 连线路径，减少复杂结构中的重叠和节点穿越。

#### Scenario: 同列边使用直线
- **GIVEN** child revision 与 parent revision 位于同一列
- **WHEN** 系统绘制 parent-child 连线
- **THEN** 连线 SHALL 使用从 child 节点中心到 parent 节点中心的直线路径
- **AND** child revision 有多个 parents 时，同列 parent 连线仍 SHALL 使用直线路径

#### Scenario: 相邻列边使用曲线路由
- **GIVEN** child revision 与 parent revision 位于不同列
- **AND** child revision 与 parent revision 的列距离为 1
- **WHEN** 系统绘制 parent-child 连线
- **THEN** 连线 SHALL 使用贝塞尔曲线路径
- **AND** 曲线控制点 SHALL 使连线从 child 所在列自然转向 parent 所在列
- **AND** child revision 与 parent revision 间隔多行时仍 SHALL 使用贝塞尔曲线路径

#### Scenario: 多行跨多列边使用 bus 路由
- **GIVEN** child revision 与 parent revision 位于不同列
- **AND** child revision 与 parent revision 的列距离大于 1
- **AND** child revision 与 parent revision 间隔多行
- **WHEN** 系统绘制 parent-child 连线
- **THEN** 连线 SHALL 先沿 child 所在 lane 纵向延伸
- **AND** 连线 SHALL 在 parent 附近横向接入 parent 所在 lane
- **AND** 连线不得使用跨越多行的长斜线直接连接 child 与 parent

#### Scenario: 多 parent 边使用偏移
- **GIVEN** child revision 有多个 parents
- **AND** parent 连线跨列
- **WHEN** 系统绘制跨列 parent 连线
- **THEN** 系统 SHALL 为不同 parent index 应用有限 lane offset
- **AND** 多条连线不得完全共享相同路径

#### Scenario: 连线避开节点圆点
- **GIVEN** 跨列连线经过中间 revision 行
- **WHEN** 中间 revision 位于连线相邻列
- **THEN** 连线路径 SHALL 保持足够横向间距，避免覆盖中间节点圆点

### Requirement: 相关路径高亮

系统 SHALL 在用户查看某个 revision 时突出相关节点和连线，并弱化非相关图形元素。

#### Scenario: Hover 高亮直接关系
- **WHEN** 用户 hover 某个 revision 行或 graph 节点
- **THEN** 系统 SHALL 高亮该 revision、其直接 parents、其直接 children 以及连接这些节点的边
- **AND** 非相关节点和连线 SHALL 降低 opacity 但保持可见

#### Scenario: 选中 revision 保持高亮
- **WHEN** 用户选中某个 revision
- **THEN** 系统 SHALL 保持该 revision 的直接 parents、直接 children 和相关边高亮
- **AND** 用户选择其他 revision 前该高亮 SHALL 保持稳定

#### Scenario: Hover 优先于选中状态
- **GIVEN** 已存在选中 revision
- **WHEN** 用户 hover 另一个 revision
- **THEN** graph SHALL 显示 hover revision 的相关路径高亮
- **AND** hover 结束后 SHALL 恢复选中 revision 的相关路径高亮

### Requirement: 边视觉层级

系统 SHALL 使用视觉层级区分普通边、跨列边和 merge 边，让复杂结构中的关系更容易扫描。

#### Scenario: 普通边保持基础样式
- **WHEN** 系统绘制单 parent 的同列边
- **THEN** 边 SHALL 使用基础 stroke 样式

#### Scenario: Merge 边弱化但可追踪
- **GIVEN** child revision 有多个 parents
- **WHEN** 系统绘制非第一 parent 的 merge 边
- **THEN** merge 边 SHALL 使用区别于普通边的 opacity 或 stroke 样式
- **AND** 在 hover 或选中相关 revision 时 SHALL 提升为高亮样式
