## Context

当前 revision 显示使用 `gridLayoutOptions` 控制布局:
- `rowHeight: 64` - 每行的垂直高度
- `trackWidth: 60` - 图形列的水平宽度

这些值定义在 `packages/web/src/stores/index.ts` 中。

## Goals / Non-Goals

**Goals:**
- 减小 `rowHeight` 以缩小行间距
- 减小 `trackWidth` 以缩小列间距
- 保持视觉可读性和交互可用性

**Non-Goals:**
- 不改变图形渲染逻辑
- 不添加用户配置选项

## Decisions

### 1. 行间距调整
- **当前值**: `rowHeight: 64`
- **新值**: `rowHeight: 48`
- **理由**: 48px 仍足够容纳文本内容 (text-sm 约 14px + padding)，同时减少约 25% 垂直空间

### 2. 列间距调整
- **当前值**: `trackWidth: 60`
- **新值**: `trackWidth: 32`
- **理由**: 32px 仍足够显示节点圆点 (r=5) 和连接线，减少约 47% 水平空间

## Risks / Trade-offs

- **Risk**: 文字可能显得拥挤 → 可通过后续调整 padding 微调
- **Risk**: 曲线连接线可能过于密集 → `CURVE_SPREAD_FACTOR` 已有自适应逻辑
