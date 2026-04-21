## Why

当前 revision 显示的行间距和图形列间距过大，导致信息密度低，用户需要更多滚动才能查看历史记录。缩小间距可以提升信息密度，让用户在同一视口内看到更多 revision 信息。

## What Changes

- 缩小 revision 行之间的垂直间距
- 缩小 revision 图形中列之间的水平间距
- 调整相关布局参数以保持视觉平衡

## Capabilities

### New Capabilities

无新增能力

### Modified Capabilities

- `revision-graph`: 调整图形布局参数，缩小列间距
- `revision-list`: 调整行间距参数

## Impact

- 影响文件: revision 图形渲染组件、revision 列表布局组件
- 可能需要调整 CSS/Tailwind 间距类
- 不影响 API 或数据结构
