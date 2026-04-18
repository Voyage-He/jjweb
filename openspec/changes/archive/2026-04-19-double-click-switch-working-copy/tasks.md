## 1. 后端 API

- [x] 1.1 在 `packages/server/src/routes/api.ts` 中添加 `POST /api/changes/:id/edit` 端点，执行 `jj edit <revision>` 命令

## 2. 前端 API 客户端

- [x] 2.1 在 `packages/web/src/api/client.ts` 中添加 `editRevision(id: string)` 方法

## 3. Canvas 视图双击处理

- [x] 3.1 在 `packages/web/src/components/commits/CommitGraph.tsx` 中添加 `onCommitEdit` 回调属性
- [x] 3.2 在 `CommitGraph` 中监听 `dblclick` 事件，根据点击坐标查找对应节点并调用 `onCommitEdit`
- [x] 3.3 在父组件中实现 `onCommitEdit` 回调，调用 `editRevision` API 并刷新状态

## 4. 表格视图双击处理

- [x] 4.1 在 `packages/web/src/components/commits/RevisionCell.tsx` 中添加 `onEdit` 回调属性
- [x] 4.2 在 `RevisionCell` 的 `<div>` 上添加 `onDoubleClick` 处理器，调用 `onEdit`
- [x] 4.3 在父组件中传递 `onEdit` 回调，复用 Canvas 视图的编辑逻辑

## 5. 用户反馈

- [x] 5.1 添加操作成功/失败的 toast 通知
- [x] 5.2 确保 `isWorkingCopy` 状态正确更新（刷新提交图和工作副本状态）
