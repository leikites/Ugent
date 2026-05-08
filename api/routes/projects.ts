import { Router, type Request, type Response } from 'express'
import { getSupabaseForToken } from '../lib/supabase.js'

const router = Router()

function readString(v: unknown) {
  return typeof v === 'string' ? v : ''
}

function readBearerToken(req: Request): string {
  const raw = readString(req.headers.authorization)
  const match = /^Bearer\s+(.+)$/i.exec(raw)
  return match?.[1] ?? ''
}

function isValidProjectName(name: string) {
  const n = name.trim()
  return n.length >= 1 && n.length <= 60
}

router.get('/', async (req: Request, res: Response) => {
  const token = readBearerToken(req)
  const supabase = getSupabaseForToken(token)
  if (supabase.ok === false) {
    res.status(401).json({ success: false, error: supabase.error })
    return
  }

  const workspaceId = readString(req.query.workspaceId)
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'missing_workspace_id' })
    return
  }

  const { data, error } = await supabase.client
    .from('projects')
    .select('id, workspace_id, name, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, projects: data })
})

router.post('/', async (req: Request, res: Response) => {
  const token = readBearerToken(req)
  const supabase = getSupabaseForToken(token)
  if (supabase.ok === false) {
    res.status(401).json({ success: false, error: supabase.error })
    return
  }

  const workspaceId = readString(req.body?.workspaceId)
  const name = readString(req.body?.name)
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'missing_workspace_id' })
    return
  }
  if (!isValidProjectName(name)) {
    res.status(400).json({ success: false, error: 'invalid_project_name' })
    return
  }

  const userRes = await supabase.client.auth.getUser()
  if (userRes.error || !userRes.data.user) {
    res.status(401).json({ success: false, error: 'invalid_token' })
    return
  }

  const { data, error } = await supabase.client
    .from('projects')
    .insert({ workspace_id: workspaceId, owner_id: userRes.data.user.id, name: name.trim() })
    .select('id, workspace_id, name, created_at, updated_at')
    .single()

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, project: data })
})

export default router

