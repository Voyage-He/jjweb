## ADDED Requirements

### Requirement: 修订版本以稳定的表格单元格展示
系统 SHALL 将每个修订版本放置在独立的表格单元格中，以网格形式展示提交历史。

#### Scenario: 基于 ChangeId 的稳定性
- **WHEN** 系统渲染修订版本列表
- **THEN** 系统使用 `change_id` 作为该修订版的稳定标识符
- **AND** 即使底层 `commit_id` 发生变化，该修订版在网格中的列位置 SHALL 保持不变

#### Scenario: 严谨的网格对齐
- **WHEN** 系统配置网格布局
- **THEN** 系统 SHALL 使用硬性像素锁定（Fixed Pixels）而非百分比或 `fr` 单位
- **AND** 单元格内容 SHALL 被裁剪（Overflow Hidden）且禁止换行，以确保不破坏整体网格的几何对齐

### Requirement: 时间轴优先的轨道预留
系统 SHALL 采用自底向上的算法，为不同的并行开发路径预留专属轨道。

#### Scenario: 物理轨道隔离
- **WHEN** 系统识别到多个并行分支
- **THEN** 第一优先级的子节点继承父节点的列位置
- **AND** 其他分支节点 SHALL 向右寻找全局唯一的空闲轨道
- **AND** 在该分支的生命周期内，其所属轨道不得被其他无关提交占用，以保留完整的时间间隙
