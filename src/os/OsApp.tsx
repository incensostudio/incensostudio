import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { useAuth } from './auth'
import { useIsMobile } from '../lib/useIsMobile'
import type { ViewKey } from '../data/types'
import { Sidebar } from '../components/Sidebar'
import { Header } from '../components/Header'
import { Toast } from '../components/Toast'
import { NotificationPanel } from '../components/NotificationPanel'
import { Overlays } from '../components/Overlays'
import { StaffLogin } from './StaffLogin'

import { Floor } from '../views/Floor'
import { Calendar } from '../views/Calendar'
import { Inbox } from '../views/Inbox'
import { Queue } from '../views/Queue'
import { Clients } from '../views/Clients'
import { Portal } from '../views/Portal'
import { Team } from '../views/Team'
import { Stock } from '../views/Stock'
import { Retail } from '../views/Retail'
import { Mind } from '../views/Mind'
import { Finance } from '../views/Finance'

const views: Record<ViewKey, () => JSX.Element> = {
  floor: Floor,
  calendar: Calendar,
  inbox: Inbox,
  queue: Queue,
  clients: Clients,
  portal: Portal,
  team: Team,
  stock: Stock,
  retail: Retail,
  mind: Mind,
  finance: Finance,
}

export function OsApp() {
  const authed = useAuth((s) => s.authed)
  const s = useStore()
  const mobile = useIsMobile()
  const [navOpen, setNavOpen] = useState(false)
  const allowed = s.viewsFor(s.role)
  const view = allowed.indexOf(s.view) >= 0 ? s.view : 'floor'
  const ViewComp = views[view]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const st = useStore.getState()
      if (st.calEdit) return st.patch({ calEdit: null, calEditDay: null, calEditStaff: null, calEditTime: null })
      if (st.drawer) return st.patch({ drawer: null, activeId: null, edit: null })
      if (st.notifOpen) return st.patch({ notifOpen: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!authed) return <StaffLogin />

  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100%', overflow: 'hidden', background: '#e5dcc9' }}>
      {/* Desktop sidebar */}
      {!mobile && <Sidebar />}

      {/* Mobile sidebar drawer */}
      {mobile && navOpen && (
        <>
          <div onClick={() => setNavOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 70 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, height: '100dvh', zIndex: 71, animation: 'drawerIn .2s ease' }}>
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </>
      )}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header mobile={mobile} onMenu={() => setNavOpen(true)} />
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <ViewComp />
        </div>
      </main>

      {s.notifOpen && <NotificationPanel />}
      <Overlays />
      <Toast />
    </div>
  )
}
