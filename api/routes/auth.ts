import { Router, type Request, type Response } from 'express'
import { getSupabaseAdmin, getSupabaseAnon } from '../lib/supabase.js'

const router = Router()

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isValidPassword(password: string) {
  return password.length >= 8
}

function isValidUsername(username: string) {
  if (username.length < 3) return false
  if (username.length > 24) return false
  return /^[a-zA-Z0-9_]+$/.test(username)
}

function usernameToEmail(username: string) {
  return `${username}@users.uuugent.local`
}

function emailToUsername(email: string | null | undefined) {
  if (!email) return ''
  const suffix = '@users.uuugent.local'
  if (email.endsWith(suffix)) return email.slice(0, -suffix.length)
  return email
}

function readBearerToken(req: Request): string {
  const raw = readString(req.headers.authorization)
  const match = /^Bearer\s+(.+)$/i.exec(raw)
  return match?.[1] ?? ''
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const admin = getSupabaseAdmin()
  if (admin.ok === false) {
    res.status(500).json({ success: false, error: admin.error })
    return
  }

  const anon = getSupabaseAnon()
  if (anon.ok === false) {
    res.status(500).json({ success: false, error: anon.error })
    return
  }

  const username = readString(req.body?.username).trim()
  const password = readString(req.body?.password)

  if (!isValidUsername(username)) {
    res.status(400).json({ success: false, error: 'invalid_username' })
    return
  }

  if (!isValidPassword(password)) {
    res.status(400).json({ success: false, error: 'invalid_password' })
    return
  }

  const email = usernameToEmail(username)

  const { data, error } = await admin.client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  })

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  const signInRes = await anon.client.auth.signInWithPassword({ email, password })
  if (signInRes.error) {
    res.status(500).json({ success: false, error: signInRes.error.message })
    return
  }

  res.status(200).json({
    success: true,
    user: data.user ? { id: data.user.id, email: data.user.email, username: emailToUsername(data.user.email) } : null,
    session: signInRes.data.session
      ? {
          access_token: signInRes.data.session.access_token,
          refresh_token: signInRes.data.session.refresh_token,
          expires_at: signInRes.data.session.expires_at,
        }
      : null,
  })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const supabase = getSupabaseAnon()
  if (supabase.ok === false) {
    res.status(500).json({ success: false, error: supabase.error })
    return
  }

  const username = readString(req.body?.username).trim()
  const password = readString(req.body?.password)

  if (!isValidUsername(username)) {
    res.status(400).json({ success: false, error: 'invalid_username' })
    return
  }

  if (!isValidPassword(password)) {
    res.status(400).json({ success: false, error: 'invalid_password' })
    return
  }

  const email = usernameToEmail(username)

  const { data, error } = await supabase.client.auth.signInWithPassword({ email, password })
  if (error) {
    res.status(401).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({
    success: true,
    user: data.user ? { id: data.user.id, email: data.user.email, username: emailToUsername(data.user.email) } : null,
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        }
      : null,
  })
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  void req
  res.status(200).json({
    success: true,
  })
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const supabase = getSupabaseAnon()
  if (supabase.ok === false) {
    res.status(500).json({ success: false, error: supabase.error })
    return
  }

  const token = readBearerToken(req)

  if (!token) {
    res.status(401).json({ success: false, error: 'missing_token' })
    return
  }

  const { data, error } = await supabase.client.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ success: false, error: 'invalid_token' })
    return
  }

  res.status(200).json({
    success: true,
    user: { id: data.user.id, email: data.user.email, username: emailToUsername(data.user.email) },
  })
})

export default router
