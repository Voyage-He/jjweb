## Context

当前 revision graph 使用 SVG 绘制贝塞尔曲线连接节点，列分配由 `calculateLayout` 函数在服务端完成。

**当前贝塞尔曲线实现** (`RevisionTable.tsx:58-64`):
```typescript
// 同列用直线，不同列用三次贝塞尔曲线
const cp1y = childY + (parentY - childY) / 2;
const cp2y = childY + (parentY - childY) / 2;
pathData = `M ${childX} ${childY} C ${childX} ${cp1y}, ${parentX} ${cp2y}, ${parentX} ${parentY}`;
```
问题：控制点 X 坐标分别固定在 `childX` 和 `parentX`，导致曲线在分叉处过于贴近。

**当前列分配算法** (`jjParsers.ts:95-201`):
- 基于 score 传播（working copy=1000, main 分支=500, 其他 bookmark=100）
- 分叉时，第一个子节点继承父列，后续子节点分配新列（从 `myCol + 1` 开始找空位）
- 问题：仅按 score/时间做局部排序，无法根据整张图的 merge edge 交叉情况调整分叉顺序

## Goals / Non-Goals

**Goals:**
- 优化贝塞尔曲线参数，使分叉处连线有足够的视觉间距
- 改进列分配算法，在保持主线优先级的前提下降低连线交叉
- 减少连线交叉，提升整体可读性

**Non-Goals:**
- 不改变现有的 score 传播机制（working copy、main 分支优先级保持不变）
- 不引入新的外部依赖（如 dagre 布局库）
- 不改变现有的虚拟滚动和渲染逻辑

## Decisions

### 1. 贝塞尔曲线优化策略

**决定**: 引入曲线"展开系数"，使曲线在分叉处向外弯曲

**方案**: 修改控制点 X 坐标，根据分叉方向添加偏移：
```typescript
// 分叉方向: parent 在 child 左侧还是右侧
const direction = parentX < childX ? -1 : 1;
const spread = trackWidth * 0.3; // 展开系数

// 子节点端保持垂直出线，父节点侧向外偏移，避免子节点连线外甩过头
const cp1x = childX;
const cp2x = parentX + direction * spread;
```

**替代方案考虑**:
- 使用二次贝塞尔曲线 (Q) - 控制点少，灵活性不足
- 增加中间节点 - 复杂度高，渲染开销大

### 2. 列分配优化策略

**决定**: 在分叉时，先按 score/时间生成默认顺序，再用全图代价函数尝试重排 fork children

**方案**: 修改 `calculateLayout` 中分叉处理逻辑：
```typescript
cost = pinPenalty
  + crossingCount * 1000
  + horizontalDistance * 10;
```

其中：
- `pinPenalty` 确保 working copy、main/master/trunk/default 等高优先级链路保持在列 0
- `crossingCount` 通过边的线段交叉检测计算，直接优化用户可见的连线交叉
- `horizontalDistance` 作为次级目标，避免为了减少交叉而产生过长横跨线

每个 fork 点只尝试有限候选顺序：
```typescript
// 4 个及以下 children 尝试全排列，更多 children 使用默认顺序和“单 child 提前”候选。
const candidates = children.length <= 4
  ? permutations(defaultOrder)
  : [defaultOrder, ...moveEachChildToFront(defaultOrder)];
```

**替代方案考虑**:
- 完全重写为拓扑排序 - 改动大，风险高
- 使用 dagre 库自动布局 - 引入新依赖，与现有逻辑冲突
- 只调整贝塞尔曲线 - 能改善局部观感，但不能解决列顺序造成的真实交叉

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 曲线展开系数过大导致曲线超出边界 | 设置合理的系数上限 (0.3 * trackWidth)，并测试边界情况 |
| 子节点端控制点外偏导致连线外甩 | 子节点端控制点保持在 childX，仅在父节点侧展开曲线 |
| 列分配改变可能影响用户习惯 | 保持 score 优先级不变，main/working copy 仍在列 0 |
| 多分支场景下仍有交叉 | 使用 crossing-aware 代价函数优化常见 fork/merge 场景，但不承诺全局最优 |
| 全排列在高分叉场景下开销过大 | 4 个及以下 children 才做全排列，更多 children 降级为有限候选 |
