## Why

在表格视图（RevisionTable）中，每个列（column）代表一条独立的开发轨道/分支。当前用户难以快速识别每条轨道对应哪个书签（bookmark），需要逐个检查单元格内容。

在每列顶部显示书签名称，可以让用户一目了然地识别各开发轨道的用途，提升导航效率。

## What Changes

- 在 RevisionTable 组件中，为每个列添加顶部书签标签显示区域
- 自动检测该列中是否存在书签，若存在则显示书签名称，否则留空
- 书签标签使用与现有书签渲染一致的视觉样式

## Capabilities

### New Capabilities

- `column-bookmark-header`: 在表格视图每列顶部显示书签名称（若存在）

### Modified Capabilities

- `revision-table-view`: 扩展表格视图以支持列头书签显示

## Impact

- `packages/web/src/components/commits/RevisionTable.tsx` - 添加列头渲染逻辑
- `packages/web/src/components/commits/RevisionCell.tsx` - 可能需要调整布局以配合列头
