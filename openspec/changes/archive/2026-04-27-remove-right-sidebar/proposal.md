## Why

当前应用在主布局中固定支持右侧详情侧边栏，占用横向空间并让 revision 列表、图形和 diff 相关内容的可视区域变窄。取消右侧侧边栏可以让主要工作区获得完整宽度，降低布局复杂度，并为后续将详情内容改为主区域内视图或弹层留出空间。

## What Changes

- 移除主布局中的右侧详情侧边栏渲染区域。
- 移除或停用顶部栏中用于切换右侧详情面板的入口。
- 保留左侧仓库/工作副本侧边栏与主内容区域的现有行为。
- 原本传入右侧详情面板的内容不再作为独立右侧 aside 展示。

## Capabilities

### New Capabilities
- `application-layout`: 定义应用主布局的区域组成，明确取消右侧详情侧边栏后主内容区域的展示要求。

### Modified Capabilities

## Impact

- 影响 `packages/web/src/components/layout/Layout.tsx` 的布局结构与工具栏按钮。
- 可能影响 `packages/web/src/App.tsx` 中传入 `detail` 内容的方式。
- 可能影响 `packages/web/src/stores/index.ts` 中右侧详情面板开关状态的使用。
- 可能需要同步更新端到端测试、用户文档或快捷键说明中与右侧详情面板相关的内容。
