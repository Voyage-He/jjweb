## Why

表格界面滚动时，顶部 bookmark 栏没有跟着滚动，导致用户在滚动浏览表格数据时，bookmark 栏的位置固定不变，影响用户体验和数据导航的连贯性。需要修复 bookmark 栏与表格滚动的同步行为。

## What Changes

- 修复 bookmark 栏的滚动同步逻辑，使其与表格内容区域保持同步滚动
- 确保 bookmark 栏能正确响应表格的滚动事件
- 保持 bookmark 栏在水平滚动时的同步（如果适用）

## Capabilities

### New Capabilities

- `bookmark-scroll-sync`: 表格界面 bookmark 栏与表格内容的滚动同步功能

### Modified Capabilities

(无现有 capability 的需求变更)

## Impact

- 表格界面组件的滚动事件处理逻辑
- bookmark 栏组件的定位和滚动行为
- 可能涉及 CSS 定位属性的调整
