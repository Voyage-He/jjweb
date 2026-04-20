## 1. 准备工作

- [x] 1.1 备份并分析 `packages/web/src/components/commits/RevisionTable.tsx` 的布局逻辑
- [x] 1.2 确认 `CommitLines` SVG 渲染逻辑中的 `x, y` 计算方式

## 2. 布局组件重构

- [x] 2.1 修改 `RevisionTable` 的 `gridStyle`：将列定义从 `repeat(maxCol + 1, width)` 改为 `repeat(maxCol + 1, width) 1fr`
- [x] 2.2 更新 `ColumnBookmarkHeader` 容器的宽度计算，确保它与新的 Grid 布局对齐
- [x] 2.3 在 `RevisionTable` 的渲染循环中，为每一行添加一个全宽的背景组件（`grid-column: 1 / -1`），处理选中高亮
- [x] 2.4 将 `RevisionCell` 重命名或重构为 `RevisionInfo`（专注于右侧元数据展示）
- [x] 2.5 在 `RevisionTable` 中，将 `RevisionInfo` 放置在 `grid-column: maxCol + 2` 且对应 `grid-row` 的位置

## 3. 图形与对齐优化

- [x] 3.1 确保 `CommitLines` 的 SVG 宽度只覆盖 `maxCol + 1` 列，或者使用绝对定位将其固定在左侧
- [x] 3.2 优化 `RevisionInfo` 的 CSS 样式：使用 `flex items-center` 确保描述和作者信息在固定高度的行内垂直居中
- [x] 3.3 验证不同 `maxCol`（不同分支深度）下的布局稳定性

## 4. 清理与验证

- [x] 4.1 移除不再需要的网格线（如果旧布局中有针对单元格的边框）
- [x] 4.2 运行 E2E 测试确保点击修订版本依然能正确选中
- [x] 4.3 验证在宽屏和窄屏下的响应式表现
