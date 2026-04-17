## Context

Jujutsu (jj) 是一个现代化的版本控制系统，兼容 Git 仓库格式，提供更直观的 CLI 体验。目前 jj 仅有命令行界面，缺乏图形化工具，对于习惯使用 GitHub Desktop、Sourcetree 或 GitKraken 的用户存在学习曲线。

本项目是一个基于 Web 的 GUI 应用程序，通过桥接层与 jj CLI 交互，提供：
- 可视化提交图
- 变更操作界面
- 工作副本管理
- 仓库管理功能

**技术约束**：
- jj CLI 必须已安装并在 PATH 中可用
- 需要文件系统访问权限
- 支持跨平台（Windows、macOS、Linux）

**目标用户**：
- 从 GUI Git 客户端迁移的用户
- 偏好可视化版本控制的开发者
- jj 初学者（GUI 有助于发现功能）

## Goals / Non-Goals

**Goals:**
- 提供直观的提交图可视化，支持分支、书签和变更导航
- 实现核心 jj 操作的 GUI 封装：创建变更、编辑消息、放弃、移动、压缩、拆分
- 显示工作副本状态和文件差异，支持丢弃修改和冲突解决
- 支持仓库初始化、克隆、打开和切换
- 提供键盘快捷键支持（命令面板）
- 响应式设计，支持不同屏幕尺寸

**Non-Goals:**
- 不替代 jj CLI 的全部功能（高级操作仍需命令行）
- 不实现 jj 的内部逻辑（依赖 jj CLI 执行所有操作）
- 不提供远程仓库托管服务（仅作为本地客户端）
- 不支持移动端（专注于桌面体验）
- 不实现用户认证系统（依赖系统级 Git 凭据）

## Decisions

### 1. 技术栈选择

**决策**: 使用纯 Web 前端 + 后端服务（Monorepo 结构）

**前端**: React + TypeScript + Vite
**后端**: Node.js + Fastify
**UI 组件库**: shadcn/ui
**样式方案**: Tailwind CSS
**数据获取**: TanStack Query

**理由**:
- **纯 Web 前端**: 无需打包成桌面应用，可直接在浏览器访问，开发调试便捷
- **React vs Vue/Svelte**: React 生态成熟，提交图库（如 react-flow、@antv/g6）支持好，社区资源丰富
- **TypeScript**: 类型安全，减少运行时错误，提高代码可维护性
- **后端服务**: 负责文件系统访问和 jj CLI 执行，前端通过 REST/WebSocket 通信
- **shadcn/ui**: 基于 Radix UI，可定制性强，组件质量高，与 Tailwind CSS 配合好
- **Tailwind CSS**: 原子化 CSS，开发效率高，无需切换文件写样式
- **TanStack Query**: 缓存、重试、自动刷新，简化服务端状态管理
- **Monorepo**: 前后端在同一仓库，共享类型定义方便，统一版本管理

**备选方案**:
- Tauri + React：需要打包成桌面应用，部署相对复杂
- Electron + Vue：打包体积大
- Ant Design：企业级组件库，但样式定制较难

### 2. 架构模式

**决策**: 客户端-服务端架构（Frontend → Backend API → jj CLI）

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (React + Vite)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │Commit    │ │Change    │ │Working   │ │Repo     │ │
│  │Graph     │ │Operations│ │Copy      │ │Mgmt     │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
├─────────────────────────────────────────────────────┤
│              Backend API (Node.js / Fastify)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Command   │ │File      │ │WebSocket │            │
│  │Executor  │ │Watcher   │ │Events    │            │
│  └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│                     jj CLI                           │
└─────────────────────────────────────────────────────┘
```

**理由**:
- 前端专注 UI 渲染和用户交互，可通过浏览器直接访问
- 后端负责与 jj CLI 通信、文件系统监听、事件分发
- jj CLI 作为单一数据源，保证操作正确性

**后端 API 职责**:
1. 执行 jj 命令并解析输出，通过 REST 返回结果
2. 监听 `.jj` 目录变化，通过 WebSocket 推送更新
3. 提供文件系统 API（读取差异、解决冲突）
4. 管理 recently opened repositories 列表

**通信协议**:
- REST API: 同步操作（获取状态、执行命令）
- WebSocket: 实时更新（提交图变化、工作副本状态）

### 3. 提交图渲染

**决策**: 使用 @antv/g6 图可视化库

**理由**:
- 专为关系图设计，支持力导向布局、层次布局
- 内置节点/边交互（拖拽、点击、悬停）
- 高性能，支持大规模数据
- 丰富的样式定制能力

**备选方案**:
- react-flow：更适合流程图，对 DAG 提交图支持较弱
- dagre + D3：需要手动组合，开发成本高

**数据流**:
```
jj log --template json → Backend 解析 → 前端 G6 渲染
```

### 4. 状态管理

**决策**: 使用 Zustand

**理由**:
- 轻量级（~1KB），无样板代码
- TypeScript 支持好
- 适合中小型应用状态管理
- 支持持久化（localStorage）

**状态结构**:
```typescript
interface AppState {
  currentRepo: Repo | null;
  commitGraph: CommitNode[];
  workingCopy: WorkingCopyState;
  selectedCommit: string | null;
  recentRepos: string[];
}
```

### 5. jj 命令输出解析

**决策**: 使用 `jj log --template json` 获取结构化数据

**理由**:
- jj 支持 JSON 模板输出，避免解析文本
- 结构化数据减少解析错误
- 可扩展获取自定义字段

**示例命令**:
```bash
jj log -T json --no-pager
jj show -r <rev> -T json
jj status -T json
```
其中 `json` 具体参考@openspec/docs/jj_templates.md

### 6. 文件差异显示

**决策**: 使用 Monaco Editor

**理由**:
- VS Code 同款编辑器，用户体验熟悉
- 原生支持 diff 视图（side-by-side 和 inline）
- 语法高亮支持多种语言
- 高性能，大文件流畅

### 7. 命令面板

**决策**: 使用 cmdk 库

**理由**:
- 类似 VS Code / Notion 的命令面板体验
- 支持模糊搜索
- 键盘优先设计
- React 组件，集成简单

## Risks / Trade-offs

### [jj CLI 版本兼容性]
不同 jj 版本的命令参数和输出格式可能变化。
**Mitigation**: 在后端抽象命令执行接口，版本差异通过适配器模式处理。启动时检测 jj 版本并记录。

### [大仓库性能]
超大型仓库（10万+ commits）可能导致提交图渲染卡顿。
**Mitigation**:
- 虚拟滚动，只渲染可视区域节点
- 按需加载历史（滚动到底部加载更多）
- 提供"仅显示最近 N 个变更"选项

### [命令执行失败处理]
用户操作可能因冲突、权限等原因失败。
**Mitigation**:
- 所有命令执行前验证前置条件
- 执行后检查 exit code 和 stderr
- 错误信息友好展示给用户
- 提供操作回滚建议

### [文件监听开销]
监听大型仓库的 `.jj` 目录可能消耗资源。
**Mitigation**:
- 使用 debounce 减少刷新频率
- 仅在窗口活跃时监听
- 用户可手动触发刷新

### [跨平台路径处理]
Windows/macOS/Linux 路径格式不同。
**Mitigation**: 后端服务统一处理路径，前端使用标准化路径字符串。

### [后端服务部署]
用户需要启动后端服务才能使用 GUI。
**Mitigation**:
- 提供一键启动脚本（npm run dev 或 start.sh）
- 后端服务默认绑定 localhost，无需外部网络暴露
- 后续可考虑打包为单一可执行文件（使用 pkg 或类似工具）

## Open Questions

以下问题已在设计阶段做出决策：

1. **是否支持多仓库同时打开？** → **决策：初期仅支持单仓库**
   - 简化实现，后续可迭代添加标签页模式

2. **是否支持自定义 jj 配置编辑？** → **决策：暂不支持**
   - 作为后续功能，需安全考虑

3. **是否集成 Git 远程操作（push/pull/fetch）？** → **决策：暂不支持**
   - 初期专注本地操作，用户可通过命令行执行远程操作
   - 后续迭代可添加，需考虑认证流程 UX

4. **主题/外观定制？** → **决策：仅支持明暗主题切换**
   - 基础功能，满足大部分用户需求
   - 自定义颜色作为后期功能
