import type { RevisionConfidence } from './reviseDraftTypes'

export type AskAnalysisCategory = 'comment_reply' | 'create_ticket' | 'create_epic'

export type AskAnalysisExecutionMode = 'draft_only' | 'needs_approval' | 'blocked'

export type AskAnalysisRequest = {
  prompt: string
  quickAction?: string
  context?: {
    dataSource: 'mock' | 'jira_readonly'
    jiraWritesEnabled: false
    notes?: string[]
    recentItems?: Array<{
      id: string
      issueKey?: string
      title: string
      category?: AskAnalysisCategory
      riskLevel?: 'low' | 'medium' | 'high' | 'critical'
      status?: string
    }>
  }
}

export type AskAnalysisResult = {
  category: AskAnalysisCategory
  origin: 'user_requested'
  executionMode: AskAnalysisExecutionMode
  analysisNarrative: string
  recommendedMove: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  confidence: RevisionConfidence
  suggestedOwner?: string
  draft: string
  sourceEvidence: string[]
  assumptions: string[]
  analysisSource: 'deepseek' | 'mock'
  dataSource: 'mock' | 'jira_readonly'
}

export type AskAnalysisApiResponse = {
  result: AskAnalysisResult
  fallbackUsed: boolean
  modelStatus: {
    provider: 'DeepSeek'
    model: string
    baseUrl: string
    enabled: boolean
    available: boolean
    authSource: 'env' | 'keychain' | 'missing'
    revisionOnly: boolean
    askAnalysisEnabled: boolean
    jiraWritesEnabled: false
    approvalMode: 'local_state_only'
    detail: string
  }
}
