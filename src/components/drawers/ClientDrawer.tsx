import { useStore } from '../../store/useStore'
import { money } from '../../lib/logic'
import { Drawer, DrawerClose } from './Drawer'

export function ClientDrawer() {
  const s = useStore()
  const close = () => s.patch({ drawer: null, activeId: null, edit: null })
  const c = s.allClients().find((x) => x.id === s.activeClient) || s.allClients()[0]
  if (!c) return null
  const tierBg = c.tier === 'Gold' ? '#f2e6d9' : c.tier === 'Silver' ? '#e8e4dc' : c.tier === 'New' ? '#e6e2f2' : '#eae6de'
  const stateBg = c.state === 'At risk' ? '#f4e0da' : c.state === 'First visit' ? '#e6e2f2' : '#e2ebdd'
  const stats = [
    { k: 'Visits', v: String(c.visits) },
    { k: 'Lifetime', v: money(c.ltv) },
    { k: 'Avg ticket', v: c.visits ? money(c.ltv / c.visits) : '—' },
    { k: 'Books via', v: c.channel },
    { k: 'Asks for', v: c.fav },
    { k: 'Next predicted', v: c.next },
  ]

  const chip = (label: string, bg: string) => (
    <span style={{ background: bg, borderRadius: 999, padding: '3px 9px', fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
  )

  return (
    <Drawer width={498} onClose={close}>
      <div style={{ padding: '22px 24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {chip(c.tier, tierBg)}
          {chip(c.state, stateBg)}
          <div style={{ marginLeft: 'auto' }}><DrawerClose onClose={close} /></div>
        </div>
        <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 27, paddingTop: 10 }}>{c.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{c.phone} · client since {c.since}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(0,0,0,.08)', border: '1px solid rgba(0,0,0,.08)', borderRadius: 11, overflow: 'hidden', marginTop: 16 }}>
          {stats.map((st2) => (
            <div key={st2.k} style={{ background: '#f7f2e4', padding: '11px 12px' }}>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>{st2.k}</div>
              <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 18, paddingTop: 3 }}>{st2.v}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#000', color: '#FEFEF1', borderRadius: 11, padding: '13px 15px', marginTop: 12 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: '#e5c07a' }}>Her formula on file</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(254,254,241,.9)', paddingTop: 5 }}>{c.formula}</div>
        </div>

        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(0,0,0,.55)', padding: '16px 0 10px' }}>
          Nobody typed these into a form. Staff wrote them across her visits — every one shows up before the person who meets her next.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.dossier.map((g) => (
            <div key={g.k} style={{ border: '1px solid rgba(0,0,0,.14)', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: g.fg }}>{g.k}</div>
              <ul style={{ margin: '7px 0 0', paddingLeft: 16 }}>
                {g.items.map((it, i) => (
                  <li key={i} style={{ fontSize: 12, lineHeight: 1.55, color: 'rgba(0,0,0,.75)', paddingBottom: 2 }}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 20 }}>
          <button
            onClick={() => { s.patch({ drawer: null, view: 'inbox' }); s.showToast('Inbox open — reply to ' + c.name.split(' ')[0] + ' on the channel she uses') }}
            style={{ flex: 1, border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '11px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Message her
          </button>
          <button
            onClick={() => {
              s.patch({ drawer: 'newbooking', nbClient: c.id, nbNewOn: false, nbQ: '', nbSrcs: [], nbNote: '', nbSvcs: [], nbSvcQ: '', nbSvcCat: 'All', nbPlan: {}, nbDay: 0 })
              s.showToast('New reservation for ' + c.name + ' — start with where she came from')
            }}
            style={{ flex: 1, border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '11px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Book her in
          </button>
        </div>
      </div>
    </Drawer>
  )
}
