基调：专业、现代、结构化的 SaaS 管理台风格；视觉参考 iOS（圆角卡片、细边框、柔和阴影、清晰层级）。

## 1. Global UI 规范

### 1.1 页面骨架

- 顶部栏：品牌（UuuGent）/ 当前 Workspace / 语言切换 / 用户菜单
- 左侧导航：Dashboard / Workspaces / Agents / Skills / Workflows / Execution / Reviews / Settings
- 主内容区：统一 PageHeader（title + subtitle + actions），下面承载 cards/tables

### 1.2 状态表达

- 统一用 StatusBadge 表达状态（tone: neutral/success/warning/danger/info）
- Run 状态：queued / running / waiting_review / succeeded / failed / paused / canceled
- Review 状态：pending / approved / rejected
- Agent 状态：active / inactive / draft / archived

### 1.3 空状态

空状态必须回答三件事：

1) 现在没有什么数据
2) 为什么重要（或下一步应该做什么）
3) CTA：创建/去某页/初始化 demo

空状态组件统一使用 EmptyState（标题 + 描述 + actions）。

## 2. 页面设计（MVP）

### 2.1 Login / Register

- 居中单列卡片：用户名/密码；注册支持二次密码校验
- 右侧/下方提供“产品能力提示”与 demo 账号提示

### 2.2 Dashboard（系统总览入口）

目标：一眼解释 UuuGent 在管理什么。

- 指标卡：Workspace 数量 / Active Agents / Workflow 数量 / Pending Reviews
- 快捷入口：创建 Workspace / 创建 Agent / 创建 Workflow / 查看待审核 / 打开 Skill Library
- Workspace 概览表：name / agents / workflows / updated
- Pending Reviews：列表（标题/摘要/状态）+ 打开 Review Center
- Agent 状态分布：active/inactive/draft/archived
- Skill 使用概览：总量/各 scope 数量/Top 使用技能
- Recent Runs：workflow 名称 / status / time

### 2.3 Command Center（执行入口层）

目标：像“任务发起控制台”，不是搜索框。

- 核心输入框：自然语言任务
- 示例/推荐输入：帮助用户理解能说什么
- Orchestrator 提案区：
  - 路由到哪个 Workspace（可 Auto，也可 pinned 到当前 workspace）
  - 建议走 Workflow Run 或 Direct Agent Run
  - 生成 Plan（步骤列表）
- CTA：确认并执行（确认后才创建 Run）
- 执行状态：
  - 创建 Run 后展示链接：Run Detail / Execution Center
  - 若生成 pending review，展示直达 Review

### 2.3 Workspaces

- Workspace List：搜索、创建、编辑、归档
- Workspace Detail：基础信息 + 关联 Agent/Workflow/Skills/Reviews/Runs 的概览与入口

### 2.4 Agent Control Center

三块认知必须明确：

- System Agent Templates（只读/推荐）
- Custom Agent Templates（可创建/编辑）
- Workspace Agent Instances（可启用/停用、可绑定技能）

实例详情页：

- 基础信息（name/summary/status/workspace）
- Skill Bindings：以 modal 维护绑定关系（勾选）
- 关联 Workflow：只读展示（后续扩展）

### 2.5 Skill Library

必须体现三层作用域与“能力定义 vs 能力挂载”：

- Tabs：Global / Workspace / Agent
- 列表列：name / scope / kind / owner / updated / used-by
- 详情页：内容、来源、被哪些 Agent 使用

### 2.6 Workflow Builder

Builder 需要体现“编排基因”：

- 左侧：Workflow 列表（含 last run status、创建 CTA、空状态）
- 中间：节点结构（线性）
- 右侧：选中节点配置（Agent 节点绑定实例；Review 节点配置 onReject/backTo）

### 2.7 Execution Center

目标：成为“执行记录总览中心”，不只是列表。

- Workspace 筛选 + Refresh
- 指标块：waiting_review / running / succeeded / failed
- 表格列：runId / workspace / workflow / current node / updatedAt / actions
- 对 waiting_review 的 run 显示“待审核”标记并提供直达 Review

### 2.8 Review Center

目标：待处理工作台。

- Workspace 切换 + 状态筛选 + workflow 轻量筛选
- 列表：title / workflow / status / createdAt / actions
- 详情：证据（上一 agent 输出与产物）、历史、输入区、Approve/Reject/Comment

### 2.9 Settings

- Demo tools：重置演示数据（恢复默认 mock 场景）
- 其他模块以“预留”呈现（tenant/members/rbac/secrets）
