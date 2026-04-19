## MODIFIED Requirements

### Requirement: UI 只显示 change ID

系统 SHALL 在所有用户界面中只显示 change ID，不显示 commit ID。

#### Scenario: 提交图节点显示
- **WHEN** 系统渲染提交图中的节点
- **THEN** 系统 SHALL 显示 change ID 的简短形式
- **AND** 系统 SHALL NOT 显示 commit ID

#### Scenario: 详情面板显示
- **WHEN** 用户查看 revision 详情
- **THEN** 系统 SHALL 显示完整的 change ID
- **AND** 系统 SHALL NOT 显示 commit ID

#### Scenario: 搜索功能
- **WHEN** 用户搜索 revision
- **THEN** 系统 SHALL 支持使用 change ID 进行搜索
- **AND** 搜索结果 SHALL 显示 change ID
