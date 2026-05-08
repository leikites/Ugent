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

function isValidWorkspaceName(name: string) {
  const n = name.trim()
  return n.length >= 1 && n.length <= 40
}

router.get('/', async (req: Request, res: Response) => {
  const token = readBearerToken(req)
  const supabase = getSupabaseForToken(token)
  if (supabase.ok === false) {
    res.status(401).json({ success: false, error: supabase.error })
    return
  }

  const { data, error } = await supabase.client
    .from('workspaces')
    .select('id, name, created_at, updated_at')
    .order('created_at', { ascending: true })

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, workspaces: data })
})

router.get('/dashboard', async (req: Request, res: Response) => {
  const token = readBearerToken(req)
  const supabase = getSupabaseForToken(token)
  if (supabase.ok === false) {
    res.status(401).json({ success: false, error: supabase.error })
    return
  }

  const { data: workspaces, error } = await supabase.client
    .from('workspaces')
    .select('id, name, created_at, updated_at')
    .order('created_at', { ascending: true })

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  const items = [] as Array<{
    id: string
    name: string
    created_at: string
    updated_at: string
    projectsCount: number
  }>

  for (const w of workspaces ?? []) {
    const countRes = await supabase.client
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', w.id)

    items.push({
      id: w.id,
      name: w.name,
      created_at: w.created_at,
      updated_at: w.updated_at,
      projectsCount: countRes.count ?? 0,
    })
  }

  res.status(200).json({ success: true, workspaces: items })
})

router.patch('/:workspaceId', async (req: Request, res: Response) => {
  const token = readBearerToken(req)
  const supabase = getSupabaseForToken(token)
  if (supabase.ok === false) {
    res.status(401).json({ success: false, error: supabase.error })
    return
  }

  const workspaceId = readString(req.params.workspaceId)
  const name = readString(req.body?.name)

  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'missing_workspace_id' })
    return
  }

  if (!isValidWorkspaceName(name)) {
    res.status(400).json({ success: false, error: 'invalid_workspace_name' })
    return
  }

  const { data, error } = await supabase.client
    .from('workspaces')
    .update({ name: name.trim() })
    .eq('id', workspaceId)
    .select('id, name, created_at, updated_at')
    .maybeSingle()

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  if (!data) {
    res.status(404).json({ success: false, error: 'workspace_not_found' })
    return
  }

  res.status(200).json({ success: true, workspace: data })
})

export default router

