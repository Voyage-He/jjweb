## Context

当前 revision graph 的列坐标由 `packages/server/src/services/jjParsers.ts` 中的布局计算生成，前端 `RevisionTable` 只根据 `maxCol + 1` 和 `trackWidth` 计算图形列宽。现有布局已经支持 working copy / 主 bookmark 祖先链固定、分叉 child 稳定排序、交叉计数和横向跨度成本，但列分配使用全局占用模型，已经结束的分支列不会被后续不重叠分支复用。

这会让短分支、merge 后的分支和互不重叠的 side branch 持续增加 `maxCol`，从而扩大 graph 区域并拉长后续连线。该变更应优先收敛后端输出的 `column`，使现有前端宽度计算自然得到更紧凑的结果。

## Goals / Non-Goals

**Goals:**

- 在保持 pinned mainline 稳定的前提下，让布局使用最少必要 graph 列。
- 允许已经不再承载节点或跨行连线的列被后续 revision 复用。
- 将 layout cost 从单一加权数字改为确定性的优先级比较，避免权重偶然抵消“最少列”目标。
- 覆盖 linear、fork、merge、短分支复用、mainline pin 和交叉优化的回归测试。

**Non-Goals:**

- 不修改 revision 数据结构或 API 响应字段。
- 不改变 `trackWidth`、`rowHeight`、`maxGraphWidth` 等 UI 配置。
- 不重写前端 SVG 路由和高亮逻辑。
- 不保证所有复杂 DAG 都达到理论最优图布局，只要求当前候选范围内选择最少列并保持确定性。

## Decisions

1. **用可复用 lane allocator 替代全局列占用**

   当前 `assignColumns` 中的 `globallyOccupied` 会让列一旦使用就永久占用。实现时应改为基于 row interval 的 lane allocator：每条需要占用 lane 的节点链或跨行连线记录起止行，分配新节点或 child 链时选择不与当前 interval 冲突的最小列。这样互不重叠的短分支可以复用同一列。

   备选方案是布局完成后做一次简单列号压缩，但单纯压缩无法判断跨行连线是否会穿过其他节点，容易产生重叠，因此不作为主方案。

2. **使用字典序 layout cost 表达优化优先级**

   `layoutCost` 应返回可比较的结构，例如 `{ pinPenalty, mainlineContinuityPenalty, columnCount, crossings, horizontalDistance, orderDeviation }`，并按该顺序比较。主线固定和连续性仍优先于压缩列数；在这些约束满足后，`columnCount` 优先于交叉数量；列数相同时再沿用现有交叉、横向跨度和稳定顺序目标。

   备选方案是继续提高加权常量，例如让 `columnCount` 乘以更大的系数。该方式对未来成本项不够稳健，且难以从测试失败中看出实际优先级。

3. **保留现有 child order 候选范围**

   该变更不扩大 `candidateOrders` 的组合搜索范围，避免在多分叉场景下引入指数级成本。最少列原则只在现有候选和新的 lane allocator 结果之间进行确定性比较。超过当前候选范围的全局最优可作为后续优化。

4. **让前端宽度继续由 `maxCol` 派生**

   前端无需新增配置；当后端输出的 column 更紧凑时，`RevisionTable` 的 `graphWidth = (maxCol + 1) * trackWidth` 会自动变窄。只需补充 UI 测试确认列号压缩后图形宽度不再保留空列。

## Risks / Trade-offs

- [Risk] 过度压缩列可能让跨行连线更贴近节点，降低可读性 → Mitigation: lane allocator 必须把跨行 parent-child 边作为 interval 占用，且列数相同时继续优先减少交叉和跨度。
- [Risk] 修改布局优先级会改变部分已有测试的固定列号期望 → Mitigation: 保留主线稳定相关断言，更新只依赖旧全局占用副作用的断言，并新增更明确的最少列测试。
- [Risk] DAG 较复杂时计算候选成本可能增加 → Mitigation: 不扩大 child order 搜索范围，并在成本计算中缓存 edge、row 和 interval metadata。
- [Risk] 用户刷新后看到 branch 横向位置变化 → Mitigation: 所有 tie-breaker 必须保持确定性，相同输入必须产生相同列布局。
