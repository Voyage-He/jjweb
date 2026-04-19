## 1. 滚动同步实现

- [x] 1.1 在 RevisionTable 组件中添加 scrollLeft 状态跟踪
- [x] 1.2 为 bookmark 栏添加 ref 引用
- [x] 1.3 修改滚动事件处理，同时监听 scrollTop 和 scrollLeft
- [x] 1.4 使用 transform translateX 同步更新 bookmark 栏位置
- [x] 1.5 使用 requestAnimationFrame 优化滚动性能

## 2. 测试验证

- [ ] 2.1 验证水平滚动时 bookmark 栏同步移动
- [ ] 2.2 验证垂直滚动时 bookmark 栏保持 sticky 行为
- [ ] 2.3 验证快速滚动时性能流畅
