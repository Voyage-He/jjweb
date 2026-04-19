## 1. 调查现有 UI 显示

- [x] 1.1 检查 `packages/web/src/components/commits/CommitGraph.tsx` 是否显示 commit ID
- [x] 1.2 检查详情面板组件是否显示 commit ID
- [x] 1.3 检查 `packages/web/src/components/commits/layout.ts` 是否有相关显示逻辑

## 2. 移除 commit ID 显示

- [x] 2.1 移除任何显示 commit ID 的 UI 代码
- [x] 2.2 确保所有 revision 显示都使用 change ID

## 3. 验证

- [x] 3.1 运行应用确认 UI 只显示 change ID
- [x] 3.2 确认功能正常（搜索、选择、导航等）
