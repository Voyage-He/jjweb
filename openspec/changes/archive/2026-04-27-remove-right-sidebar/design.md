## Context

当前主应用布局由 `Layout` 组件组织为顶部栏、左侧 sidebar、主内容区和右侧 detail panel。`App` 将 `CommitDetail` 作为 `detail` prop 传入，`useUIStore` 中也保留了 `detailPanelOpen` 和 `toggleDetailPanel` 状态。用户请求取消右侧侧边栏，因此布局 contract 需要从三栏变为“左侧可切换 sidebar + 主内容区”。

## Goals / Non-Goals

**Goals:**
- 主布局不再渲染右侧详情侧边栏。
- 顶部栏不再提供右侧详情面板切换按钮。
- 主内容区域占用移除右侧侧边栏后的剩余宽度。
- 清理不再使用的 `detail` prop、右侧面板状态和相关快捷键/测试期望。

**Non-Goals:**
- 不重新设计 commit 详情内容的替代入口。
- 不改变左侧 sidebar、仓库切换、revision 表格或操作对话框的核心行为。
- 不改变后端 API 或 commit detail 数据获取能力，除非前端不再需要对应调用。

## Decisions

### 移除 `Layout` 的右侧 detail slot

`Layout` 将不再接收或渲染 `detail` prop，也不再读取 `detailPanelOpen` / `toggleDetailPanel`。这样可以让主布局的结构与目标界面一致，避免保留一个永远关闭的隐藏面板。

替代方案是保留 `detail` prop 但默认关闭。该方案会继续暴露已取消的布局能力，并留下无效状态与入口，不符合“取消右侧侧边栏”的目标。

### 从 `App` 移除右侧详情面板挂载

`App` 不再将 `CommitDetail` 作为右侧区域传给 `Layout`。如果 `CommitDetail` 仅用于右侧侧边栏且没有其他入口，对应 import 和用于侧边栏详情展示的查询应一并移除；revision 选择行为保持可用，以免影响表格选中状态和操作上下文。

替代方案是将 `CommitDetail` 立即迁移到主内容区或弹层。该方案会引入新的交互设计，不属于本次变更范围。

### 清理 UI 状态与用户可见说明

`detailPanelOpen` 和 `toggleDetailPanel` 不再属于有效 UI 状态，应从 store、持久化状态、快捷键绑定和设置/文档中移除或停用。保留旧状态会造成用户界面没有对应反馈的死入口。

替代方案是仅隐藏按钮但保留快捷键与 store。该方案会让快捷键或设置项表现为无效果，增加维护成本。

## Risks / Trade-offs

- 失去右侧详情的即时查看入口 -> 本次只取消侧边栏；后续可单独设计详情页、弹层或主区域内详情视图。
- 现有 E2E 测试可能依赖右侧详情内容 -> 更新测试为验证右侧侧边栏不存在、主区域仍可选择 revision。
- 持久化存储中可能残留旧的 `detailPanelOpen` 字段 -> Zustand `partialize` 已未持久化该字段时无需迁移；若实现中发现已持久化，应忽略旧字段。
