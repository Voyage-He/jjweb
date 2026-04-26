## ADDED Requirements

### Requirement: 主布局不包含右侧详情侧边栏
系统 SHALL 在仓库打开后的主应用布局中只渲染顶部栏、可切换的左侧侧边栏和主内容区域，MUST NOT 渲染独立的右侧详情侧边栏。

#### Scenario: 仓库打开后展示主工作区
- **WHEN** 用户打开一个仓库并进入主应用界面
- **THEN** 系统 SHALL 显示主内容区域
- **AND** 系统 SHALL 保持左侧侧边栏按当前开关状态展示或隐藏
- **AND** 系统 MUST NOT 在主内容区域右侧渲染独立详情侧边栏

#### Scenario: 主内容区域占用右侧侧边栏移除后的空间
- **WHEN** 系统渲染主应用布局
- **THEN** 主内容区域 SHALL 扩展到除左侧侧边栏外的剩余可用宽度
- **AND** 主内容区域右侧 MUST NOT 预留固定详情面板宽度

### Requirement: 不提供右侧详情侧边栏切换入口
系统 SHALL 不向用户展示用于打开、关闭或切换右侧详情侧边栏的 UI 入口或快捷键说明。

#### Scenario: 顶部栏不显示详情面板切换按钮
- **WHEN** 系统渲染顶部栏
- **THEN** 顶部栏 SHALL 保留与当前有效布局相关的操作入口
- **AND** 顶部栏 MUST NOT 显示用于切换右侧详情面板的按钮

#### Scenario: 设置和快捷键说明不暴露详情面板切换
- **WHEN** 系统展示快捷键说明或设置中的快捷键列表
- **THEN** 系统 MUST NOT 显示用于切换右侧详情面板的动作

### Requirement: Revision 选择不依赖右侧详情侧边栏
系统 SHALL 允许用户继续选择 revision，并保持选择状态供主内容区操作使用，而不要求右侧详情侧边栏存在。

#### Scenario: 用户选择 revision
- **WHEN** 用户在 revision 表格中选择一个 revision
- **THEN** 系统 SHALL 更新当前选中的 revision 状态
- **AND** 系统 MUST NOT 因缺少右侧详情侧边栏而改变 revision 表格布局或阻止后续 revision 操作
