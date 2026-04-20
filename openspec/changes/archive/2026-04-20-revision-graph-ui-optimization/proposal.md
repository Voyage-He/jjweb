## Why

当前 revision graph 存在两个视觉问题影响用户体验：
1. **分叉处连线贴合过紧** - 贝塞尔曲线控制点设置导致分支线在分叉点附近过于贴近，难以区分不同分支
2. **连线交叉导致视觉混乱** - 列分配算法未考虑时间因素，导致新分支可能出现在较远的列，造成连线跨越多个列

## What Changes

- 优化贝塞尔曲线参数，增加分叉处的视觉间距
- 改进列分配算法，让时间上最新的分支优先占据较近的列（靠近主分支）
- 减少连线交叉，提升 graph 可读性

## Capabilities

### New Capabilities

- `revision-graph-layout`: 优化 revision graph 的布局算法，包括列分配策略和曲线绘制参数

### Modified Capabilities

无现有 spec 需要修改。

## Impact

- `packages/server/src/services/jjParsers.ts` - `calculateLayout` 函数
- `packages/web/src/components/commits/RevisionTable.tsx` - `CommitLines` 组件中的贝塞尔曲线绘制逻辑
