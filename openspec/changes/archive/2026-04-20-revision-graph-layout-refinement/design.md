## Context

当前 `RevisionTable` 使用 CSS Grid 布局，每个修订版本（`RevisionCell`）被放置在 `(row, column)` 对应的单元格中。这意味着修订版本的信息（如作者、描述）散布在不同的列中，导致视觉上不够整齐，且 commit graph 的连线需要穿插在这些信息块之间。

## Goals / Non-Goals

**Goals:**
- 将修订版本列表重构为“左图右文”的布局。
- 左侧区域专门用于渲染 commit graph（多列宽度）。
- 右侧区域固定用于展示修订版本的元数据（单列，占据剩余宽度）。
- 确保图形节点与右侧信息行在视觉上水平对齐。

**Non-Goals:**
- 不改变现有的 `commit.row` 和 `commit.column` 计算算法。
- 不引入新的重度 UI 框架或 Canvas 库。

## Decisions

1. **Grid 布局重构**:
   - `RevisionTable` 的 `gridTemplateColumns` 将被修改为：
     `grid-template-columns: repeat(${maxCol + 1}, ${columnWidth}px) 1fr;`
   - 其中前面的列属于 `Graph Area`，最后一列（`1fr`）属于 `Info Area`。

2. **组件拆分与定位**:
   - **`CommitLines` (SVG)**: 维持原状，覆盖左侧 `Graph Area`。它负责绘制连线和节点圆点。
   - **`RevisionInfo` (原 `RevisionCell` 的重构版本)**:
     - 每一个修订版本的 `RevisionInfo` 组件将被放置在 `grid-column: ${maxCol + 2}`（即最后一列）。
     - 它始终处于 `grid-row: ${commit.row + 1}`。
     - 这样所有的修订信息都会在右侧垂直对齐。

3. **背景高亮处理**:
   - 由于 `RevisionInfo` 只在最后一列，选中的高亮背景需要横跨整行（从列 1 到最后一列）。
   - 实现方案：在每一行（`grid-row`）放置一个背景占位组件，设置 `grid-column: 1 / -1`。

4. **对齐策略**:
   - 保持 `rowHeight` 固定。
   - `CommitLines` 中的圆点 `cy` 计算公式为 `rowHeight / 2`。
   - `RevisionInfo` 内部使用 `flex items-center` 确保内容垂直居中。

## Risks / Trade-offs

- **[Risk]**: 宽显示器下，右侧信息可能距离左侧图形过远。
  - **Mitigation**: 为 `Graph Area` 后的第一个信息列设置一个合理的最小间距，或允许用户调整图形列宽。
- **[Risk]**: 虚拟滚动计算。
  - **Mitigation**: 现有的基于 `visibleRange` 的过滤逻辑依然适用，只需要确保背景占位符和信息组件都正确渲染。
