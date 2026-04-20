## Why

当前修订版本列表的布局中，图形结构（commit graph）与修订版本信息（message, author 等）的过于耦合。通过将每个修订版本限制在单行展示，我们可以将左侧空间专门用于展现清晰的修订树结构，并将相关的元数据（如消息和作者）直接放置在对应行的右侧。这种布局能使图形结构更集中，逻辑关系更清晰，同时也提高了空间利用率。

## What Changes

- **修订列表布局重构**: 将修订版本在最左侧单独成列，每行代表一个修订版本。
- **左侧图形区域**: 在行的最左列集成 commit graph 的渲染，确保节点与行对齐，不同分支分隔明确，颜色有区分。
- **右侧信息区域**: 在行的右侧剩余列展示修订版本的详细信息（message, author, date, bookmarks 等）。
- **对齐优化**: 确保图形节点中心与该行修订版本信息在视觉上完美对齐。

## Capabilities

### New Capabilities
- `revision-layout`: 定义单行修订版本的布局标准，包括左侧图形区和右侧信息区的分配。

### Modified Capabilities
- `revision-table-view`: 修改原有的网格布局逻辑，改为支持集中图形结构的布局。
- `commit-graph`: 调整图形渲染逻辑，以适应单行高度限制并与行内容对齐。

## Impact

- `packages/web/src/components/RevisionTable`: 需要重构布局组件。
- `packages/web/src/components/CommitGraph`: 绘图逻辑需要适配新的行高度和对齐要求。
- `packages/shared/src/types`: 可能需要调整布局相关的配置类型。
