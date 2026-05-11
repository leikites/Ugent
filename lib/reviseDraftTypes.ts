export type RevisionConfidence = 'low' | 'medium' | 'high'

export type DraftRevisionRequest = {
  itemId: string
  issueKey?: string
  itemType: string
  title: string
  analysisNarrative: string
  currentDraft: string
  userFeedback: string
  quickChips: string[]
}

export type DraftRevisionApiResponse = {
  revisedDraft: string
  revisionSummary: string
  appliedFeedback: string
  confidence: RevisionConfidence
  guardrailNotes: string[]
  source: 'deepseek' | 'mock'
  fallbackUsed: boolean
  modelStatus: RevisionModelStatus
}

export type RevisionModelStatus = {
  provider: 'DeepSeek'
  model: string
  baseUrl: string
  enabled: boolean
  available: boolean
  authSource: 'env' | 'keychain' | 'missing'
  revisionOnly: boolean
  jiraWritesEnabled: false
  approvalMode: 'local_state_only'
  detail: string
}
