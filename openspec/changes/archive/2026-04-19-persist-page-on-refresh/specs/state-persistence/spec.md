## ADDED Requirements

### Requirement: Repository state persists across page refreshes

系统 SHALL 将当前打开的仓库信息持久化到浏览器 localStorage，并在页面刷新后自动恢复。

#### Scenario: Repository restored after page refresh
- **WHEN** 用户打开了一个仓库并刷新页面
- **THEN** 系统从 localStorage 恢复仓库状态，用户保持在仓库视图中

#### Scenario: No repository on first visit
- **WHEN** 用户首次访问应用（localStorage 中无数据）
- **THEN** 系统显示仓库选择页面

### Requirement: Corrupted storage data is handled gracefully

系统 SHALL 处理 localStorage 数据损坏的情况，不导致应用崩溃。

#### Scenario: Corrupted storage data
- **WHEN** localStorage 中的仓库数据损坏或格式无效
- **THEN** 系统清除无效数据并显示仓库选择页面

### Requirement: Storage key follows naming convention

系统 SHALL 使用 `jjgui-repo-storage` 作为 localStorage key，与现有 `jjgui-ui-storage` 保持一致。

#### Scenario: Storage key verification
- **WHEN** 仓库状态被持久化
- **THEN** 数据存储在 `jjgui-repo-storage` key 下
