## Why

项目已从 Canvas 渲染的提交图迁移到基于表格布局（RevisionTable）的视图。Canvas 实现（`CommitGraph.tsx` 及其依赖 `layout.ts`）目前未被使用，形成死代码。删除这些代码可以减少代码库复杂度、降低维护成本，并消除潜在的混淆。

## What Changes

- **BREAKING**: 删除 `CommitGraph.tsx` 组件（Canvas 渲染实现）
- **BREAKING**: 删除 `layout.ts` 布局算法文件
- 删除 `layout.test.ts` 测试文件
- 更新 `index.ts` 导出，移除 CommitGraph 和 layout 相关导出
- 更新 README.md，移除 "canvas-based" 相关描述
- 更新 E2E 测试 `e2e/app.spec.ts`，将 canvas 选择器替换为表格视图选择器
- 归档 `openspec/specs/commit-graph/spec.md` 规格文件

## Capabilities

### New Capabilities

无

### Modified Capabilities

无（删除操作不引入新的能力变更）

## Impact

- **受影响文件**:
  - `packages/web/src/components/commits/CommitGraph.tsx` - 删除
  - `packages/web/src/components/commits/layout.ts` - 删除
  - `packages/web/src/components/commits/layout.test.ts` - 删除
  - `packages/web/src/components/commits/index.ts` - 更新导出
  - `README.md` - 更新功能描述
  - `e2e/app.spec.ts` - 更新测试选择器
  - `openspec/specs/commit-graph/spec.md` - 归档或删除

- **API 变更**: 移除 `CommitGraph` 组件和 `layout` 相关函数的公开导出

- **依赖关系**: 无外部依赖变更。当前代码库使用 `RevisionTable` 作为主要提交视图，此变更不影响任何活动功能。

- **E2E 测试**: 需要将 `canvas` 选择器更新为表格视图选择器
