## REMOVED Requirements

### Requirement: Canvas 提交图渲染

**Reason**: 项目已迁移到基于表格布局的 RevisionTable 视图，Canvas 实现成为死代码并被移除。

**Migration**: 使用 `RevisionTable` 组件查看提交历史。该组件提供相同的提交浏览、选择、导航功能，但基于表格布局而非 Canvas 渲染。

### Requirement: Canvas 布局算法

**Reason**: `layout.ts` 中的布局算法仅服务于已删除的 `CommitGraph` Canvas 组件，随组件一起移除。

**Migration**: `RevisionTable` 组件使用独立的布局逻辑，无需此算法。
