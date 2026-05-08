export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export function toneForRunStatus(status: string): StatusTone {
  if (status === 'succeeded') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'waiting_review') return 'warning'
  if (status === 'running') return 'info'
  return 'neutral'
}

export function toneForReviewStatus(status: string): StatusTone {
  if (status === 'pending') return 'warning'
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'neutral'
}

