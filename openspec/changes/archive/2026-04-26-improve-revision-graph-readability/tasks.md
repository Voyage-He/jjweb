## 1. 布局稳定性

- [x] 1.1 在 `packages/server/src/services/jjParsers.ts` 中抽出 pinned mainline 识别逻辑，按 working copy、main、master、trunk、default、@、其他 bookmark、时间顺序确定固定主线。
- [x] 1.2 调整列分配逻辑，使固定主线 child 继承父节点列，非主线分支分配到相邻可用列。
- [x] 1.3 扩展布局代价函数，加入主线连续性、横向跨度和原始拓扑顺序偏离的确定性 tie-breaker。
- [x] 1.4 在 `packages/server/src/services/jjParsers.test.ts` 中添加 working copy 优先、bookmark 主线固定、等价布局稳定和主线 child 继承父列测试。

## 2. 边路由

- [x] 2.1 在 `packages/web/src/components/commits/RevisionTable.tsx` 中扩展 graph edge 计算，保留 parent index、parent count、是否 merge edge 等 metadata。
- [x] 2.2 将 `calculateCommitLinePath` 扩展为支持同列直线、相邻列曲线、跨多列多行 bus 路由和多 parent lane offset 的可测试路由函数。
- [x] 2.3 为普通边、跨列边和 merge 边应用不同的 stroke/opacity 样式，并确保相关边高亮时提升可见度。
- [x] 2.4 在 `packages/web/src/components/commits/RevisionTable.test.tsx` 中添加同列直线、相邻列曲线、跨多列多行 bus 路由、多 parent 偏移和 merge 边样式测试。

## 3. 相关路径高亮

- [x] 3.1 在 `RevisionTable` 中添加局部 hover graph state，并基于 hover/selected commit 派生相关 commit/edge 集合。
- [x] 3.2 让 revision 行和 graph 节点触发 hover 高亮，hover 优先于 selected，高亮结束后恢复 selected 状态。
- [x] 3.3 对非相关节点和连线应用弱化样式，同时保持可见和可点击行交互不变。
- [x] 3.4 添加 hover 高亮直接 parents/children、selected 持久高亮和 hover 恢复 selected 的组件测试。

## 4. 验证

- [x] 4.1 运行 server parser 测试，确认布局列分配和现有交叉优化未回退。
- [x] 4.2 运行 web revision table 测试，确认路径生成、样式和交互高亮符合规格。
- [x] 4.3 手动检查复杂 fork/merge fixture 或真实仓库，确认主线稳定、跨列连线可追踪、hover/selected 高亮清晰。
