import type { AskAnalysisResult } from '../lib/pmAssistantTypes'

export type ReviewItemStatus =
  | 'pending'
  | 'revised_pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_revision'
  | 'snoozed'

export type ReviewItemType =
  | 'comment_reply'
  | 'sprint_risk'
  | 'priority_conflict'
  | 'release_risk'
  | 'ticket_creation_draft'
  | 'epic_breakdown'
  | 'epic_creation_draft'
  | 'follow_up_task'

export type ReviewItemSource = 'jira_issue' | 'jira_comment' | 'sprint' | 'epic' | 'release'
export type ReviewItemCategory = 'comment_reply' | 'create_ticket' | 'create_epic'
export type ReviewItemOrigin = 'user_requested' | 'automation_detected'
export type ReviewItemExecutionMode = 'safe_auto' | 'draft_only' | 'needs_approval' | 'blocked'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type DraftVersionStatus = 'current' | 'previous' | 'approved'
export type RevisionConfidence = 'low' | 'medium' | 'high'
export type RevisionSource = 'mock' | 'deepseek'

export type DraftRevisionResult = {
  revisedDraft: string
  revisionSummary: string
  appliedFeedback: string
  confidence: RevisionConfidence
  guardrailNotes: string[]
  source: RevisionSource
}

export type MockAssistantOutput = {
  format: 'amigo_pm_reply_v1' | 'amigo_planning_v1'
  draftId: string
  title: string
  status: 'draft' | 'pending_review' | 'needs_revision' | 'confirmed'
  revisionComment: string
  summary?: string
  decisionRationale?: string
  nextStep?: string
  draftReply?: string
  warnings?: string[]
  preCreationChecks?: string[]
  stories?: Array<{
    issueType: string
    summary: string
    fields: {
      background?: string[]
      userStory?: string[]
      requirements?: string[]
      scope?: string[]
      acceptanceCriteria?: string[]
    }
  }>
}

export type DraftVersion = {
  id: string
  version: number
  createdAt: string
  createdBy: 'assistant' | 'user_feedback'
  feedbackApplied?: string
  appliedFeedback?: string
  revisionSummary?: string
  revisionConfidence?: RevisionConfidence
  guardrailNotes?: string[]
  revisionSource?: RevisionSource
  content: string
  structuredOutput?: MockAssistantOutput
  status: DraftVersionStatus
}

export type FeedbackEntry = {
  id: string
  createdAt: string
  text: string
  chips: string[]
  fromVersionId: string
  toVersionId: string
}

export type DecisionEntry = {
  id: string
  createdAt: string
  decision: 'approve' | 'reject' | 'needs_revision' | 'snooze'
  versionId: string
}

export type ThreadMessage = {
  id: string
  createdAt: string
  role: 'user_feedback' | 'assistant_summary' | 'assistant_draft'
  itemId: string
  versionId?: string
  content: string
}

export type ActivityEvent = {
  id: string
  createdAt: string
  type: 'worker_event' | 'user_feedback' | 'draft_revision' | 'user_decision' | 'approval' | 'user_request'
  message: string
  itemId?: string
  versionId?: string
}

export type WorkerRun = {
  id: string
  worker:
    | 'jira_sync_worker'
    | 'comment_analyzer'
    | 'sprint_risk_analyzer'
    | 'release_readiness_checker'
  startedAt: string
  durationSec: number
  status: 'ok' | 'warn' | 'error'
  itemsScanned: number
  reviewItemsCreated: number
  errors: string[]
}

export type ReviewItem = {
  id: string
  source: ReviewItemSource
  issueKey?: string
  type: ReviewItemType
  category: ReviewItemCategory
  origin: ReviewItemOrigin
  executionMode: ReviewItemExecutionMode
  dataSource: 'mock' | 'jira_readonly'
  analysisSource: 'deepseek' | 'mock'
  riskLevel: RiskLevel
  title: string
  analysisNarrative: string
  recommendedMove: string
  whyItMatters: string
  evidence: string[]
  assumptions: string[]
  suggestedNextStep: string
  status: ReviewItemStatus
  createdAt: string
  owner?: string
  suggestedOwner?: string
  dueDate?: string
  releaseDate?: string
  codeFreezeImpact: string
  confidence: 'low' | 'medium' | 'high'
  decisionNeededBy?: string
  sourceLabel: string
  sourceUrl?: string
  background?: string
  scope?: string[]
  userStory?: string
  requirements?: string[]
  acceptanceCriteria?: string[]
  preCreationChecks?: string[]
  workflowStage?: 'plan' | 'draft' | 'confirm' | 'create'
  draftVersions: DraftVersion[]
  currentDraftVersionId: string
  feedbackHistory: FeedbackEntry[]
  decisionHistory: DecisionEntry[]
  thread: ThreadMessage[]
  approvedVersionId?: string
  approvedAt?: string
}

export type ReviewState = {
  items: ReviewItem[]
  activityEvents: ActivityEvent[]
}

export type AskPmAssistantAction =
  | 'comment_reply'
  | 'create_ticket'
  | 'create_epic'

type AnalysisInput = Pick<
  ReviewItem,
  | 'id'
  | 'issueKey'
  | 'type'
  | 'category'
  | 'origin'
  | 'executionMode'
  | 'riskLevel'
  | 'title'
  | 'whyItMatters'
  | 'suggestedNextStep'
  | 'owner'
  | 'suggestedOwner'
  | 'dueDate'
  | 'releaseDate'
  | 'codeFreezeImpact'
  | 'confidence'
  | 'decisionNeededBy'
  | 'sourceLabel'
  | 'workflowStage'
> & {
  analysisNarrative?: string
}

type SeedReviewItemRaw = {
  id: string
  source: ReviewItemSource
  issueKey?: string
  type: ReviewItemType
  category: ReviewItemCategory
  origin: ReviewItemOrigin
  executionMode: ReviewItemExecutionMode
  dataSource: 'mock' | 'jira_readonly'
  analysisSource: 'deepseek' | 'mock'
  riskLevel: RiskLevel
  title: string
  analysisNarrative: string
  recommendedMove: string
  whyItMatters: string
  evidence: string[]
  assumptions: string[]
  suggestedNextStep: string
  draft: string
  status: ReviewItemStatus
  createdAt: string
  owner?: string
  suggestedOwner?: string
  dueDate?: string
  releaseDate?: string
  codeFreezeImpact: string
  confidence: 'low' | 'medium' | 'high'
  decisionNeededBy?: string
  sourceLabel: string
  sourceUrl?: string
  background?: string
  scope?: string[]
  userStory?: string
  requirements?: string[]
  acceptanceCriteria?: string[]
  preCreationChecks?: string[]
  workflowStage?: 'plan' | 'draft' | 'confirm' | 'create'
}

export const projectDefaults = {
  projectKey: 'ATT',
  executedActionsWithoutApproval: 0
}

export const workerRuns: WorkerRun[] = [
  {
    id: 'WR-901',
    worker: 'jira_sync_worker',
    startedAt: '2026-05-11 08:55',
    durationSec: 42,
    status: 'ok',
    itemsScanned: 318,
    reviewItemsCreated: 1,
    errors: []
  },
  {
    id: 'WR-902',
    worker: 'comment_analyzer',
    startedAt: '2026-05-11 09:10',
    durationSec: 58,
    status: 'warn',
    itemsScanned: 74,
    reviewItemsCreated: 2,
    errors: ['Rate limit near threshold (read-only), retry scheduled']
  },
  {
    id: 'WR-903',
    worker: 'sprint_risk_analyzer',
    startedAt: '2026-05-11 09:18',
    durationSec: 31,
    status: 'ok',
    itemsScanned: 26,
    reviewItemsCreated: 1,
    errors: []
  },
  {
    id: 'WR-904',
    worker: 'release_readiness_checker',
    startedAt: '2026-05-11 10:20',
    durationSec: 44,
    status: 'error',
    itemsScanned: 12,
    reviewItemsCreated: 1,
    errors: ['Missing release owner field in cached snapshot']
  }
]

function nowLocal() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function composeAnalysisNarrative(args: {
  mainTake: string
  why: string
  recommendedMoves: string[]
  draftDirection: string
  smallRisk: string
}) {
  return [
    '[Main Take]',
    args.mainTake,
    '',
    '[Why]',
    args.why,
    '',
    '[Recommended Move]',
    ...args.recommendedMoves.map((move, index) => `${index + 1}. ${move}`),
    '',
    '[Draft Direction]',
    args.draftDirection,
    '',
    '[Small Risk / Assumption]',
    args.smallRisk
  ].join('\n')
}

function inferCategoryFromType(type: ReviewItemType): ReviewItemCategory {
  if (type === 'comment_reply') return 'comment_reply'
  if (type === 'epic_creation_draft' || type === 'epic_breakdown') return 'create_epic'
  return 'create_ticket'
}

function defaultExecutionModeForType(type: ReviewItemType): ReviewItemExecutionMode {
  if (type === 'comment_reply') return 'draft_only'
  if (type === 'follow_up_task') return 'draft_only'
  return 'needs_approval'
}

export function buildFallbackAnalysisNarrative(item: AnalysisInput) {
  const ref = item.issueKey ?? item.id
  const owner = item.owner?.trim() || 'current owner'
  const suggestedOwner = item.suggestedOwner?.trim() || owner
  const deadline = item.decisionNeededBy?.trim() || item.dueDate?.trim() || 'today'
  const release = item.releaseDate?.trim() || 'current release window'

  if (item.type === 'comment_reply') {
    return composeAnalysisNarrative({
      mainTake: `${ref} 我看完了。这里表面上是在问要不要回一个 comment，但本质上是在确认 scope 边界是不是已经被误读。我的建议是不要把未确认的 work 一起答应进去，而是先把本次 release 说清楚，再把 follow-up owner 锁定。`,
      why: `依据很直接：当前 source 是 ${item.sourceLabel}，comment 会被外部当成 committed signal；但 owner、checkpoint 和 ${release} 的 scope 还没有完全对齐。如果回复含糊，QA、CS 和 stakeholder 会按错误范围理解。`,
      recommendedMoves: [
        `明确本次 release 只覆盖已经确认的部分，不做额外 launch commitment。`,
        `把未进入当前 scope 的内容标成 follow-up，并要求 ${suggestedOwner} 补 owner / next checkpoint。`,
        `在 ${deadline} 前同步 release note 或 comment 口径，避免外部继续按旧理解执行。`
      ],
      draftDirection: '这版 draft 应该走“澄清 scope + 不承诺未确认内容 + 要 owner / checkpoint”的方向。',
      smallRisk: `这个判断依赖当前 comment 和 release context；如果 ${item.sourceLabel} 已经在别处更新过 scope，需要按最新上下文重写。`
    })
  }

  if (item.type === 'sprint_risk') {
    return composeAnalysisNarrative({
      mainTake: `${ref} 我看完了。这里表面上看是一个 blocker update，但本质上已经是 code-freeze 前的 sprint / release risk。我的建议不是继续催进度，而是要求 owner 立刻给 fix / rollback / scope-cut plan，并把 decision deadline 锁住。`,
      why: `依据是当前风险已经碰到 code freeze 边界，而且 ${item.codeFreezeImpact}。如果现在还只收 status update，不去拿 recovery plan，团队会在 freeze 前最后一刻才发现没有 fallback。`,
      recommendedMoves: [
        `把它正式升级成 ${item.riskLevel} 风险，而不是普通执行问题。`,
        `要求 ${owner} 或 ${suggestedOwner} 在 ${deadline} 前明确给出 fix / rollback / scope-cut 路径。`,
        `提前确认如果压不过 freeze，谁来拍板 scope cut。`
      ],
      draftDirection: '这版 draft 应该走“升级风险 + 要 recovery plan + 锁 deadline”的方向。',
      smallRisk: '如果 blocker 其实已经在线下关闭但 Jira 没同步，风险等级可能偏高；但在拿到正式更新前，不建议先下调。'
    })
  }

  if (item.type === 'epic_breakdown' || item.type === 'epic_creation_draft') {
    return composeAnalysisNarrative({
      mainTake: `${ref} 我看完了。这里表面上是 epic children 排得有点乱，但本质上是 dependency 和 release sequencing 没拉直。我的建议不是立刻改 committed scope，而是先做拆解、排序，再让 owner review sequencing。`,
      why: `当前 children 跨多个 sprint，且顺序不清。问题不在 ticket 数量，而在 release story 本身被拆散了。如果现在直接改 scope，只会把排程噪音放大。`,
      recommendedMoves: [
        '先按 milestone / dependency 产出一版 breakdown recommendation。',
        `让 ${suggestedOwner} review 哪些 child 必须前置，哪些可以后移。`,
        '在 sequencing 明确后再调整 sprint placement，而不是先改 committed scope。'
      ],
      draftDirection: '这版 draft 应该走“先形成 epic draft + 顺序/依赖说明 + 要 owner review”的方向。',
      smallRisk: '如果还有未写进 ticket 的隐藏依赖，第一版 breakdown 只能当 sequencing draft，不应视为 final plan。'
    })
  }

  if (item.type === 'release_risk') {
    return composeAnalysisNarrative({
      mainTake: `${ref} 我看完了。这里表面上像是 checklist 缺一个字段，但本质上是 release readiness 的责任没有落地。我的建议是现在就补 owner 和 verification checkpoint，不要等到 release week 才回头追。`,
      why: `当前 source 是 ${item.sourceLabel}，owner 为空会让 checklist 看起来像“待补信息”，实际上是没人对 closing 负责。等到 sign-off 前再发现缺口，通常已经来不及补 verification 节奏。`,
      recommendedMoves: [
        `先指定 suggested owner（${suggestedOwner}），并要求 ${owner} 确认是否接手。`,
        `同步补一个 verification checkpoint，明确谁在什么时候验证什么。`,
        `把这条当成 launch readiness risk 跟，而不是普通 admin cleanup。`
      ],
      draftDirection: '这版 draft 应该走“补 owner + 补 checkpoint + 提前锁 readiness”的方向。',
      smallRisk: '如果 checklist 在别的系统已经有人接但主视图未同步，这条风险可能被高估；不过在 owner 明确前，不建议假设它已解决。'
    })
  }

  if (item.type === 'ticket_creation_draft') {
    return composeAnalysisNarrative({
      mainTake: `${ref} 我看完了。这里表面上像是在问要不要建 ticket，但本质上是在判断这个 follow-up 值不值得进入正式跟踪，以及 draft 是否已经到可确认状态。我的建议是按 Amigo workflow 走 plan -> draft -> confirm，V0 先停在 ${item.workflowStage === 'confirm' ? 'confirm' : 'draft'} / confirm。`,
      why: `如果背景、范围和验收条件不清楚，现在直接 create 只会多一个模糊 backlog；但如果完全不留 draft，需求又很容易在 release 后掉线。`,
      recommendedMoves: [
        '先确认这件事是否值得单独建 ticket，而不是并入现有 workstream。',
        '检查 draft 是否已经包含 background / scope / user story / requirements / acceptance criteria / pre-creation checks。',
        '只有信息足够完整时才进入 confirm，V0 仍然不做 Jira create。'
      ],
      draftDirection: '这版 draft 应该走“整理成可确认 ticket draft”的方向。',
      smallRisk: '如果已经存在重复 ticket，或 owner / acceptance criteria 还没确认，这个 draft 应该保守停在 confirm 前。'
    })
  }

  if (item.type === 'priority_conflict') {
    return composeAnalysisNarrative({
      mainTake: `${ref} 我看完了。这里表面上像是优先级讨论，但本质上是在做 capacity 和 sequencing 取舍。我的建议是先把 trade-off 说清楚，再决定哪些工作进入下个 sprint，哪些后移。`,
      why: `当前上下文说明这是 planning decision，不是简单排个序就结束。如果不先把依赖、容量和 release 影响讲清楚，后面很容易出现“口头同意、排程失真”的情况。`,
      recommendedMoves: [
        '先明确容量边界和 release-critical work。',
        '把必须保留、可以延后、需要额外 owner 确认的项分开。',
        `在 ${deadline} 前给出一版 PM recommendation，供团队确认。`
      ],
      draftDirection: '这版 draft 应该走“说明 trade-off + 给调整建议 + 明确需要确认的人”的方向。',
      smallRisk: `如果还有隐藏依赖或资源变动，这版建议可能需要在 ${deadline} 前再同步一次。`
    })
  }

  return composeAnalysisNarrative({
    mainTake: `${ref} 我看完了。这里表面上是一个 follow-up，但本质上是在判断这件事要不要继续推进，以及谁来接。我的建议是先把 owner、next checkpoint 和 scope 边界锁住。`,
    why: `当前信息说明它会影响 ${item.whyItMatters.toLowerCase()}。如果没有明确 owner 和截止点，这类事项很容易被默认“有人会处理”，最后反而掉线。`,
    recommendedMoves: [
      `让 ${suggestedOwner} 和 ${owner} 对齐责任边界。`,
      `把 decision needed by 锁在 ${deadline} 前。`,
      '把 draft 写成明确 action，而不是字段拼接。'
    ],
    draftDirection: '这版 draft 应该走“锁 owner + 锁 checkpoint + 保守推进”的方向。',
    smallRisk: `当前 confidence 是 ${item.confidence}；如果源上下文更新，需要按最新信息重算。`
  })
}

function resolveAnalysisNarrative(item: AnalysisInput) {
  if (item.analysisNarrative?.trim()) return item.analysisNarrative.trim()
  return buildFallbackAnalysisNarrative(item)
}

function summarizeRewrite(item: ReviewItem, feedbackText: string, chips: string[]) {
  const parts: string[] = []
  if (feedbackText.trim()) parts.push(`已应用反馈：${feedbackText.trim()}`)
  if (chips.length) parts.push(`已应用快捷指令：${chips.join('、')}`)
  parts.push(`已按 ${item.type} 重新生成一版可 review 的 draft`)
  parts.push(item.executionMode === 'needs_approval' ? '当前版本可继续 review，如无异议可进入 approval' : '当前版本仍为 draft only')
  return parts.join('；')
}

function buildMockAssistantOutput(args: {
  item: ReviewItem
  versionId: string
  content: string
  feedbackText: string
  chips: string[]
}): MockAssistantOutput {
  const revisionComment = summarizeRewrite(args.item, args.feedbackText, args.chips)

  if (args.item.type === 'ticket_creation_draft') {
    return {
      format: 'amigo_planning_v1',
      draftId: args.versionId,
      title: args.item.title,
      status: 'pending_review',
      revisionComment,
      warnings: [
        'Jira writes remain disabled',
        'DeepSeek is optional for draft revision only',
        'Creation remains disabled until explicit approval and later integration'
      ],
      preCreationChecks: args.item.preCreationChecks ?? [],
      stories: [
        {
          issueType: 'Story',
          summary: args.item.title,
          fields: {
            background: args.item.background ? [args.item.background] : [],
            userStory: args.item.userStory ? [args.item.userStory] : [],
            requirements: args.item.requirements ?? [],
            scope: args.item.scope ?? [],
            acceptanceCriteria: args.item.acceptanceCriteria ?? []
          }
        }
      ]
    }
  }

  return {
    format: 'amigo_pm_reply_v1',
    draftId: args.versionId,
    title: args.item.title,
    status: 'pending_review',
    revisionComment,
    summary: args.item.suggestedNextStep,
    decisionRationale: args.item.whyItMatters,
    nextStep: `Review by ${args.item.decisionNeededBy ?? args.item.dueDate ?? 'TBD'}; owner check: ${args.item.suggestedOwner ?? 'TBD'}`,
    draftReply: args.content,
    warnings: ['Jira writes remain disabled', 'DeepSeek is optional for draft revision only', 'Approval only updates local/mock state']
  }
}

function buildInitialAssistantOutput(args: { item: ReviewItem; versionId: string; content: string }): MockAssistantOutput {
  if (args.item.type === 'ticket_creation_draft') {
    return {
      format: 'amigo_planning_v1',
      draftId: args.versionId,
      title: args.item.title,
      status: 'pending_review',
      revisionComment: '初版 draft 已生成（未写入 Jira）。',
      warnings: ['Jira writes remain disabled', 'Approval only updates local/mock state'],
      preCreationChecks: args.item.preCreationChecks ?? [],
      stories: [
        {
          issueType: 'Story',
          summary: args.item.title,
          fields: {
            background: args.item.background ? [args.item.background] : [],
            userStory: args.item.userStory ? [args.item.userStory] : [],
            requirements: args.item.requirements ?? [],
            scope: args.item.scope ?? [],
            acceptanceCriteria: args.item.acceptanceCriteria ?? []
          }
        }
      ]
    }
  }

  return {
    format: 'amigo_pm_reply_v1',
    draftId: args.versionId,
    title: args.item.title,
    status: 'pending_review',
    revisionComment: '初版 draft 已生成（未写入 Jira）。',
    summary: args.item.recommendedMove || args.item.suggestedNextStep,
    decisionRationale: args.item.analysisNarrative,
    nextStep: `Review by ${args.item.decisionNeededBy ?? args.item.dueDate ?? 'TBD'}; approval updates local state only`,
    draftReply: args.content,
    warnings: ['Jira writes remain disabled', 'Approval only updates local/mock state']
  }
}

function buildSeedItem(raw: SeedReviewItemRaw): ReviewItem {
  const analysisNarrative = resolveAnalysisNarrative(raw)
  const v1Id = `${raw.id}-v1`
  const baseItem: ReviewItem = {
    id: raw.id,
    source: raw.source,
    issueKey: raw.issueKey,
    type: raw.type,
    category: raw.category,
    origin: raw.origin,
    executionMode: raw.executionMode,
    dataSource: raw.dataSource,
    analysisSource: raw.analysisSource,
    riskLevel: raw.riskLevel,
    title: raw.title,
    analysisNarrative,
    recommendedMove: raw.recommendedMove,
    whyItMatters: raw.whyItMatters,
    evidence: raw.evidence,
    assumptions: raw.assumptions,
    suggestedNextStep: raw.suggestedNextStep,
    status: raw.status,
    createdAt: raw.createdAt,
    owner: raw.owner,
    suggestedOwner: raw.suggestedOwner,
    dueDate: raw.dueDate,
    releaseDate: raw.releaseDate,
    codeFreezeImpact: raw.codeFreezeImpact,
    confidence: raw.confidence,
    decisionNeededBy: raw.decisionNeededBy,
    sourceLabel: raw.sourceLabel,
    sourceUrl: raw.sourceUrl,
    background: raw.background,
    scope: raw.scope,
    userStory: raw.userStory,
    requirements: raw.requirements,
    acceptanceCriteria: raw.acceptanceCriteria,
    preCreationChecks: raw.preCreationChecks,
    workflowStage: raw.workflowStage,
    draftVersions: [],
    currentDraftVersionId: v1Id,
    feedbackHistory: [],
    decisionHistory: [],
    thread: []
  }

  const v1: DraftVersion = {
    id: v1Id,
    version: 1,
    createdAt: raw.createdAt,
    createdBy: 'assistant',
    content: raw.draft,
    structuredOutput: buildInitialAssistantOutput({ item: baseItem, versionId: v1Id, content: raw.draft }),
    status: raw.status === 'approved' ? 'approved' : 'current'
  }

  return {
    ...baseItem,
    draftVersions: [v1],
    thread: [
      {
        id: `${raw.id}-thread-init-summary`,
        createdAt: raw.createdAt,
        role: 'assistant_summary',
        itemId: raw.id,
        versionId: v1Id,
        content: raw.suggestedNextStep
      },
      {
        id: `${raw.id}-thread-init-draft`,
        createdAt: raw.createdAt,
        role: 'assistant_draft',
        itemId: raw.id,
        versionId: v1Id,
        content: raw.draft
      }
    ]
  }
}

const seedReviewItemsRaw: SeedReviewItemRaw[] = [
  {
    id: 'RI-1001',
    source: 'jira_comment',
    issueKey: 'ATT-123',
    type: 'comment_reply',
    category: 'comment_reply',
    origin: 'automation_detected',
    executionMode: 'draft_only',
    dataSource: 'mock',
    analysisSource: 'mock',
    riskLevel: 'high',
    title: 'Launch scope question needs reply',
    analysisNarrative: composeAnalysisNarrative({
      mainTake:
        'ATT-123 我看完了。这里表面上是在问 5/18 是否包含 reporting，但本质上不是回答 yes / no，而是把 May 18 release scope 的边界说清楚。我的建议是明确 5/18 只包含 core flow，不要把 reporting 一起承诺进去。',
      why:
        '依据很直接：当前 Jira comment 在问 reporting 是否属于本次 launch，但现有 sprint scope 没有承接 reporting，release note 又可能让外部误解。如果现在回复含糊，QA、CS 和 stakeholder 会按错误范围验收。',
      recommendedMoves: [
        '明确 5/18 launch scope 是 core flow only。',
        '说明 reporting 不在本次 release，而是作为 next sprint / follow-up。',
        '要求补 reporting owner 和 next checkpoint，避免 follow-up 掉线。'
      ],
      draftDirection: '这版 draft 应该走“澄清 scope + 不承诺 reporting + 要 owner / checkpoint”的方向。',
      smallRisk: '这个判断基于当前 Jira comment 和 mock release context；如果 release note 已经更新，需要按最新同步结果重写。'
    }),
    recommendedMove: '澄清 5/18 scope 边界，不承诺 reporting，并补 owner/checkpoint。',
    whyItMatters: '這則 comment 在問 5/18 上線是否包含 reporting。若回覆模糊，會造成跨團隊誤解與錯誤驗收。',
    evidence: [
      'Comment: “Is the May 18 launch including the reporting scope, or only the core flow?”',
      'Release notes draft mentions reporting but sprint scope does not'
    ],
    assumptions: ['Sprint scope 未承接 reporting', 'Jira write disabled', 'Release note 口径可能需要同步'],
    suggestedNextStep: '回覆澄清：5/18 僅包含 core flow；reporting 進下一個 sprint，並補上 owner。',
    draft:
      'Thanks for checking — May 18 launch is core flow only. Reporting is not in scope for this release and should be tracked as a follow-up item for the next sprint. Please add the reporting owner and next checkpoint so we can keep the follow-up visible.',
    status: 'pending',
    createdAt: '2026-05-11 09:12',
    owner: 'Mia',
    suggestedOwner: 'Leo (reporting)',
    dueDate: '2026-05-11',
    releaseDate: '2026-05-18',
    codeFreezeImpact: 'Medium: wrong scope message may create last-minute release confusion.',
    confidence: 'high',
    decisionNeededBy: '2026-05-11 14:00',
    sourceLabel: 'Jira comment on ATT-123',
    sourceUrl: 'jira://ATT-123#comment'
  },
  {
    id: 'RI-1002',
    source: 'sprint',
    issueKey: 'ATT-201',
    type: 'sprint_risk',
    category: 'create_ticket',
    origin: 'automation_detected',
    executionMode: 'needs_approval',
    dataSource: 'mock',
    analysisSource: 'mock',
    riskLevel: 'critical',
    title: 'QA blocker before code freeze',
    analysisNarrative: composeAnalysisNarrative({
      mainTake:
        'ATT-201 我看完了。这里表面上是 QA blocker update，但本质上已经是 code-freeze 前的 sprint / release risk。我的建议不是继续催进度，而是直接要求 owner 给 fix / rollback / scope-cut plan。',
      why:
        '现在 blocker 已经卡到 QA critical cases，离 code freeze 很近。如果今天拿不到 recovery plan，release readiness 就是在假设风险会自己消失，这个判断不成立。',
      recommendedMoves: [
        '把它明确标成 sprint / release risk，不再按普通执行问题跟。',
        '要求 owner 今天内给出 fix / rollback / scope-cut plan，至少三选一。',
        '把 deadline 和最终拍板人锁死，避免 freeze 前最后一天才发现没有 fallback。'
      ],
      draftDirection: '这版 draft 应该走“升级风险 + 要 plan + 锁 deadline”的方向。',
      smallRisk: '如果 blocker 已经在线下解决但 Jira 没更新，风险可能偏高；但在拿到正式更新前，不建议先降级。'
    }),
    recommendedMove: '升级为 critical risk，要求 owner 给 fix/rollback/scope-cut plan 并锁 deadline。',
    whyItMatters: 'Code freeze 前仍有未解 blocker，可能導致 release readiness 失敗、臨時降 scope 或延期。',
    evidence: ['QA status: 5 critical test cases blocked', 'ATT-201 is in “In Progress” for 6 days with no update'],
    assumptions: ['Code freeze 临近', '当前状态可能滞后于线下真实进度', 'Jira write disabled'],
    suggestedNextStep: '標記為 critical risk，要求 owner 今日內給出 recovery plan。',
    draft:
      'Flagging this as a critical sprint risk: we still have blocked QA coverage before code freeze. Please share a recovery plan today with one clear path (fix, rollback, or scope cut), the owner, and the deadline for decision.',
    status: 'pending',
    createdAt: '2026-05-11 09:20',
    owner: 'Unassigned',
    suggestedOwner: 'QA lead + release DRI',
    dueDate: '2026-05-11',
    releaseDate: '2026-05-18',
    codeFreezeImpact: 'High: blocker remains open before code freeze.',
    confidence: 'high',
    decisionNeededBy: '2026-05-11 12:00',
    sourceLabel: 'Sprint 15 risk scan',
    sourceUrl: 'jira://ATT-201'
  },
  {
    id: 'RI-1003',
    source: 'epic',
    issueKey: 'ATT-88',
    type: 'epic_breakdown',
    category: 'create_epic',
    origin: 'automation_detected',
    executionMode: 'needs_approval',
    dataSource: 'mock',
    analysisSource: 'mock',
    riskLevel: 'medium',
    title: 'Epic children split across sprints with unclear ordering',
    analysisNarrative: composeAnalysisNarrative({
      mainTake:
        'ATT-88 我看完了。这里表面上像是 epic 下面的 stories 排得有点乱，但本质上是 dependency 和 release sequencing 没理顺。我的建议是先做拆解和排序，再决定哪些 child 应该换 sprint。',
      why:
        '当前 children 跨多个 sprint，顺序不清，说明问题不在 ticket hygiene，而在 release story 本身已经被拆散了。如果现在直接改 scope，只会在错误 sequencing 上继续滚雪球。',
      recommendedMoves: [
        '先按 milestone / dependency 产出一版 breakdown recommendation。',
        '让 owner review 哪些 child 必须前置，哪些可以后移。',
        '依 sequencing 再调整 sprint placement，不要先改 committed scope。'
      ],
      draftDirection: '这版 draft 应该走“拆解 / 排序 / owner review”的方向。',
      smallRisk: '如果还有未记录的隐藏 dependency，第一版 breakdown 只能当 sequencing draft，不应当 final plan。'
    }),
    recommendedMove: '先产出拆解/排序建议，再让 owner review sequencing，再决定是否改 sprint/scope。',
    whyItMatters: 'Epic 子任務散落多個 sprint 且缺少依賴順序，容易造成排程與 release 承諾不一致。',
    evidence: [
      'Epic ATT-88 has 12 children across Sprint 14/15/16',
      'Two blocked children are still planned in an earlier sprint'
    ],
    assumptions: ['存在隐藏依赖的可能', '当前仅有 mock epic snapshot', 'Jira write disabled'],
    suggestedNextStep: '先產出一版 epic breakdown 建議（排序/依賴/owner review），再做 scope 決策。',
    draft:
      'Draft recommendation: regroup the child tickets by milestone, move dependency blockers ahead of downstream stories, and ask the program PM to review the sequencing before any sprint commitment changes.',
    status: 'needs_revision',
    createdAt: '2026-05-11 10:05',
    owner: 'Nina',
    suggestedOwner: 'Program PM',
    dueDate: '2026-05-12',
    codeFreezeImpact: 'Low: planning drift across sprints if not aligned now.',
    confidence: 'medium',
    decisionNeededBy: '2026-05-12 10:00',
    sourceLabel: 'Epic ATT-88',
    sourceUrl: 'jira://ATT-88'
  },
  {
    id: 'RI-1004',
    source: 'release',
    type: 'release_risk',
    category: 'create_ticket',
    origin: 'automation_detected',
    executionMode: 'needs_approval',
    dataSource: 'mock',
    analysisSource: 'mock',
    riskLevel: 'high',
    title: 'Release readiness flagged unclear owner',
    analysisNarrative: composeAnalysisNarrative({
      mainTake:
        'Release readiness owner risk 我看完了。这里表面上像是 checklist 少填了一个 owner，但本质上是 launch readiness 的 verification responsibility 还没落地。我的建议是现在就补 owner 和 verification checkpoint。',
      why:
        '没有 owner 的 checklist 看起来像“待补字段”，实际上是没人对 closing 负责。等到 sign-off 前才发现 verification owner 缺失，通常已经来不及补节奏。',
      recommendedMoves: [
        '先指定 suggested owner，并要求当前 owner 确认是否接手。',
        '同时补一个 verification checkpoint，写清楚谁在什么时候验证什么。',
        '把它当成 launch readiness risk 跟，不要当普通 admin cleanup。'
      ],
      draftDirection: '这版 draft 应该走“补 owner + 补 checkpoint + 提前锁 readiness”的方向。',
      smallRisk: '如果 release checklist 在别的系统已经更新，这条风险可能只是同步延迟；但在 owner 明确前，不建议假设它已解决。'
    }),
    recommendedMove: '现在就补 owner 和 verification checkpoint，把它当作 launch readiness risk 跟。',
    whyItMatters: '關鍵 checklist 無 owner 會導致最後一刻堵塞，且難以追責。',
    evidence: ['Release checklist: “Support handoff” has no owner', 'Last scan shows 2 readiness items missing owners'],
    assumptions: ['Checklist 同步可能延迟', 'Owner 未明确前不假设已解决', 'Jira write disabled'],
    suggestedNextStep: '補 owner 與 verification checkpoint，作為 launch readiness risk 跟進。',
    draft:
      'We still have a release-readiness gap because the support handoff item has no confirmed owner. Please confirm the owner and the next verification checkpoint today so we can close the checklist with accountability.',
    status: 'pending',
    createdAt: '2026-05-11 10:22',
    owner: 'Release PM',
    suggestedOwner: 'Support lead',
    dueDate: '2026-05-12',
    releaseDate: '2026-05-18',
    codeFreezeImpact: 'High: unclear owner may block readiness sign-off.',
    confidence: 'medium',
    decisionNeededBy: '2026-05-11 17:00',
    sourceLabel: 'Release readiness checklist',
    sourceUrl: 'jira://release-checklist'
  },
  {
    id: 'RI-1005',
    source: 'jira_issue',
    issueKey: 'ATT-305',
    type: 'ticket_creation_draft',
    category: 'create_ticket',
    origin: 'automation_detected',
    executionMode: 'needs_approval',
    dataSource: 'mock',
    analysisSource: 'mock',
    riskLevel: 'low',
    title: 'Ticket creation draft waiting confirmation',
    analysisNarrative: composeAnalysisNarrative({
      mainTake:
        'ATT-305 我看完了。这里表面上是在问要不要建 ticket，但本质上是在判断这个 follow-up 值不值得进入正式跟踪，以及 draft 是否已经到可确认质量。我的建议是按 Amigo workflow 走 plan -> draft -> confirm，V0 先停在 draft / confirm。',
      why:
        '这件事不影响当前 release，但如果现在不整理成一个可 review 的 ticket draft，后面很容易变成口头需求消失。反过来，如果信息还没收敛就直接 create，Jira 里只会多一个模糊 ticket。',
      recommendedMoves: [
        '先确认这件事是否值得单独建 ticket，而不是并入现有 workstream。',
        '检查 draft 里是否已经包含 background、scope、user story、requirements、acceptance criteria 和 pre-creation checks。',
        '如果信息足够完整就进入 confirm；如果还缺 owner 或重复性检查，就继续停在 draft。'
      ],
      draftDirection: '这版 draft 应该走“值得追踪就整理成可确认 ticket draft”的方向。',
      smallRisk: '如果已经有类似 ticket 或 owner 尚未确认，这个 draft 需要保守处理，先不要推进到 create。'
    }),
    recommendedMove: '按 Amigo workflow 走 plan->draft->confirm；V0 停在 draft/confirm，不创建 Jira。',
    whyItMatters: '這是低風險 follow-up，但若不建立 draft，需求容易在 release 後掉線。',
    evidence: ['Meeting note mentions follow-up “add export toggle”', 'No ticket exists for export toggle'],
    suggestedNextStep: '確認是否需要建立 ticket；若需要，先完成 draft / confirm，不寫 Jira。',
    assumptions: ['可能存在重复 ticket', 'Owner 未确认前应保守推进', 'Jira write disabled'],
    draft:
      'Title: Add export toggle for reporting view\n\nBackground: Stakeholder follow-up requested an export toggle in reporting view after launch.\n\nScope: Create a draft ticket only, capture suggested owner, and include acceptance criteria.\n\nRequirements: Draft title and summary are clear; owner suggestion is included; acceptance criteria are reviewable.\n\nAcceptance criteria: Export toggle can be enabled in reporting view; default state is off; analytics event is tracked when toggle is used.\n\nPre-creation checks: No duplicate ticket exists; owner suggestion is available; not in current launch scope.',
    status: 'snoozed',
    createdAt: '2026-05-11 11:10',
    owner: 'Product ops',
    suggestedOwner: 'Reporting team PM',
    dueDate: '2026-05-13',
    releaseDate: '2026-05-25',
    codeFreezeImpact: 'None for current release; affects follow-up planning only.',
    confidence: 'medium',
    decisionNeededBy: '2026-05-13 16:00',
    sourceLabel: 'Meeting follow-up draft',
    sourceUrl: 'jira://meeting-note-export-toggle',
    background: 'A follow-up request came from stakeholder review asking for an export toggle in the reporting view.',
    scope: ['Create a Jira ticket draft only', 'Capture owner suggestion', 'Include acceptance criteria'],
    userStory: 'As a PM, I want a follow-up ticket drafted so the export toggle request is tracked after launch.',
    requirements: [
      'Draft title and summary are clear',
      'Owner suggestion is included',
      'Acceptance criteria are ready for review'
    ],
    acceptanceCriteria: [
      'Export toggle can be enabled in reporting view',
      'Default state is off',
      'Analytics event is tracked when toggle is used'
    ],
    preCreationChecks: ['No duplicate ticket exists', 'Owner suggestion is available', 'Not in current launch scope'],
    workflowStage: 'draft'
  },
  {
    id: 'RI-2001',
    source: 'jira_comment',
    issueKey: 'ATT-1537',
    type: 'comment_reply',
    category: 'comment_reply',
    origin: 'user_requested',
    executionMode: 'draft_only',
    dataSource: 'mock',
    analysisSource: 'mock',
    riskLevel: 'medium',
    title: 'Analyze ATT-1537 reply',
    analysisNarrative: composeAnalysisNarrative({
      mainTake:
        'ATT-1537 我看完了。这里表面上像是在问“我该怎么回”，但本质上是在决定你要不要在回复里提前承诺时间点。我的建议是先给方向性结论，再明确哪些点还要 owner 确认。',
      why:
        '当前上下文来自你主动发起的 Ask PM Assistant，请求里只有 ticket key，没有完整 thread。这个信息量足够先写回复方向，但不足以直接做过度承诺。',
      recommendedMoves: [
        '先回答当前能确认的结论，不替工程或 owner 提前承诺。',
        '把需要补充确认的点单独列出来。',
        '如果对方在问 release / scope，优先澄清边界再给下一步。'
      ],
      draftDirection: '这版 draft 应该走“给结论 + 留出待确认项 + 不过度承诺”的方向。',
      smallRisk: '因为目前没有完整 comment thread，这个 draft 仍然需要你结合原始 Jira 上下文再过一遍。'
    }),
    recommendedMove: '先给方向性结论，避免过度承诺；把待 owner 确认项列清楚。',
    whyItMatters: '這是你主動請 PM assistant 幫你看 ATT-1537 怎麼回，目標是先拿到可 review 的 reply draft。',
    evidence: ['User request: “帮我看 ATT-1537 我该怎么回”'],
    assumptions: ['缺少完整 comment thread', 'Jira write disabled'],
    suggestedNextStep: '先 review 一版回复草稿，再决定是否补 owner / timeline。',
    draft:
      'Draft reply: I reviewed the current context. My recommendation is to respond with the confirmed direction first, avoid committing to timing until the owner validates scope and next steps, and then tighten the wording once the owner check is back.',
    status: 'pending',
    createdAt: '2026-05-11 11:32',
    owner: 'PM',
    suggestedOwner: 'Issue owner',
    dueDate: '2026-05-11',
    codeFreezeImpact: 'Low: reply quality risk only.',
    confidence: 'medium',
    decisionNeededBy: '2026-05-11 18:00',
    sourceLabel: 'Ask PM Assistant request',
    sourceUrl: 'local://ask-pm-assistant/ri-2001'
  },
  {
    id: 'RI-2002',
    source: 'sprint',
    type: 'priority_conflict',
    category: 'create_ticket',
    origin: 'user_requested',
    executionMode: 'needs_approval',
    dataSource: 'mock',
    analysisSource: 'mock',
    riskLevel: 'medium',
    title: 'Review sprint trade-offs before May 18 release',
    analysisNarrative: composeAnalysisNarrative({
      mainTake:
        '我看完了。这里表面上是在问 sprint 要怎么排，但本质上是在做 release 前的 capacity trade-off。我的建议是先把必须保留的 release-critical work 锁住，再处理可后移项。',
      why:
        '当前请求来自你主动发起的 planning ask，说明你要的不是 ticket viewer，而是 PM recommendation。没有 trade-off 结构时，团队很容易把“都想做”误当成“都能做”。',
      recommendedMoves: [
        '先区分 release-critical、important but movable、can defer 三层。',
        '把 capacity 冲突和 owner 依赖写清楚。',
        '输出一版可 review 的 sprint adjustment recommendation。'
      ],
      draftDirection: '这版 draft 应该走“说明 trade-off + 给调整建议 + 点名需要确认的人”的方向。',
      smallRisk: '如果 capacity 或 dependency 在 planning meeting 后变了，这版建议还需要再同步一次。'
    }),
    recommendedMove: '先把 release-critical work 锁住，再处理可后移项，输出可 review 的 trade-off 建议。',
    whyItMatters: '這是主動發起的 planning request，目標是先拿到一版 PM recommendation，而不是直接改 sprint。',
    evidence: ['User request: “检查 5/18 release readiness / review sprint plan”'],
    assumptions: ['容量与依赖可能变化', 'Jira write disabled'],
    suggestedNextStep: '先 review 一版 planning recommendation，再决定是否形成 owner follow-up。',
    draft:
      'Draft planning recommendation: keep the release-critical stories in the current sprint, move the lower-confidence work that still lacks owner confirmation, and ask engineering + QA owners to confirm the capacity trade-offs before finalizing the sprint boundary.',
    status: 'pending',
    createdAt: '2026-05-11 11:40',
    owner: 'PM',
    suggestedOwner: 'Engineering manager + QA lead',
    dueDate: '2026-05-12',
    releaseDate: '2026-05-18',
    codeFreezeImpact: 'Medium: weak trade-off framing may create hidden scope pressure before release.',
    confidence: 'medium',
    decisionNeededBy: '2026-05-12 10:00',
    sourceLabel: 'Ask PM Assistant request',
    sourceUrl: 'local://ask-pm-assistant/ri-2002'
  }
]

export const seedReviewItems: ReviewItem[] = seedReviewItemsRaw.map(buildSeedItem)
const seedReviewItemById = Object.fromEntries(seedReviewItems.map((item) => [item.id, item])) as Record<string, ReviewItem>

export const LEGACY_REVIEW_STATE_KEY = 'amigo_pm_review_state_v0'
export const REVIEW_STATE_KEY = 'amigo_pm_review_state_v1'

export function counts(items: ReviewItem[]) {
  const pendingDecisions = items.filter((i) => i.status === 'pending' || i.status === 'revised_pending_review').length
  const jiraCommentsNeedingResponse = items.filter(
    (i) => i.type === 'comment_reply' && (i.status === 'pending' || i.status === 'revised_pending_review')
  ).length
  const highRisk = items.filter((i) => i.riskLevel === 'high' || i.riskLevel === 'critical').length
  const draftActionsWaitingApproval = items.filter((i) => {
    if (!(i.status === 'pending' || i.status === 'revised_pending_review')) return false
    const current = i.draftVersions.find((v) => v.id === i.currentDraftVersionId)
    return Boolean(current?.content?.trim())
  }).length
  return { pendingDecisions, jiraCommentsNeedingResponse, highRisk, draftActionsWaitingApproval }
}

export function seedReviewState(): ReviewState {
  return {
    items: seedReviewItems,
    activityEvents: [
      ...workerRuns.map((run) => ({
        id: `EV-${run.id}`,
        createdAt: run.startedAt,
        type: 'worker_event' as const,
        message: `${run.worker} scanned ${run.itemsScanned} items and created ${run.reviewItemsCreated} review items`,
        itemId: undefined,
        versionId: undefined
      })),
      {
        id: 'EV-SEED-USER-2001',
        createdAt: '2026-05-11 11:32',
        type: 'user_request' as const,
        message: 'User request created review item RI-2001 via Ask PM Assistant',
        itemId: 'RI-2001'
      },
      {
        id: 'EV-SEED-USER-2002',
        createdAt: '2026-05-11 11:40',
        type: 'user_request' as const,
        message: 'User request created review item RI-2002 via Ask PM Assistant',
        itemId: 'RI-2002'
      }
    ]
  }
}

function upgradeDraftVersions(item: any, seed?: ReviewItem): DraftVersion[] {
  const rawVersions = Array.isArray(item?.draftVersions) ? item.draftVersions : seed?.draftVersions ?? []
  return rawVersions.map((version: any, index: number) => ({
    id: typeof version?.id === 'string' ? version.id : `${item.id}-v${index + 1}`,
    version: typeof version?.version === 'number' ? version.version : index + 1,
    createdAt: typeof version?.createdAt === 'string' ? version.createdAt : item.createdAt,
    createdBy: version?.createdBy === 'user_feedback' ? 'user_feedback' : 'assistant',
    feedbackApplied: typeof version?.feedbackApplied === 'string' ? version.feedbackApplied : undefined,
    appliedFeedback: typeof version?.appliedFeedback === 'string' ? version.appliedFeedback : version?.feedbackApplied,
    revisionSummary: typeof version?.revisionSummary === 'string' ? version.revisionSummary : undefined,
    revisionConfidence:
      version?.revisionConfidence === 'low' || version?.revisionConfidence === 'high' ? version.revisionConfidence : 'medium',
    guardrailNotes: Array.isArray(version?.guardrailNotes)
      ? version.guardrailNotes.filter((note: unknown) => typeof note === 'string')
      : undefined,
    revisionSource: version?.revisionSource === 'deepseek' ? 'deepseek' : version?.revisionSource === 'mock' ? 'mock' : undefined,
    content: typeof version?.content === 'string' ? version.content : '',
    structuredOutput: version?.structuredOutput,
    status: version?.status === 'approved' ? 'approved' : version?.status === 'previous' ? 'previous' : 'current'
  }))
}

function upgradeItem(item: any): ReviewItem | null {
  if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.type !== 'string') return null

  const seed = seedReviewItemById[item.id]
  const type = item.type as ReviewItemType
  const category = (item.category ?? seed?.category ?? inferCategoryFromType(type)) as ReviewItemCategory
  const origin = (item.origin ?? seed?.origin ?? 'automation_detected') as ReviewItemOrigin
  const executionMode = (item.executionMode ?? seed?.executionMode ?? defaultExecutionModeForType(type)) as ReviewItemExecutionMode
  const draftVersions = upgradeDraftVersions(item, seed)
  const currentDraftVersionId =
    typeof item.currentDraftVersionId === 'string' && draftVersions.some((version) => version.id === item.currentDraftVersionId)
      ? item.currentDraftVersionId
      : draftVersions[0]?.id ?? `${item.id}-v1`

  const analysisNarrative = resolveAnalysisNarrative({
    id: item.id,
    issueKey: typeof item.issueKey === 'string' ? item.issueKey : seed?.issueKey,
    type,
    category,
    origin,
    executionMode,
    riskLevel: (item.riskLevel ?? seed?.riskLevel ?? 'medium') as RiskLevel,
    title: typeof item.title === 'string' ? item.title : seed?.title ?? item.id,
    whyItMatters: typeof item.whyItMatters === 'string' ? item.whyItMatters : seed?.whyItMatters ?? '',
    suggestedNextStep: typeof item.suggestedNextStep === 'string' ? item.suggestedNextStep : seed?.suggestedNextStep ?? '',
    owner: typeof item.owner === 'string' ? item.owner : seed?.owner,
    suggestedOwner: typeof item.suggestedOwner === 'string' ? item.suggestedOwner : seed?.suggestedOwner,
    dueDate: typeof item.dueDate === 'string' ? item.dueDate : seed?.dueDate,
    releaseDate: typeof item.releaseDate === 'string' ? item.releaseDate : seed?.releaseDate,
    codeFreezeImpact: typeof item.codeFreezeImpact === 'string' ? item.codeFreezeImpact : seed?.codeFreezeImpact ?? '',
    confidence: item.confidence === 'low' || item.confidence === 'high' ? item.confidence : seed?.confidence ?? 'medium',
    decisionNeededBy: typeof item.decisionNeededBy === 'string' ? item.decisionNeededBy : seed?.decisionNeededBy,
    sourceLabel: typeof item.sourceLabel === 'string' ? item.sourceLabel : seed?.sourceLabel ?? 'Review item',
    workflowStage: item.workflowStage ?? seed?.workflowStage,
    analysisNarrative: typeof item.analysisNarrative === 'string' ? item.analysisNarrative : seed?.analysisNarrative
  })

  const recommendedMove =
    typeof item.recommendedMove === 'string'
      ? item.recommendedMove
      : typeof seed?.recommendedMove === 'string'
        ? seed.recommendedMove
        : typeof item.suggestedNextStep === 'string'
          ? item.suggestedNextStep
          : seed?.suggestedNextStep ?? ''

  const assumptions = Array.isArray(item.assumptions)
    ? item.assumptions.filter((entry: unknown) => typeof entry === 'string')
    : seed?.assumptions ?? []

  const dataSource = (item.dataSource ?? seed?.dataSource ?? 'mock') as 'mock' | 'jira_readonly'
  const analysisSource = (item.analysisSource ?? seed?.analysisSource ?? 'mock') as 'deepseek' | 'mock'

  return {
    id: item.id,
    source: (item.source ?? seed?.source ?? 'jira_issue') as ReviewItemSource,
    issueKey: typeof item.issueKey === 'string' ? item.issueKey : seed?.issueKey,
    type,
    category,
    origin,
    executionMode,
    dataSource,
    analysisSource,
    riskLevel: (item.riskLevel ?? seed?.riskLevel ?? 'medium') as RiskLevel,
    title: typeof item.title === 'string' ? item.title : seed?.title ?? item.id,
    analysisNarrative,
    recommendedMove,
    whyItMatters: typeof item.whyItMatters === 'string' ? item.whyItMatters : seed?.whyItMatters ?? '',
    evidence: Array.isArray(item.evidence) ? item.evidence.filter((entry: unknown) => typeof entry === 'string') : seed?.evidence ?? [],
    assumptions,
    suggestedNextStep: typeof item.suggestedNextStep === 'string' ? item.suggestedNextStep : seed?.suggestedNextStep ?? '',
    status: (item.status ?? seed?.status ?? 'pending') as ReviewItemStatus,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : seed?.createdAt ?? nowLocal(),
    owner: typeof item.owner === 'string' ? item.owner : seed?.owner,
    suggestedOwner: typeof item.suggestedOwner === 'string' ? item.suggestedOwner : seed?.suggestedOwner,
    dueDate: typeof item.dueDate === 'string' ? item.dueDate : seed?.dueDate,
    releaseDate: typeof item.releaseDate === 'string' ? item.releaseDate : seed?.releaseDate,
    codeFreezeImpact: typeof item.codeFreezeImpact === 'string' ? item.codeFreezeImpact : seed?.codeFreezeImpact ?? '',
    confidence: item.confidence === 'low' || item.confidence === 'high' ? item.confidence : seed?.confidence ?? 'medium',
    decisionNeededBy: typeof item.decisionNeededBy === 'string' ? item.decisionNeededBy : seed?.decisionNeededBy,
    sourceLabel: typeof item.sourceLabel === 'string' ? item.sourceLabel : seed?.sourceLabel ?? 'Review item',
    sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl : seed?.sourceUrl,
    background: typeof item.background === 'string' ? item.background : seed?.background,
    scope: Array.isArray(item.scope) ? item.scope.filter((entry: unknown) => typeof entry === 'string') : seed?.scope,
    userStory: typeof item.userStory === 'string' ? item.userStory : seed?.userStory,
    requirements: Array.isArray(item.requirements)
      ? item.requirements.filter((entry: unknown) => typeof entry === 'string')
      : seed?.requirements,
    acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
      ? item.acceptanceCriteria.filter((entry: unknown) => typeof entry === 'string')
      : seed?.acceptanceCriteria,
    preCreationChecks: Array.isArray(item.preCreationChecks)
      ? item.preCreationChecks.filter((entry: unknown) => typeof entry === 'string')
      : seed?.preCreationChecks,
    workflowStage: item.workflowStage ?? seed?.workflowStage,
    draftVersions,
    currentDraftVersionId,
    feedbackHistory: Array.isArray(item.feedbackHistory) ? item.feedbackHistory : [],
    decisionHistory: Array.isArray(item.decisionHistory) ? item.decisionHistory : [],
    thread: Array.isArray(item.thread) ? item.thread : seed?.thread ?? [],
    approvedVersionId: typeof item.approvedVersionId === 'string' ? item.approvedVersionId : seed?.approvedVersionId,
    approvedAt: typeof item.approvedAt === 'string' ? item.approvedAt : seed?.approvedAt
  }
}

export function loadReviewState(): ReviewState {
  if (typeof window === 'undefined') return seedReviewState()
  try {
    const raw = window.localStorage.getItem(REVIEW_STATE_KEY) ?? window.localStorage.getItem(LEGACY_REVIEW_STATE_KEY)
    if (!raw) return seedReviewState()
    const parsed = JSON.parse(raw) as ReviewState
    if (!parsed?.items?.length) return seedReviewState()

    const upgradedItems = parsed.items.map(upgradeItem).filter(Boolean) as ReviewItem[]
    if (!upgradedItems.length) return seedReviewState()

    const existingIds = new Set(upgradedItems.map((item) => item.id))
    const mergedItems = [...upgradedItems, ...seedReviewItems.filter((seed) => !existingIds.has(seed.id))]
    const activityEvents = Array.isArray(parsed.activityEvents)
      ? parsed.activityEvents.map((event: any) => ({
          ...event,
          type: event?.type ?? ('user_feedback' as const)
        }))
      : []

    return { items: mergedItems, activityEvents: activityEvents.length ? activityEvents : seedReviewState().activityEvents }
  } catch {
    return seedReviewState()
  }
}

export function saveReviewState(state: ReviewState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state))
}

function buildRewriteInstruction(feedbackText: string, chips: string[]) {
  return [feedbackText.trim(), ...chips].filter(Boolean).join('；')
}

function includesIntent(instruction: string, candidates: string[]) {
  return candidates.some((candidate) => instruction.includes(candidate))
}

function sentenceFromFeedback(item: ReviewItem, feedbackText: string, chips: string[]) {
  const instruction = `${feedbackText} ${chips.join(' ')}`.toLowerCase()
  const wantsOwner = includesIntent(instruction, ['owner', '負責人', '负责人']) || chips.includes('Ask for owner')
  const wantsRisk = includesIntent(instruction, ['risk', '風險', '风险']) || chips.includes('Add release risk')
  const wantsShorter = chips.includes('Make it shorter') || includesIntent(instruction, ['shorter', '簡短', '简短'])
  const wantsSofter = chips.includes('Make it softer') || includesIntent(instruction, ['soft', '柔和'])
  const wantsDirect = chips.includes('Be more direct') || includesIntent(instruction, ['direct', '直接'])
  const wantsScopeCallout =
    chips.includes('Clarify out of scope') || includesIntent(instruction, ['scope', '不在本次', 'not in scope', 'out of scope'])
  const wantsJiraComment = chips.includes('Turn into Jira comment') || includesIntent(instruction, ['jira comment'])
  const noCommit =
    chips.includes('Do not commit to launch') ||
    includesIntent(instruction, ['不要承諾', '不要承诺', 'not promise', 'do not commit', 'launch']) ||
    wantsRisk

  const signoff = wantsDirect ? 'PM recommendation:' : wantsSofter ? 'Thanks for checking.' : 'Please review the following update.'

  if (item.type === 'comment_reply') {
    const lines: string[] = [wantsJiraComment ? 'Jira comment draft:' : '', signoff].filter(Boolean)
    if (noCommit) {
      lines.push(`We should not commit to ${item.releaseDate ?? 'the current release'} until the owner confirms delivery and scope.`)
    } else {
      lines.push(`${item.releaseDate ?? 'This release'} is currently planned for the confirmed core scope only.`)
    }
    if (wantsScopeCallout) lines.push('The open follow-up work remains out of scope for this release and should be tracked separately.')
    if (wantsOwner) lines.push('Please confirm the owner and next checkpoint for the follow-up item.')
    if (wantsRisk) lines.push('If ownership remains unclear before code freeze, we may need to hold scope or adjust the release message.')
    return wantsShorter ? lines.slice(0, 3).join(' ') : lines.join(' ')
  }

  if (item.type === 'sprint_risk' || item.type === 'release_risk') {
    const lines = [
      wantsJiraComment ? 'Jira comment draft:' : 'PM risk note:',
      item.type === 'sprint_risk'
        ? `This is now a ${item.riskLevel} sprint risk tied to code-freeze readiness.`
        : 'This is now a release-readiness risk because ownership or verification is still open.',
      wantsOwner ? `Please confirm the owner. Suggested owner: ${item.suggestedOwner ?? 'TBD'}.` : '',
      wantsRisk ? `Impact: ${item.codeFreezeImpact}` : '',
      wantsDirect
        ? `Share the concrete plan by ${item.decisionNeededBy ?? item.dueDate ?? 'today'}.`
        : wantsSofter
          ? `Could you share the concrete plan by ${item.decisionNeededBy ?? item.dueDate ?? 'today'} so we can keep the release aligned?`
          : `Please share the concrete plan by ${item.decisionNeededBy ?? item.dueDate ?? 'today'} so we can keep the release aligned.`
    ].filter(Boolean)
    return wantsShorter ? lines.slice(0, 4).join(' ') : lines.join(' ')
  }

  if (item.type === 'epic_breakdown') {
    const lines = [
      'Epic breakdown recommendation:',
      'Re-sequence the child work by dependency and milestone before changing committed sprint scope.',
      wantsOwner ? `Owner review needed: ${item.suggestedOwner ?? 'Program PM'}.` : '',
      wantsRisk ? `Risk note: ${item.codeFreezeImpact}` : ''
    ].filter(Boolean)
    return wantsShorter ? lines.slice(0, 3).join(' ') : lines.join(' ')
  }

  if (item.type === 'epic_creation_draft') {
    const lines = [
      'Epic draft recommendation:',
      'Define epic goal/scope first, then list the first 3 child stories and dependencies.',
      wantsOwner ? `Owner review needed: ${item.suggestedOwner ?? 'Program PM'}.` : ''
    ].filter(Boolean)
    return wantsShorter ? lines.slice(0, 3).join(' ') : lines.join(' ')
  }

  if (item.type === 'priority_conflict') {
    const lines = [
      'Planning recommendation:',
      'Keep release-critical work in scope, separate movable work, and ask owners to confirm trade-offs.',
      wantsOwner ? `Owner alignment needed: ${item.suggestedOwner ?? 'TBD'}.` : '',
      wantsRisk ? `Risk note: ${item.codeFreezeImpact}` : ''
    ].filter(Boolean)
    return wantsShorter ? lines.slice(0, 3).join(' ') : lines.join(' ')
  }

  if (item.type === 'ticket_creation_draft') {
    const sections = [
      wantsJiraComment ? 'Jira ticket draft:' : 'Ticket creation draft:',
      `Title: ${item.title}`,
      item.background ? `Background: ${item.background}` : '',
      item.userStory ? `User story: ${item.userStory}` : '',
      item.scope?.length ? `Scope: ${item.scope.join('; ')}` : '',
      item.requirements?.length ? `Requirements: ${item.requirements.join('; ')}` : '',
      item.acceptanceCriteria?.length ? `Acceptance criteria: ${item.acceptanceCriteria.join('; ')}` : '',
      wantsOwner ? `Suggested owner: ${item.suggestedOwner ?? 'TBD'}.` : '',
      `Next step: keep in ${item.workflowStage === 'confirm' ? 'confirm' : 'draft'} until approval. Jira create remains disabled.`
    ].filter(Boolean)
    return wantsShorter ? sections.slice(0, 5).join('\n') : sections.join('\n')
  }

  return [
    `Recommended PM action for ${item.issueKey ?? item.id}:`,
    item.suggestedNextStep,
    wantsOwner ? `Please confirm owner: ${item.suggestedOwner ?? 'TBD'}.` : '',
    wantsRisk ? `Risk note: ${item.codeFreezeImpact}` : ''
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildMockRevisionResult(item: ReviewItem, feedbackText: string, chips: string[]): DraftRevisionResult {
  return {
    revisedDraft: sentenceFromFeedback(item, feedbackText, chips),
    revisionSummary: summarizeRewrite(item, feedbackText, chips),
    appliedFeedback: buildRewriteInstruction(feedbackText, chips),
    confidence: item.confidence,
    guardrailNotes: [
      'Revision fallback used local mock rewrite',
      'Jira writes remain disabled',
      'Approval only updates local state'
    ],
    source: 'mock'
  }
}

export function reviseDraft(
  state: ReviewState,
  args: {
    itemId: string
    feedbackText: string
    chips: string[]
    reason?: 'revise' | 'needs_revision'
    revisionResult?: DraftRevisionResult
  }
) {
  const createdAt = nowLocal()
  const items: ReviewItem[] = state.items.map((it) => {
    if (it.id !== args.itemId) return it
    const current = it.draftVersions.find((v) => v.id === it.currentDraftVersionId) ?? it.draftVersions[0]
    const revisionResult = args.revisionResult ?? buildMockRevisionResult(it, args.feedbackText, args.chips)
    const nextVersionNumber = Math.max(...it.draftVersions.map((v) => v.version)) + 1
    const nextId = `${it.id}-v${nextVersionNumber}`
    const nextContent = revisionResult.revisedDraft
    const nextVersion: DraftVersion = {
      id: nextId,
      version: nextVersionNumber,
      createdAt,
      createdBy: 'user_feedback',
      feedbackApplied: revisionResult.appliedFeedback,
      appliedFeedback: revisionResult.appliedFeedback,
      revisionSummary: revisionResult.revisionSummary,
      revisionConfidence: revisionResult.confidence,
      guardrailNotes: revisionResult.guardrailNotes,
      revisionSource: revisionResult.source,
      content: nextContent,
      structuredOutput: buildMockAssistantOutput({
        item: it,
        versionId: nextId,
        content: nextContent,
        feedbackText: args.feedbackText,
        chips: args.chips
      }),
      status: 'current'
    }

    const nextItem: ReviewItem = {
      ...it,
      status: 'revised_pending_review' as const,
      workflowStage: it.type === 'ticket_creation_draft' ? 'confirm' : it.workflowStage,
      draftVersions: [
        ...it.draftVersions.map((version) => (version.status === 'approved' ? version : { ...version, status: 'previous' as const })),
        nextVersion
      ],
      currentDraftVersionId: nextId,
      feedbackHistory: [
        {
          id: `${it.id}-fb-${Date.now()}`,
          createdAt,
          text: args.feedbackText,
          chips: args.chips,
          fromVersionId: current.id,
          toVersionId: nextId
        },
        ...it.feedbackHistory
      ],
      thread: [
        {
          id: `${it.id}-thread-fb-${Date.now()}`,
          createdAt,
          role: 'user_feedback',
          itemId: it.id,
          versionId: current.id,
          content: buildRewriteInstruction(args.feedbackText, args.chips)
        },
        {
          id: `${it.id}-thread-summary-${Date.now() + 1}`,
          createdAt,
          role: 'assistant_summary',
          itemId: it.id,
          versionId: nextId,
          content: revisionResult.revisionSummary
        },
        {
          id: `${it.id}-thread-draft-${Date.now() + 2}`,
          createdAt,
          role: 'assistant_draft',
          itemId: it.id,
          versionId: nextId,
          content: nextContent
        },
        ...it.thread
      ]
    }
    return nextItem
  })

  const activityEvent: ActivityEvent = {
    id: `EV-${Date.now()}`,
    createdAt,
    type: args.reason === 'needs_revision' ? 'draft_revision' : 'user_feedback',
    message:
      args.reason === 'needs_revision'
        ? `Needs revision with feedback for ${args.itemId}`
        : `User feedback applied to ${args.itemId}`,
    itemId: args.itemId,
    versionId: items.find((item) => item.id === args.itemId)?.currentDraftVersionId
  }

  const nextState: ReviewState = {
    items,
    activityEvents: [activityEvent, ...state.activityEvents]
  }
  return nextState
}

export function approveCurrentDraft(state: ReviewState, args: { itemId: string }) {
  const createdAt = nowLocal()
  const items: ReviewItem[] = state.items.map((it) => {
    if (it.id !== args.itemId) return it
    const current = it.draftVersions.find((v) => v.id === it.currentDraftVersionId) ?? it.draftVersions[0]
    const nextItem: ReviewItem = {
      ...it,
      status: 'approved' as const,
      approvedVersionId: current.id,
      approvedAt: createdAt,
      draftVersions: it.draftVersions.map((version) => ({
        ...version,
        status: version.id === current.id ? ('approved' as const) : ('previous' as const)
      })),
      decisionHistory: [
        {
          id: `${it.id}-dec-${Date.now()}`,
          createdAt,
          decision: 'approve',
          versionId: current.id
        },
        ...it.decisionHistory
      ]
    }
    return nextItem
  })

  const activityEvent: ActivityEvent = {
    id: `EV-${Date.now()}`,
    createdAt,
    type: 'approval',
    message: `Approved current draft for ${args.itemId} (draft only, not posted to Jira)`,
    itemId: args.itemId,
    versionId: items.find((item) => item.id === args.itemId)?.approvedVersionId
  }

  const nextState: ReviewState = {
    items,
    activityEvents: [activityEvent, ...state.activityEvents]
  }
  return nextState
}

export function decideCurrentDraft(
  state: ReviewState,
  args: { itemId: string; decision: 'reject' | 'needs_revision' | 'snooze' }
) {
  const createdAt = nowLocal()
  const items: ReviewItem[] = state.items.map((it) => {
    if (it.id !== args.itemId) return it
    const current = it.draftVersions.find((v) => v.id === it.currentDraftVersionId) ?? it.draftVersions[0]
    const nextItem: ReviewItem = {
      ...it,
      status: args.decision === 'reject' ? 'rejected' : args.decision === 'snooze' ? 'snoozed' : 'needs_revision',
      decisionHistory: [
        {
          id: `${it.id}-dec-${Date.now()}`,
          createdAt,
          decision: args.decision,
          versionId: current.id
        },
        ...it.decisionHistory
      ]
    }
    return nextItem
  })

  const activityEvent: ActivityEvent = {
    id: `EV-${Date.now()}`,
    createdAt,
    type: 'user_decision',
    message: `Decision "${args.decision}" recorded for ${args.itemId} (draft only, not posted to Jira)`,
    itemId: args.itemId,
    versionId: items.find((item) => item.id === args.itemId)?.currentDraftVersionId
  }

  const nextState: ReviewState = {
    items,
    activityEvents: [activityEvent, ...state.activityEvents]
  }
  return nextState
}

function nextReviewItemId(items: ReviewItem[]) {
  const maxId = items.reduce((max, item) => {
    const match = item.id.match(/RI-(\d+)/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 2000)
  return `RI-${maxId + 1}`
}

function extractIssueKey(prompt: string) {
  const match = prompt.match(/[A-Za-z]+-\d+/)
  return match ? match[0].toUpperCase() : undefined
}

function buildUserRequestBlueprint(prompt: string, action: AskPmAssistantAction, id: string): SeedReviewItemRaw {
  const createdAt = nowLocal()
  const issueKey = extractIssueKey(prompt)
  const trimmedPrompt = prompt.trim()

  if (action === 'comment_reply') {
    return {
      id,
      source: issueKey ? 'jira_comment' : 'jira_issue',
      issueKey,
      type: 'comment_reply',
      category: 'comment_reply',
      origin: 'user_requested',
      executionMode: 'draft_only',
      dataSource: 'mock',
      analysisSource: 'mock',
      riskLevel: 'medium',
      title: `Analyze ${issueKey ?? 'reply'} response`,
      analysisNarrative: composeAnalysisNarrative({
        mainTake: `${issueKey ?? '这个请求'} 我看完了。这里表面上是在写一段回复，但本质上是在决定你现在要不要给出明确承诺。我的建议是先给结论，再把需要 owner 补充确认的点留出来。`,
        why: `当前上下文直接来自你的 Ask PM Assistant 请求：“${trimmedPrompt}”。信息足够先写 reply draft，但不足以替 owner 或 release 承诺兜底，所以应该先保守给可确认部分。`,
        recommendedMoves: ['先写清楚当前能确认的结论。', '对未确认的信息明确标成待 owner 回复。', '如果涉及 scope / launch，优先澄清边界。'],
        draftDirection: '这版 draft 应该走“先给结论 + 留出待确认项 + 不过度承诺”的方向。',
        smallRisk: '因为这是 user-requested item，当前没有完整 thread，回复前仍建议对照原 ticket 再看一遍。'
      }),
      recommendedMove: '先给方向性结论，避免过度承诺；把待确认项（owner/scope/deadline）写清楚。',
      whyItMatters: '這是主動請 PM assistant 幫你產出 reply draft，目標是先拿到可 review 的回覆。',
      evidence: [`User request: “${trimmedPrompt}”`],
      assumptions: ['缺少完整上下文时要保守输出', 'Jira writes disabled', 'Data source = mock'],
      suggestedNextStep: '先 review 這版 reply draft，再決定是否補 owner / timeline。',
      draft:
        'Draft reply: I reviewed the current context. My recommendation is to respond with the confirmed direction first, avoid overcommitting on unresolved timing, and ask the owner to confirm the remaining open point before we make any stronger promise.',
      status: 'pending',
      createdAt,
      owner: 'PM',
      suggestedOwner: 'Issue owner',
      dueDate: createdAt.slice(0, 10),
      codeFreezeImpact: 'Low: reply quality risk only.',
      confidence: 'medium',
      decisionNeededBy: createdAt.slice(0, 10),
      sourceLabel: 'Ask PM Assistant request',
      sourceUrl: `local://ask-pm-assistant/${id}`
    }
  }

  if (action === 'create_epic') {
    return {
      id,
      source: 'epic',
      issueKey,
      type: 'epic_creation_draft',
      category: 'create_epic',
      origin: 'user_requested',
      executionMode: 'needs_approval',
      dataSource: 'mock',
      analysisSource: 'mock',
      riskLevel: 'medium',
      title: `Create ${issueKey ?? 'epic'} draft`,
      analysisNarrative: buildFallbackAnalysisNarrative({
        id,
        issueKey,
        type: 'epic_creation_draft',
        category: 'create_epic',
        origin: 'user_requested',
        executionMode: 'needs_approval',
        riskLevel: 'medium',
        title: `Create ${issueKey ?? 'epic'} draft`,
        whyItMatters: '需要先理清 sequencing，再决定怎么拆。',
        suggestedNextStep: '先做 breakdown recommendation。',
        owner: 'PM',
        suggestedOwner: 'Program PM',
        dueDate: createdAt.slice(0, 10),
        codeFreezeImpact: 'Low: planning sequencing risk.',
        confidence: 'medium',
        decisionNeededBy: createdAt.slice(0, 10),
        sourceLabel: 'Ask PM Assistant request'
      }),
      recommendedMove: '先出拆解与 sequencing 建议，让 owner review 后再调整 scope/sprint。',
      whyItMatters: '這是主動發起的 epic breakdown request。',
      evidence: [`User request: “${trimmedPrompt}”`],
      assumptions: ['存在隐藏依赖', '当前为 mock epic context', 'Jira writes disabled'],
      suggestedNextStep: '先 review 一版 breakdown recommendation。',
      draft:
        'Epic draft: Draft an Epic summary, clarify sequencing/dependencies, and list the first 3 child stories to create next. (No Jira write in V0.)',
      status: 'pending',
      createdAt,
      owner: 'PM',
      suggestedOwner: 'Program PM',
      dueDate: createdAt.slice(0, 10),
      codeFreezeImpact: 'Low: planning sequencing risk.',
      confidence: 'medium',
      decisionNeededBy: createdAt.slice(0, 10),
      sourceLabel: 'Ask PM Assistant request',
      sourceUrl: `local://ask-pm-assistant/${id}`
    }
  }

  if (action === 'create_ticket') {
    return {
      id,
      source: 'jira_issue',
      issueKey,
      type: 'ticket_creation_draft',
      category: 'create_ticket',
      origin: 'user_requested',
      executionMode: 'needs_approval',
      dataSource: 'mock',
      analysisSource: 'mock',
      riskLevel: 'medium',
      title: `Story draft request for ${issueKey ?? 'new work'}`,
      analysisNarrative: buildFallbackAnalysisNarrative({
        id,
        issueKey,
        type: 'ticket_creation_draft',
        category: 'create_ticket',
        origin: 'user_requested',
        executionMode: 'needs_approval',
        riskLevel: 'medium',
        title: `Story draft request for ${issueKey ?? 'new work'}`,
        whyItMatters: '需要先形成可确认的 ticket / story draft。',
        suggestedNextStep: '按 plan -> draft -> confirm 走。',
        owner: 'PM',
        suggestedOwner: 'Feature owner',
        dueDate: createdAt.slice(0, 10),
        codeFreezeImpact: 'None: draft planning only.',
        confidence: 'medium',
        decisionNeededBy: createdAt.slice(0, 10),
        sourceLabel: 'Ask PM Assistant request',
        workflowStage: 'draft'
      }),
      recommendedMove: '按 plan->draft->confirm 走，V0 不创建 Jira；把 scope/requirements/AC 写到可 review。',
      whyItMatters: '這是主動發起的 plan stories request。',
      evidence: [`User request: “${trimmedPrompt}”`],
      assumptions: ['Jira create disabled', '需要补 owner 与 acceptance criteria', 'Data source = mock'],
      suggestedNextStep: '先 review story draft，再决定是否进入 confirm。',
      draft:
        'Title: Draft new story\n\nBackground: Capture the requested work as a structured story draft for PM review.\n\nScope: Create a draft only; do not create Jira.\n\nRequirements: Clarify background, scope, requirements, acceptance criteria, and owner suggestion.',
      status: 'pending',
      createdAt,
      owner: 'PM',
      suggestedOwner: 'Feature owner',
      dueDate: createdAt.slice(0, 10),
      codeFreezeImpact: 'None: draft planning only.',
      confidence: 'medium',
      decisionNeededBy: createdAt.slice(0, 10),
      sourceLabel: 'Ask PM Assistant request',
      sourceUrl: `local://ask-pm-assistant/${id}`,
      background: `User asked: ${trimmedPrompt}`,
      scope: ['Create story draft only', 'Do not create Jira in V0', 'Keep approval local'],
      userStory: 'As a PM, I want a draft story so I can review before any Jira creation step.',
      requirements: ['Background is captured', 'Requirements are explicit', 'Owner suggestion is included'],
      acceptanceCriteria: ['Draft is reviewable', 'Still not posted to Jira in V0'],
      preCreationChecks: ['No duplicate story already exists', 'Owner suggestion available', 'Acceptance criteria are explicit'],
      workflowStage: 'draft'
    }
  }

  return buildUserRequestBlueprint(trimmedPrompt, 'comment_reply', id)
}

export function createUserRequestedReviewItem(
  state: ReviewState,
  args: { prompt: string; action: AskPmAssistantAction }
): { state: ReviewState; itemId: string } {
  const itemId = nextReviewItemId(state.items)
  const raw = buildUserRequestBlueprint(args.prompt, args.action, itemId)
  const item = buildSeedItem(raw)
  return {
    itemId,
    state: {
      items: [item, ...state.items],
      activityEvents: [
        {
          id: `EV-${Date.now()}`,
          createdAt: item.createdAt,
          type: 'user_request',
          message: `User request created review item ${item.id} via Ask PM Assistant`,
          itemId: item.id,
          versionId: item.currentDraftVersionId
        },
        ...state.activityEvents
      ]
    }
  }
}

function typeFromAskCategory(category: AskAnalysisResult['category']): ReviewItemType {
  if (category === 'comment_reply') return 'comment_reply'
  if (category === 'create_epic') return 'epic_creation_draft'
  return 'ticket_creation_draft'
}

function sourceFromAskCategory(category: AskAnalysisResult['category']): ReviewItemSource {
  if (category === 'comment_reply') return 'jira_comment'
  if (category === 'create_epic') return 'epic'
  return 'jira_issue'
}

function mapAskExecutionMode(mode: AskAnalysisResult['executionMode']): ReviewItemExecutionMode {
  if (mode === 'needs_approval') return 'needs_approval'
  if (mode === 'blocked') return 'blocked'
  return 'draft_only'
}

export function createUserRequestedReviewItemFromAnalysis(
  state: ReviewState,
  args: { prompt: string; quickAction?: string; result: AskAnalysisResult }
): { state: ReviewState; itemId: string } {
  const itemId = nextReviewItemId(state.items)
  const createdAt = nowLocal()
  const issueKey = extractIssueKey(args.prompt)
  const type = typeFromAskCategory(args.result.category)
  const source = sourceFromAskCategory(args.result.category)

  const raw: SeedReviewItemRaw = {
    id: itemId,
    source,
    issueKey,
    type,
    category: args.result.category,
    origin: 'user_requested',
    executionMode: mapAskExecutionMode(args.result.executionMode),
    dataSource: args.result.dataSource,
    analysisSource: args.result.analysisSource,
    riskLevel: args.result.riskLevel,
    title:
      args.result.category === 'comment_reply' && issueKey
        ? `Analyze ${issueKey} reply`
        : args.result.category === 'create_epic'
          ? `Create ${issueKey ?? 'epic'} draft`
          : `Create ${issueKey ?? 'ticket'} draft`,
    analysisNarrative: args.result.analysisNarrative,
    recommendedMove: args.result.recommendedMove,
    whyItMatters: args.result.recommendedMove,
    evidence: args.result.sourceEvidence,
    assumptions: args.result.assumptions,
    suggestedNextStep: args.result.recommendedMove,
    draft: args.result.draft,
    status: 'pending',
    createdAt,
    owner: 'PM',
    suggestedOwner: args.result.suggestedOwner,
    dueDate: createdAt.slice(0, 10),
    releaseDate: undefined,
    codeFreezeImpact: args.result.riskLevel === 'critical' || args.result.riskLevel === 'high' ? 'High' : 'Medium',
    confidence: args.result.confidence,
    decisionNeededBy: createdAt.slice(0, 10),
    sourceLabel: `Ask PM Assistant (${args.result.dataSource})`,
    sourceUrl: `local://ask-pm-assistant/${itemId}`,
    background: args.result.category === 'create_ticket' ? `User asked: ${args.prompt.trim()}` : undefined,
    scope: undefined,
    userStory: undefined,
    requirements: undefined,
    acceptanceCriteria: undefined,
    preCreationChecks: undefined,
    workflowStage: type === 'ticket_creation_draft' ? 'draft' : undefined
  }

  const item = buildSeedItem(raw)
  const message = `Ask analysis created review item ${item.id} (analysis=${args.result.analysisSource}, data=${args.result.dataSource})`

  return {
    itemId,
    state: {
      items: [item, ...state.items],
      activityEvents: [
        {
          id: `EV-${Date.now()}`,
          createdAt,
          type: 'user_request',
          message,
          itemId: item.id,
          versionId: item.currentDraftVersionId
        },
        ...state.activityEvents
      ]
    }
  }
}
