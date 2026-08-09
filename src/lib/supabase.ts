import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'incenso-auth',
  },
})

// The desk-auth Edge Function endpoint (handles PIN sign-in server-side).
export const DESK_AUTH_URL = `${SUPABASE_URL}/functions/v1/desk-auth`

export async function callDeskAuth(body: Record<string, unknown>) {
  const res = await fetch(DESK_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}
