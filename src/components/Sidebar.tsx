import { useStore } from '../store/useStore'
import { useAuth } from '../os/auth'
import { threads, decisions } from '../data/fixtures'
import type { Role, ViewKey } from '../data/types'
import { Wordmark, NavIcon } from './icons'

const GROUPS: { title: string; items: { key: ViewKey; label: string; badgeKind?: 'open' | 'threads' | 'pend' | 'mind'; alert?: boolean }[] }[] = [
  {
    title: 'Operations',
    items: [
      { key: 'floor', label: "Today's Floor", badgeKind: 'open' },
      { key: 'calendar', label: 'Calendar' },
      { key: 'inbox', label: 'Inbox', badgeKind: 'threads', alert: true },
      { key: 'queue', label: 'Send Queue', badgeKind: 'pend', alert: true },
    ],
  },
  { title: 'Relationships', items: [{ key: 'clients', label: 'Client Book' }, { key: 'portal', label: 'Client Portal' }, { key: 'team', label: 'Team' }] },
  { title: 'Inventory', items: [{ key: 'stock', label: 'Products & Stock' }, { key: 'retail', label: 'Retail' }] },
  { title: 'Intelligence', items: [{ key: 'mind', label: 'Incenso Mind', badgeKind: 'mind' }, { key: 'finance', label: 'Finance' }] },
]

const roleScopes: Record<Role, string> = {
  owner: 'Full visibility. Every station, every ticket, every margin, every AI decision.',
  manager: 'Floor, stock, team and queue control. Financial summaries without payroll detail.',
  reception: 'Check-in, checkout approval, payments and the client message queue.',
  staff: 'Your own column, your clients, your product log and your performance.',
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const s = useStore()
  const signOut = useAuth((a) => a.signOut)
  const allowed = s.viewsFor(s.role)
  const go = (v: ViewKey) => {
    s.go(v)
    onNavigate?.()
  }

  const floorOpen = s.apts.filter((a) => (a.day || 0) === 0 && a.stage !== 'paid' && a.stage !== 'cancelled').length
  const unreadThreads = threads.filter((t) => t.unread && (s.readThreads || []).indexOf(t.id) < 0).length
  const pendCount = (s.msgs || []).filter((m) => m.status === 'pending').length
  const minePending = decisions.filter((d) => (s.mindLater || []).indexOf(d.title) < 0 && (s.mindDone || []).indexOf(d.title) < 0).length

  const badgeFor = (kind?: string): number => {
    if (kind === 'open') return floorOpen
    if (kind === 'threads') return unreadThreads
    if (kind === 'pend') return pendCount
    if (kind === 'mind') return minePending
    return 0
  }

  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => allowed.indexOf(it.key) >= 0) })).filter((g) => g.items.length)

  const roleBtns: { r: Role; label: string }[] = [
    { r: 'owner', label: 'Owner' },
    { r: 'manager', label: 'Manager' },
    { r: 'reception', label: 'Reception' },
    { r: 'staff', label: 'Staff' },
  ]

  return (
    <aside style={{ width: 238, flex: 'none', minHeight: 0, overflowY: 'auto', background: '#FEFEF1', borderRight: '1px solid rgba(0,0,0,.14)', display: 'flex', flexDirection: 'column', padding: '22px 14px 14px' }}>
      <div style={{ padding: '4px 10px 20px' }}>
        <Wordmark />
      </div>

      {groups.map((g) => (
        <div key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,.32)', padding: '14px 12px 6px' }}>{g.title}</div>
          {g.items.map((it) => {
            const on = it.key === s.view
            const count = badgeFor(it.badgeKind)
            const showBadge = !!it.badgeKind && count > 0
            const badgeBg = it.alert ? '#b4462f' : it.badgeKind === 'mind' ? '#000' : 'transparent'
            const badgeFg = badgeBg !== 'transparent' ? '#FEFEF1' : on ? 'rgba(254,254,241,.65)' : 'rgba(0,0,0,.45)'
            return (
              <button
                key={it.key}
                onClick={() => go(it.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 12px', border: 0, borderRadius: 7, cursor: 'pointer', fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', background: on ? '#000' : 'transparent', color: on ? '#FEFEF1' : 'rgba(0,0,0,.72)' }}
              >
                <NavIcon view={it.key} />
                <span style={{ minWidth: 0 }}>{it.label}</span>
                {showBadge && (
                  <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 9, background: badgeBg, color: badgeFg, borderRadius: 999, padding: '1px 6px' }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      ))}

      <div style={{ flex: 1, minHeight: 8 }} />

      <div style={{ borderTop: '1px solid rgba(0,0,0,.12)', padding: '12px 10px 2px' }}>
        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,.32)' }}>Signed in as</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 8 }}>
          {roleBtns.map((b) => {
            const on = s.role === b.r
            return (
              <button
                key={b.r}
                onClick={() => s.switchRole(b.r)}
                style={{ border: '1px solid rgba(0,0,0,.16)', borderRadius: 6, padding: '6px 4px', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : 'transparent', color: on ? '#FEFEF1' : 'rgba(0,0,0,.7)' }}
              >
                {b.label}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: 10.5, lineHeight: 1.45, color: 'rgba(0,0,0,.5)', paddingTop: 9 }}>{roleScopes[s.role]}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10 }}>
          <button
            onClick={() => s.resetDemo()}
            style={{ border: 0, background: 'none', fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: s.resetArm ? '#b4462f' : 'rgba(0,0,0,.35)', cursor: 'pointer', padding: '2px 0' }}
          >
            {s.resetArm ? 'Tap again to wipe it all' : 'Reset demo data'}
          </button>
          <button
            onClick={() => { onNavigate?.(); signOut() }}
            style={{ marginLeft: 'auto', border: 0, background: 'none', fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.35)', cursor: 'pointer', padding: '2px 0' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
