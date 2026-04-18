## ADDED Requirements

### Requirement: 用户可以通过双击切换工作副本

系统 SHALL 允许用户通过双击提交图中的 revision 节点来切换工作副本到该 revision。

#### Scenario: 双击非工作副本 revision
- **WHEN** 用户双击提交图中一个非当前工作副本的 revision 节点
- **THEN** 系统执行 `jj edit <revision>` 命令
- **AND** 工作副本移动到目标 revision
- **AND** 提交图更新显示新的工作副本位置（绿色高亮）
- **AND** 工作副本面板更新显示新 revision 的文件状态

#### Scenario: 双击当前工作副本
- **WHEN** 用户双击当前工作副本节点
- **THEN** 系统不执行任何操作
- **AND** 不显示任何提示信息

#### Scenario: 切换工作副本失败
- **WHEN** 用户双击某个 revision 但 `jj edit` 命令执行失败
- **THEN** 系统显示错误提示信息
- **AND** 提交图和工作副本状态保持不变

#### Scenario: 表格视图双击切换
- **WHEN** 用户在表格视图（RevisionTable）中双击某个 revision 单元格
- **THEN** 系统执行与提交图视图相同的切换工作副本逻辑
