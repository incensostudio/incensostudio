import { useStore } from '../store/useStore'
import type { ViewKey } from '../data/types'

const roleNames: Record<string, string> = { owner: 'Owner', manager: 'Manager', reception: 'Reception', staff: 'Staff — Rania' }
const actorFor: Record<string, string> = { 'Checkout to approve': 'Staff', 'Client incoming': 'Reception', 'In service': 'Staff', Payment: 'Reception' }
const jumpFor: Record<string, ViewKey> = { Stock: 'stock', Mind: 'mind', Payment: 'finance', Booking: 'calendar', 'No-show': 'calendar' }

const staticFeed = [
  { t: '10:41', dot: '#7a3b5f', text: 'Joud closed Nour Khalil — 2 services, 2 products, $80', actor: 'Staff' },
  { t: '10:38', dot: '#6b7a4a', text: 'Rania accepted Tala Fares at station 2', actor: 'Staff' },
  { t: '10:34', dot: '#3b4a7a', text: 'Rim Aoun checked in — keratin verified against booking', actor: 'Reception' },
  { t: '10:22', dot: '#b4462f', text: 'Oxydant 6% dropped below reorder point during Tala’s formula', actor: 'System' },
  { t: '10:05', dot: '#000', text: 'Layal Haddad paid $434 by OMT — thank-you sent to WhatsApp', actor: 'Reception' },
  { t: '09:52', dot: '#b07d1a', text: 'Mind drafted 8 client messages for today — none send without approval', actor: 'Mind' },
]
const floorWatch = [
  { tag: 'Margin', tagFg: '#e5c07a', text: 'Nour’s ticket is running 95% margin — $4 of product on $80. Best of the day.' },
  { tag: 'Timing', tagFg: '#9fc08a', text: 'Rania is 12 min behind. Maya’s 14:00 consult is the only slack — hold it.' },
  { tag: 'Risk', tagFg: '#e59a8a', text: 'Rim’s keratin needs 220ml of solution. Only 340ml on hand and a 12:00 booking wants 180ml.' },
]

export function NotificationPanel() {
  const s = useStore()
  const close = () => s.patch({ notifOpen: false })
  const visible = s.notifs.filter((n) => n.roles.indexOf(s.role) >= 0)
  const unread = visible.filter((n) => !n.read).length
  const tab = s.notifTab || 'notifs'

  const liveFeed = s.notifs.filter((n) => String(n.id).length > 4).slice(0, 4).map((n) => ({ t: 'now', dot: n.dot, text: n.text, actor: actorFor[n.kind] || 'System' }))
  const feed = liveFeed.concat(staticFeed).slice(0, 7)

  const tabs = [
    ['notifs', 'Alerts', String(unread)],
    ['feed', 'Activity', String(feed.length)],
    ['watch', 'Floor watch', String(floorWatch.length)],
  ] as const

  const goNotif = (n: (typeof visible)[number]) => {
    s.save({ notifs: s.notifs.map((x) => (x.id === n.id ? { ...x, read: true } : x)) })
    if (n.kind === 'Checkout to approve') {
      const t = s.apts.find((x) => x.stage === 'review')
      s.patch({ notifOpen: false, view: 'floor' })
      if (t) s.advance(t.id)
      return
    }
    const dest = jumpFor[n.kind] || 'floor'
    const ok = s.viewsFor(s.role)
    s.patch({ notifOpen: false, view: ok.indexOf(dest) >= 0 ? dest : 'floor' })
  }

  return (
    <>
      <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.28)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 388, background: '#FEFEF1', zIndex: 61, overflowY: 'auto', animation: 'drawerIn .22s ease', boxShadow: '-8px 0 40px rgba(0,0,0,.14)' }}>
        <div style={{ padding: '20px 22px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 18 }}>What is happening</span>
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>{roleNames[s.role]}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, paddingTop: 12 }}>
            {tabs.map(([k, label, count]) => {
              const on = tab === k
              return (
                <button key={k} onClick={() => s.patch({ notifTab: k })} style={{ border: 0, borderRadius: 999, padding: '6px 12px', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : 'transparent', color: on ? '#FEFEF1' : 'rgba(0,0,0,.6)' }}>
                  {label} {count !== '0' && <span style={{ opacity: 0.7 }}>{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '4px 16px 22px' }}>
          {tab === 'notifs' && (
            <>
              <button onClick={() => s.save({ notifs: s.notifs.map((n) => ({ ...n, read: true })) })} style={{ border: '1px solid rgba(0,0,0,.16)', background: 'none', borderRadius: 999, padding: '6px 12px', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 8 }}>Mark all read</button>
              {visible.map((n) => (
                <div key={n.id} style={{ background: n.read ? 'transparent' : '#f5efe0', borderRadius: 10, padding: '11px 12px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: n.dot, flex: 'none' }} />
                    <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,.55)' }}>{n.kind}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.4)' }}>{n.t}</span>
                  </div>
                  <button onClick={() => goNotif(n)} style={{ display: 'block', textAlign: 'left', border: 0, background: 'none', padding: '6px 0 2px', cursor: 'pointer', fontSize: 12, lineHeight: 1.5, color: 'rgba(0,0,0,.8)' }}>{n.text}</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'rgba(0,0,0,.4)' }}>to {n.to}</span>
                    {!n.read && (
                      <button onClick={() => s.save({ notifs: s.notifs.map((x) => (x.id === n.id ? { ...x, read: true } : x)) })} style={{ marginLeft: 'auto', border: 0, background: 'none', fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,.4)', cursor: 'pointer' }}>Mark read</button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'feed' && feed.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '9px 4px', borderTop: i ? '1px solid rgba(0,0,0,.06)' : 'none' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: f.dot, flex: 'none', marginTop: 4 }} />
              <div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>{f.text}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,.4)', paddingTop: 2 }}>{f.actor} · {f.t}</div>
              </div>
            </div>
          ))}

          {tab === 'watch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {floorWatch.map((w, i) => (
                <div key={i} style={{ background: '#000', color: '#FEFEF1', borderRadius: 11, padding: '12px 14px' }}>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.12em', textTransform: 'uppercase', color: w.tagFg }}>{w.tag}</span>
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(254,254,241,.86)', paddingTop: 5 }}>{w.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
