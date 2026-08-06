import { useStore } from '../../store/useStore'
import { staff, svcCat, stations, stages } from '../../data/fixtures'
import { aptMin, clock, dayCards, freeAt, gridSlots, hm, money, st, svcParts, svcPrice } from '../../lib/logic'
import type { Appointment, Service } from '../../data/types'
import { Modal, DrawerClose } from './Drawer'

const cats = ['All', 'Hair', 'Nails', 'Makeup', 'Brows & Lashes']

export function BookingEditor() {
  const s = useStore()
  const ap = s.apts.find((x) => x.id === s.calEdit)
  const close = () => s.patch({ calEdit: null, calEditDay: null, calEditStaff: null, calEditTime: null })
  if (!ap) return null

  const d = dayCards()
  const dur = aptMin(ap)
  const day = typeof s.calEditDay === 'number' ? s.calEditDay : ap.day || 0
  const staffId = s.calEditStaff || ap.staff
  const start = typeof s.calEditTime === 'number' ? s.calEditTime : toMinLocal(ap.time)
  const dept = (svcParts(ap.service)[0] || ({} as Service)).cat || 'Hair'
  const qual = staff.filter((x) => x.skills.indexOf(dept) >= 0)

  const visit = s.apts
    .filter((x) => (x.day || 0) === (ap.day || 0) && x.client === ap.client && x.stage !== 'cancelled')
    .sort((p, q) => toMinLocal(p.time) - toMinLocal(q.time))
  const visitEnd = visit.reduce((m, x) => Math.max(m, toMinLocal(x.time) + aptMin(x)), 9 * 60)
  const visitPrice = visit.reduce((n, x) => n + svcPrice(x.service), 0)
  const visitMin = visit.reduce((n, x) => n + aptMin(x), 0)
  const clashesVisit = (startM: number, durM: number, skip?: string) => visit.some((v) => { if (v.id === skip) return false; const vs = toMinLocal(v.time); return startM < vs + aptMin(v) && vs < startM + durM })

  const cq = (s.ceQ || '').trim().toLowerCase()
  const ccat = s.ceCat || 'All'
  const menu = svcCat.filter((x) => (ccat === 'All' || x.cat === ccat) && (!cq || (x.name + ' ' + x.sub).toLowerCase().indexOf(cq) >= 0))

  const addService = (x: Service) => {
    const qu = staff.filter((y) => y.skills.indexOf(x.cat) >= 0)
    let pick: { id: string; start: number } | null = null
    for (let i = 0; i < qu.length && !pick; i++) {
      for (let m = visitEnd; m <= 20 * 60 - x.min; m += 15) {
        if (freeAt(s.apts, ap.day || 0, qu[i].id, m, x.min) && !clashesVisit(m, x.min)) { pick = { id: qu[i].id, start: m }; break }
      }
    }
    if (!pick) { s.patch({ ceErr: 'No ' + x.cat.toLowerCase() + ' technician is free after ' + clock(visitEnd) + ' — try another day.' }); return }
    const extra: Appointment = { id: 'a' + Date.now(), client: ap.client, cid: ap.cid, service: x.name, min: x.min, staff: pick.id, time: clock(pick.start), day: ap.day || 0, channel: ap.channel, stage: 'booked', total: 0, lines: [], note: ap.note || '' }
    s.save({ apts: s.apts.concat([extra]) })
    s.patch({ ceErr: '', ceQ: '' })
  }

  const ok = freeAt(s.apts, day, staffId, start, dur, ap.id) && !clashesVisit(start, dur, ap.id)
  const stageOf = stages.find((x) => x.key === ap.stage) || stages[0]

  const smallBtn: React.CSSProperties = { border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '8px 13px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }
  const heading: React.CSSProperties = { fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', padding: '16px 0 8px' }

  return (
    <Modal width="min(560px,92vw)" onClose={close}>
      <div style={{ padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 22 }}>{ap.client}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.55)', paddingTop: 2 }}>{ap.service} · {hm(dur)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: stageOf.dot }} />
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)' }}>{stageOf.label} · now {(ap.day || 0) === 0 ? 'today ' + ap.time : d[ap.day || 0].wd + ' ' + d[ap.day || 0].num + ' ' + ap.time}</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}><DrawerClose onClose={close} /></div>
        </div>

        {/* This visit */}
        <div style={heading}>This visit — {visit.length === 1 ? 'one booking' : visit.length + ' bookings, one visit'} · {money(visitPrice)} · {hm(visitMin)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {visit.map((x) => {
            const s2 = st(x.staff)
            const st2 = toMinLocal(x.time)
            const isThis = x.id === ap.id
            return (
              <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(0,0,0,.1)', borderRadius: 9, padding: '9px 11px', background: isThis ? '#f3ead6' : '#FEFEF1' }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: s2.bg, color: '#FEFEF1', display: 'grid', placeItems: 'center', fontFamily: "'Geist Mono',monospace", fontSize: 8, flex: 'none' }}>{s2.init}</span>
                <button onClick={() => s.patch({ calEdit: x.id, calEditDay: x.day || 0, calEditStaff: x.staff, calEditTime: st2, ceErr: '' })} style={{ border: 0, background: 'none', textAlign: 'left', cursor: 'pointer', flex: 1 }}>
                  <div style={{ fontSize: 12.5 }}>{x.service}</div>
                  <div style={{ fontSize: 10, color: 'rgba(0,0,0,.5)', paddingTop: 1 }}>{s2.name} · {clock(st2)}–{clock(st2 + aptMin(x))} · {money(svcPrice(x.service))}</div>
                </button>
                <button disabled={visit.length <= 1} onClick={() => { if (visit.length <= 1) return; s.save({ apts: s.apts.map((z) => (z.id === x.id ? { ...z, stage: 'cancelled' } : z)) }); if (x.id === ap.id) s.patch({ calEdit: null }) }} style={{ border: 0, background: 'none', cursor: visit.length > 1 ? 'pointer' : 'default', color: 'rgba(0,0,0,.4)', opacity: visit.length > 1 ? 1 : 0.25, fontSize: 15 }}>×</button>
              </div>
            )
          })}
        </div>

        {/* Add another service */}
        <div style={heading}>Add another service to this visit</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 8 }}>
          {cats.map((c) => { const on = ccat === c; return <button key={c} onClick={() => s.patch({ ceCat: c })} style={{ border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '5px 11px', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : 'rgba(0,0,0,.7)' }}>{c}</button> })}
        </div>
        <input value={s.ceQ || ''} onChange={(e) => s.patch({ ceQ: e.target.value })} placeholder="Search the menu" style={{ width: '100%', background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 8, padding: '8px 11px', fontSize: 12 }} />
        <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 5 }}>
          {menu.slice(0, 24).map((x) => (
            <button key={x.name} onClick={() => addService(x)} style={{ textAlign: 'left', border: '1px solid rgba(0,0,0,.12)', background: 'none', borderRadius: 8, padding: '7px 9px', cursor: 'pointer' }}>
              <div style={{ fontSize: 11.5 }}>{x.name}</div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.5)', paddingTop: 1 }}>{x.cat + ' · ' + hm(x.min) + ' · ' + (x.from ? 'from ' : '') + money(x.base)}</div>
            </button>
          ))}
        </div>
        {s.ceErr && <div style={{ fontSize: 11, color: '#b4462f', paddingTop: 6 }}>{s.ceErr}</div>}
        <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.45)', paddingTop: 6 }}>Each service becomes its own booking with a qualified technician, back-to-back after {clock(visitEnd)}.</div>

        {/* Day */}
        <div style={heading}>Day</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {d.map((x) => { const on = day === x.i; return <button key={x.i} onClick={() => s.patch({ calEditDay: x.i })} style={{ border: `1px solid ${on ? '#000' : 'rgba(0,0,0,.14)'}`, borderRadius: 8, padding: '7px 9px', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : '#000', opacity: x.closed ? 0.4 : 1, textAlign: 'center', minWidth: 46 }}><div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>{x.label}</div><div style={{ fontSize: 12 }}>{x.num}</div></button> })}
        </div>

        {/* With whom */}
        <div style={heading}>With whom</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {qual.map((x) => { const on = staffId === x.id; return <button key={x.id} onClick={() => s.patch({ calEditStaff: x.id })} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${on ? '#000' : 'rgba(0,0,0,.16)'}`, borderRadius: 999, padding: '6px 11px', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : '#000' }}><span style={{ width: 6, height: 6, borderRadius: 999, background: x.bg }} /><span style={{ fontSize: 11.5 }}>{x.name}</span></button> })}
        </div>

        {/* Start */}
        <div style={heading}>Start</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {gridSlots().map((m) => { const free = freeAt(s.apts, day, staffId, m, dur, ap.id); const on = start === m; return <button key={m} onClick={() => free && s.patch({ calEditTime: m })} style={{ border: `1px solid ${on ? '#000' : free ? 'rgba(0,0,0,.16)' : 'rgba(0,0,0,.07)'}`, borderRadius: 6, padding: '6px 9px', fontFamily: "'Geist Mono',monospace", fontSize: 10.5, cursor: free ? 'pointer' : 'not-allowed', background: on ? '#000' : free ? '#FEFEF1' : 'transparent', color: on ? '#FEFEF1' : free ? '#000' : 'rgba(0,0,0,.26)' }}>{clock(m)}</button> })}
        </div>

        <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.6)', paddingTop: 12 }}>{(day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : d[day].wd + ' ' + d[day].num + ' ' + d[day].mon) + ' · ' + clock(start) + '–' + clock(start + dur) + ' · ' + st(staffId).name}</div>
        {!ok && <div style={{ fontSize: 11.5, color: '#b4462f', paddingTop: 6 }}>That slot clashes with another booking in this column.</div>}

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 16 }}>
          {ap.stage === 'booked' && (
            <button onClick={() => { const dp = (svcParts(ap.service)[0] || ({} as Service)).cat || 'Hair'; const st0 = (stations.filter((x) => x.dept === dp)[0] || stations[0]).name; s.patch({ calEdit: null, station: st0 }); s.bump(ap.id, 'reception', { station: st0 }) }} style={smallBtn}>Check her in</button>
          )}
          <button onClick={() => { s.patch({ calEdit: null, view: 'inbox' }); s.showToast('Her thread is open in the Inbox') }} style={smallBtn}>Message her</button>
          <button onClick={() => { const nd = Math.min(13, (ap.day || 0) + 7); const copy = { ...ap, id: 'a' + Date.now(), day: nd, stage: 'booked' as const, total: 0, lines: [], station: null }; s.save({ apts: s.apts.concat([copy]) }); s.patch({ calEdit: null, calDay: nd, calMode: 'day' }); s.showToast('Same again for ' + ap.client + ' on ' + d[nd].wd + ' ' + d[nd].num + ' ' + d[nd].mon) }} style={smallBtn}>Repeat in a week</button>
          <button onClick={() => { const n = { id: 'n' + Date.now(), kind: 'No-show', to: 'Reception', dot: '#b4462f', read: false, t: 'now', roles: ['owner', 'manager', 'reception'] as any, text: ap.client + ' did not arrive for ' + ap.time + ' ' + ap.service + ' — chair freed, win-back queued.' }; s.save({ apts: s.apts.map((x) => (x.id === ap.id ? { ...x, stage: 'cancelled', noShow: true } : x)), notifs: [n as any].concat(s.notifs) }); s.patch({ calEdit: null }); s.showToast(ap.client + ' marked as a no-show — chair freed and a win-back queued') }} style={smallBtn}>Mark no-show</button>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 14 }}>
          <button onClick={() => { s.moveApt(ap.id, { stage: 'cancelled' }); s.patch({ calEdit: null, calEditDay: null, calEditStaff: null, calEditTime: null }); s.showToast(ap.client + '’s ' + ap.service.toLowerCase() + ' is cancelled — the chair is free again') }} style={{ ...smallBtn, border: '1px solid #b4462f', color: '#b4462f' }}>Cancel booking</button>
          <div style={{ flex: 1 }} />
          <button onClick={close} style={smallBtn}>Keep as is</button>
          <button onClick={() => { if (!ok) { s.showToast('That slot clashes — pick another time or another chair', 'warn'); return } s.moveApt(ap.id, { day, staff: staffId, time: clock(start) }); s.patch({ calEdit: null, calEditDay: null, calEditStaff: null, calEditTime: null, calDay: day, calMode: 'day' }); s.showToast(ap.client + ' moved to ' + (day === 0 ? 'today' : day === 1 ? 'tomorrow' : d[day].wd + ' ' + d[day].num) + ' ' + clock(start) + ' with ' + st(staffId).name) }} style={{ border: 0, background: ok ? '#000' : 'rgba(0,0,0,.18)', color: '#FEFEF1', borderRadius: 999, padding: '9px 18px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Move it</button>
        </div>
      </div>
    </Modal>
  )
}

function toMinLocal(t: string): number {
  const p = String(t || '').split(':')
  return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0)
}
