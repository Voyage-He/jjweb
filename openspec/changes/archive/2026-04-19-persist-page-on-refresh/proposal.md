## Why

当前应用在页面刷新时会丢失所有状态，用户被重定向回仓库选择页面。这严重影响了用户体验——用户需要重新选择仓库并导航到之前查看的内容。应该通过持久化关键状态来保持用户的上下文。

## What Changes

- 将 `repository` 状态持久化到 localStorage，使应用在刷新后能够自动恢复仓库上下文
- 可选：持久化 `selectedCommit` 的 changeId，刷新后恢复选中的提交

## Capabilities

### New Capabilities

- `state-persistence`: 在页面刷新后保持应用状态，包括当前打开的仓库和用户选择

### Modified Capabilities

无现有 capabilities 需要修改。

## Impact

- `packages/web/src/stores/index.ts` - 为 `useRepoStore` 添加 persist 中间件
- `packages/web/src/App.tsx` - 可能需要调整初始化逻辑
