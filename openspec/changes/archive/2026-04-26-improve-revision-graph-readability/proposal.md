## Why

复杂 revision 结构中，当前图形容易因为主线位置变化、跨列连线重叠和关系路径不突出而难以阅读。需要先改进布局稳定性和连线可追踪性，让用户能快速识别当前 revision、主线和相关 parent/child 路径。

## What Changes

- 稳定主线布局：优先将 working copy 祖先链或 main/master/trunk 主线保持在固定主列，降低刷新、筛选或数据变化后的空间跳动。
- 改进节点排序：在减少交叉的同时保持拓扑顺序、时间顺序和主线优先级的稳定组合。
- 改进连线路由：普通 parent-child 边保持短且清晰，跨列/merge 边使用可区分的曲线路由和偏移，减少重叠与节点穿越。
- 增加交互高亮：hover 或选中 revision 时高亮直接相关路径，并弱化非相关节点和连线。
- 不引入 breaking change，不改变 revision 数据模型的语义。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `revision-graph-layout`: 增加稳定主线布局和稳定节点排序要求。
- `revision-graph`: 增加复杂结构下的连线路由、边区分和交互高亮要求。

## Impact

- 影响 revision graph 的布局计算、节点排序、边路径生成和交互状态渲染。
- 可能影响图形区域宽度、横向滚动和已有曲线参数的使用方式。
- 不需要新增后端 API；若现有前端数据缺少 bookmark、working copy 或 parent 边类型信息，则需在现有解析层补齐派生 metadata。
