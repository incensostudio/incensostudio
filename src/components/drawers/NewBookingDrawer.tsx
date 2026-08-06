import { useStore } from '../../store/useStore'
import { staff, svcCat, chan as chanColors } from '../../data/fixtures'
import { clock, dayCards, gridSlots, hm, money, slotFits, st } from '../../lib/logic'
import type { Appointment, Client, Service } from '../../data/types'
import { Drawer, DrawerClose } from './Drawer'

const CH = ['Google search', 'ChatGPT', 'Instagram', 'TikTok', 'Phone', 'WhatsApp', 'Walk-in']
const depts = ['All', 'Hair', 'Nails', 'Makeup', 'Brows & Lashes']

interface Row {
  svc: Service
  qual: typeof staff
  staffId: string | null
  start: number | null
  end: number | null
  resolved?: string | null
}

export function NewBookingDrawer() {
  const s = useStore()
  const close = () => s.patch({ drawer: null, activeId: null, edit: null })

  const roster = [...staff, { id: 'own', name: 'Owner (you)', init: 'YOU', role: 'Owner', bg: '#000', skills: [] as string[], pfp: '' }]
  const srcs = s.nbSrcs || []
  const toggleSrc = (k: string) => s.patch({ nbSrcs: srcs.indexOf(k) >= 0 ? srcs.filter((x) => x !== k) : srcs.concat([k]) })
  const refIds = srcs.filter((k) => k.indexOf('staff:') === 0).map((k) => k.slice(6))
  const refs = refIds.map((id) => roster.find((r) => r.id === id)).filter(Boolean) as typeof roster
  const chans = srcs.filter((k) => k.indexOf('staff:') !== 0)
  const src = chans[0] || (refs.length ? 'Staff referral' : null)

  const cl = s.nbClient ? s.allClients().find((c) => c.id === s.nbClient) : null
  const N = s.nbNew || {}
  const newOn = !cl && !!s.nbNewOn
  const q = (s.nbQ || '').trim()
  const ql = q.toLowerCase()
  const hits = ql ? s.allClients().filter((c) => (c.name + ' ' + c.phone + ' ' + c.fav + ' ' + c.tier).toLowerCase().indexOf(ql) >= 0) : []
  const exact = s.allClients().some((c) => c.name.toLowerCase() === ql)
  const setNew = (k: string, v: string) => s.patch({ nbNew: { ...(s.nbNew || {}), [k]: v } })

  const sq = (s.nbSvcQ || '').trim().toLowerCase()
  const scat = s.nbSvcCat || 'All'
  const picked = s.nbSvcs || []
  const pObjs = picked.map((n) => svcCat.find((x) => x.name === n)).filter(Boolean) as Service[]
  const totalMin = pObjs.reduce((a, b) => a + b.min, 0)
  const totalPrice = pObjs.reduce((a, b) => a + b.base, 0)
  const anyFrom = pObjs.some((x) => x.from)
  const menu = svcCat.filter((x) => (scat === 'All' || x.cat === scat) && (!sq || (x.name + ' ' + x.sub).toLowerCase().indexOf(sq) >= 0))

  const day = s.nbDay || 0
  const cards = dayCards()
  const dc = cards[day]
  const gs = gridSlots()
  const plan = s.nbPlan || {}
  const setPlan = (name: string, patch: { staff?: string; start?: number | null }) => s.patch({ nbPlan: { ...(s.nbPlan || {}), [name]: { ...(s.nbPlan || {})[name], ...patch } } })

  const rows: Row[] = pObjs.map((x) => {
    const qual = staff.filter((stf) => stf.skills.indexOf(x.cat) >= 0)
    const e = plan[x.name] || {}
    const staffId = e.staff === 'any' || (e.staff && qual.some((g) => g.id === e.staff)) ? e.staff! : null
    const okStart =
      typeof e.start === 'number' &&
      e.start + x.min <= 20 * 60 + 30 &&
      !dc.closed &&
      (staffId && staffId !== 'any' ? slotFits(s.apts, day, staffId, e.start, x.min) : qual.some((g) => slotFits(s.apts, day, g.id, e.start!, x.min)))
    const start = okStart ? (e.start as number) : null
    return { svc: x, qual, staffId, start, end: start != null ? start + x.min : null }
  })

  const claimed: Record<string, [number, number][]> = {}
  const claim = (id: string | null | undefined, x: number, y: number) => { if (id) (claimed[id] = claimed[id] || []).push([x, y]) }
  const freeIn = (id: string, x: number, y: number) => !(claimed[id] || []).some((iv) => x < iv[1] && iv[0] < y)
  rows.filter((r) => r.start != null && r.staffId && r.staffId !== 'any').forEach((r) => { r.resolved = r.staffId; claim(r.staffId, r.start!, r.end!) })
  rows.filter((r) => r.start != null && (!r.staffId || r.staffId === 'any')).sort((x, y) => x.start! - y.start!).forEach((r) => {
    const g = r.qual.find((z) => slotFits(s.apts, day, z.id, r.start!, r.svc.min) && freeIn(z.id, r.start!, r.end!))
    r.resolved = g ? g.id : null
    if (g) claim(g.id, r.start!, r.end!)
  })
  const whoName = (r: Row) => (r.resolved ? st(r.resolved).name : null)

  const diaryOk = (r: Row, m: number) =>
    r.staffId && r.staffId !== 'any'
      ? slotFits(s.apts, day, r.staffId, m, r.svc.min)
      : r.qual.some((g) => slotFits(s.apts, day, g.id, m, r.svc.min) && !rows.some((o) => o !== r && o.start != null && o.resolved === g.id && m < o.end! && o.start < m + r.svc.min))
  const clash = (r: Row, m: number) => rows.some((o) => o !== r && o.start != null && m < o.end! && o.start < m + r.svc.min)
  const techClash = (r: Row, m: number) => rows.some((o) => o !== r && o.start != null && o.staffId && o.staffId !== 'any' && o.staffId === r.staffId && m < o.end! && o.start < m + r.svc.min)

  const firstRow = rows[0]
  const openFor = (dIdx: number) => {
    const d2 = cards[dIdx]
    if (d2.closed) return 0
    if (!firstRow) return gs.filter((m) => staff.some((stf) => stf.skills.length && slotFits(s.apts, dIdx, stf.id, m, 60))).length
    return gs.filter((m) => (firstRow.staffId && firstRow.staffId !== 'any' ? slotFits(s.apts, dIdx, firstRow.staffId, m, firstRow.svc.min) : firstRow.qual.some((g) => slotFits(s.apts, dIdx, g.id, m, firstRow.svc.min)))).length
  }

  const timed = rows.filter((r) => r.start != null).sort((x, y) => x.start! - y.start!)
  const planStart = timed.length ? timed[0].start! : null
  const planEnd = timed.length ? Math.max(...timed.map((r) => r.end!)) : null
  let gapMin = 0
  for (let i = 1; i < timed.length; i++) gapMin += Math.max(0, timed[i].start! - timed[i - 1].end!)
  const unset = rows.filter((r) => r.start == null)

  const reach = chans.indexOf('WhatsApp') >= 0 ? 'WhatsApp' : chans.indexOf('Instagram') >= 0 ? 'Instagram' : chans.indexOf('Phone') >= 0 ? 'SMS' : 'WhatsApp'
  const clientName = cl ? cl.name : newOn ? N.name || '' : ''

  const blocked: string[] = []
  if (!srcs.length) blocked.push('where she came from')
  if (!clientName) blocked.push('who she is')
  if (!picked.length) blocked.push('at least one service')
  if (unset.length) blocked.push('a time for ' + unset.map((r) => r.svc.name).join(' and '))
  const unresolved = rows.filter((r) => r.start != null && !r.resolved)
  if (unresolved.length) blocked.push('a free technician for ' + unresolved.map((r) => r.svc.name).join(' and '))

  const chain = () => {
    const next: Record<string, { staff: string; start: number; min: number }> = {}
    let cursor: number | null = null
    rows.forEach((r) => {
      const fixed = r.staffId && r.staffId !== 'any' ? r.staffId : null
      const cands = fixed ? [fixed] : r.qual.map((g) => g.id)
      let best: { staff: string; start: number } | null = null
      for (const sid of cands) {
        for (let i = 0; i < gs.length; i++) {
          const m = gs[i]
          if (cursor != null && m < cursor) continue
          if (m + r.svc.min > 20 * 60 + 30) break
          if (!slotFits(s.apts, day, sid, m, r.svc.min)) continue
          const hit = Object.keys(next).some((k) => m < next[k].start + next[k].min && next[k].start < m + r.svc.min)
          if (hit) continue
          if (!best || m < best.start) best = { staff: sid, start: m }
          break
        }
      }
      if (best) { next[r.svc.name] = { staff: fixed ? fixed : best.staff, start: best.start, min: r.svc.min }; cursor = best.start + r.svc.min }
    })
    const p2: Record<string, { staff: string; start: number }> = {}
    Object.keys(next).forEach((k) => (p2[k] = { staff: next[k].staff, start: next[k].start }))
    s.patch({ nbPlan: p2 })
  }

  const create = () => {
    if (blocked.length) return
    const visit = 'v' + Date.now()
    let cid = cl ? cl.id : null
    let fresh: Client | null = null
    if (!cid) {
      cid = 'c' + Date.now()
      fresh = {
        id: cid, name: clientName, phone: N.phone || '—', since: 'Today', visits: 0, ltv: 0, tier: 'New', fav: '—', channel: src || 'Walk-in', state: 'First visit',
        next: day === 0 ? 'today' : dc.wd + ' ' + dc.num + ' ' + dc.mon,
        formula: 'No history — nothing on file yet', sees: ['Your first visit — we will start your file today'],
        dossier: [{ k: 'Intake', fg: '#000', items: ['File opened at the desk · came via ' + (src || 'walk-in')].concat(s.nbNote ? ['Said at booking: “' + s.nbNote + '”'] : []).concat(N.insta ? ['Instagram ' + N.insta] : []) }],
      }
    }
    const apts: Appointment[] = timed.map((r, i) => ({ id: 'a' + Date.now() + i, visit, client: clientName, cid: cid!, service: r.svc.name, min: r.svc.min, staff: r.resolved || r.qual[0].id, time: clock(r.start!), channel: src || 'Walk-in', stage: 'booked', total: 0, lines: [], day: dc.i, note: s.nbNote || '' }))
    const when = day === 0 ? 'today' : day === 1 ? 'tomorrow' : dc.wd + ' ' + dc.num + ' ' + dc.mon
    const notif = { id: 'n' + Date.now(), kind: 'Booking', to: 'Reception', dot: '#3b4a7a', read: false, t: 'now', roles: ['owner', 'manager', 'reception'] as any, text: clientName + ' — ' + when + ': ' + apts.map((x) => x.time + ' ' + x.service + ' with ' + st(x.staff).name).join(' · ') + ' · via ' + (chans.join(' + ') || 'staff') + (refs.length ? ' (referred by ' + refs.map((r) => r.name).join(', ') + ')' : '') }
    s.save({ apts: s.apts.concat(apts), notifs: [notif as any].concat(s.notifs), newClients: fresh ? (s.newClients || []).concat([fresh]) : s.newClients || [], drawer: null, view: day === 0 ? 'floor' : 'calendar', calMode: 'day', calDay: dc.i })
    s.showToast(clientName + ' is booked for ' + when + ' · ' + clock(timed[0].start!) + ' with ' + st(apts[0].staff).name + (fresh ? ' · a new client file was opened for her' : '') + (s.nbConfirm ? ' · confirmation on its way' : ''))
  }

  const step = (n: number, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0 10px' }}>
      <span style={{ width: 17, height: 17, borderRadius: 999, background: '#000', color: '#FEFEF1', display: 'grid', placeItems: 'center', fontFamily: "'Geist Mono',monospace", fontSize: 9 }}>{n}</span>
      <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.55)' }}>{label}</span>
    </div>
  )
  const pill = (label: string, on: boolean, onClick: () => void, bg?: string, fg?: string): JSX.Element => (
    <button onClick={onClick} style={{ border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '7px 12px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : bg || '#FEFEF1', color: on ? '#FEFEF1' : fg || '#000' }}>{label}</button>
  )

  return (
    <Drawer width={660} onClose={close}>
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>New reservation</div>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 24, paddingTop: 3 }}>Book her in</div>
          </div>
          <div style={{ marginLeft: 'auto' }}><DrawerClose onClose={close} /></div>
        </div>

        {/* 1. Where from */}
        {step(1, 'Where did she come from?')}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CH.map((k) => { const c = chanColors[k] || ['#e8e4dc', '#000']; const on = srcs.indexOf(k) >= 0; return pill(k, on, () => toggleSrc(k), c[0], c[1]) })}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8 }}>
          {roster.map((r) => { const k = 'staff:' + r.id; const on = srcs.indexOf(k) >= 0; return <button key={k} onClick={() => toggleSrc(k)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '6px 11px', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : '#000' }}><span style={{ width: 16, height: 16, borderRadius: 999, background: r.bg, color: '#FEFEF1', display: 'grid', placeItems: 'center', fontFamily: "'Geist Mono',monospace", fontSize: 7 }}>{r.init}</span><span style={{ fontSize: 11 }}>{r.name}</span></button> })}
        </div>

        {/* 2. Who is she */}
        {step(2, 'Who is she?')}
        {cl ? (
          <div style={{ background: '#f3ead6', borderRadius: 11, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 16 }}>{cl.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(0,0,0,.55)', paddingTop: 2 }}>{cl.phone + ' · ' + cl.tier + ' · ' + cl.visits + ' visits · asks for ' + cl.fav}</div>
              <div style={{ fontSize: 11, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{cl.formula}</div>
            </div>
            <button onClick={() => s.patch({ nbClient: null, nbNewOn: false, nbQ: '' })} style={{ marginLeft: 'auto', border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '6px 12px', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Change</button>
          </div>
        ) : newOn ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['name', 'phone', 'insta', 'tiktok'] as const).map((k) => (
              <input key={k} value={N[k] || ''} onChange={(e) => setNew(k, e.target.value)} placeholder={{ name: 'Full name', phone: 'Mobile', insta: 'Instagram', tiktok: 'TikTok' }[k]} style={{ background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 8, padding: '9px 11px', fontSize: 12 }} />
            ))}
          </div>
        ) : (
          <>
            <input value={s.nbQ || ''} onChange={(e) => s.patch({ nbQ: e.target.value, nbClient: null })} placeholder="Search by name or mobile" style={{ width: '100%', background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 9, padding: '9px 12px', fontSize: 12.5 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6 }}>
              {hits.slice(0, 5).map((c) => (
                <button key={c.id} onClick={() => s.patch({ nbClient: c.id, nbNewOn: false })} style={{ textAlign: 'left', border: '1px solid rgba(0,0,0,.12)', background: 'none', borderRadius: 8, padding: '9px 11px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 12.5 }}>{c.name}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', paddingTop: 1 }}>{c.phone + ' · ' + c.visits + ' visits · ' + c.tier}</div>
                </button>
              ))}
              {q.length >= 2 && !exact && (
                <button onClick={() => s.patch({ nbNewOn: true, nbClient: null, nbNew: { ...(s.nbNew || {}), name: q } })} style={{ textAlign: 'left', border: '1px dashed rgba(0,0,0,.2)', background: 'none', borderRadius: 8, padding: '9px 11px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 12.5 }}>“{q}” — first time here</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', paddingTop: 1 }}>Open a new file</div>
                </button>
              )}
            </div>
          </>
        )}
        <input value={s.nbNote || ''} onChange={(e) => s.patch({ nbNote: e.target.value })} placeholder="Note for this reservation (optional)" style={{ width: '100%', marginTop: 8, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 8, padding: '8px 11px', fontSize: 12 }} />

        {/* 3. What for */}
        {step(3, 'What is she coming for?')}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 8 }}>
          {depts.map((c) => pill(c, scat === c, () => s.patch({ nbSvcCat: c })))}
        </div>
        <input value={s.nbSvcQ || ''} onChange={(e) => s.patch({ nbSvcQ: e.target.value })} placeholder="Search services" style={{ width: '100%', background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 8, padding: '8px 11px', fontSize: 12 }} />
        {pObjs.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingTop: 8 }}>
            {pObjs.map((x) => (
              <span key={x.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '5px 10px', fontSize: 11 }}>{x.name} · {hm(x.min)}<button onClick={() => { const p2 = { ...(s.nbPlan || {}) }; delete p2[x.name]; s.patch({ nbSvcs: picked.filter((n) => n !== x.name), nbPlan: p2 }) }} style={{ border: 0, background: 'none', color: '#FEFEF1', cursor: 'pointer' }}>×</button></span>
            ))}
          </div>
        )}
        <div style={{ maxHeight: 170, overflowY: 'auto', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menu.length === 0 ? (
            <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.5)' }}>Nothing in the menu matches that.</div>
          ) : (
            menu.map((x) => {
              const on = picked.indexOf(x.name) >= 0
              return (
                <button key={x.name} onClick={() => { const nextSel = on ? picked.filter((n) => n !== x.name) : picked.concat([x.name]); const p2 = { ...(s.nbPlan || {}) }; if (on) delete p2[x.name]; s.patch({ nbSvcs: nextSel, nbPlan: p2 }) }} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', border: 0, borderRadius: 8, padding: '8px 11px', cursor: 'pointer', background: on ? '#f3ead6' : 'transparent' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: on ? '#000' : 'transparent', border: on ? 'none' : '1px solid rgba(0,0,0,.25)', color: '#FEFEF1', display: 'grid', placeItems: 'center', fontSize: 10, flex: 'none' }}>{on ? '✓' : ''}</span>
                  <span style={{ fontSize: 12.5, flex: 1 }}>{x.name}<span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, color: 'rgba(0,0,0,.45)', paddingLeft: 8 }}>{x.cat + ' · ' + x.sub + ' · ' + hm(x.min)}</span></span>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11 }}>{(x.from ? 'from ' : '') + money(x.base)}</span>
                </button>
              )
            })
          )}
        </div>
        {pObjs.length > 0 && <div style={{ fontSize: 11, color: 'rgba(0,0,0,.55)', paddingTop: 6 }}>{pObjs.length + (pObjs.length === 1 ? ' service · ' : ' services · ') + hm(totalMin) + ' · ' + (anyFrom ? 'from ' : '') + money(totalPrice)}</div>}

        {/* 4. Which day */}
        {step(4, 'Which day')}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {cards.map((x) => {
            const on = day === x.i
            const n = x.closed ? 0 : openFor(x.i)
            const sub = x.mon + (x.closed ? ' · closed' : pObjs.length ? (n ? ' · ' + n + ' open' : ' · full') : '')
            return (
              <button key={x.i} onClick={() => s.patch({ nbDay: x.i, nbPlan: {} })} style={{ border: `1px solid ${on ? '#000' : 'rgba(0,0,0,.14)'}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : '#000', opacity: on ? 1 : x.closed || !n ? 0.42 : 1, textAlign: 'center', minWidth: 58 }}>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>{x.label}</div>
                <div style={{ fontSize: 13 }}>{x.num}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 7.5, color: on ? 'rgba(254,254,241,.6)' : 'rgba(0,0,0,.4)', paddingTop: 1 }}>{sub}</div>
              </button>
            )
          })}
        </div>

        {/* 5. Who and when */}
        {step(5, 'Who and when')}
        {pObjs.length === 0 ? (
          <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.5)' }}>Pick a service first.</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            <button onClick={chain} style={{ border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '7px 14px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Chain back-to-back</button>
            <button onClick={() => s.patch({ nbPlan: {} })} style={{ border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '7px 14px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Clear times</button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r, i) => {
            const techNote = r.staffId && r.staffId !== 'any' ? st(r.staffId).name + ' · ' + st(r.staffId).role : r.start == null ? 'Any of ' + r.qual.length + ' ' + r.svc.cat.toLowerCase() + ' technicians — pick a time and we name one' : r.resolved ? whoName(r) + ' is the one free at ' + clock(r.start) + ' — she is who gets the card' : 'Nobody in ' + r.svc.cat.toLowerCase() + ' is free at ' + clock(r.start) + ' — pick another slot'
            return (
              <div key={r.svc.name} style={{ border: '1px solid rgba(0,0,0,.12)', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.4)' }}>{i + 1}</span>
                  <span style={{ fontSize: 13 }}>{r.svc.name}</span>
                  <span style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)' }}>{r.svc.cat + ' · ' + hm(r.svc.min) + ' · ' + (r.svc.from ? 'from ' : '') + money(r.svc.base)}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 11, color: r.start != null ? '#000' : 'rgba(0,0,0,.4)' }}>{r.start != null ? clock(r.start) + '–' + clock(r.end!) : 'time not set'}</span>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingTop: 8 }}>
                  {[{ any: true } as any, ...r.qual].map((g: any, gi: number) => {
                    if (g.any) { const on = r.staffId === 'any'; return <button key="any" onClick={() => { const keep = r.start != null && r.qual.some((z) => slotFits(s.apts, day, z.id, r.start!, r.svc.min)); setPlan(r.svc.name, keep ? { staff: 'any' } : { staff: 'any', start: null }) }} style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '5px 10px', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : '#000' }}><span>★</span><span style={{ fontSize: 10.5 }}>Any {r.svc.cat.toLowerCase()} tech</span></button> }
                    const on = r.staffId === g.id
                    return <button key={g.id + gi} onClick={() => { const keep = r.start != null && slotFits(s.apts, day, g.id, r.start!, r.svc.min) && !rows.some((o) => o !== r && o.start != null && o.staffId === g.id && r.start! < o.end! && o.start! < r.start! + r.svc.min); setPlan(r.svc.name, keep ? { staff: g.id } : { staff: g.id, start: null }) }} style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '5px 10px', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : '#000' }}><span style={{ width: 6, height: 6, borderRadius: 999, background: g.bg }} /><span style={{ fontSize: 10.5 }}>{g.name}</span></button>
                  })}
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.55)', paddingTop: 6 }}>{techNote}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingTop: 8 }}>
                  {gs.map((m) => {
                    const fitsDay = !dc.closed && m + r.svc.min <= 20 * 60 + 30
                    const okSlot = fitsDay && diaryOk(r, m) && !clash(r, m) && !techClash(r, m)
                    const on = r.start === m
                    return <button key={m} onClick={() => okSlot && setPlan(r.svc.name, { start: m })} style={{ border: `1px solid ${on ? '#000' : okSlot ? 'rgba(0,0,0,.16)' : 'rgba(0,0,0,.07)'}`, borderRadius: 6, padding: '5px 8px', fontFamily: "'Geist Mono',monospace", fontSize: 10, cursor: okSlot ? 'pointer' : 'not-allowed', background: on ? '#000' : okSlot ? '#FEFEF1' : 'transparent', color: on ? '#FEFEF1' : okSlot ? '#000' : 'rgba(0,0,0,.26)' }}>{clock(m)}</button>
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {planStart != null && <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.6)', padding: '10px 0' }}>In studio {clock(planStart)}–{clock(planEnd!)}{gapMin ? ' · ' + hm(gapMin) + ' waiting' : ''}</div>}
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, background: '#FEFEF1', borderTop: '1px solid rgba(0,0,0,.12)', padding: '14px 24px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', paddingBottom: 8 }}>
          {[{ k: 'Client', v: clientName || '—' }, { k: 'Day', v: dc ? (dc.i === 0 ? 'Today' : dc.i === 1 ? 'Tomorrow' : dc.wd) + ' ' + dc.num + ' ' + dc.mon : '—' }, { k: 'In studio', v: planStart != null ? clock(planStart) + '–' + clock(planEnd!) + ' · ' + hm(totalMin) + ' of service' : '—' }, { k: 'Source', v: srcs.length ? chans.concat(refs.map((r) => r.name + ' (referral)')).join(' · ') : '—' }].map((r) => (
            <div key={r.k} style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)', width: 62, flex: 'none' }}>{r.k}</span>
              <span style={{ fontSize: 11.5 }}>{r.v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 8 }}>
          {[{ on: !!s.nbConfirm, label: 'Send her the confirmation now', sub: 'One message on ' + reach + ' with every service, technician and time.', toggle: () => s.patch({ nbConfirm: !s.nbConfirm }) }, { on: !!s.nbRemind, label: 'Remind her 24 hours before', sub: 'Same thread. She can reply to move it — that lands in Inbox, not in a void.', toggle: () => s.patch({ nbRemind: !s.nbRemind }) }].map((o) => (
            <button key={o.label} onClick={o.toggle} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, textAlign: 'left', border: 0, background: 'none', cursor: 'pointer' }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: o.on ? '#000' : 'transparent', border: o.on ? 'none' : '1px solid rgba(0,0,0,.25)', color: '#FEFEF1', display: 'grid', placeItems: 'center', fontSize: 10, flex: 'none', marginTop: 1 }}>{o.on ? '✓' : ''}</span>
              <span><span style={{ fontSize: 12 }}>{o.label}</span><span style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', display: 'block', paddingTop: 1 }}>{o.sub}</span></span>
            </button>
          ))}
        </div>
        {blocked.length > 0 && <div style={{ fontSize: 11, color: '#b4462f', paddingBottom: 8 }}>Still needed: {blocked.join(', ')}.</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={close} style={{ border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '11px 18px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
          <button onClick={create} disabled={blocked.length > 0} style={{ flex: 1, border: 0, background: blocked.length ? 'rgba(0,0,0,.18)' : '#000', color: '#FEFEF1', borderRadius: 999, padding: '11px 18px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: blocked.length ? 'not-allowed' : 'pointer' }}>{rows.length > 1 ? 'Confirm ' + rows.length + ' appointments' : 'Confirm reservation'}</button>
        </div>
      </div>
    </Drawer>
  )
}
