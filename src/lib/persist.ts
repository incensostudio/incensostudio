// ---------------------------------------------------------------------------
// Persistence layer for the PersistedState slice.
// localStorage is the source of truth for instant reads/writes; when Supabase
// is configured, writes are mirrored (debounced) and the initial load prefers
// the server row so state follows the user across devices.
// ---------------------------------------------------------------------------

import type { PersistedState } from '../data/types'
import { supabase, supabaseEnabled, WORKSPACE_ID } from './supabase'

const KEY = 'incenso-os-v2'

export function loadLocal(): Partial<PersistedState> | null {
  try {
    const s = localStorage.getItem(KEY)
    return s ? (JSON.parse(s) as Partial<PersistedState>) : null
  } catch {
    return null
  }
}

export function saveLocal(state: PersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function clearLocal() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export async function loadRemote(): Promise<Partial<PersistedState> | null> {
  if (!supabaseEnabled || !supabase) return null
  try {
    const { data, error } = await supabase.from('os_state').select('state').eq('id', WORKSPACE_ID).maybeSingle()
    if (error || !data) return null
    return data.state as Partial<PersistedState>
  } catch {
    return null
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
export function saveRemote(state: PersistedState) {
  if (!supabaseEnabled || !supabase) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    supabase!
      .from('os_state')
      .upsert({ id: WORKSPACE_ID, state, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.warn('[incenso] remote save failed:', error.message)
      })
  }, 600)
}

export async function clearRemote() {
  if (!supabaseEnabled || !supabase) return
  try {
    await supabase.from('os_state').delete().eq('id', WORKSPACE_ID)
  } catch {
    /* ignore */
  }
}
