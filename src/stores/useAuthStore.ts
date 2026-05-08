import { create } from 'zustand'
import { appService } from '@/services'

export type AuthUser = { id: string; email: string | null; username: string }

type AuthSession = {
  access_token: string
  refresh_token: string
  expires_at: number | null
}

type AuthState = {
  status: 'loading' | 'anonymous' | 'authenticated'
  user: AuthUser | null
  session: AuthSession | null
  error: string | null
  init: () => Promise<void>
  signIn: (username: string, password: string) => Promise<boolean>
  signUp: (username: string, password: string) => Promise<boolean>
  signOut: () => void
}

const STORAGE_KEY = 'auth_session'

function readStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.access_token || !parsed?.refresh_token) return null
    return parsed
  } catch {
    return null
  }
}

function storeSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  session: null,
  error: null,
  init: async () => {
    const stored = readStoredSession()
    if (!stored) {
      set({ status: 'anonymous', user: null, session: null, error: null })
      return
    }

    set({ status: 'loading', error: null, session: stored })
    const res = await appService.repos.auth.me(stored.access_token)
    if (res.ok === true) {
      set({ status: 'authenticated', user: { ...res.data.user, email: res.data.user.email }, error: null })
      return
    }
    storeSession(null)
    set({ status: 'anonymous', user: null, session: null, error: res.error })
  },
  signIn: async (username, password) => {
    set({ status: 'loading', error: null })
    const res = await appService.repos.auth.signIn(username, password)
    if (res.ok === false) {
      set({ status: 'anonymous', error: res.error, user: null, session: null })
      return false
    }
    const session: AuthSession = {
      access_token: res.data.session.accessToken,
      refresh_token: res.data.session.accessToken,
      expires_at: res.data.session.expiresAt,
    }
    storeSession(session)
    set({ status: 'authenticated', user: { ...res.data.user, email: res.data.user.email }, session, error: null })
    return true
  },
  signUp: async (username, password) => {
    set({ status: 'loading', error: null })
    const res = await appService.repos.auth.signUp(username, password)
    if (res.ok === false) {
      set({ status: 'anonymous', error: res.error, user: null, session: null })
      return false
    }
    const session: AuthSession = {
      access_token: res.data.session.accessToken,
      refresh_token: res.data.session.accessToken,
      expires_at: res.data.session.expiresAt,
    }
    storeSession(session)
    set({ status: 'authenticated', user: { ...res.data.user, email: res.data.user.email }, session, error: null })
    return true
  },
  signOut: () => {
    const token = readStoredSession()?.access_token
    if (token) void appService.repos.auth.signOut(token)
    storeSession(null)
    set({ status: 'anonymous', user: null, session: null, error: null })
  },
}))
