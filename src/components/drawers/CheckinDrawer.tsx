import { useStore } from '../../store/useStore'
import { stations } from '../../data/fixtures'
import { briefFor, depositFor, st, svcParts } from '../../lib/logic'
import type { Service } from '../../data/types'
import { Drawer, DrawerClose } from './Drawer'

export function CheckinDrawer() {
  const s = useStore()
  const a = s.apts.find((x) => x.id === s.activeId)
  const close = () => s.patch({ drawer: null, activeId: null, edit: null })
  if (!a) return null
  const stf = st(a.staff)
  const c = s.allClients().find((x) => x.id === a.cid)
  const dept = (svcParts(a.service)[0] || ({} as Service)).cat || 'Hair'
  const deptStations = stations.filter((x) => x.dept === dept)
  const list = deptStations.length ? deptStations : stations
  const brief = briefFor(c)

  const rows = [
    { k: 'Booked via', v: a.channel + (a.channel === 'Staff' ? ' — added by Maher for a friend' : '') },
    a.note ? { k: 'Note at booking', v: a.note } : null,
    { k: 'Service', v: a.service },
    { k: 'With', v: stf.name + ' · ' + stf.role },
    { k: 'Reminder', v: 'Delivered yesterday 18:00 · confirmed by reply “yes”' },
    { k: 'Deposit', v: depositFor(a, c) },
  ].filter(Boolean) as { k: string; v: string }[]

  return (
    <Drawer width={470} onClose={close}>
      <div style={{ padding: '22px 24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Reception check-in</div>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 24, paddingTop: 4 }}>{a.client}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.5)', paddingTop: 3 }}>{a.channel + ' reservation · ' + a.time + ' · ' + stf.name}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <DrawerClose onClose={close} />
          </div>
        </div>

        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', padding: '20px 0 8px' }}>Verify the reservation</div>
        <div style={{ background: '#f3ead6', borderRadius: 11, padding: '12px 14px' }}>
          {rows.map((r, i) => (
            <div key={r.k} style={{ display: 'flex', gap: 12, padding: '6px 0', borderTop: i ? '1px solid rgba(0,0,0,.08)' : 'none' }}>
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,.45)', width: 120, flex: 'none' }}>{r.k}</span>
              <span style={{ fontSize: 12, lineHeight: 1.4 }}>{r.v}</span>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', padding: '20px 0 8px' }}>Brief the staff — from her dossier</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {brief.map((b, i) => (
            <div key={i} style={{ border: '1px solid rgba(0,0,0,.14)', borderRadius: 10, padding: '9px 11px' }}>
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: b.fg }}>{b.tag}</span>
              <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'rgba(0,0,0,.72)', paddingTop: 3 }}>{b.text}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', padding: '20px 0 8px' }}>Assign station — {dept.toLowerCase()} only</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {list.map((x) => {
            const on = s.station === x.name
            return (
              <button key={x.name} onClick={() => s.patch({ station: x.name })} style={{ border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '7px 13px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : 'transparent', color: on ? '#FEFEF1' : 'rgba(0,0,0,.7)' }}>
                {x.name}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 24 }}>
          <button onClick={close} style={{ flex: 'none', border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '11px 18px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => s.bump(a.id, 'reception', { station: s.station })} style={{ flex: 1, border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '11px 18px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Check in &amp; notify {stf.name}
          </button>
        </div>
      </div>
    </Drawer>
  )
}
