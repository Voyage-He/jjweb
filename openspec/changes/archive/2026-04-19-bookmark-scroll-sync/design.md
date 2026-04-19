## Context

表格界面包含一个 bookmark 栏，用于显示每列的书签信息。当前实现中，bookmark 栏位于滚动容器外部，使用 CSS `position: sticky` 固定在顶部。这导致水平滚动时 bookmark 栏无法跟随内容滚动。

### 当前结构

```
┌─────────────────────────────────┐
│ Bookmark Bar (sticky top-0)     │  ← 滚动容器外部
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Scrollable Content Area     │ │  ← containerRef (overflow-auto)
│ │                             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 相关文件

- `packages/web/src/components/commits/RevisionTable.tsx` - 主表格组件
- `packages/web/src/components/commits/ColumnBookmarkHeader.tsx` - bookmark 头单元格组件

## Goals / Non-Goals

**Goals:**
- 实现 bookmark 栏与表格内容的水平滚动同步
- 保持 vertical sticky 行为（bookmark 栏始终可见）
- 不影响现有的虚拟滚动性能

**Non-Goals:**
- 不修改 vertical 滚动逻辑
- 不修改 bookmark 的数据结构或显示逻辑
- 不涉及 mobile 端适配

## Decisions

### Decision 1: 水平滚动同步方案

**选择: 监听 scrollLeft 并同步更新 bookmark 栏位置**

方案对比:
1. **方案 A: 将 bookmark 栏移入滚动容器内**
   - 优点: 最简单，无需额外 JS 逻辑
   - 缺点: 会影响现有的 sticky 行为，可能导致 vertical 滚动时 bookmark 栏不可见

2. **方案 B: 监听 scrollLeft 并用 transform 同步 (已选择)**
   - 优点: 保持 vertical sticky 行为，性能好（transform 不触发 reflow）
   - 缺点: 需要额外 JS 事件处理

3. **方案 C: 使用 CSS scroll-driven animations**
   - 优点: 纯 CSS，性能最佳
   - 缺点: 浏览器支持有限，兼容性风险

### Decision 2: 同步实现方式

使用 `transform: translateX(-${scrollLeft}px)` 来移动 bookmark 栏，而不是修改 `left` 或 `margin-left`。理由:
- transform 由 GPU 加速，性能更好
- 不影响布局流
- 与 sticky positioning 兼容

## Risks / Trade-offs

- **性能风险**: 频繁触发 scroll 事件
  - → 使用 `requestAnimationFrame` 或节流来优化

- **视觉闪烁**: scroll 事件响应可能有轻微延迟
  - → 可接受，用户主要关注内容区域

- **兼容性**: 需要确保 transform 与 sticky 在各浏览器中正常工作
  - → 现代浏览器普遍支持，无需 polyfill
