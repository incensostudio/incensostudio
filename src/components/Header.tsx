import { useStore } from '../store/useStore'
import type { ViewKey } from '../data/types'
import { AskSquare, BellIcon } from './icons'

const titles: Record<ViewKey, [string, string]> = {
  floor: ["Today's Floor", 'Friday 31 July — live pipeline'],
  inbox: ['Inbox', 'Every channel in one thread list'],
  portal: ['Client Portal', 'What she sees when she signs in'],
  calendar: ['Calendar', 'Every chair, every day'],
  queue: ['Send Queue', 'Nothing leaves without a human yes'],
  clients: ['Client Book', '1,284 profiles — AI-organised'],
  team: ['Team', 'Performance, product discipline, access'],
  stock: ['Products & Stock', 'Millilitre-level consumption intelligence'],
  retail: ['Retail', 'Shelf, web, app and social'],
  mind: ['Incenso Mind', 'Your business manager'],
  finance: ['Finance', 'July — month to date'],
}

export function Header({ mobile = false, onMenu }: { mobile?: boolean; onMenu?: () => void } = {}) {
  const s = useStore()
  const [title, sub] = titles[s.view] || titles.floor
  const unread = s.notifs.filter((n) => n.roles.indexOf(s.role) >= 0 && !n.read).length

  return (
    <header style={{ flex: 'none', height: 60, background: '#FEFEF1', borderBottom: '1px solid rgba(0,0,0,.14)', display: 'flex', alignItems: 'center', gap: mobile ? 10 : 14, padding: mobile ? '0 12px' : '0 20px' }}>
      {mobile && (
        <button onClick={onMenu} aria-label="Menu" style={{ width: 36, height: 36, flex: 'none', border: '1px solid rgba(0,0,0,.18)', borderRadius: 9, background: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" stroke="#000" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 11, minWidth: 0 }}>
        <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: mobile ? 17 : 19, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>{title}</span>
        {!mobile && <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>{sub}</span>}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
        {mobile ? (
          <button onClick={() => s.openNew()} aria-label="New reservation" style={{ width: 36, height: 36, borderRadius: 999, background: '#000', color: '#FEFEF1', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>+</button>
        ) : (
          <button
            onClick={() => s.openNew()}
            style={{ background: '#000', color: '#FEFEF1', border: 0, borderRadius: 999, padding: '9px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            New reservation
          </button>
        )}
        <button
          onClick={() => s.patch({ drawer: s.drawer === 'ask' ? null : 'ask' })}
          aria-label="Ask Incenso"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(0,0,0,.2)', background: '#FEFEF1', borderRadius: 999, padding: mobile ? 0 : '8px 14px', width: mobile ? 36 : undefined, height: mobile ? 36 : undefined, justifyContent: 'center', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          <AskSquare />
          {!mobile && 'Ask Incenso'}
        </button>
        <button
          onClick={() => s.patch({ notifOpen: !s.notifOpen, notifTab: s.notifTab || 'notifs' })}
          style={{ position: 'relative', width: 36, height: 36, borderRadius: 999, border: '1px solid rgba(0,0,0,.2)', background: '#FEFEF1', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#000', flex: 'none' }}
          title="What is happening"
        >
          <BellIcon />
          {unread > 0 && (
            <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, background: '#b4462f', color: '#FEFEF1', borderRadius: 999, fontFamily: "'Geist Mono',monospace", fontSize: 9, display: 'grid', placeItems: 'center', padding: '0 3px' }}>{unread}</span>
          )}
        </button>
      </div>
    </header>
  )
}
