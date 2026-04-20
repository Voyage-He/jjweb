## Why

当前 revision 表格同时在顶部区域展示分支名、在 Message 列展示完整 message，容易占用过多横向和纵向空间。将分支名贴近对应 revision 的 message，并限制 message 为首行展示，可以提升列表信息密度和可扫读性。

## What Changes

- 取消顶部区域中的分支名显示，不再把分支名作为独立顶部信息呈现
- 在每行 Message 内容左侧显示该 revision 关联的分支名
- Message 文本仅显示第一行内容，忽略换行后的正文内容
- 保持现有列布局、虚拟滚动和行高稳定

## Capabilities

### New Capabilities

### Modified Capabilities
- `revision-table-layout`: 调整 revision 表格中分支名与 Message 内容的展示规则

## Impact

- 前端 UI 组件：revision 表格列头、revision 行、Message 单元格
- 数据处理：Message 字段展示前需要提取第一行文本
- 样式：Message 左侧新增分支名展示区域，并确保行内容不换行、不撑高
