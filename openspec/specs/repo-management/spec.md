## ADDED Requirements

### Requirement: 用户可以初始化新仓库

系统 SHALL 允许用户在指定目录初始化新的 Jujutsu 仓库。

#### Scenario: 在空目录初始化仓库
- **WHEN** 用户选择一个空目录并点击"初始化仓库"
- **THEN** 系统执行 `jj init` 命令
- **AND** 系统显示仓库初始化成功的确认消息
- **AND** 系统自动打开该仓库

#### Scenario: 在已存在仓库的目录初始化
- **WHEN** 用户选择一个已包含 `.jj` 目录的文件夹
- **THEN** 系统显示错误提示"该目录已是一个 Jujutsu 仓库"
- **AND** 系统询问是否打开现有仓库

### Requirement: 用户可以克隆远程仓库

系统 SHALL 允许用户通过 URL 克隆远程 Git 仓库。

#### Scenario: 成功克隆远程仓库
- **WHEN** 用户输入有效的 Git 远程 URL 并选择目标目录
- **THEN** 系统执行 `jj git clone <url> <directory>` 命令
- **AND** 系统显示克隆进度
- **AND** 克隆完成后自动打开仓库

#### Scenario: 克隆私有仓库时认证失败
- **WHEN** 用户尝试克隆需要认证的私有仓库但未提供有效凭据
- **THEN** 系统显示认证错误提示
- **AND** 系统提示用户配置 Git 凭据或 SSH 密钥

### Requirement: 用户可以打开现有仓库

系统 SHALL 允许用户打开本地已存在的 Jujutsu 或 Git 仓库。

#### Scenario: 打开 Jujutsu 仓库
- **WHEN** 用户选择包含 `.jj` 目录的文件夹
- **THEN** 系统加载仓库并显示提交图视图

#### Scenario: 打开 Git 仓库（非 Jujutsu）
- **WHEN** 用户选择包含 `.git` 但不含 `.jj` 目录的文件夹
- **THEN** 系统询问是否将此 Git 仓库初始化为 Jujutsu 仓库
- **AND** 用户确认后执行 `jj init --git-repo=.`

#### Scenario: 打开非仓库目录
- **WHEN** 用户选择的目录既不包含 `.jj` 也不包含 `.git`
- **THEN** 系统提示"未检测到版本控制仓库"
- **AND** 提供初始化新仓库的选项

### Requirement: 用户可以关闭当前仓库

系统 SHALL 允许用户关闭当前打开的仓库。

#### Scenario: 关闭仓库
- **WHEN** 用户点击"关闭仓库"按钮
- **THEN** 系统保存当前视图状态
- **AND** 系统返回仓库选择界面

### Requirement: 用户可以切换仓库

系统 SHALL 维护最近打开的仓库列表并允许快速切换。

#### Scenario: 从最近列表切换仓库
- **WHEN** 用户从"最近仓库"菜单选择一个仓库
- **THEN** 系统关闭当前仓库
- **AND** 系统打开选中的仓库

#### Scenario: 仓库目录已被移动或删除
- **WHEN** 用户尝试打开最近列表中的仓库但目录不存在
- **THEN** 系统显示"仓库目录未找到"错误
- **AND** 从最近列表中移除该项
