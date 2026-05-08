# UuuGent

PM AI Agent · Multi-Agent Workflow Console

UuuGent 是一个面向团队与项目协作场景的多 AI Agent 协作工作台（Web MVP）。产品核心不是聊天窗口，而是围绕 Workspace 隔离、Agent 能力挂载（Skills）、Workflow 编排与 Review 人工门控形成可追踪闭环。

## 当前 MVP 能做什么（可演示）

- 登录/注册（原型模式）：本地 mock 账号/会话（默认演示账号 `demo / password123`）
- Workspace：列表/创建/编辑/归档/切换；Dashboard 展示 workspace 指标概览
- Agent Control Center：系统模板/自定义模板/Workspace 实例的统一入口；创建模板与实例；启用/停用；实例详情可管理 Skill 绑定
- Skill Library：Global / Workspace / Agent 三层作用域；创建/编辑/归档（软删）；查看 Skill 被哪些 Agent 使用
- Workflow Builder：按 workspace 管理 Workflow；线性 Builder 配置 Start/Agent/Review/End（预留 Condition）；绑定 workspace 内实例
- Command Center：自然语言任务入口；Orchestrator（mock）生成 Plan → Confirm；确认后创建 Run 并联动 Execution/Review
- Review Center：统一管理待审核/已审核；Approve/Reject/Comment 会驱动 WorkflowRun 状态变化
- Execution Center：全局运行记录总览（跨 workspace）；支持筛选；展示当前节点与“待审核”直达入口

数据源说明：当前版本默认使用本地 mock 数据（localStorage），用于演示主链路与后续接真实后端的结构。

## 运行项目

```bash
npm install
npm run dev
```

- 前端：`http://localhost:5173/`
- 后端：`http://localhost:3001/`（当前 mock 模式不依赖后端，主要为后续真实 API 预留）

## 演示建议路径

1) 登录：`demo / password123`
2) 进入 `Settings` → 点击“重置演示数据”（确保 demo 场景一致）
3) Dashboard 查看总览与快捷入口
4) 打开 `Command Center`：输入任务 → 生成建议 → 确认执行
5) 打开 `Execution Center`：找到刚创建的 Run（若有“待审核”可直达 Review）
6) 在 `Review Detail` Approve/Reject → 回到 Execution Center 点击“刷新”观察状态同步

## 文档

- 产品/架构/页面设计：`.trae/documents/`
