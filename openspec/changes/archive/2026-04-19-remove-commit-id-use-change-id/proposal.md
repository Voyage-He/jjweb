## Why

在 Jujutsu 版本控制系统中，commit ID（类似 Git 的 commit hash）对于用户来说是**不必要的 UI 信息**。Jujutsu 使用 **change ID** 作为 revision 的唯一标识符，用户只需要看到 change ID 即可。

当前 UI 中可能显示了 commit ID，这对用户造成困惑：
- commit ID 会随着 rebase 等操作而改变，没有参考价值
- change ID 才是用户需要关心和使用的信息
- 显示 commit ID 增加了视觉噪音

## What Changes

- 移除 UI 中所有显示 commit ID 的地方
- 只保留 change ID 的显示
- 后端数据解析保持不变，commit ID 仅在需要 Git 互操作时内部使用

## Capabilities

### New Capabilities
<!-- 无新增能力 -->

### Modified Capabilities
- `commit-graph`: 移除 commit ID 的 UI 显示，只展示 change ID
- `revision-table-view`: 确保不显示 commit ID

## Impact

- 前端展示 revision 信息的 UI 组件
- 详情面板中的 revision 信息显示
