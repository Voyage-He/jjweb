## Why

当前 revision graph 在存在分叉、merge 或短生命周期分支时，列分配容易保留已经不再需要的横向轨道，导致图形区域变宽、连线跨度增加，降低扫描效率。需要在保持主线稳定和图形可读性的前提下，让布局优先使用最少必要列数。

## What Changes

- 调整 revision graph 的列分配原则，将“最少列数”作为主线稳定之后的核心优化目标。
- 在分支生命周期结束、merge 回主线或列无后续占用时，允许后续 revision 复用空闲列。
- 为候选布局引入确定性的列数成本比较，在列数相同后再比较交叉、跨度和稳定性等现有目标。
- 保持 working copy / 主 bookmark 祖先链的稳定主列行为，不因压缩列数导致主线横向跳动。
- 不改变 revision 数据模型、表格列配置或 graph 渲染 API。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `revision-graph-layout`: 增加按最少列原则分配和复用 graph 列的行为要求。

## Impact

- 影响 revision graph 布局计算逻辑，尤其是分支列分配、候选布局评分和空闲列复用。
- 影响现有 revision graph layout 相关测试，需要增加覆盖分叉、merge、短分支和稳定主线的用例。
- 不引入新的外部依赖，不改变用户可见配置项。
