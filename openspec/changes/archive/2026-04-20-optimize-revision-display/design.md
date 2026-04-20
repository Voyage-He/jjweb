## Context

当前 revision 显示系统存在两个主要问题：

1. **图形区域空间占比过大**：当前 `columnWidth` 默认为 200px，如果有多个分支（如 5 个分支），图形区域就占据 1000px，对于大多数屏幕来说过于宽大，严重压缩了 revision 信息的显示空间。

2. **Revision 信息展示不够结构化**：当前 `RevisionInfo` 组件将所有信息（changeId、author、description）水平排列在一个区域内，缺乏清晰的列分隔，用户无法快速定位和比较不同字段的信息。

### 现有架构
- `RevisionTable.tsx`: 使用 CSS Grid 布局，图形区域由 `gridLayoutOptions.columnWidth` 控制列宽
- `RevisionInfo.tsx`: 水平排列显示 changeId、author、description
- `useUIStore`: 管理 `gridLayoutOptions`（rowHeight、columnWidth）

## Goals / Non-Goals

**Goals:**
- 减小图形区域的空间占比，使其更紧凑合理
- 实现表格式列布局，每个信息字段独立成列
- 提供可配置的列头系统，支持 message、changeId、author 等字段
- 保持虚拟滚动的性能

**Non-Goals:**
- 不重新设计整体 UI 风格
- 不改变数据获取逻辑
- 不支持用户自定义添加/移除列（后续可扩展）

## Decisions

### D1: 图形列使用弹性宽度
- **决定**：图形列宽度基于实际分支数量自动计算，使用更紧凑的单轨道宽度（60px）
- **计算公式**：`graphWidth = branchCount × trackWidth`
- **理由**：
  - 单分支时仅占 60px，紧凑高效
  - 多分支时自动扩展（如 10 分支 = 600px）
  - 相比当前固定 200px/列，节省大量空间（5 分支：1000px → 300px）
- **可选上限**：可设置 `maxGraphWidth` 防止极端情况（如 50+ 分支）

### D2: 引入列配置系统
- **决定**：在 `UIStore` 中新增 `revisionColumns` 配置，定义可见列及其顺序
- **默认列配置**：
  ```typescript
  revisionColumns: [
    { id: 'graph', label: '', width: 'auto' },      // 图形区
    { id: 'changeId', label: 'Change ID', width: 100 },
    { id: 'message', label: 'Message', width: 'flex' },
    { id: 'author', label: 'Author', width: 120 },
    { id: 'date', label: 'Date', width: 140 },
  ]
  ```
- **理由**：提供结构化的列定义，便于渲染和后续扩展

### D3: 表头区域
- **决定**：在 `RevisionTable` 中新增固定的表头行，显示各列标签
- **理由**：与现有 `ColumnBookmarkHeader` 区分，表头显示通用字段名，bookmark header 显示分支书签信息

### D4: RevisionInfo 重构为列布局
- **决定**：将 `RevisionInfo` 拆分为独立的列单元，每个字段占据一列
- **理由**：实现真正的表格布局，支持列头对齐和列宽控制

## Risks / Trade-offs

- **小屏幕适配**：列数过多可能导致水平滚动
  - → 可通过 `revisionColumns` 配置隐藏次要列
- **现有 bookmark header 兼容性**：需要确保新表头与现有 `ColumnBookmarkHeader` 协同工作
  - → 将图形列的表头区域留给 `ColumnBookmarkHeader`，其他列使用统一表头样式