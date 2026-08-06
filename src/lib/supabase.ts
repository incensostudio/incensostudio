import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Supabase is optional. When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set
 * the persisted slice is synced to the `os_state` table; otherwise the app runs
 * entirely on localStorage. This lets the UI work with or without a backend.
 */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export const supabaseEnabled = !!supabase

// A single logical workspace for this prototype. In a real deployment this
// would be the authenticated salon/tenant id.
export const WORKSPACE_ID = 'incenso-demo'
