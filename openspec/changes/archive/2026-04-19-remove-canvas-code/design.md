## Context

当前项目使用 `RevisionTable` 组件作为主要的提交历史视图，基于表格布局渲染。原有的 Canvas 实现（`CommitGraph.tsx` + `layout.ts`）已被完全替代，形成死代码。

**当前状态**:
- `CommitGraph.tsx` - 860 行 Canvas 渲染代码，未被任何活动代码引用
- `layout.ts` - 504 行布局算法，仅被 `CommitGraph.tsx` 使用
- `layout.test.ts` - 测试文件，仅测试 `layout.ts` 的函数
- `index.ts` 导出这些组件，但无消费者导入

**约束**:
- 必须确保删除后无运行时错误
- E2E 测试需要更新以使用新的选择器
- 规格文件需要归档而非直接删除，以保留历史记录

## Goals / Non-Goals

**Goals:**
- 删除所有 Canvas 相关的死代码
- 更新所有引用点（导出、文档、测试）
- 保持代码库整洁，无残留引用

**Non-Goals:**
- 不修改 `RevisionTable` 或其他活动组件
- 不重构现有功能
- 不添加新功能

## Decisions

### Decision 1: 直接删除而非归档代码

**选择**: 直接删除文件

**理由**: 代码已完全被 `RevisionTable` 替代，无复用价值。Git 历史已保留所有代码，无需额外归档。

**替代方案**: 使用 `git mv` 移动到归档目录 - 拒绝，因为增加不必要的复杂性

### Decision 2: 规格文件处理

**选择**: 将 `openspec/specs/commit-graph/spec.md` 移动到归档目录

**理由**: 规格文件记录了功能需求，归档可保留历史上下文，便于未来参考。

**归档路径**: `openspec/specs/archive/commit-graph/spec.md`

### Decision 3: E2E 测试更新策略

**选择**: 将 canvas 选择器替换为表格视图选择器

**理由**: 测试应验证当前活动功能（表格视图），而非已删除的 Canvas 实现。

**具体变更**:
- `page.locator('canvas')` → `page.locator('[data-testid="revision-table"]')` 或类似选择器

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 遗漏某个引用点导致构建失败 | 删除后运行 TypeScript 编译和测试验证 |
| E2E 测试选择器不正确 | 检查 `RevisionTable` 组件的实际 DOM 结构 |
| 规格归档路径不存在 | 创建归档目录后再移动 |
