## ADDED Requirements

### Requirement: 时间轴优先的轨道预留
系统 SHALL 采用自底向上的算法，为不同的并行开发路径预留专属轨道。

#### Scenario: 物理轨道隔离
- **WHEN** 系统识别到多个并行分支
- **THEN** 第一优先级的子节点继承父节点的列位置
- **AND** 其他分支节点 SHALL 向右寻找全局唯一的空闲轨道
- **AND** 在该分支的生命周期内，其所属轨道不得被其他无关提交占用，以保留完整的时间间隙

### Requirement: 图形节点与行的紧密集成
commit graph 的节点 SHALL 被渲染在对应修订版本行的左侧预留区内。

#### Scenario: 跨行连线
- **WHEN** 绘制 commit graph 边缘（edges）
- **THEN** 系统 SHALL 基于行索引（row index）和列索引（column index）计算路径
- **AND** 连线 SHALL 跨越行边界连接父子节点
