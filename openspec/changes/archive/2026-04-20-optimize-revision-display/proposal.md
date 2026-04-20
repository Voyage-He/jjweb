## Why

当前 revision 图形区域（graph visualization）占据了过多的屏幕空间，导致实际内容显示区域受限，用户体验不佳。同时，revision 信息展示方式不够结构化，缺乏清晰的列布局和可配置的表头，使得用户难以快速定位和比较不同 revision 的关键信息（如 message、changeID、author 等）。

## What Changes

- 减小 revision 图形区域的视觉占比，优化空间分配比例
- 将每个 revision 的信息改为独立的列布局（column-based layout）
- 实现可配置的列头系统，支持 message、changeID、author 等字段的灵活配置
- 提升信息密度和可读性

## Capabilities

### New Capabilities
- `revision-table-layout`: 基于 table/column 的 revision 信息展示布局，支持可配置列头

### Modified Capabilities
- `revision-graph`: 调整图形可视化区域的尺寸和空间占比

## Impact

- 前端 UI 组件：revision 列表/图形展示相关组件
- 可能涉及 CSS/Tailwind 样式调整
- 可能需要新增配置项用于列头定制
