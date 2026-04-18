## 1. 基础架构与数据解析 (Infrastructure & Data Parsing)

- [x] 1.1 在 `packages/server/src/services/jjParsers.ts` 中更新解析逻辑，为每个提交记录计算 `(row, column)` 坐标
- [x] 1.2 在 `packages/web/src/stores` 中更新状态管理，支持存储和分发修订版本的网格位置信息
- [x] 1.3 编写单元测试验证坐标映射算法在复杂分支（Merge/Fork）下的正确性

## 2. 网格视图组件开发 (Grid View Component Development)

- [x] 2.1 创建基于 `CSS Grid` 的修订版本列表容器组件
- [x] 2.2 实现 `RevisionCell` 组件，用于展示单个修订版本的详细信息（变更 ID、作者、摘要等）
- [x] 2.3 集成 `CSS Border` 或 `Gap` 样式，实现水平（修订版本间）和垂直（分支间）的浅色分割线

## 3. 提交图连线集成 (Commit Graph Integration)

- [x] 3.1 在网格背景层引入 `SVG` 画布，用于绘制提交间的父子关系连线
- [x] 3.2 实现根据单元格坐标动态计算 `SVG` 路径的逻辑
- [x] 3.3 替换原有的 `Canvas` 渲染代码，确保新旧布局平稳过渡

## 4. 交互功能与优化 (Interactions & Optimization)

- [x] 4.1 迁移并测试现有的交互功能：节点选择、右键菜单、折叠/展开操作
- [x] 4.2 确保重定基底 (Rebase) 等写操作在网格布局下触发正确的视图刷新
- [x] 4.3 引入虚拟滚动 (Virtual Scrolling) 机制，优化大型仓库下的渲染性能
- [x] 4.4 添加“显示/隐藏分割线”的切换选项，并适配主题色切换
