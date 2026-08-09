import { useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { Drawer } from '../components/Drawer'
import { selectStyle } from '../components/ui'
import { useStore } from '../store'
import type { BookingSeed } from '../App'
import type { Client } from '../lib/types'
import {
  CURRENCY, DURS, MO, WD, dayName, durLabel, money, offsetOf, overlaps, pad, slots, toMin, toTime, todayStr,
} from '../lib/format'

interface Card { key: string; name: string; price: number; staff: string; time: string; dur: number }

export function BookingDrawer({ seed, onClose }: { seed?: BookingSeed; onClose: () => void }) {
  const s = useStore()
  const seededClient = seed?.clientId ? s.clients.find((c) => c.id === seed.clientId) : undefined

  const [name, setName] = useState(seed?.name || '')
  const [clientId, setClientId] = useState<string | null>(seed?.clientId || null)
  const [phone, setPhone] = useState(seededClient?.phone || seed?.phone || '')
  const [showClients, setShowClients] = useState(false)
  const [date, setDate] = useState(seed?.date || todayStr())
  const [monthOff, setMonthOff] = useState(() => {
    const t = new Date(); const d = new Date((seed?.date || todayStr()) + 'T00:00:00')
    return (d.getFullYear() - t.getFullYear()) * 12 + (d.getMonth() - t.getMonth())
  })
  const [svcQ, setSvcQ] = useState('')
  const [showSvcs, setShowSvcs] = useState(false)
  const [stackAt, setStackAt] = useState('10:00')

  const seededSvc = seed?.service ? s.services.find((x) => x.name === seed.service) : undefined
  const [cards, setCards] = useState<Card[]>(
    seededSvc ? [{ key: 'k0', name: seededSvc.name, price: seededSvc.price, staff: seed?.staff || s.staff[0]?.id || '', time: '10:00', dur: seededSvc.minutes }] : [],
  )

  const clientMatches = useMemo(() => {
    const t = name.trim().toLowerCase()
    if (!t || clientId) return []
    return s.clients.filter((c) => c.name.toLowerCase().includes(t) || c.phone.includes(t)
      || (c.instagram || '').toLowerCase().includes(t) || (c.tiktok || '').toLowerCase().includes(t)).slice(0, 6)
  }, [name, clientId, s.clients])

  const svcMatches = s.services.filter((x) => x.active && (!svcQ || x.name.toLowerCase().includes(svcQ.toLowerCase()))).slice(0, 8)
  const isNew = !clientId && name.trim().length > 0 && !s.clients.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())

  const pickClient = (c: Client) => { setName(c.name); setClientId(c.id); setPhone(c.phone); setShowClients(false) }

  const addService = (svcName: string) => {
    const svc = s.services.find((x) => x.name === svcName)
    if (!svc) return
    setCards((cs) => {
      const last = cs[cs.length - 1]
      const start = last ? toTime(toMin(last.time) + last.dur) : stackAt
      const staff = s.staff.find((st) => (st.does || []).includes(svc.category) && !s.isOff(date, st.id))?.id || s.staff[0]?.id || ''
      return [...cs, { key: 'k' + cs.length + Math.round(svc.price) + start, name: svc.name, price: svc.price, staff, time: start, dur: svc.minutes }]
    })
    setSvcQ(''); setShowSvcs(false)
  }
  const setCard = (key: string, patch: Partial<Card>) => setCards((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  const removeCard = (key: string) => setCards((cs) => cs.filter((c) => c.key !== key))
  const stack = () => setCards((cs) => { let t = toMin(stackAt); return cs.map((c) => { const time = toTime(t); t += c.dur; return { ...c, time } }) })

  const cardWarn = (c: Card): string => {
    if (c.staff && s.isOff(date, c.staff)) return `${s.staffById(c.staff)?.name || 'Stylist'} is off on ${dayName(date)}`
    const cs = toMin(c.time), ce = cs + c.dur
    const clashE = s.appointments.some((a) => a.date === date && a.staff_id === c.staff && a.stage !== 'cancelled' && overlaps(cs, ce, toMin(a.time), toMin(a.time) + a.duration_min))
    const clashC = cards.some((o) => o.key !== c.key && o.staff === c.staff && overlaps(cs, ce, toMin(o.time), toMin(o.time) + o.dur))
    if (clashE || clashC) return `${s.staffById(c.staff)?.name || 'Stylist'} is double-booked at ${c.time}`
    return ''
  }

  const totalDur = cards.reduce((m, c) => m + c.dur, 0)
  const totalPrice = cards.reduce((m, c) => m + c.price, 0)
  const spanStart = cards.length ? cards.reduce((m, c) => Math.min(m, toMin(c.time)), 1e9) : 0
  const spanEnd = cards.length ? cards.reduce((m, c) => Math.max(m, toMin(c.time) + c.dur), 0) : 0
  const canConfirm = cards.length > 0 && name.trim().length > 0

  const confirm = async () => {
    if (!canConfirm) return
    await s.createBooking(
      { clientId, name, phone, ig: seededClient?.instagram || '', tt: seededClient?.tiktok || '', note: '' },
      cards.map((c) => ({ name: c.name, price: c.price, staff: c.staff, date, time: c.time, dur: c.dur })),
    )
    onClose()
  }

  // ---- month calendar ----
  const base = new Date()
  const view = new Date(base.getFullYear(), base.getMonth() + monthOff, 1)
  const y = view.getFullYear(), mo = view.getMonth()
  const startDow = new Date(y, mo, 1).getDay()
  const daysInMonth = new Date(y, mo + 1, 0).getDate()
  const cells: (string | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${y}-${pad(mo + 1)}-${pad(i + 1)}`)]
  const canPrevMonth = monthOff > 0
  const dots = useMemo(() => {
    const m = new Set<string>()
    s.appointments.forEach((a) => { if (a.stage !== 'cancelled') m.add(a.date) })
    return m
  }, [s.appointments])

  return (
    <Drawer width={620} onClose={onClose}>
      <div style={{ padding: '22px 22px 14px', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: F.display, fontSize: 22 }}>New booking</div>
        <button onClick={onClose} data-tap="icon" style={{ marginLeft: 'auto', border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, width: 34, height: 34, cursor: 'pointer', fontSize: 18, color: C.mut45 }}>×</button>
      </div>

      {/* Client */}
      <div style={{ padding: '0 22px 16px' }}>
        <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45, marginBottom: 8 }}>Client</div>
        <div style={{ position: 'relative' }}>
          <input value={name} onChange={(e) => { setName(e.target.value); setClientId(null); setShowClients(true) }} onFocus={() => setShowClients(true)} placeholder="Name, phone or @handle"
            style={{ width: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 10, padding: '13px 15px', fontFamily: F.ui, fontSize: 14 }} />
          {showClients && clientMatches.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 3, marginTop: 4, background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,.12)' }}>
              {clientMatches.map((c) => (
                <button key={c.id} onClick={() => pickClient(c)} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, padding: '10px 14px', border: 0, borderTop: `1px solid ${C.hair07}`, background: C.cream, cursor: 'pointer' }}>
                  <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {isNew && (
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" style={{ width: '100%', marginTop: 8, background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 10, padding: '11px 15px', fontFamily: F.mono, fontSize: 12 }} />
        )}
      </div>

      {/* Day + month calendar */}
      <div style={{ padding: '0 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45 }}>Day</div>
          <div style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 11, color: C.ink }}>{dayName(date)}</div>
        </div>
        <div style={{ border: `1px solid ${C.hair12}`, borderRadius: 12, padding: 12, background: C.cream }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <button onClick={() => canPrevMonth && setMonthOff(monthOff - 1)} disabled={!canPrevMonth} style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, width: 30, height: 30, cursor: canPrevMonth ? 'pointer' : 'default', opacity: canPrevMonth ? 1 : 0.35, fontFamily: F.mono }}>←</button>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: F.display, fontSize: 17 }}>{MO[mo]} {y}</div>
            <button onClick={() => setMonthOff(monthOff + 1)} style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, width: 30, height: 30, cursor: 'pointer', fontFamily: F.mono }}>→</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
            {WD.map((w) => <div key={w} style={{ textAlign: 'center', fontFamily: F.mono, fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mut38, padding: '2px 0' }}>{w}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {cells.map((cell, i) => {
              if (!cell) return <div key={i} />
              const dnum = parseInt(cell.slice(-2), 10)
              const past = offsetOf(cell) < 0
              const isToday = cell === todayStr()
              const selected = cell === date
              const hasDot = dots.has(cell)
              return (
                <button key={i} onClick={() => !past && setDate(cell)} disabled={past}
                  style={{ position: 'relative', aspectRatio: '1', border: `1px solid ${selected ? '#000' : C.hair12}`, background: selected ? C.ink : isToday ? C.wheat : C.cream, color: selected ? C.cream : past ? 'rgba(0,0,0,.25)' : C.ink, borderRadius: 9, cursor: past ? 'default' : 'pointer', fontFamily: F.mono, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {dnum}
                  {hasDot && <span style={{ position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 999, background: selected ? C.cream : C.mut45 }} />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add service */}
      <div style={{ padding: '0 22px 6px', position: 'relative' }}>
        <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45, marginBottom: 8 }}>Add service</div>
        <input value={svcQ} onChange={(e) => { setSvcQ(e.target.value); setShowSvcs(true) }} onFocus={() => setShowSvcs(true)} placeholder={`Search ${s.services.length} services — cut, balayage, gel…`} style={{ width: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 10, padding: '13px 15px', fontFamily: F.ui, fontSize: 14 }} />
        {showSvcs && svcQ && (
          <div style={{ position: 'absolute', top: '100%', left: 22, right: 22, zIndex: 3, marginTop: 4, background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,.12)' }}>
            {svcMatches.map((svc) => (
              <button key={svc.id} onClick={() => addService(svc.name)} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, padding: '10px 14px', border: 0, borderTop: `1px solid ${C.hair07}`, background: C.cream, cursor: 'pointer' }}>
                <span style={{ flex: 1, fontSize: 13 }}>{svc.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{durLabel(svc.minutes)}</span>
                <span style={{ fontFamily: F.mono, fontSize: 11 }}>{money(svc.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stack control */}
      {cards.length > 1 && (
        <div style={{ padding: '8px 22px 4px', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: F.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: C.mut45 }}>Stack back-to-back from</span>
          <select value={stackAt} onChange={(e) => setStackAt(e.target.value)} style={selectStyle}>{slots(15).map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <button onClick={stack} style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '7px 13px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase' }}>Reflow</button>
        </div>
      )}

      {/* Service cards */}
      <div style={{ padding: '6px 22px', flex: 1 }}>
        {cards.length === 0 && <div style={{ padding: 18, textAlign: 'center', color: C.mut45, fontSize: 12.5 }}>Search a service above to add it to the booking.</div>}
        {cards.map((c) => {
          const warn = cardWarn(c)
          const durOpts = Array.from(new Set([...DURS, c.dur])).sort((x, y) => x - y)
          return (
            <div key={c.key} style={{ border: `1px solid ${warn ? C.alert : C.hair12}`, borderRadius: 12, padding: 13, marginBottom: 10, background: C.cream }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, fontSize: 14 }}>{c.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.hair14}`, borderRadius: 7, padding: '0 8px' }}>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{CURRENCY}</span>
                  <input value={c.price} inputMode="numeric" onChange={(e) => setCard(c.key, { price: parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10) })} style={{ width: 44, border: 0, background: 'none', fontFamily: F.mono, fontSize: 12, padding: '8px 2px', textAlign: 'right' }} />
                </div>
                <button onClick={() => removeCard(c.key)} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 16, color: C.mut45 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={c.staff} onChange={(e) => setCard(c.key, { staff: e.target.value })} style={selectStyle}>{s.staff.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}</select>
                <select value={c.time} onChange={(e) => setCard(c.key, { time: e.target.value })} style={selectStyle}>{slots(15).map((t) => <option key={t} value={t}>{t}</option>)}</select>
                <select value={c.dur} onChange={(e) => setCard(c.key, { dur: parseInt(e.target.value, 10) })} style={selectStyle}>{durOpts.map((dd) => <option key={dd} value={dd}>{durLabel(dd)}</option>)}</select>
                <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.mut45, alignSelf: 'center' }}>ends {toTime(toMin(c.time) + c.dur)}</span>
              </div>
              {warn && <div style={{ color: C.alert, fontSize: 11, paddingTop: 8 }}>{warn} — you can still book it.</div>}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.hair12}`, padding: 20, background: C.cream, position: 'sticky', bottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>
          <span style={{ color: isNew ? C.ink : C.mut45 }}>{isNew ? `New client · ${name.trim()}` : clientId ? name.trim() : 'Add a client'}</span>
          {cards.length > 0 && <span style={{ marginLeft: 'auto' }}>{cards.length} {cards.length === 1 ? 'service' : 'services'} · {toTime(spanStart)}–{toTime(spanEnd)} · {durLabel(totalDur)}</span>}
        </div>
        <button onClick={confirm} disabled={!canConfirm} style={{ width: '100%', border: 0, background: canConfirm ? C.ink : 'rgba(0,0,0,.25)', color: C.cream, borderRadius: 10, padding: '15px 0', cursor: canConfirm ? 'pointer' : 'default', fontFamily: F.mono, fontSize: 11.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          {canConfirm ? `Confirm booking · ${money(totalPrice)}` : 'Add a client and a service'}
        </button>
      </div>
    </Drawer>
  )
}
