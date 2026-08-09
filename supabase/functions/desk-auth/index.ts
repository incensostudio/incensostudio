// desk-auth — front-desk sign-in for Incenso Studio.
//
// Two actions, both POST JSON:
//   { "action": "chips" }                        -> list of sign-in chips (no secrets)
//   { "action": "login", "deskUserId", "pin" }   -> verify passcode, return a session
//
// The service-role key never leaves this function. Passcodes are verified in
// Postgres (bcrypt via the desk_verify RPC, with a 6-try / 15-min lockout).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

  let payload: { action?: string; deskUserId?: string; pin?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }

  // --- List sign-in chips (safe columns only) -------------------------------
  if (payload.action === 'chips') {
    const { data, error } = await admin.rpc('desk_chips')
    if (error) return json({ error: 'Could not load users' }, 500)
    return json({ chips: data })
  }

  // --- Login ----------------------------------------------------------------
  if (payload.action === 'login') {
    const { deskUserId, pin } = payload
    if (!deskUserId || !pin || !/^\d{4,8}$/.test(pin)) return json({ error: 'Invalid input' }, 400)

    const { data: rows, error } = await admin.rpc('desk_verify', { p_id: deskUserId, p_pin: pin })
    if (error) return json({ error: 'Verification failed' }, 500)
    const v = Array.isArray(rows) ? rows[0] : rows
    if (!v || !v.ok) {
      if (v && v.locked) return json({ error: 'locked' }, 429)
      return json({ error: 'invalid' }, 401)
    }

    // Mint a real Supabase session for the linked auth account.
    const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
    const { data: sess, error: signErr } = await anon.auth.signInWithPassword({
      email: v.email,
      password: v.secret,
    })
    if (signErr || !sess.session) return json({ error: 'Sign-in failed' }, 500)

    // Public profile of who just signed in.
    const { data: du } = await admin
      .from('desk_users')
      .select('id,name,initials,role,role_label,colour')
      .eq('id', deskUserId)
      .single()

    return json({
      session: {
        access_token: sess.session.access_token,
        refresh_token: sess.session.refresh_token,
      },
      user: du,
    })
  }

  return json({ error: 'Unknown action' }, 400)
})
