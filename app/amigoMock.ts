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

export type ReviewItemSource = 'jira_issue' | 'jira_comment' | 'sprint' | 'epic' | 'release'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type ReviewItem = {
  id: string
  source: ReviewItemSource
  issueKey?: string
  type: ReviewItemType
  riskLevel: RiskLevel
  title: string
  analysisNarrative: string
  whyItMatters: string
  evidence: string[]
  suggestedNextStep: string
  status: ReviewItemStatus
  createdAt: string
  owner: string
  suggestedOwner: string
  dueDate: string
  releaseDate?: string
  codeFreezeImpact: string
  confidence: 'low' | 'medium' | 'high'
  decisionNeededBy: string
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
  type: 'worker_event' | 'user_feedback' | 'draft_revision' | 'user_decision' | 'approval'
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

export const projectDefaults = {
  projectKey: 'ATT',
  executedActionsWithoutApproval: 0
}

type AnalysisInput = Pick<
  ReviewItem,
  | 'id'
  | 'issueKey'
  | 'type'
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

export function buildFallbackAnalysisNarrative(item: AnalysisInput) {
  const ref = item.issueKey ?? item.id
  const when = item.releaseDate ? `release date 是 ${item.releaseDate}` : `decision needed by ${item.decisionNeededBy}`
  const ownerLine =
    item.suggestedOwner && item.suggestedOwner !== item.owner
      ? `先让 ${item.suggestedOwner} 和当前 owner ${item.owner} 对齐责任边界。`
      : `先让当前 owner ${item.owner} 明确给结论。`

  if (item.type === 'comment_reply') {
    return `${ref} 我看完了。这里真正要处理的不是把 comment 回成一个 yes/no，而是把 scope 边界讲清楚，避免外部把 follow-up work 当成当前 release 承诺。我建议你先澄清这次 release 只覆盖已经确认的主流程，不要顺手把未落 owner 的内容一起答应进去。

原因很直接：这类 comment 一旦回复含糊，QA、CS 和 stakeholder 会直接拿回复当 scope 依据；但现在 owner、checkpoint 和 ${when} 还没有完全对齐。

我建议你这样处理：
1. 先明确本次 release 的 committed scope，只回答已经确认的部分。
2. 对未进入当前 scope 的内容直接标成 follow-up，不做 launch commitment。
3. 要求补 owner 和 next checkpoint，避免 comment 关掉了但 follow-up 掉线。

所以这版 draft 应该走“澄清 scope + 说明不承诺 + 要 owner / checkpoint”的方向，语气可以稳一点，但结论不能模糊。

小风险：如果 ${item.sourceLabel} 之后已经更新过 scope 或 release note，这个判断需要按最新上下文再校正一次。`
  }

  if (item.type === 'sprint_risk') {
    return `${ref} 我看完了。这里真正要处理的不是继续催进度，而是把它升级成 sprint / release risk 来处理。我建议你直接要求 owner 给 fix / rollback / scope-cut 三选一计划，并把 deadline 锁在 ${item.decisionNeededBy} 前。

原因很直接：现在风险已经碰到 code freeze 边界，继续问“什么时候好”没有用，必须先知道如果压不过去，团队准备怎么收口。${item.codeFreezeImpact}

我建议你这样处理：
1. 先把风险等级明确挂出来，不再按普通 blocker 跟进。
2. 要 owner 今天给 recovery plan，至少覆盖 fix、rollback 或 scope cut。
3. 明确 deadline 和 decision owner，避免 freeze 前最后一天才发现没有 fallback。

所以这版 draft 应该走“升级风险 + 要 plan + 锁 deadline”的方向，不要写成一般 status ping。

小风险：如果 blocker 已经在线下解决但 Jira 没同步，语气可以稍微收一点；但在拿到明确更新前，不建议先降级风险。`
  }

  if (item.type === 'epic_breakdown') {
    return `${ref} 我看完了。这里真正要处理的不是直接改 scope，而是先把 epic children 的 dependency 和 release sequencing 拉直。我建议你先做拆解和排序，再决定哪些 child 应该换 sprint 或换 owner。

原因很直接：现在 children 跨多个 sprint，但顺序不清，说明这不是单纯的 ticket hygiene 问题，而是 release story 本身已经被拆散了。如果你现在直接动 scope，只会把排程噪音放大。

我建议你这样处理：
1. 先按 milestone / dependency 做一版 breakdown recommendation。
2. 让 owner review 哪些 child 必须前置，哪些可以后移。
3. 依 sequencing 再调整 sprint placement，而不是先改 commitment。

所以这版 draft 应该走“拆解 / 排序 / owner review”的方向，不要直接承诺 scope 变化。

小风险：如果还有没写进 ticket 的隐藏依赖，第一版 breakdown 可能还不够准，所以建议把它当作 sequencing draft，不当 final plan。`
  }

  if (item.type === 'release_risk') {
    return `${ref} 我看完了。这里真正要处理的不是补一个字段，而是 release readiness 里有一块责任没有落地。我建议你现在就把 owner 和 verification checkpoint 补上，不要等到 release week 再回头追。

原因很直接：owner 为空的时候，checklist 看起来像有进度，实际上没有人负责 closing。等到 sign-off 前再发现缺口，通常已经来不及补 verification。

我建议你这样处理：
1. 先指定 suggested owner，并要求当前 owner 确认是否接手。
2. 同时补一个 verification checkpoint，明确下次看什么、什么时候看。
3. 把这条当成 launch readiness risk 跟，而不是普通 checklist cleanup。

所以这版 draft 应该走“补 owner + 补 checkpoint + 提前锁 readiness”的方向，重点是 closing accountability。

小风险：如果 checklist 在别的系统里已经有人接，但主视图没同步，这条风险会被高估；不过在 owner 明确前，不建议假设它已经解决。`
  }

  if (item.type === 'ticket_creation_draft') {
    return `${ref} 我看完了。这里真正要处理的不是马上建 ticket，而是判断这件事值不值得进入正式跟踪，以及 draft 是否已经到可确认状态。我建议你按 Amigo workflow 走 plan -> draft -> confirm，V0 先停在 ${item.workflowStage === 'confirm' ? 'confirm' : 'draft'} / confirm，不直接 create。

原因很直接：这类 follow-up 如果不先把背景、范围和验收条件写清楚，建出来的 ticket 只会变成另一个模糊 backlog；但如果完全不留 draft，又很容易在 release 后消失。

我建议你这样处理：
1. 先确认这件事是否值得单独建 ticket，而不是并入现有 workstream。
2. 检查 draft 里有没有 background、scope、user story、requirements、acceptance criteria 和 pre-creation checks。
3. 只有在信息足够完整时再进入 confirm，V0 仍然不做 Jira create。

所以这版 draft 应该走“值得追踪就整理成可确认 ticket draft”的方向，而不是直接点击创建。

小风险：如果已经有重复 ticket 或 owner 还没确认，这个 draft 应该先保守停在 confirm 前，不要往 create 走。`
  }

  return `${ref} 我看完了。这里真正要处理的不是重复描述 ticket，而是判断 PM 现在该做什么。我建议你按 ${item.suggestedNextStep} 这个方向推进，并先把 owner、deadline 和 scope 边界讲清楚。

原因很直接：当前信息说明这是一个 ${item.riskLevel} 风险项，且 ${item.whyItMatters.toLowerCase()}。

我建议你这样处理：
1. 先确认谁负责，以及 ${item.decisionNeededBy} 前要拿到什么结论。
2. 说明当前判断依据，避免团队按错误假设执行。
3. 把 draft 写成可直接 review 的 PM 动作，而不是字段汇总。

所以这版 draft 应该走“给明确判断 + 给下一步动作”的方向。

小风险：当前 confidence 是 ${item.confidence}，如果源信息更新，需要按最新上下文重新判断。`
}

function resolveAnalysisNarrative(item: AnalysisInput) {
  const canonical = seedNarrativeById[item.id]
  if (canonical) return canonical
  if (item.analysisNarrative?.trim()) return item.analysisNarrative.trim()
  return buildFallbackAnalysisNarrative(item)
}

const seedReviewItemsRaw: Array<{
  id: string
  source: ReviewItemSource
  issueKey?: string
  type: ReviewItemType
  riskLevel: RiskLevel
  title: string
  analysisNarrative: string
  whyItMatters: string
  evidence: string[]
  suggestedNextStep: string
  draft: string
  status: ReviewItemStatus
  createdAt: string
  owner: string
  suggestedOwner: string
  dueDate: string
  releaseDate?: string
  codeFreezeImpact: string
  confidence: 'low' | 'medium' | 'high'
  decisionNeededBy: string
  sourceLabel: string
  sourceUrl?: string
  background?: string
  scope?: string[]
  userStory?: string
  requirements?: string[]
  acceptanceCriteria?: string[]
  preCreationChecks?: string[]
  workflowStage?: 'plan' | 'draft' | 'confirm' | 'create'
}> = [
  {
    id: 'RI-1001',
    source: 'jira_comment',
    issueKey: 'ATT-123',
    type: 'comment_reply',
    riskLevel: 'high',
    title: 'Launch scope question needs reply',
    analysisNarrative:
      `ATT-123 我看完了。这里真正要处理的不是简单回答 5/18 是否包含 reporting，而是把 May 18 release scope 边界说清楚，避免 stakeholder 把 reporting 误认为本次 launch 范围。我建议你回复时明确：5/18 只包含 core flow，reporting 不在本次 release scope，需要作为 follow-up 放到下一 sprint，并补 owner。

原因很直接：comment 在问 reporting 是否包含在 May 18 launch，但当前 sprint scope 没有明确承接 reporting，release note 又有可能让人误解。如果回复含糊，后面 QA、CS 或 stakeholder 会按错误范围验收。

我建议你这样处理：
1. 明确 5/18 launch scope 是 core flow only。
2. 说明 reporting 不在本次 release，而是 next sprint / follow-up。
3. 要求补 reporting owner 和 next checkpoint，避免 follow-up 掉线。

所以这版 draft 应该走“澄清 scope + 要 owner”的方向，不要承诺 reporting 会进入 5/18。

小风险：这个判断基于当前 Jira comment 和 mock release context；如果 release note 已经更新，需要重新同步后再确认。`,
    whyItMatters:
      '這則 comment 在問 5/18 上線是否包含 scope。若不回覆，會造成跨團隊誤解、宣告錯誤與排程風險。',
    evidence: [
      'Comment: “Is the May 18 launch including the reporting scope, or only the core flow?”',
      'Release notes draft mentions “reporting” but sprint scope does not'
    ],
    suggestedNextStep: '回覆澄清：5/18 僅包含 core flow；reporting 進入下一個 sprint，並補上 owner。',
    draft:
      'Thanks for checking — May 18 launch is core flow only. Reporting is not in scope for this release and is planned for next sprint. I’ll update the release notes and assign an owner for the reporting follow-up.',
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
    riskLevel: 'critical',
    title: 'QA blocker before code freeze',
    analysisNarrative:
      `ATT-201 我看完了。这里真正要处理的不是催团队快一点，而是把它升级成 code-freeze 前的 QA blocker risk。我建议你直接按 critical escalation 处理，要求 owner 给出明确的 fix / rollback / scope cut plan，而不是继续收 status update。

原因很直接：现在 blocker 已经卡到 QA critical cases，离 code freeze 又很近。如果今天没有 recovery plan，release readiness 就是在假设风险会自己消失，这个判断不成立。

我建议你这样处理：
1. 明确把它标成 sprint / release risk，不再按普通执行问题跟。
2. 要 owner 在今天内提交 fix / rollback / scope cut plan，至少三选一给出路径。
3. 把 deadline 锁死，并确认谁拍板，如果压不过 freeze，具体 cut 哪部分 scope。

所以这版 draft 应该走“升级风险 + 要 plan + 锁 deadline”的方向，不要写成一般的 progress ping。

小风险：如果 blocker 已经在线下被解决但 Jira 没更新，风险等级可能被高估；但在拿到正式更新前，不建议先降级。`,
    whyItMatters:
      'Code freeze 前仍有未解 blocker，可能導致 release readiness 失敗、臨時降 scope 或延期。',
    evidence: [
      'QA status: 5 critical test cases blocked',
      'ATT-201 is in “In Progress” for 6 days with no update'
    ],
    suggestedNextStep: '標記為 critical risk，要求 owner 今日內給出 plan（fix/rollback/scope-cut）。',
    draft:
      'Flagging this as a critical sprint risk: we still have blocked QA cases before code freeze. Can you share an updated plan today (fix vs rollback vs scope-cut) and confirm who is driving it?',
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
    riskLevel: 'medium',
    title: 'Epic children split across sprints with unclear ordering',
    analysisNarrative:
      `ATT-88 我看完了。这里真正要处理的不是直接改 epic scope，而是先把 children 的 dependency 和 release sequencing 理顺。我建议你先做拆解和排序，再决定哪些 child 应该换 sprint、哪些需要 owner review。

原因很直接：现在 epic children 跨多个 sprint，但顺序不清，说明问题不是 ticket 数量，而是 release story 已经被拆散了。如果你现在直接动 scope，只会在错误 sequencing 上继续滚雪球。

我建议你这样处理：
1. 先按 milestone / dependency 做一版 epic breakdown recommendation。
2. 让 owner review 哪些 child 必须前置，哪些可以后移。
3. 依 sequencing 再调整 sprint placement，不要先改 committed scope。

所以这版 draft 应该走“拆解 / 排序 / owner review”的方向，不要直接改 scope。

小风险：如果还有未记录的隐藏 dependency，第一版 breakdown 可能还不够准，所以建议把它当成 sequencing draft，不当 final plan。`,
    whyItMatters:
      'Epic 子任務散落多個 sprint 且缺少依賴順序，容易造成 PRD/排程不一致與 release 承諾風險。',
    evidence: [
      'Epic ATT-88 has 12 children across Sprint 14/15/16',
      'Two children are “Blocked” but still planned in earlier sprint'
    ],
    suggestedNextStep: '請 AI 先產出一版 epic breakdown 建議（排序/依賴/owner），你只需 approve。',
    draft:
      'Draft: create 3 sub-epics by milestone; reorder children; add dependency links; propose owners',
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
    riskLevel: 'high',
    title: 'Release readiness flagged unclear owner',
    analysisNarrative:
      `Release readiness owner risk 我看完了。这里真正要处理的不是 checklist 少填了一个 owner，而是 launch readiness 里有一块 verification responsibility 还没有落地。我建议你现在就补 owner 和 verification checkpoint，不要等到 release week 才追。

原因很直接：没有 owner 的 checklist 看起来像“待补信息”，实际上是没人对 closing 负责。等到 release sign-off 前才发现没有 verification owner，通常已经来不及补验证节奏。

我建议你这样处理：
1. 先指定 suggested owner，并要求当前 owner 明确确认是否接手。
2. 同时补一个 verification checkpoint，写清楚谁在什么时候验证什么。
3. 把它当成 launch readiness risk 跟，不要当成普通 admin cleanup。

所以这版 draft 应该走“补 owner + 补 checkpoint + 提前锁 readiness”的方向，不要写成轻描淡写的提醒。

小风险：如果 release checklist 在别的地方已经更新，这条风险可能只是同步延迟；但在 owner 明确前，不建议假设它已经解决。`,
    whyItMatters:
      '關鍵 checklist 無 owner 會導致最後一刻堵塞，且難以追責。',
    evidence: ['Release checklist: “Support handoff” has no owner', 'Last scan shows 2 items missing owners'],
    suggestedNextStep: '產生 draft assign-owner 建議（不寫入 Jira），讓你一鍵 approve 後再手動執行。',
    draft: 'Draft: propose owners for missing checklist items; prepare assignment message',
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
    riskLevel: 'low',
    title: 'Ticket creation draft waiting confirmation',
    analysisNarrative:
      `ATT-305 我看完了。这里真正要处理的不是马上建 ticket，而是判断这个 follow-up 值不值得被正式追踪，以及 draft 是否已经到可确认质量。我建议你按 Amigo ticket creation workflow 走 plan -> draft -> confirm，V0 先停在 draft / confirm，不直接 create。

原因很直接：这件事不影响当前 release，但如果你现在不把它整理成一个可 review 的 ticket draft，后面很容易变成口头需求消失。反过来，如果信息还没收敛就直接 create，Jira 里只会多一个模糊 ticket。

我建议你这样处理：
1. 先确认这件事是否值得单独建 ticket，而不是并入现有 workstream。
2. 检查 draft 里是否已经包含 background、scope、user_story、requirements、acceptance_criteria 和 pre_creation_checks。
3. 如果信息足够完整，就进入 confirm；如果还缺 owner 或重复性检查，就继续停在 draft。

所以这版 draft 应该走“值得追踪就整理成可确认 ticket draft”的方向，而不是直接创建 Jira。

小风险：如果已经有类似 ticket 或 owner 尚未确认，这个 draft 需要保守处理，先不要推进到 create。`,
    whyItMatters:
      '這是低風險的 follow-up ticket，但若不建立會讓需求缺口被遺忘。',
    evidence: ['Meeting note mentions follow-up “add export toggle”', 'No ticket exists for export toggle'],
    suggestedNextStep: '確認是否需要建立 ticket，若需要，使用 draft action（不會寫入 Jira）。',
    draft:
      'Draft: create ATT ticket “Add export toggle for reporting view”, include acceptance criteria and owner suggestion',
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
    preCreationChecks: [
      'No duplicate ticket exists',
      'Owner suggestion is available',
      'Not in current launch scope'
    ],
    workflowStage: 'draft'
  }
]

const seedNarrativeById = Object.fromEntries(seedReviewItemsRaw.map((item) => [item.id, item.analysisNarrative])) as Record<string, string>

function nowLocal() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function seedItem(raw: {
  id: string
  source: ReviewItemSource
  issueKey?: string
  type: ReviewItemType
  riskLevel: RiskLevel
  title: string
  analysisNarrative: string
  whyItMatters: string
  evidence: string[]
  suggestedNextStep: string
  draft: string
  status: ReviewItemStatus
  createdAt: string
  owner: string
  suggestedOwner: string
  dueDate: string
  releaseDate?: string
  codeFreezeImpact: string
  confidence: 'low' | 'medium' | 'high'
  decisionNeededBy: string
  sourceLabel: string
  sourceUrl?: string
  background?: string
  scope?: string[]
  userStory?: string
  requirements?: string[]
  acceptanceCriteria?: string[]
  preCreationChecks?: string[]
  workflowStage?: 'plan' | 'draft' | 'confirm' | 'create'
}): ReviewItem {
  const analysisNarrative = resolveAnalysisNarrative({
    ...raw,
    workflowStage: raw.workflowStage
  })
  const structuredOutput = buildMockAssistantOutput({
    item: {
      id: raw.id,
      source: raw.source,
      issueKey: raw.issueKey,
      type: raw.type,
      riskLevel: raw.riskLevel,
      title: raw.title,
      analysisNarrative,
      whyItMatters: raw.whyItMatters,
      evidence: raw.evidence,
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
      currentDraftVersionId: '',
      feedbackHistory: [],
      decisionHistory: [],
      thread: []
    },
    versionId: `${raw.id}-v1`,
    content: raw.draft,
    feedbackText: '',
    chips: []
  })
  const v1: DraftVersion = {
    id: `${raw.id}-v1`,
    version: 1,
    createdAt: raw.createdAt,
    createdBy: 'assistant',
    content: raw.draft,
    structuredOutput,
    status: 'current'
  }
  return {
    id: raw.id,
    source: raw.source,
    issueKey: raw.issueKey,
    type: raw.type,
    riskLevel: raw.riskLevel,
    title: raw.title,
    analysisNarrative,
    whyItMatters: raw.whyItMatters,
    evidence: raw.evidence,
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
    draftVersions: [v1],
    currentDraftVersionId: v1.id,
    feedbackHistory: [],
    decisionHistory: [],
    thread: [
      {
        id: `${raw.id}-thread-init-summary`,
        createdAt: raw.createdAt,
        role: 'assistant_summary',
        itemId: raw.id,
        versionId: v1.id,
        content: raw.suggestedNextStep
      },
      {
        id: `${raw.id}-thread-init-draft`,
        createdAt: raw.createdAt,
        role: 'assistant_draft',
        itemId: raw.id,
        versionId: v1.id,
        content: raw.draft
      }
    ]
  }
}

export const seedReviewItems: ReviewItem[] = seedReviewItemsRaw.map(seedItem)

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

export type ReviewState = {
  items: ReviewItem[]
  activityEvents: ActivityEvent[]
}

export const REVIEW_STATE_KEY = 'amigo_pm_review_state_v0'

export function seedReviewState(): ReviewState {
  return {
    items: seedReviewItems,
    activityEvents: workerRuns.map((run) => ({
      id: `EV-${run.id}`,
      createdAt: run.startedAt,
      type: 'worker_event' as const,
      message: `${run.worker} scanned ${run.itemsScanned} items and created ${run.reviewItemsCreated} review items`,
      itemId: undefined,
      versionId: undefined
    }))
  }
}

export function loadReviewState(): ReviewState {
  if (typeof window === 'undefined') return seedReviewState()
  try {
    const raw = window.localStorage.getItem(REVIEW_STATE_KEY)
    if (!raw) return seedReviewState()
    const parsed = JSON.parse(raw) as ReviewState
    if (!parsed?.items?.length) return seedReviewState()
    const hasRequiredShape = parsed.items.every(
      (item) =>
        Array.isArray(item.draftVersions) &&
        typeof item.currentDraftVersionId === 'string' &&
        Array.isArray(item.feedbackHistory) &&
        Array.isArray(item.decisionHistory) &&
        Array.isArray(item.thread) &&
        typeof item.owner === 'string'
    )
    if (!hasRequiredShape) return seedReviewState()
    const activityEvents = Array.isArray(parsed.activityEvents)
      ? parsed.activityEvents.map((event) => ({
          ...event,
          type: event.type ?? ('user_feedback' as const)
        }))
      : []
    const items = parsed.items.map((item) => ({
      ...item,
      analysisNarrative: resolveAnalysisNarrative(item)
    }))
    return { ...parsed, items, activityEvents }
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
  const wantsSofter = chips.includes('Make it softer') || includesIntent(instruction, ['soft', '柔和', ' softer'])
  const wantsDirect = chips.includes('Be more direct') || includesIntent(instruction, ['direct', '直接', '更直接'])
  const wantsScopeCallout =
    chips.includes('Clarify out of scope') || includesIntent(instruction, ['scope', '不在本次', 'not in scope', 'out of scope'])
  const wantsJiraComment = chips.includes('Turn into Jira comment') || includesIntent(instruction, ['jira comment'])
  const noCommit =
    chips.includes('Do not commit to launch') ||
    includesIntent(instruction, ['不要承諾', '不要承诺', 'not promise', 'do not commit', '不要 commit', 'launch']) ||
    wantsRisk

  const signoff = wantsDirect ? 'PM recommendation:' : wantsSofter ? 'Thanks for checking.' : 'Please review the following update.'

  if (item.type === 'comment_reply') {
    const lines: string[] = [wantsJiraComment ? 'Jira comment draft:' : '', signoff].filter(Boolean)
    if (noCommit) {
      lines.push(
        `We should not commit to ${item.releaseDate ?? 'the current release'} until the owner confirms delivery and the release risk is understood.`
      )
    } else {
      lines.push(`${item.releaseDate ?? 'This release'} is currently planned for core flow only, pending final owner confirmation.`)
    }
    if (wantsOwner) {
      lines.push(`Please confirm the owner for the reporting follow-up and when they can provide an update.`)
    }
    if (wantsScopeCallout) {
      lines.push('Reporting is not in scope for this release and should be tracked as follow-up work.')
    }
    if (wantsRisk) {
      lines.push('If ownership remains unclear before code freeze, we may need to hold scope or adjust the release plan.')
    }
    return wantsShorter ? lines.slice(0, 3).join(' ') : lines.join(' ')
  }

  if (item.type === 'sprint_risk') {
    const lines = [
      wantsJiraComment ? 'Jira comment draft:' : 'PM risk note:',
      `This is currently a ${item.riskLevel} sprint risk tied to ${item.issueKey ?? item.id}.`,
      `The blocker affects code freeze readiness and needs a clear plan by ${item.decisionNeededBy}.`,
      wantsOwner ? `Please confirm who is owning the unblock plan. Suggested owner: ${item.suggestedOwner}.` : '',
      wantsRisk ? `Release impact: ${item.codeFreezeImpact}` : '',
      wantsSofter
        ? 'Could you share the recovery plan today so we can keep the sprint and release aligned?'
        : wantsDirect
          ? 'Share the recovery plan today so the sprint can stay on track.'
          : 'Please share the recovery plan today so we can keep the sprint and release aligned.'
    ].filter(Boolean)
    return wantsShorter ? lines.slice(0, 4).join(' ') : lines.join(' ')
  }

  if (item.type === 'epic_breakdown') {
    const lines = [
      'Epic breakdown draft:',
      `The current epic split is creating planning ambiguity across sprints and should be re-sequenced before ${item.dueDate}.`,
      `Suggested owner: ${item.suggestedOwner}.`,
      'Proposed action: group child tickets by milestone, reorder dependencies, and align each child with one target sprint.',
      wantsOwner ? 'Please confirm who will own the sequencing update and cross-sprint alignment.' : '',
      wantsRisk ? `Risk note: ${item.codeFreezeImpact}` : ''
    ].filter(Boolean)
    return wantsShorter ? lines.slice(0, 4).join(' ') : lines.join(' ')
  }

  if (item.type === 'release_risk') {
    const lines = [
      wantsJiraComment ? 'Jira comment draft:' : 'Release readiness note:',
      `A release readiness gap remains open because ownership is unclear.`,
      `Suggested owner: ${item.suggestedOwner}.`,
      wantsScopeCallout ? 'This should remain outside the committed scope until ownership and timing are confirmed.' : '',
      wantsRisk ? `Code freeze impact: ${item.codeFreezeImpact}` : '',
      wantsSofter
        ? 'Could you confirm the owner and next checkpoint so we can close the release checklist with confidence?'
        : wantsDirect
          ? 'Confirm the owner and next checkpoint so we can close the release checklist.'
          : 'Please confirm the owner and next checkpoint so we can close the release checklist with confidence.'
    ].filter(Boolean)
    return wantsShorter ? lines.slice(0, 4).join(' ') : lines.join(' ')
  }

  if (item.type === 'ticket_creation_draft') {
    const sections = [
      wantsJiraComment ? 'Jira ticket draft:' : 'Ticket creation draft:',
      `Title: ${item.title}`,
      `Background: ${item.background ?? 'Follow-up request needs tracking.'}`,
      item.userStory ? `User story: ${item.userStory}` : '',
      item.scope?.length ? `Scope: ${item.scope.join('; ')}` : '',
      item.requirements?.length ? `Requirements: ${item.requirements.join('; ')}` : '',
      item.acceptanceCriteria?.length ? `Acceptance criteria: ${item.acceptanceCriteria.join('; ')}` : '',
      wantsOwner ? `Suggested owner: ${item.suggestedOwner}.` : '',
      `Next step: keep in ${item.workflowStage === 'confirm' ? 'confirm' : 'draft'} until you approve. Jira create remains disabled.`
    ].filter(Boolean)
    return wantsShorter ? sections.slice(0, 5).join('\n') : sections.join('\n')
  }

  return [
    `Recommended PM response for ${item.issueKey ?? item.id}:`,
    item.suggestedNextStep,
    instruction.includes('owner') || chips.includes('Ask for owner')
      ? `Please confirm owner: ${item.suggestedOwner}.`
      : '',
    chips.includes('Add release risk') ? `Release risk note: ${item.codeFreezeImpact}` : ''
  ]
    .filter(Boolean)
    .join(' ')
}

function summarizeRewrite(item: ReviewItem, feedbackText: string, chips: string[]) {
  const parts: string[] = []
  if (feedbackText.trim()) parts.push(`已应用反馈：${feedbackText.trim()}`)
  if (chips.length) parts.push(`已应用快捷指令：${chips.join('、')}`)
  parts.push(`已按 ${item.type} 重新生成一版可 review 的 draft`)
  return parts.join('；')
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
    nextStep: `Review by ${args.item.decisionNeededBy}; owner check: ${args.item.suggestedOwner}`,
    draftReply: args.content,
    warnings: ['Jira writes remain disabled', 'DeepSeek is optional for draft revision only', 'Approval only updates local/mock state']
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
  const items = state.items.map((it) => {
    if (it.id !== args.itemId) return it
    const current = it.draftVersions.find((v) => v.id === it.currentDraftVersionId) ?? it.draftVersions[0]
    const revisionResult = args.revisionResult ?? buildMockRevisionResult(it, args.feedbackText, args.chips)
    const nextContent = revisionResult.revisedDraft

    const nextVersionNumber = Math.max(...it.draftVersions.map((v) => v.version)) + 1
    const nextId = `${it.id}-v${nextVersionNumber}`
    const structuredOutput = buildMockAssistantOutput({
      item: it,
      versionId: nextId,
      content: nextContent,
      feedbackText: args.feedbackText,
      chips: args.chips
    })
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
      structuredOutput,
      status: 'current'
    }

    const nextDraftVersions = it.draftVersions.map((v) => {
      if (v.status === 'approved') return v
      return { ...v, status: 'previous' as const }
    })
    nextDraftVersions.push(nextVersion)

    const fbEntry: FeedbackEntry = {
      id: `${it.id}-fb-${Date.now()}`,
      createdAt,
      text: args.feedbackText,
      chips: args.chips,
      fromVersionId: current.id,
      toVersionId: nextId
    }

    const thread: ThreadMessage[] = [
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

    return {
      ...it,
      status: 'revised_pending_review' as const,
      draftVersions: nextDraftVersions,
      currentDraftVersionId: nextId,
      feedbackHistory: [fbEntry, ...it.feedbackHistory],
      workflowStage: it.type === 'ticket_creation_draft' ? 'confirm' : it.workflowStage,
      thread
    }
  })

  const activityEvents: ActivityEvent[] = [
    {
      id: `EV-${Date.now()}`,
      createdAt: nowLocal(),
      type: args.reason === 'needs_revision' ? 'draft_revision' : 'user_feedback',
      message:
        args.reason === 'needs_revision'
          ? `Needs revision with feedback for ${args.itemId}`
          : `User feedback applied to ${args.itemId}`,
      itemId: args.itemId,
      versionId: items.find((i) => i.id === args.itemId)?.currentDraftVersionId
    },
    ...state.activityEvents
  ]

  return { items, activityEvents }
}

export function approveCurrentDraft(state: ReviewState, args: { itemId: string }) {
  const createdAt = nowLocal()
  const items = state.items.map((it) => {
    if (it.id !== args.itemId) return it
    const current = it.draftVersions.find((v) => v.id === it.currentDraftVersionId) ?? it.draftVersions[0]
    const nextVersions = it.draftVersions.map((v) => {
      if (v.id === current.id) return { ...v, status: 'approved' as const }
      if (v.status === 'approved') return v
      return { ...v, status: 'previous' as const }
    })

    const decision: DecisionEntry = {
      id: `${it.id}-dec-${Date.now()}`,
      createdAt,
      decision: 'approve',
      versionId: current.id
    }

    return {
      ...it,
      status: 'approved' as const,
      approvedVersionId: current.id,
      approvedAt: createdAt,
      draftVersions: nextVersions,
      decisionHistory: [decision, ...it.decisionHistory]
    }
  })

  const activityEvents: ActivityEvent[] = [
    {
      id: `EV-${Date.now()}`,
      createdAt: nowLocal(),
      type: 'approval',
      message: `Approved current draft for ${args.itemId} (draft only, not posted to Jira)`,
      itemId: args.itemId,
      versionId: items.find((i) => i.id === args.itemId)?.approvedVersionId
    },
    ...state.activityEvents
  ]

  return { items, activityEvents }
}

export function decideCurrentDraft(
  state: ReviewState,
  args: { itemId: string; decision: 'reject' | 'needs_revision' | 'snooze' }
) {
  const createdAt = nowLocal()
  const items = state.items.map((it) => {
    if (it.id !== args.itemId) return it
    const current = it.draftVersions.find((v) => v.id === it.currentDraftVersionId) ?? it.draftVersions[0]
    const decision: DecisionEntry = {
      id: `${it.id}-dec-${Date.now()}`,
      createdAt,
      decision: args.decision,
      versionId: current.id
    }

    const nextStatus =
      args.decision === 'reject' ? ('rejected' as const) : args.decision === 'snooze' ? ('snoozed' as const) : ('needs_revision' as const)

    return {
      ...it,
      status: nextStatus,
      decisionHistory: [decision, ...it.decisionHistory]
    }
  })

  const activityEvents: ActivityEvent[] = [
    {
      id: `EV-${Date.now()}`,
      createdAt: nowLocal(),
      type: 'user_decision',
      message: `Decision "${args.decision}" recorded for ${args.itemId} (draft only, not posted to Jira)`,
      itemId: args.itemId,
      versionId: items.find((i) => i.id === args.itemId)?.currentDraftVersionId
    },
    ...state.activityEvents
  ]

  return { items, activityEvents }
}
