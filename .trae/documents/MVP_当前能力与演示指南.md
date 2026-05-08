## 1. 当前系统能做什么（MVP）

### 1.1 账号与会话（原型）

- 支持用户名+密码的登录/注册
- 默认演示账号：`demo / password123`
- 会话与 demo 数据默认存于本地（localStorage）

### 1.2 Workspace（隔离单元）

- Workspace 列表：搜索、创建、编辑、归档
- 支持切换当前 Workspace
- Dashboard 展示每个 Workspace 的指标（agents/workflows/pending reviews/runs）

### 1.3 Agent（模板 + 实例）

- Agent Control Center：系统模板（system）/自定义模板（custom）/Workspace 实例（instances）分区展示
- 支持创建自定义模板、创建实例、启用/停用实例
- 实例详情页可管理 Skill 绑定（绑定关系会影响 Skill 使用统计与详情关联）

### 1.4 Skill（能力来源：三层作用域）

- Skill Library：清晰区分 Global / Workspace / Agent 三层 scope
- 支持创建/编辑/归档（软删除）
- Skill 详情页展示来源、内容以及“被哪些 Agent 使用”

### 1.5 Workflow（编排与联动）

- Workflow Builder：线性 Builder 支持 Start/Agent/Review/End（预留 Condition）
- Agent 节点只能选择当前 Workspace 下的实例
- Review 节点是显式节点，支持配置 onReject 行为（pause / back_to）

### 1.6 Review（人工门控：可执行、可追踪）

- Review Center：待审核/已审核列表、状态筛选、按 workflow 筛选
- Review Detail：展示证据（上一 Agent 输出/产物）、历史记录；支持 Approve/Reject/Comment
- 审核动作会驱动 WorkflowRun 状态变化，并在 Execution / Run Detail / Dashboard 同步体现

### 1.7 Execution（执行记录中心）

- Execution Center：全局 runs 汇总（跨 workspace），支持 workspace 筛选与刷新
- 展示当前节点与“待审核”直达入口
- Run Detail：展示节点运行状态、产物计数，并在 waiting_review 时直达 Review

### 1.8 Command Center（执行入口层）

- 用户输入自然语言任务
- Orchestrator（mock）解析意图：选择 Workspace，判断走 Direct Agent Run 或 Workflow Run
- 优先采用 Plan → Confirm：先生成执行建议与计划，用户确认后才创建 Run
- 确认后：
  - 运行记录进入 Execution Center
  - 若流程包含 Review 节点或推进到 Review，会生成待审核项进入 Review Center

## 2. 如何演示（建议脚本）

1) 登录：`demo / password123`
2) 打开 `Settings` → “重置演示数据”（确保数据一致）
3) 回到 `Dashboard`：讲清五个核心对象（Workspace/Agent/Skill/Workflow/Review）
4) 进入 `Command Center`：输入任务 → 生成建议（Plan）→ 确认执行（Confirm）
5) 跳转到 `Execution Center`：找到刚创建的 Run（若提示“待审核”可直达 Review）
6) 在 `Review Detail` Approve/Reject
7) 回到 `Execution Center` 点击“刷新”，展示 run 状态与当前节点变化；回到 Dashboard 看指标变化

## 3. 当前仍然是 mock 的部分

- 数据层：默认走本地 mock DB（localStorage），用于演示闭环
- 执行引擎：没有真实 AI 执行/工具调用，节点输出与状态推进为 mock
- 权限系统：RBAC/成员/Secrets 等以预留为主
