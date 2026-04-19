## 1. 删除 Canvas 组件文件

- [x] 1.1 删除 `packages/web/src/components/commits/CommitGraph.tsx`
- [x] 1.2 删除 `packages/web/src/components/commits/layout.ts`
- [x] 1.3 删除 `packages/web/src/components/commits/layout.test.ts`

## 2. 更新导出和引用

- [x] 2.1 更新 `packages/web/src/components/commits/index.ts`，移除 CommitGraph 和 layout 相关导出

## 3. 更新文档和测试

- [x] 3.1 更新 `README.md`，移除 "canvas-based" 相关描述
- [x] 3.2 更新 `e2e/app.spec.ts`，将 canvas 选择器替换为表格视图选择器

## 4. 归档规格文件

- [x] 4.1 创建归档目录 `openspec/specs/archive/commit-graph/`
- [x] 4.2 移动 `openspec/specs/commit-graph/spec.md` 到归档目录

## 5. 验证

- [x] 5.1 运行 TypeScript 编译检查，确保无引用错误
- [x] 5.2 运行单元测试，确保测试通过
- [x] 5.3 运行 E2E 测试，确保测试通过
