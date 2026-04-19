## ADDED Requirements

### Requirement: Bookmark 栏水平滚动同步

当用户在表格内容区域进行水平滚动时，bookmark 栏 SHALL 同步水平移动，保持与对应列的对齐。

#### Scenario: 水平滚动时 bookmark 栏跟随

- **WHEN** 用户在表格内容区域水平滚动
- **THEN** bookmark 栏 SHALL 以相同的方向和距离同步移动

#### Scenario: 水平滚动停止时 bookmark 栏位置正确

- **WHEN** 用户停止水平滚动
- **THEN** bookmark 栏 SHALL 准确对齐到对应的列位置

### Requirement: Bookmark 栏垂直方向固定

bookmark 栏 SHALL 保持 vertical sticky 行为，在垂直滚动时始终可见于顶部。

#### Scenario: 垂直滚动时 bookmark 栏可见

- **WHEN** 用户在表格内容区域垂直滚动
- **THEN** bookmark 栏 SHALL 保持固定在可视区域顶部

#### Scenario: 同时滚动时行为正确

- **WHEN** 用户同时进行水平和垂直滚动
- **THEN** bookmark 栏 SHALL 保持固定在顶部且水平位置与内容同步

### Requirement: 性能要求

滚动同步 SHALL 不影响表格的滚动性能，保持流畅的用户体验。

#### Scenario: 滚动流畅度

- **WHEN** 用户快速滚动表格
- **THEN** bookmark 栏同步 SHALL 不导致明显的卡顿或延迟
