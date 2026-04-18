## Why

在 Jujutsu 中，工作副本（working copy）是一个特殊的 revision，用户的修改直接应用到这个 revision 上。当前用户只能通过命令行或右键菜单执行 `jj edit` 来切换工作副本到其他 revision，操作不够直观便捷。双击 revision 节点是图形界面中常见的快捷操作方式，可以大大提升用户切换工作副本的效率。

## What Changes

- 在提交图的 revision 节点上添加双击事件处理
- 双击某个 revision 时，执行 `jj edit <revision>` 命令，将工作副本切换到该 revision
- 切换成功后，更新提交图视图，显示新的工作副本位置
- 如果双击的是当前工作副本，则不执行任何操作
- 如果目标 revision 存在冲突或其他问题导致无法切换，显示错误提示

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `commit-graph`: 增加双击 revision 节点切换工作副本的功能

## Impact

- `packages/web/src/components/commits/CommitGraph.tsx`: 添加双击事件处理
- `packages/web/src/components/commits/RevisionCell.tsx`: 添加双击事件处理（表格视图）
- `packages/web/src/api/client.ts`: 添加 `editRevision` API 方法
- `packages/server/src/routes/api.ts`: 添加 `POST /api/changes/:id/edit` 端点
