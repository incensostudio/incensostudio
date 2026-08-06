import { create } from 'zustand'

// Demo-only staff auth. In production this would be real Supabase Auth scoped
// to the salon; here a session flag gates the back-office.
const KEY = 'incenso-staff'

interface AuthState {
  authed: boolean
  who: string
  signIn: (who: string) => void
  signOut: () => void
}

function initial(): { authed: boolean; who: string } {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return { authed: true, who: JSON.parse(raw).who || 'Staff' }
  } catch {
    /* ignore */
  }
  return { authed: false, who: '' }
}

export const useAuth = create<AuthState>((set) => ({
  ...initial(),
  signIn: (who) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ who }))
    } catch {
      /* ignore */
    }
    set({ authed: true, who })
  },
  signOut: () => {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    set({ authed: false, who: '' })
  },
}))
