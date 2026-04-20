## 1. 图形区域弹性宽度

- [x] 1.1 在 `useUIStore` 中将 `columnWidth` 重命名为 `trackWidth`，默认值改为 60px
- [x] 1.2 新增 `maxGraphWidth` 配置项，默认值 800px
- [x] 1.3 修改 `RevisionTable` 的 grid 布局，图形区宽度根据分支数动态计算
- [x] 1.4 调整 `CommitLines` 组件中节点圆点半径适配紧凑轨道（r 从 4 改为 5）
- [x] 1.5 验证连线在紧凑布局下的显示效果，必要时调整 strokeWidth

## 2. 列配置系统

- [x] 2.1 在 `useUIStore` 中新增 `revisionColumns` 配置项，定义列结构
- [x] 2.2 实现 `revisionColumns` 的持久化存储（添加到 partialize）
- [x] 2.3 创建 `RevisionColumnHeader` 组件，渲染列头标签

## 3. RevisionInfo 重构

- [x] 3.1 重构 `RevisionInfo` 组件，拆分为独立的列单元（ChangeIdCell、MessageCell、AuthorCell、DateCell）
- [x] 3.2 更新 `RevisionTable` 的 grid 布局，使用 `revisionColumns` 配置生成列模板
- [x] 3.3 将各列单元按配置顺序渲染到对应 grid 列位置

## 4. 表头集成

- [x] 4.1 在 `RevisionTable` 中集成 `RevisionColumnHeader`，与现有 `ColumnBookmarkHeader` 协同
- [x] 4.2 确保表头与内容行的列宽精确对齐
- [x] 4.3 实现表头在水平滚动时的同步滚动

## 5. 测试与验证

- [x] 5.1 验证虚拟滚动功能正常工作
- [x] 5.2 验证列配置持久化功能
- [x] 5.3 测试单分支、多分支、大量分支（20+）下的图形区域表现
