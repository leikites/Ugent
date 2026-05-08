import { createClient } from '@supabase/supabase-js'

type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; username: string | null; created_at: string; updated_at: string }
        Insert: { id: string; email?: string | null; username?: string | null; created_at?: string; updated_at?: string }
        Update: { email?: string | null; username?: string | null; updated_at?: string }
        Relationships: []
      }
      workspaces: {
        Row: { id: string; owner_id: string; name: string; created_at: string; updated_at: string }
        Insert: { id?: string; owner_id: string; name: string; created_at?: string; updated_at?: string }
        Update: { name?: string; updated_at?: string }
        Relationships: []
      }
      projects: {
        Row: { id: string; workspace_id: string; owner_id: string; name: string; created_at: string; updated_at: string }
        Insert: { id?: string; workspace_id: string; owner_id: string; name: string; created_at?: string; updated_at?: string }
        Update: { name?: string; updated_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type SupabaseInitResult =
  | { ok: true; client: ReturnType<typeof createClient<Database>> }
  | { ok: false; error: string }

export function getSupabaseAnon(): SupabaseInitResult {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!url) return { ok: false, error: 'missing_supabase_url' }
  if (!anonKey) return { ok: false, error: 'missing_supabase_anon_key' }

  return { ok: true, client: createClient<Database>(url, anonKey) }
}

export function getSupabaseAdmin(): SupabaseInitResult {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) return { ok: false, error: 'missing_supabase_url' }
  if (!serviceRoleKey) return { ok: false, error: 'missing_supabase_service_role_key' }

  return { ok: true, client: createClient<Database>(url, serviceRoleKey) }
}

export function getSupabaseForToken(token: string): SupabaseInitResult {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!url) return { ok: false, error: 'missing_supabase_url' }
  if (!anonKey) return { ok: false, error: 'missing_supabase_anon_key' }
  if (!token) return { ok: false, error: 'missing_token' }

  return {
    ok: true,
    client: createClient<Database>(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }),
  }
}
