import { useState } from 'react'
import { C, F } from './lib/tokens'
import { useStore } from './store'
import { useNarrow } from './lib/useNarrow'
import { Logo } from './components/Logo'
import { SignIn } from './screens/SignIn'
import { Book } from './screens/Book'
import { Clients } from './screens/Clients'
import { Payments } from './screens/Payments'
import { TicketDrawer } from './drawers/TicketDrawer'
import { BookingDrawer } from './drawers/BookingDrawer'
import { ClientDrawer } from './drawers/ClientDrawer'
import { CloseDayDrawer } from './drawers/CloseDayDrawer'
import { dayName, todayStr } from './lib/format'

export type View = 'today' | 'clients' | 'pay'

export interface BookingSeed {
  name?: string; phone?: string; clientId?: string | null
  service?: string; staff?: string; date?: string
}
export type DrawerState =
  | { kind: 'ticket'; client: string; date: string }
  | { kind: 'booking'; seed?: BookingSeed }
  | { kind: 'client'; clientId: string }
  | { kind: 'close'; date: string }
  | null

export function App() {
  const s = useStore()
  const narrow = useNarrow()
  const [view, setView] = useState<View>('today')
  const [viewedDate, setViewedDate] = useState(todayStr())
  const [drawer, setDrawer] = useState<DrawerState>(null)

  if (!s.ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.sand }}>
        <div style={{ opacity: 0.5 }}><Logo height={26} /></div>
      </div>
    )
  }
  if (!s.user) return <SignIn />

  const today = todayStr()
  const todaysApts = s.appointments.filter((a) => a.date === today)
  const paidToday = todaysApts.filter((a) => a.stage === 'paid')

  const nav: { key: View; label: string; count: number }[] = [
    { key: 'today', label: 'The book', count: todaysApts.length },
    { key: 'clients', label: 'Clients', count: s.clients.length },
    { key: 'pay', label: 'Payments', count: paidToday.length },
  ]

  const openTicket = (client: string, date: string) => setDrawer({ kind: 'ticket', client, date })
  const openBooking = (seed?: BookingSeed) => setDrawer({ kind: 'booking', seed })
  const openClient = (clientId: string) => setDrawer({ kind: 'client', clientId })
  const openClose = (date: string) => setDrawer({ kind: 'close', date })
  const close = () => setDrawer(null)

  const header = {
    today: ['The book', dayName(viewedDate)],
    clients: ['Clients', `${s.clients.length} on file`],
    pay: ['Payments', dayName(today)],
  }[view]

  // ---------- Rail (desktop) / Tab bar (mobile) ----------
  const Rail = (
    <aside style={{
      width: narrow ? '100%' : 206, flex: 'none', background: C.cream,
      borderRight: narrow ? 'none' : `1px solid ${C.hair12}`,
      borderTop: narrow ? `1px solid ${C.hair12}` : 'none',
      display: 'flex', flexDirection: 'column',
      padding: narrow ? `6px 8px calc(6px + env(safe-area-inset-bottom))` : '16px 12px',
    }}>
      {!narrow && (
        <div style={{ padding: '4px 10px' }}>
          <Logo height={20} />
          <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,.4)', paddingTop: 7 }}>Beauty Studio</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: narrow ? 'row' : 'column', gap: narrow ? 4 : 2, paddingTop: narrow ? 0 : 18 }}>
        {nav.map((n) => {
          const on = view === n.key
          return (
            <button key={n.key} onClick={() => setView(n.key)}
              style={{
                display: 'flex', flexDirection: narrow ? 'column' : 'row', alignItems: 'center',
                justifyContent: narrow ? 'center' : 'flex-start', gap: narrow ? 3 : 9,
                flex: narrow ? 1 : undefined, minHeight: 44, width: '100%', textAlign: 'left',
                padding: narrow ? '6px 4px' : '9px 11px', border: 0, borderRadius: 7, cursor: 'pointer',
                fontFamily: F.mono, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase',
                background: on ? C.ink : 'transparent', color: on ? C.cream : 'rgba(0,0,0,.68)',
              }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, flex: 'none', background: on ? C.cream : C.mut25, display: narrow ? 'none' : 'block' }} />
              <span>{narrow ? n.label.replace('The book', 'Book') : n.label}</span>
              <span style={{ marginLeft: narrow ? 0 : 'auto', fontFamily: F.mono, fontSize: 9, color: on ? 'rgba(254,254,241,.6)' : 'rgba(0,0,0,.35)' }}>{n.count || ''}</span>
            </button>
          )
        })}
      </div>

      {!narrow && (
        <>
          <div style={{ flex: 1, minHeight: 8 }} />
          <div style={{ borderTop: `1px solid ${C.hair12}`, padding: '13px 10px 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontSize: 9, color: C.cream, background: s.user.colour }}>{s.user.initials}</span>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 12 }}>{s.user.name}</div>
                <div style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: C.mut42 }}>{s.user.role_label}</div>
              </div>
            </div>
            <button onClick={() => s.logout()} style={{ marginTop: 10, width: '100%', border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 7, padding: '8px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.mut45 }}>Sign out</button>
          </div>
        </>
      )}
    </aside>
  )

  return (
    <div style={{ display: 'flex', flexDirection: narrow ? 'column-reverse' : 'row', height: '100vh', width: '100%', overflow: 'hidden', background: C.sand }}>
      {Rail}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: narrow ? 'calc(12px + env(safe-area-inset-top)) 14px 12px' : '20px 26px 14px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.display, fontSize: 21 }}>{header[0]}</div>
            <div style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45, paddingTop: 3 }}>{header[1]}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => openBooking()} data-tap="fixed" style={{ border: 0, background: C.ink, color: C.cream, borderRadius: 999, padding: narrow ? '10px 14px' : '10px 16px', cursor: 'pointer', fontFamily: F.mono, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              {narrow ? '+ New' : '+ New booking'}
            </button>
            {narrow && (
              <button onClick={() => s.logout()} title="Sign out" style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '11px 15px', cursor: 'pointer', fontFamily: F.mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mut45 }}>Out</button>
            )}
          </div>
        </header>

        {/* Screen */}
        <div style={{ flex: 1, overflowY: 'auto', padding: narrow ? '0 14px 20px' : '0 26px 24px' }}>
          {view === 'today' && (
            <Book viewedDate={viewedDate} setViewedDate={setViewedDate} openTicket={openTicket} openBooking={openBooking} />
          )}
          {view === 'clients' && <Clients openClient={openClient} openTicket={openTicket} openBooking={openBooking} />}
          {view === 'pay' && <Payments openTicket={openTicket} openClose={openClose} />}
        </div>
      </main>

      {/* Drawers */}
      {drawer?.kind === 'ticket' && <TicketDrawer client={drawer.client} date={drawer.date} onClose={close} openBooking={openBooking} openClient={openClient} />}
      {drawer?.kind === 'booking' && <BookingDrawer seed={drawer.seed} onClose={close} />}
      {drawer?.kind === 'client' && <ClientDrawer clientId={drawer.clientId} onClose={close} openTicket={openTicket} />}
      {drawer?.kind === 'close' && <CloseDayDrawer date={drawer.date} onClose={close} />}

      {/* Toast */}
      {s.toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: narrow ? 88 : 26, transform: 'translateX(-50%)', zIndex: 60, background: C.ink, color: C.cream, borderRadius: 999, padding: '10px 18px', fontSize: 12.5, animation: 'toastIn .25s ease', maxWidth: '92vw', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,.25)' }}>
          {s.toast}
        </div>
      )}
    </div>
  )
}
