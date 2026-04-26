## Context

当前 revision graph 的列分配主要在 `packages/server/src/services/jjParsers.ts` 中完成，已经包含 working copy/main/master/trunk 相关打分、交叉代价和横向跨度代价。前端 `packages/web/src/components/commits/RevisionTable.tsx` 使用 commit 的 `row`/`column` 绘制 SVG 节点和 parent 连线，并已有贝塞尔曲线展开参数。

复杂结构下的问题集中在两类：布局层需要更稳定地保持主线位置；渲染层需要让普通边、跨列边和 merge 边更容易区分，并在用户查看某个 revision 时突出相关关系。

## Goals / Non-Goals

**Goals:**

- 保持 working copy 祖先链优先，其次保持 main/master/trunk/default 等主线在稳定主列。
- 在减少交叉的同时保留稳定排序，避免等价布局在数据刷新后抖动。
- 为普通 parent-child 边、跨列边和 merge 边提供清晰且可测试的 SVG 路由策略。
- 增加 hover/selected revision 的相关路径高亮，并弱化非相关图形元素。

**Non-Goals:**

- 不引入新的图布局库。
- 不改造 revision 数据模型的外部 API 语义。
- 不实现折叠、minimap、局部展开或 Canvas/WebGL 渲染。
- 不改变 revision table 的两栏布局和虚拟滚动策略。

## Decisions

### 1. 继续在 server 侧计算稳定列

列分配保留在 `jjParsers.ts`，因为当前 API 已经把 `row`/`column` 作为前端渲染输入，且测试覆盖主要在 parser 层。布局算法应显式构造 pinned lane：working copy 祖先链优先，其次 main/master/trunk/default/@ 祖先链。多条候选主线冲突时，使用 working copy > main/master/trunk/default/@ > 其他 bookmark > 时间顺序的优先级。

替代方案是把布局移到前端，但这会让 API 返回的数据和 UI 状态耦合，并需要重复 parser 层已有测试夹具。

### 2. 使用确定性代价函数处理等价布局

在现有 crossing cost 和 horizontal distance 基础上增加稳定 tie-breaker：pinned lane 偏离惩罚、主线连续性惩罚、候选 child 原始顺序偏离惩罚。即使多个布局交叉数相同，也必须选择确定性结果。

替代方案是只靠 bookmark 分数排序。该方式简单，但复杂 merge/fork 结构中仍可能因为横向跨度或输入顺序微小变化导致列位置跳动。

### 3. 前端将边路由抽成可测试函数

`calculateCommitLinePath` 应扩展为面向边类型的路由函数，输入包含 child/parent 坐标、parent index、总 parent 数、是否跨列、是否 merge parent 等信息。路由规则按结构优先级执行：同列边始终使用直线；相邻列边使用贝塞尔曲线，即使跨越多行也避免与同列直线重合；跨超过 1 列且跨越多行的边使用 bus/lane 路由，先沿 child lane 纵向延伸，再在 parent 附近横向接入。多 parent 的跨列边使用有限 lane offset，避免完全覆盖。

替代方案是仅调整 CSS 样式。样式可以改善对比度，但不能解决多条边共用相同几何路径的问题。

### 4. 高亮状态由 RevisionTable 管理

前端在 hover 和 selected commit 上派生 related commit/edge 集合。hover 只临时高亮直接 parents/children；selected commit 可保持完整的一跳关系高亮。非相关元素降低 opacity，但保持可见，避免上下文突然消失。

替代方案是把高亮状态写入全局 store。当前交互只影响一个表格组件，局部 state 更简单，也减少全局状态同步风险。

## Risks / Trade-offs

- 复杂布局代价函数增加 parser 计算成本 -> 仅对 fork children 候选排序做 bounded search，继续限制全排列规模。
- 主线强固定可能增加少量跨列连线 -> 使用交叉代价和横向跨度作为次级目标，避免为固定列牺牲过多整体可读性。
- merge 边偏移可能在窄 `trackWidth` 下拥挤 -> 偏移量仅用于跨列边，基于 `trackWidth` 设置上限，并加入路径快照/单元测试。
- bus 路由可能与相邻列同列线重合 -> 仅对跨超过 1 列且跨越多行的边使用 bus，相邻列继续使用曲线。
- hover 高亮可能与选中状态冲突 -> 明确 hover 优先用于临时预览，selected 用于持久强调；两者都存在时显示 hover 关系。
