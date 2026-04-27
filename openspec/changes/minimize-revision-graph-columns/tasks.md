## 1. 布局成本与列占用建模

- [ ] 1.1 在 `packages/server/src/services/jjParsers.ts` 中梳理现有 `assignColumns`、`layoutCost`、`candidateOrders` 的输入输出边界
- [ ] 1.2 将 layout cost 从单一 number 调整为可字典序比较的结构，比较顺序为主线约束、最少列数、交叉数量、横向跨度、稳定顺序偏离
- [ ] 1.3 为节点链和 parent-child 跨行连线计算 row interval，占用 interval 内不可复用的 graph lane

## 2. 最少列分配实现

- [ ] 2.1 用可复用 lane allocator 替换 `globallyOccupied`，为每个候选布局选择不冲突的最小可用列
- [ ] 2.2 保持 working copy / 主 bookmark 祖先链固定在列 0，并确保固定主线 child 继承父列
- [ ] 2.3 在分叉 child 顺序候选比较中优先选择最少列布局，相同列数下再沿用交叉和跨度优化
- [ ] 2.4 布局完成后校验并规范化已使用列号，确保输出列从 0 开始连续且没有中间空列

## 3. 回归测试

- [ ] 3.1 为非重叠短分支复用同一列添加 `jjParsers.test.ts` 用例
- [ ] 3.2 为 merge 后释放 side branch 列添加 `jjParsers.test.ts` 用例
- [ ] 3.3 更新或补充 mainline pin 测试，确认最少列优化不会移动 working copy / 主 bookmark 祖先链
- [ ] 3.4 更新交叉优化测试，确认相同最少列数内仍优先选择较少连线交叉的 child 顺序
- [ ] 3.5 为 `RevisionTable` 增加 graph width 回归测试，确认 `maxCol` 压缩后不会保留空 graph 列

## 4. 验证

- [ ] 4.1 运行 server parser 相关测试并修复失败
- [ ] 4.2 运行 web revision table 相关测试并修复失败
- [ ] 4.3 手动检查一个包含分叉、merge、短分支和 working copy 的 revision log，确认图形结构更紧凑且主线稳定
