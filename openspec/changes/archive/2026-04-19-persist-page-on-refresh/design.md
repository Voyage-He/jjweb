## Context

当前应用使用 Zustand 进行状态管理。`useUIStore` 已经使用了 `persist` 中间件来持久化 UI 偏好设置（主题、侧边栏状态等），但 `useRepoStore` 没有使用持久化，导致页面刷新时仓库状态丢失。

项目已依赖 `zustand/middleware` 的 `persist` 功能，无需引入新的依赖。

## Goals / Non-Goals

**Goals:**
- 持久化 `repository` 对象到 localStorage
- 应用启动时自动恢复仓库状态
- 保持现有代码结构，最小化改动

**Non-Goals:**
- 不持久化敏感数据（如认证令牌）
- 不持久化完整 commits 列表（数据量大，可重新获取）
- 不实现跨设备同步

## Decisions

### 1. 使用 Zustand persist 中间件

**选择**: 复用现有的 `zustand/middleware` 的 `persist` 功能

**理由**:
- 项目已在使用此方案（`useUIStore`）
- 代码改动最小，与现有架构一致
- 支持选择性持久化（`partialize`）

**备选方案**:
- 手动 localStorage 管理：需要更多代码，容易出错
- IndexedDB：对于少量数据来说过于复杂

### 2. 持久化内容选择

**选择**: 仅持久化 `repository` 对象

**理由**:
- `commits` 列表数据量大，可通过 API 重新获取
- `selectedCommit` 在 commits 变化后可能不存在
- 保持 localStorage 占用最小

**备选方案**:
- 持久化 `selectedCommit.changeId`：可在刷新后尝试恢复选中状态，但实现复杂度增加

### 3. Storage key 命名

**选择**: 使用 `jjgui-repo-storage` 作为 storage key

**理由**: 与现有的 `jjgui-ui-storage` 保持一致的命名风格

## Risks / Trade-offs

**[风险] localStorage 数据损坏** → 添加 JSON.parse 异常处理，损坏时回退到初始状态

**[权衡] 仓库路径变更** → 如果仓库目录被移动/删除，应用会显示错误，用户需要关闭仓库重新选择
