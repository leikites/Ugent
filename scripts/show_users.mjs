import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 })
if (usersError) {
  console.error(usersError.message)
  process.exit(1)
}

const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, username, email, created_at')
  .order('created_at', { ascending: false })
  .limit(50)

if (profilesError) {
  console.error(profilesError.message)
  process.exit(1)
}

console.log(JSON.stringify({
  auth_users: users.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    username: u.user_metadata?.username ?? null,
  })),
  profiles,
}, null, 2))
