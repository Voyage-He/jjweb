## Context

当前系统使用 Canvas 渲染提交图，revision 节点支持单击选择和拖放操作。后端已有 `jj edit` 命令的执行能力（通过 `jjExecutor`），但前端没有暴露相应的 API 端点，也没有双击事件处理逻辑。

在 Jujutsu 中，`jj edit <revision>` 命令会将工作副本移动到指定的 revision，使其成为新的工作副本位置。这与 `jj new` 不同，`jj edit` 是切换到已存在的 revision，而不是创建新的空白变更。

## Goals / Non-Goals

**Goals:**
- 实现双击 revision 节点切换工作副本的功能
- 在 Canvas 视图和表格视图中都支持此功能
- 提供清晰的用户反馈（加载状态、成功/失败提示）
- 保持与现有交互（单击选择、拖放）的兼容性

**Non-Goals:**
- 改变现有的单击选择行为
- 实现三击或其他高级交互
- 添加双击的自定义配置（如双击速度阈值）

## Decisions

### 1. 双击检测策略
- **方案**: 使用浏览器的原生 `dblclick` 事件
- **理由**: 浏览器原生双击事件已经处理了双击时间间隔和点击位置判断，无需自行实现。对于 Canvas，需要在点击位置检测到节点后触发双击回调。
- **实现**:
  - 表格视图（RevisionCell）：直接在 `<div>` 上添加 `onDoubleClick` 处理器
  - Canvas 视图（CommitGraph）：监听 `dblclick` 事件，根据点击坐标查找对应节点

### 2. API 设计
- **方案**: 添加 `POST /api/changes/:id/edit` 端点
- **理由**: 与现有 API 风格一致（如 `/changes/:id/move`、`/changes/:id/squash`），语义清晰
- **实现**:
  ```typescript
  // 后端
  router.post('/changes/:id/edit', async (req, res) => {
    const { id } = req.params;
    const result = await jjExecutor.execute(['edit', id], { cwd: repoPath });
    // ...
  });

  // 前端
  async editRevision(id: string): Promise<{ success: boolean }> {
    return this.request(`/changes/${id}/edit`, { method: 'POST' });
  }
  ```

### 3. 用户体验反馈
- **方案**: 使用 toast 通知显示操作结果
- **理由**: 与系统其他操作（如 abandon、squash）保持一致的用户反馈模式
- **实现**:
  - 操作开始时显示加载状态（可选，因为 `jj edit` 通常很快）
  - 成功后刷新提交图和工作副本状态
  - 失败时显示错误 toast，包含 jj 的错误信息

### 4. 当前工作副本的双击行为
- **方案**: 双击当前工作副本时，不执行任何操作（静默忽略）
- **理由**: 用户可能误双击当前工作副本，执行 `jj edit` 到同一个 revision 是无意义的操作，且可能产生不必要的 UI 刷新

## Risks / Trade-offs

- **[Risk] 双击与单击选择的冲突**: 用户快速双击时，可能会先触发两次单击选择事件
  - **Mitigation**: 这是浏览器默认行为，单击选择是无副作用的操作，不会影响最终结果。双击后选择状态会正确更新。

- **[Risk] 目标 revision 有未提交的修改**: 如果当前工作副本有未提交的修改，切换到其他 revision 可能导致修改丢失或冲突
  - **Mitigation**: 依赖 `jj edit` 的默认行为。jj 会将工作副本的修改带到新的 revision。如果用户想保留修改在原 revision，应先 commit 或 squash。

- **[Risk] 切换失败**: 目标 revision 可能不存在或存在冲突导致切换失败
  - **Mitigation**: 捕获 `jj edit` 的错误输出，通过 toast 显示给用户，不更新 UI 状态。
