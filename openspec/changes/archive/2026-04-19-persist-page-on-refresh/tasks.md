## 1. Store 改造

- [x] 1.1 为 `useRepoStore` 添加 `persist` 中间件，持久化 `repository` 字段
- [x] 1.2 使用 `partialize` 配置仅持久化 `repository`，排除 `commits`、`selectedCommit` 等

## 2. 应用初始化

- [x] 2.1 更新 `App.tsx`，确保从持久化状态恢复时正确显示仓库视图（设置 `repoOpen` 状态）
- [x] 2.2 处理仓库恢复失败的情况（仓库已被删除或移动）

## 3. 测试验证

- [ ] 3.1 手动测试：打开仓库 → 刷新页面 → 确认保持在仓库视图
- [ ] 3.2 手动测试：首次访问 → 确认显示仓库选择页面
- [ ] 3.3 手动测试：手动清除 localStorage → 确认正常显示仓库选择页面
