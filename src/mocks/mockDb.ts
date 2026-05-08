import type {
  AgentTemplate,
  AuditRecord,
  ExecutionLog,
  Id,
  Membership,
  ReviewAction,
  ReviewItem,
  Skill,
  SkillBinding,
  Task,
  Tenant,
  User,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeRun,
  WorkflowRun,
  Workspace,
  WorkspaceAgent,
} from '@/types/domain'

type MockSession = {
  token: string
  userId: Id
  createdAt: string
}

export type MockDb = {
  version: 3
  tenant: Tenant
  users: Record<Id, User & { password: string }>
  memberships: Record<Id, Membership>
  sessions: Record<string, MockSession>
  workspaces: Record<Id, Workspace>
  agentTemplates: Record<Id, AgentTemplate>
  workspaceAgents: Record<Id, WorkspaceAgent>
  skills: Record<Id, Skill>
  skillBindings: Record<Id, SkillBinding>
  workflows: Record<Id, Workflow>
  workflowNodes: Record<Id, WorkflowNode>
  workflowEdges: Record<Id, WorkflowEdge>
  tasks: Record<Id, Task>
  runs: Record<Id, WorkflowRun>
  nodeRuns: Record<Id, WorkflowNodeRun>
  reviews: Record<Id, ReviewItem>
  reviewActions: Record<Id, ReviewAction>
  executionLogs: Record<Id, ExecutionLog>
  auditRecords: Record<Id, AuditRecord>
}

const STORAGE_KEY = 'uuugent_mockdb_v3'

function nowIso() {
  return new Date().toISOString()
}

function id(prefix: string): Id {
  const uuid = crypto.randomUUID()
  return `${prefix}_${uuid}`
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function readDb(): MockDb | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return safeJsonParse<MockDb>(raw)
  } catch {
    return null
  }
}

function writeDb(db: MockDb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    void 0
  }
}

function seedDb(): MockDb {
  const tenantId = id('t')
  const userId = id('u')
  const membershipId = id('m')
  const createdAt = nowIso()

  const w1 = id('ws')

  const tenant: Tenant = { id: tenantId, name: 'UuuGent Demo Tenant', createdAt }
  const users: Record<Id, User & { password: string }> = {
    [userId]: { id: userId, username: 'demo', email: 'demo@uuugent.local', createdAt, password: 'password123' },
  }

  const memberships: Record<Id, Membership> = {
    [membershipId]: {
      id: membershipId,
      tenantId,
      userId,
      role: 'owner',
      status: 'active',
      createdAt,
    },
  }

  const workspaces: Record<Id, Workspace> = {
    [w1]: {
      id: w1,
      tenantId,
      name: 'Default',
      description: '默认 Workspace，用于快速开始。',
      createdAt,
      updatedAt: createdAt,
      archivedAt: null,
    },
  }

  const g1 = id('sk')
  const g2 = id('sk')
  const g4 = id('sk')
  const wsSk = id('sk')
  const wsSk2 = id('sk')
  const wsSk3 = id('sk')

  const g3 = id('sk')
  const aSk = id('sk')

  const skills: Record<Id, Skill> = {
    [g1]: {
      id: g1,
      tenantId,
      scope: 'global',
      owner: { type: 'tenant', tenantId },
      name: 'PRD 写作规范',
      kind: 'checklist',
      description: '结构化 PRD 输出与评审要点。',
      version: '1.0.0',
      enabled: true,
      archivedAt: null,
      source: { type: 'system', ref: null },
      content: { text: '使用 Problem → Solution → Scope → Metrics 的结构输出 PRD。' },
      createdAt,
      updatedAt: createdAt,
    },
    [g2]: {
      id: g2,
      tenantId,
      scope: 'global',
      owner: { type: 'tenant', tenantId },
      name: 'Jira 输出格式',
      kind: 'format',
      description: '将任务拆分为 Jira 可落地的 Story/Task。',
      version: '1.0.0',
      enabled: true,
      archivedAt: null,
      source: { type: 'system', ref: null },
      content: { text: '输出 Story/Task 标题、验收标准与拆分建议。' },
      createdAt,
      updatedAt: createdAt,
    },
    [g4]: {
      id: g4,
      tenantId,
      scope: 'global',
      owner: { type: 'tenant', tenantId },
      name: 'Release Notes 模板',
      kind: 'format',
      description: '把变更记录整理成对外可读的发布说明。',
      version: '0.4.0',
      enabled: true,
      archivedAt: null,
      source: { type: 'user', ref: 'seed' },
      content: { text: '输出：Highlights / Fixes / Known issues / Rollback plan。' },
      createdAt,
      updatedAt: createdAt,
    },
    [g3]: {
      id: g3,
      tenantId,
      scope: 'global',
      owner: { type: 'tenant', tenantId },
      name: '评审 Checklist',
      kind: 'checklist',
      description: '质量门禁：覆盖目标、风险、可执行性。',
      version: '0.8.0',
      enabled: true,
      archivedAt: null,
      source: { type: 'user', ref: 'seed' },
      content: { text: '检查：目标明确、边界清晰、可验证指标、风险与依赖。' },
      createdAt,
      updatedAt: createdAt,
    },
    [wsSk]: {
      id: wsSk,
      tenantId,
      scope: 'workspace',
      owner: { type: 'workspace', tenantId, workspaceId: w1 },
      name: '竞品分析模板',
      kind: 'prompt',
      description: '竞品矩阵、差异点与机会点结构。',
      version: '0.3.0',
      enabled: true,
      archivedAt: null,
      source: { type: 'github', ref: 'uuugent/skillpacks/competitive-analysis' },
      content: { text: '输出：目标用户、竞品矩阵、差异点、机会点、建议。' },
      createdAt,
      updatedAt: createdAt,
    },
    [wsSk2]: {
      id: wsSk2,
      tenantId,
      scope: 'workspace',
      owner: { type: 'workspace', tenantId, workspaceId: w1 },
      name: '交付标准',
      kind: 'checklist',
      description: 'Default Workspace 的交付标准与验收维度。',
      version: '0.2.0',
      enabled: true,
      archivedAt: null,
      source: { type: 'user', ref: 'seed' },
      content: { text: '检查：结构化输出、可复现步骤、关键结论与风险。' },
      createdAt,
      updatedAt: createdAt,
    },
    [wsSk3]: {
      id: wsSk3,
      tenantId,
      scope: 'workspace',
      owner: { type: 'workspace', tenantId, workspaceId: w1 },
      name: 'SkillPack 清单规范',
      kind: 'format',
      description: 'GitHub SkillPack 的 manifest/schema 规范。',
      version: '0.1.0',
      enabled: true,
      archivedAt: null,
      source: { type: 'github', ref: 'uuugent/skillpacks/manifest' },
      content: { text: '字段：name/version/permissions/tools/inputs/outputs/signature。' },
      createdAt,
      updatedAt: createdAt,
    },
    [aSk]: {
      id: aSk,
      tenantId,
      scope: 'agent',
      owner: { type: 'agent', tenantId, workspaceId: w1, agentId: 'pending' },
      name: 'MCP 导入规范',
      kind: 'checklist',
      description: '本地 Skill/MCP 导入时的校验与安全检查。',
      version: '0.1.0',
      enabled: true,
      archivedAt: null,
      source: { type: 'local', ref: 'mcp' },
      content: { text: '检查：权限最小化、输入输出 schema、超时与错误提示。' },
      createdAt,
      updatedAt: createdAt,
    },
  }

  const sys1 = id('agtpl')
  const sys2 = id('agtpl')
  const sys3 = id('agtpl')
  const cus1 = id('agtpl')
  const cus2 = id('agtpl')

  const agentTemplates: Record<Id, AgentTemplate> = {
    [sys1]: {
      id: sys1,
      tenantId,
      scope: 'system',
      name: 'Planning Agent',
      summary: '把目标拆成可执行计划与里程碑。',
      responsibilities: '拆解目标、识别依赖、输出里程碑与风险。',
      defaultPrompt: '你是规划智能体，输出结构化计划、依赖与风险。',
      defaultEnabled: true,
      recommendedSkillIds: [g1, g3],
      createdAt,
      updatedAt: createdAt,
    },
    [sys2]: {
      id: sys2,
      tenantId,
      scope: 'system',
      name: 'Review Agent',
      summary: '在关键节点进行质量与风险审核。',
      responsibilities: '对关键输出进行质量门禁，给出通过/驳回与修改建议。',
      defaultPrompt: '你是审核智能体，按 checklist 给出结论与修改建议。',
      defaultEnabled: true,
      recommendedSkillIds: [g3],
      createdAt,
      updatedAt: createdAt,
    },
    [sys3]: {
      id: sys3,
      tenantId,
      scope: 'system',
      name: 'Execution Agent',
      summary: '把任务落成可执行步骤与产物。',
      responsibilities: '执行具体动作、产出文件/摘要、记录关键日志。',
      defaultPrompt: '你是执行智能体，输出可交付的结果与日志。',
      defaultEnabled: true,
      recommendedSkillIds: [g2, g4],
      createdAt,
      updatedAt: createdAt,
    },
    [cus1]: {
      id: cus1,
      tenantId,
      scope: 'custom',
      name: 'Research Agent',
      summary: '做快速调研并整理可验证假设。',
      responsibilities: '收集证据、归纳结论、输出假设与下一步验证方案。',
      defaultPrompt: '你是研究智能体，输出结论、证据、未知与下一步。',
      defaultEnabled: true,
      recommendedSkillIds: [wsSk],
      createdAt,
      updatedAt: createdAt,
    },
    [cus2]: {
      id: cus2,
      tenantId,
      scope: 'custom',
      name: 'Ops Agent',
      summary: '面向工具链与运行排障的协作助手。',
      responsibilities: '排障、改动影响分析、日志归因与回滚建议。',
      defaultPrompt: '你是运维智能体，优先输出可执行的排障步骤与影响评估。',
      defaultEnabled: true,
      recommendedSkillIds: [wsSk3, g4],
      createdAt,
      updatedAt: createdAt,
    },
  }

  const ai1 = id('ag')
  const ai2 = id('ag')
  const ai3 = id('ag')
  const ai4 = id('ag')
  const ai5 = id('ag')

  const b1 = id('sb')
  const b2 = id('sb')
  const b3 = id('sb')
  const b4 = id('sb')
  const b5 = id('sb')
  const b6 = id('sb')
  const b7 = id('sb')
  const b8 = id('sb')

  const workspaceAgents: Record<Id, WorkspaceAgent> = {
    [ai1]: {
      id: ai1,
      tenantId,
      workspaceId: w1,
      templateId: sys1,
      name: 'Default Planner',
      summary: 'Default 工作区的规划实例。',
      status: 'active',
      promptOverride: null,
      skillBindingIds: [b1, b2],
      workflowIds: [],
      createdAt,
      updatedAt: createdAt,
    },
    [ai2]: {
      id: ai2,
      tenantId,
      workspaceId: w1,
      templateId: cus1,
      name: 'Studio Research',
      summary: 'Default 工作区的研究实例。',
      status: 'active',
      promptOverride: null,
      skillBindingIds: [b3, b4],
      workflowIds: [],
      createdAt,
      updatedAt: createdAt,
    },
    [ai3]: {
      id: ai3,
      tenantId,
      workspaceId: w1,
      templateId: sys2,
      name: 'Studio Reviewer',
      summary: '显式审核节点的执行实例。',
      status: 'inactive',
      promptOverride: null,
      skillBindingIds: [b5],
      workflowIds: [],
      createdAt,
      updatedAt: createdAt,
    },
    [ai4]: {
      id: ai4,
      tenantId,
      workspaceId: w1,
      templateId: null,
      name: 'Studio Draft Agent',
      summary: '用于演示 Draft 状态的实例。',
      status: 'draft',
      promptOverride: null,
      skillBindingIds: [],
      workflowIds: [],
      createdAt,
      updatedAt: createdAt,
    },
    [ai5]: {
      id: ai5,
      tenantId,
      workspaceId: w1,
      templateId: cus2,
      name: 'Infra Ops',
      summary: 'Default 工作区的运维与集成实例。',
      status: 'active',
      promptOverride: null,
      skillBindingIds: [b6, b7, b8],
      workflowIds: [],
      createdAt,
      updatedAt: createdAt,
    },
  }

  skills[aSk] = {
    ...skills[aSk],
    owner: { type: 'agent', tenantId, workspaceId: w1, agentId: ai5 },
  }

  const skillBindings: Record<Id, SkillBinding> = {
    [b1]: {
      id: b1,
      tenantId,
      workspaceId: w1,
      target: { type: 'workspaceAgent', agentId: ai1 },
      skillId: g1,
      enabled: true,
      priority: 10,
      createdAt,
      updatedAt: createdAt,
    },
    [b2]: {
      id: b2,
      tenantId,
      workspaceId: w1,
      target: { type: 'workspaceAgent', agentId: ai1 },
      skillId: g2,
      enabled: true,
      priority: 20,
      createdAt,
      updatedAt: createdAt,
    },
    [b3]: {
      id: b3,
      tenantId,
      workspaceId: w1,
      target: { type: 'workspaceAgent', agentId: ai2 },
      skillId: wsSk,
      enabled: true,
      priority: 10,
      createdAt,
      updatedAt: createdAt,
    },
    [b4]: {
      id: b4,
      tenantId,
      workspaceId: w1,
      target: { type: 'workspaceAgent', agentId: ai2 },
      skillId: g1,
      enabled: true,
      priority: 30,
      createdAt,
      updatedAt: createdAt,
    },
    [b5]: {
      id: b5,
      tenantId,
      workspaceId: w1,
      target: { type: 'workspaceAgent', agentId: ai3 },
      skillId: g3,
      enabled: true,
      priority: 10,
      createdAt,
      updatedAt: createdAt,
    },
    [b6]: {
      id: b6,
      tenantId,
      workspaceId: w1,
      target: { type: 'workspaceAgent', agentId: ai5 },
      skillId: wsSk3,
      enabled: true,
      priority: 10,
      createdAt,
      updatedAt: createdAt,
    },
    [b7]: {
      id: b7,
      tenantId,
      workspaceId: w1,
      target: { type: 'workspaceAgent', agentId: ai5 },
      skillId: g4,
      enabled: true,
      priority: 20,
      createdAt,
      updatedAt: createdAt,
    },
    [b8]: {
      id: b8,
      tenantId,
      workspaceId: w1,
      target: { type: 'workspaceAgent', agentId: ai5 },
      skillId: aSk,
      enabled: true,
      priority: 30,
      createdAt,
      updatedAt: createdAt,
    },
  }

  const wf1 = id('wf')
  const n1 = id('node')
  const n2 = id('node')
  const n3 = id('node')
  const n4 = id('node')

  const wf2 = id('wf')
  const m1 = id('node')
  const m2 = id('node')
  const m3 = id('node')
  const m4 = id('node')
  const m5 = id('node')

  const wf3 = id('wf')
  const p1 = id('node')
  const p2 = id('node')
  const p3 = id('node')
  const p4 = id('node')

  const workflows: Record<Id, Workflow> = {
    [wf1]: {
      id: wf1,
      tenantId,
      workspaceId: w1,
      name: 'PRD → Review → Jira',
      description: '以审核节点作为显式门控，确保输出可控可追踪。',
      status: 'active',
      startNodeId: n1,
      nodes: [],
      edges: [],
      createdAt,
      updatedAt: createdAt,
    },
    [wf2]: {
      id: wf2,
      tenantId,
      workspaceId: w1,
      name: 'Plan → Condition → Run',
      description: '包含条件分支的最小工作流示例。',
      status: 'active',
      startNodeId: m1,
      nodes: [],
      edges: [],
      createdAt,
      updatedAt: createdAt,
    },
    [wf3]: {
      id: wf3,
      tenantId,
      workspaceId: w1,
      name: 'SkillPack 导入门禁',
      description: '导入前校验 → 人工审核 → 产出安装清单。',
      status: 'active',
      startNodeId: p1,
      nodes: [],
      edges: [],
      createdAt,
      updatedAt: createdAt,
    },
  }

  const workflowNodes: Record<Id, WorkflowNode> = {
    [n1]: {
      id: n1,
      tenantId,
      workflowId: wf1,
      type: 'start',
      title: '开始',
      description: '输入目标与上下文',
      agentId: null,
      status: 'completed',
      config: { type: 'start', inputHint: '输入：目标、背景、约束。' },
    },
    [n2]: {
      id: n2,
      tenantId,
      workflowId: wf1,
      type: 'agent',
      title: 'Research',
      description: '调研与假设',
      agentId: ai2,
      status: 'completed',
      config: { type: 'agent', agentId: ai2, inputHint: '输入：目标与已有资料。', outputHint: '输出：结论/证据/下一步。' },
    },
    [n3]: {
      id: n3,
      tenantId,
      workflowId: wf1,
      type: 'review',
      title: '人工审核',
      description: '审核 PRD 关键结论',
      agentId: null,
      status: 'waiting_review',
      config: { type: 'review', policy: 'any_member', role: null, onReject: 'back_to', backToNodeId: n2 },
    },
    [n4]: {
      id: n4,
      tenantId,
      workflowId: wf1,
      type: 'end',
      title: '结束',
      description: '生成 Jira 草稿',
      agentId: null,
      status: 'pending',
      config: { type: 'end', resultHint: '输出 Jira 草稿。' },
    },
    [m1]: {
      id: m1,
      tenantId,
      workflowId: wf2,
      type: 'start',
      title: '开始',
      description: '输入需求',
      agentId: null,
      status: 'completed',
      config: { type: 'start', inputHint: '输入：需求描述与目标。' },
    },
    [m2]: {
      id: m2,
      tenantId,
      workflowId: wf2,
      type: 'agent',
      title: 'Plan',
      description: '输出计划与拆解',
      agentId: ai1,
      status: 'running',
      config: { type: 'agent', agentId: ai1, inputHint: '输入：需求与约束。', outputHint: '输出：计划/里程碑/风险。' },
    },
    [m3]: {
      id: m3,
      tenantId,
      workflowId: wf2,
      type: 'condition',
      title: '条件分支',
      description: '根据风险决定是否需要审核',
      agentId: null,
      status: 'pending',
      config: { type: 'condition', expression: 'risk_level == "high"', trueToNodeId: m4, falseToNodeId: m5 },
    },
    [m4]: {
      id: m4,
      tenantId,
      workflowId: wf2,
      type: 'review',
      title: '人工审核',
      description: '高风险时必须审核',
      agentId: null,
      status: 'pending',
      config: { type: 'review', policy: 'role', role: 'owner', onReject: 'pause', backToNodeId: null },
    },
    [m5]: {
      id: m5,
      tenantId,
      workflowId: wf2,
      type: 'end',
      title: '结束',
      description: '执行完成',
      agentId: null,
      status: 'pending',
      config: { type: 'end', resultHint: '输出执行结果。' },
    },
    [p1]: {
      id: p1,
      tenantId,
      workflowId: wf3,
      type: 'start',
      title: '开始',
      description: '输入仓库地址与目标',
      agentId: null,
      status: 'completed',
      config: { type: 'start', inputHint: '输入：GitHub 仓库、目标 workspace、权限范围。' },
    },
    [p2]: {
      id: p2,
      tenantId,
      workflowId: wf3,
      type: 'agent',
      title: '校验与解析',
      description: '解析 manifest，校验权限与 schema',
      agentId: ai5,
      status: 'failed',
      config: { type: 'agent', agentId: ai5, inputHint: '输入：repo 与版本。', outputHint: '输出：manifest 与风险清单。' },
    },
    [p3]: {
      id: p3,
      tenantId,
      workflowId: wf3,
      type: 'review',
      title: '人工审核',
      description: '确认权限与来源可信',
      agentId: null,
      status: 'pending',
      config: { type: 'review', policy: 'role', role: 'owner', onReject: 'pause', backToNodeId: null },
    },
    [p4]: {
      id: p4,
      tenantId,
      workflowId: wf3,
      type: 'end',
      title: '结束',
      description: '生成安装清单',
      agentId: null,
      status: 'pending',
      config: { type: 'end', resultHint: '输出安装清单与变更记录。' },
    },
  }

  const workflowEdges: Record<Id, WorkflowEdge> = {
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf1, fromNodeId: n1, toNodeId: n2, condition: null },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf1, fromNodeId: n2, toNodeId: n3, condition: null },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf1, fromNodeId: n3, toNodeId: n4, condition: 'approved' },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf1, fromNodeId: n3, toNodeId: n2, condition: 'rejected' },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf2, fromNodeId: m1, toNodeId: m2, condition: null },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf2, fromNodeId: m2, toNodeId: m3, condition: null },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf2, fromNodeId: m3, toNodeId: m4, condition: 'true' },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf2, fromNodeId: m3, toNodeId: m5, condition: 'false' },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf2, fromNodeId: m4, toNodeId: m5, condition: 'approved' },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf3, fromNodeId: p1, toNodeId: p2, condition: null },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf3, fromNodeId: p2, toNodeId: p3, condition: null },
    [id('edge')]: { id: id('edge'), tenantId, workflowId: wf3, fromNodeId: p3, toNodeId: p4, condition: 'approved' },
  }

  workspaces[w1].updatedAt = createdAt

  workflows[wf1].nodes = [workflowNodes[n1], workflowNodes[n2], workflowNodes[n3], workflowNodes[n4]]
  workflows[wf2].nodes = [workflowNodes[m1], workflowNodes[m2], workflowNodes[m3], workflowNodes[m4], workflowNodes[m5]]
  workflows[wf3].nodes = [workflowNodes[p1], workflowNodes[p2], workflowNodes[p3], workflowNodes[p4]]

  const edgeList = Object.values(workflowEdges)
  workflows[wf1].edges = edgeList.filter((e) => e.workflowId === wf1)
  workflows[wf2].edges = edgeList.filter((e) => e.workflowId === wf2)
  workflows[wf3].edges = edgeList.filter((e) => e.workflowId === wf3)

  const run1 = id('run')
  const run2 = id('run')
  const run4 = id('run')
  const run5 = id('run')
  const run6 = id('run')
  const task1 = id('task')
  const task2 = id('task')
  const task3 = id('task')
  const task4 = id('task')
  const task5 = id('task')
  const tasks: Record<Id, Task> = {
    [task1]: {
      id: task1,
      tenantId,
      workspaceId: w1,
      title: '为 UuuGent 输出 PRD 初稿',
      description: '从目标、用户、范围、指标与风险出发生成 PRD。',
      input: { goal: '输出 PRD', workspace: 'Default' },
      createdByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    },
    [task2]: {
      id: task2,
      tenantId,
      workspaceId: w1,
      title: '拆解并执行计划',
      description: '输出计划，并按风险决定是否进入审核。',
      input: { goal: '拆解计划', risk_level: 'low' },
      createdByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    },
    [task3]: {
      id: task3,
      tenantId,
      workspaceId: w1,
      title: '高风险计划需要人工审核',
      description: '演示 Reject 后进入 pause 的运行记录。',
      input: { goal: '拆解计划', risk_level: 'high' },
      createdByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    },
    [task4]: {
      id: task4,
      tenantId,
      workspaceId: w1,
      title: '导入 GitHub SkillPack',
      description: '解析 manifest 并产出安装清单。',
      input: { repo: 'uuugent/skillpacks/manifest', version: '0.1.0' },
      createdByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    },
    [task5]: {
      id: task5,
      tenantId,
      workspaceId: w1,
      title: '准备一次新的 PRD 审核',
      description: '演示 queued 的运行记录。',
      input: { goal: '输出 PRD', workspace: 'Default' },
      createdByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    },
  }

  const run3 = id('run')
  const runs: Record<Id, WorkflowRun> = {
    [run1]: {
      id: run1,
      tenantId,
      workspaceId: w1,
      workflowId: wf1,
      taskId: task1,
      status: 'waiting_review',
      triggeredByUserId: userId,
      triggeredBy: 'demo',
      createdAt,
      startedAt: createdAt,
      finishedAt: null,
    },
    [run2]: {
      id: run2,
      tenantId,
      workspaceId: w1,
      workflowId: wf1,
      taskId: task1,
      status: 'succeeded',
      triggeredByUserId: userId,
      triggeredBy: 'demo',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 6 + 1000 * 10).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6 + 1000 * 60).toISOString(),
    },
    [run3]: {
      id: run3,
      tenantId,
      workspaceId: w1,
      workflowId: wf2,
      taskId: task2,
      status: 'running',
      triggeredByUserId: userId,
      triggeredBy: 'demo',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 20 + 1000 * 5).toISOString(),
      finishedAt: null,
    },
    [run4]: {
      id: run4,
      tenantId,
      workspaceId: w1,
      workflowId: wf2,
      taskId: task3,
      status: 'paused',
      triggeredByUserId: userId,
      triggeredBy: 'demo',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 5).toISOString(),
      finishedAt: null,
    },
    [run5]: {
      id: run5,
      tenantId,
      workspaceId: w1,
      workflowId: wf3,
      taskId: task4,
      status: 'failed',
      triggeredByUserId: userId,
      triggeredBy: 'demo',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 12 + 1000 * 3).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    },
    [run6]: {
      id: run6,
      tenantId,
      workspaceId: w1,
      workflowId: wf1,
      taskId: task5,
      status: 'queued',
      triggeredByUserId: userId,
      triggeredBy: 'demo',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      startedAt: null,
      finishedAt: null,
    },
  }

  const nr1 = id('nrun')
  const nr2 = id('nrun')
  const nr3 = id('nrun')
  const nr4 = id('nrun')
  const nr5 = id('nrun')
  const nr6 = id('nrun')
  const nr7 = id('nrun')
  const nr8 = id('nrun')
  const nr9 = id('nrun')
  const nr10 = id('nrun')
  const nr11 = id('nrun')
  const nodeRuns: Record<Id, WorkflowNodeRun> = {
    [nr1]: {
      id: nr1,
      tenantId,
      workspaceId: w1,
      runId: run1,
      nodeId: n1,
      status: 'completed',
      startedAt: createdAt,
      finishedAt: createdAt,
      output: { text: '输入收集完成。', artifacts: [] },
    },
    [nr2]: {
      id: nr2,
      tenantId,
      workspaceId: w1,
      runId: run1,
      nodeId: n2,
      status: 'completed',
      startedAt: createdAt,
      finishedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      output: { text: '调研完成：输出假设与证据。', artifacts: [{ name: 'research.md', uri: 'mock://artifacts/research.md' }] },
    },
    [nr3]: {
      id: nr3,
      tenantId,
      workspaceId: w1,
      runId: run1,
      nodeId: n3,
      status: 'waiting_review',
      startedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      finishedAt: null,
      output: { text: '请审核 PRD 关键结论。', artifacts: [{ name: 'prd.md', uri: 'mock://artifacts/prd.md' }] },
    },
    [nr4]: {
      id: nr4,
      tenantId,
      workspaceId: w1,
      runId: run3,
      nodeId: m1,
      status: 'completed',
      startedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
      output: { text: '输入：拆解计划。', artifacts: [] },
    },
    [nr5]: {
      id: nr5,
      tenantId,
      workspaceId: w1,
      runId: run3,
      nodeId: m2,
      status: 'running',
      startedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      finishedAt: null,
      output: null,
    },
    [nr6]: {
      id: nr6,
      tenantId,
      workspaceId: w1,
      runId: run2,
      nodeId: n3,
      status: 'approved',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 6 + 1000 * 35).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6 + 1000 * 36).toISOString(),
      output: { text: '审核通过。', artifacts: [] },
    },
    [nr7]: {
      id: nr7,
      tenantId,
      workspaceId: w1,
      runId: run4,
      nodeId: m1,
      status: 'completed',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 20).toISOString(),
      output: { text: '输入：高风险拆解计划。', artifacts: [] },
    },
    [nr8]: {
      id: nr8,
      tenantId,
      workspaceId: w1,
      runId: run4,
      nodeId: m2,
      status: 'completed',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 25).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 80).toISOString(),
      output: { text: '计划输出：包含风险与依赖。', artifacts: [{ name: 'plan.md', uri: 'mock://artifacts/plan.md' }] },
    },
    [nr9]: {
      id: nr9,
      tenantId,
      workspaceId: w1,
      runId: run4,
      nodeId: m3,
      status: 'completed',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 82).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 90).toISOString(),
      output: { text: '条件命中：risk_level=high，进入人工审核。', artifacts: [] },
    },
    [nr10]: {
      id: nr10,
      tenantId,
      workspaceId: w1,
      runId: run4,
      nodeId: m4,
      status: 'rejected',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 92).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 120).toISOString(),
      output: { text: '审核未通过：需要补齐风险缓解与回滚计划。', artifacts: [] },
    },
    [nr11]: {
      id: nr11,
      tenantId,
      workspaceId: w1,
      runId: run5,
      nodeId: p2,
      status: 'failed',
      startedAt: new Date(Date.now() - 1000 * 60 * 12 + 1000 * 3).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
      output: { text: '解析失败：manifest 缺少签名字段。', artifacts: [{ name: 'manifest.json', uri: 'mock://artifacts/manifest.json' }] },
    },
  }

  const rev1 = id('rev')
  const rev2 = id('rev')
  const rev3 = id('rev')
  const reviews: Record<Id, ReviewItem> = {
    [rev1]: {
      id: rev1,
      tenantId,
      workspaceId: w1,
      runId: run1,
      nodeId: n3,
      title: 'PRD 关键结论审核',
      summary: '等待你确认：问题定义、目标用户、成功指标与风险。',
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
    },
    [rev2]: {
      id: rev2,
      tenantId,
      workspaceId: w1,
      runId: run4,
      nodeId: m4,
      title: '高风险计划审核',
      summary: '已驳回：需要补齐风险缓解与回滚方案。',
      status: 'rejected',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 92).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 120).toISOString(),
    },
    [rev3]: {
      id: rev3,
      tenantId,
      workspaceId: w1,
      runId: run2,
      nodeId: n3,
      title: 'PRD 审核（已通过）',
      summary: '结构清晰，继续推进。',
      status: 'approved',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6 + 1000 * 35).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6 + 1000 * 40).toISOString(),
    },
  }

  const ra1 = id('ract')
  const ra2 = id('ract')
  const reviewActions: Record<Id, ReviewAction> = {
    [ra1]: {
      id: ra1,
      tenantId,
      workspaceId: w1,
      runId: run2,
      nodeRunId: nr6,
      decision: 'approve',
      comment: '结构清晰，继续推进。',
      createdByUserId: userId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6 + 1000 * 40).toISOString(),
    },
    [ra2]: {
      id: ra2,
      tenantId,
      workspaceId: w1,
      runId: run4,
      nodeRunId: nr10,
      decision: 'reject',
      comment: '需要补齐风险缓解措施与回滚预案。',
      createdByUserId: userId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 120).toISOString(),
    },
  }

  const executionLogs: Record<Id, ExecutionLog> = {
    [id('log')]: {
      id: id('log'),
      tenantId,
      workspaceId: w1,
      runId: run1,
      nodeRunId: nr2,
      agentId: ai2,
      level: 'info',
      message: 'Research step completed',
      data: { output: 'research.md' },
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
    [id('log')]: {
      id: id('log'),
      tenantId,
      workspaceId: w1,
      runId: run1,
      nodeRunId: nr3,
      agentId: null,
      level: 'info',
      message: 'Waiting for human review',
      data: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
  }

  const auditRecords: Record<Id, AuditRecord> = {
    [id('audit')]: {
      id: id('audit'),
      tenantId,
      actorUserId: userId,
      action: 'workspace.rename',
      entity: { type: 'workspace', id: w1 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      metadata: { from: 'Default', to: 'Default' },
    },
  }

  return {
    version: 3,
    tenant,
    users,
    memberships,
    sessions: {},
    workspaces,
    agentTemplates,
    workspaceAgents,
    skills,
    skillBindings,
    workflows,
    workflowNodes,
    workflowEdges,
    tasks,
    runs,
    nodeRuns,
    reviews,
    reviewActions,
    executionLogs,
    auditRecords,
  }
}

export function getMockDb(): MockDb {
  const existing = readDb()
  if (existing && existing.version === 3) return existing
  const next = seedDb()
  writeDb(next)
  return next
}

export function setMockDb(updater: (db: MockDb) => MockDb): MockDb {
  const current = getMockDb()
  const next = updater(current)
  writeDb(next)
  return next
}

export function resetMockDb(): MockDb {
  const next = seedDb()
  writeDb(next)
  return next
}

export async function mockDelay(ms = 250) {
  await new Promise((r) => setTimeout(r, ms))
}
