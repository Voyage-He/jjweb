## Context

当前 UI 中显示了 commit ID（commit hash），但这对 Jujutsu 用户来说是不必要的信息：

- **change ID**：Jujutsu 的稳定标识符，用户需要看到和使用
- **commit ID**：类似 Git hash，会随 rebase 改变，用户无需关心

调查发现 UI 主要在以下地方显示 revision 信息：
1. `CommitGraph.tsx`：显示 `changeId.slice(0, 8)`（已正确显示 change ID）
2. 详情面板：可能显示完整的 revision 信息

需要确认是否有地方显示了 commit ID，并移除这些显示。

## Goals / Non-Goals

**Goals:**
- 确保所有 UI 只显示 change ID，不显示 commit ID
- 保持代码简洁，移除不必要的 commit ID 展示逻辑

**Non-Goals:**
- 不修改后端数据结构或类型定义
- 不影响 commit ID 的内部存储（某些场景可能需要）

## Decisions

### 1. UI 显示策略

**决定**：UI 只显示 change ID

**理由**：
- change ID 是用户唯一需要关心的标识
- commit ID 对用户没有实际价值

### 2. 数据保留

**决定**：后端继续解析和存储 commit ID

**理由**：
- 某些 Git 互操作场景可能需要
- 不影响前端显示
- 保持数据完整性

## Risks / Trade-offs

- **风险**：高级用户可能想看 commit ID
  - **缓解**：可在详情面板的"高级信息"折叠区域提供（如有需要）
