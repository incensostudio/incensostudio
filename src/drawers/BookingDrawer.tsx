import { useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { Drawer } from '../components/Drawer'
import { selectStyle } from '../components/ui'
import { useStore } from '../store'
import type { BookingSeed } from '../App'
import type { Client } from '../lib/types'
import {
  CURRENCY, DURS, addDays, dayName, durLabel, money, overlaps, slots, toMin, toTime, todayStr,
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
  const [svcQ, setSvcQ] = useState('')
  const [showSvcs, setShowSvcs] = useState(false)
  const [stackAt, setStackAt] = useState('10:00')

  const seededSvc = seed?.service ? s.services.find((x) => x.name === seed.service) : undefined
  const [cards, setCards] = useState<Card[]>(
    seededSvc ? [{ key: 'k0', name: seededSvc.name, price: seededSvc.price, staff: seed?.staff || s.staff[0]?.id || '', time: '10:00', dur: seededSvc.minutes }] : [],
  )

  const clientMatches = useMemo(() => {
    const t = name.trim().toLowerCase()
    return s.clients.filter((c) => t && c.name.toLowerCase().includes(t)).slice(0, 6)
  }, [name, s.clients])

  const svcMatches = s.services.filter((x) => x.active && (!svcQ || x.name.toLowerCase().includes(svcQ.toLowerCase()))).slice(0, 8)

  const pickClient = (c: Client) => { setName(c.name); setClientId(c.id); setPhone(c.phone); setShowClients(false) }

  const addService = (svcName: string) => {
    const svc = s.services.find((x) => x.name === svcName)
    if (!svc) return
    setCards((cs) => {
      const last = cs[cs.length - 1]
      const start = last ? toTime(toMin(last.time) + last.dur) : stackAt
      const staff = s.staff.find((st) => (st.does || []).includes(svc.category) && !s.isOff(date, st.id))?.id || s.staff[0]?.id || ''
      return [...cs, { key: 'k' + Date.now() + Math.random().toString(36).slice(2, 5), name: svc.name, price: svc.price, staff, time: start, dur: svc.minutes }]
    })
    setSvcQ(''); setShowSvcs(false)
  }

  const setCard = (key: string, patch: Partial<Card>) => setCards((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  const removeCard = (key: string) => setCards((cs) => cs.filter((c) => c.key !== key))

  const stack = () => setCards((cs) => {
    let t = toMin(stackAt)
    return cs.map((c) => { const time = toTime(t); t += c.dur; return { ...c, time } })
  })

  // conflict detection per card
  const cardWarn = (c: Card): string => {
    if (c.staff && s.isOff(date, c.staff)) {
      const st = s.staffById(c.staff)
      return `${st?.name || 'Stylist'} is off on ${dayName(date)}`
    }
    const cs = toMin(c.time); const ce = cs + c.dur
    // against existing appointments
    const clashExisting = s.appointments.some((a) => a.date === date && a.staff_id === c.staff && a.stage !== 'cancelled' && overlaps(cs, ce, toMin(a.time), toMin(a.time) + a.duration_min))
    // against other cards
    const clashCards = cards.some((o) => o.key !== c.key && o.staff === c.staff && overlaps(cs, ce, toMin(o.time), toMin(o.time) + o.dur))
    if (clashExisting || clashCards) { const st = s.staffById(c.staff); return `${st?.name || 'Stylist'} is double-booked at ${c.time}` }
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

  return (
    <Drawer width={560} onClose={onClose}>
      <div style={{ padding: '20px 22px 14px', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: F.display, fontSize: 21 }}>New booking</div>
        <button onClick={onClose} data-tap="icon" style={{ marginLeft: 'auto', border: 0, background: 'none', cursor: 'pointer', fontSize: 20, color: C.mut45 }}>×</button>
      </div>

      {/* Client */}
      <div style={{ padding: '0 22px 14px' }}>
        <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45, marginBottom: 8 }}>Client</div>
        <div style={{ position: 'relative' }}>
          <input value={name} onChange={(e) => { setName(e.target.value); setClientId(null); setShowClients(true) }} onFocus={() => setShowClients(true)} placeholder="Search or type a new name" style={{ width: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9, padding: '10px 12px', fontFamily: F.ui, fontSize: 13 }} />
          {showClients && clientMatches.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 3, marginTop: 4, background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,.12)' }}>
              {clientMatches.map((c) => (
                <button key={c.id} onClick={() => pickClient(c)} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, padding: '9px 12px', border: 0, borderTop: `1px solid ${C.hair07}`, background: C.cream, cursor: 'pointer' }}>
                  <span style={{ flex: 1, fontSize: 12.5 }}>{c.name}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={{ width: '100%', marginTop: 8, background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9, padding: '10px 12px', fontFamily: F.mono, fontSize: 12 }} />
      </div>

      {/* Date + stack */}
      <div style={{ padding: '0 22px 14px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45 }}>Day</div>
        <select value={date} onChange={(e) => setDate(e.target.value)} style={{ ...selectStyle, fontSize: 12, padding: '8px 10px' }}>
          {Array.from({ length: 60 }, (_, i) => addDays(todayStr(), i)).map((d) => <option key={d} value={d}>{dayName(d)}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: F.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: C.mut45 }}>Stack from</span>
          <select value={stackAt} onChange={(e) => setStackAt(e.target.value)} style={selectStyle}>
            {slots(15).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={stack} style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase' }}>Reflow</button>
        </div>
      </div>

      {/* Service search */}
      <div style={{ padding: '0 22px 10px', position: 'relative' }}>
        <input value={svcQ} onChange={(e) => { setSvcQ(e.target.value); setShowSvcs(true) }} onFocus={() => setShowSvcs(true)} placeholder={`Search ${s.services.length} services — cut, balayage, gel…`} style={{ width: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9, padding: '10px 12px', fontFamily: F.ui, fontSize: 13 }} />
        {showSvcs && svcQ && (
          <div style={{ position: 'absolute', top: '100%', left: 22, right: 22, zIndex: 3, marginTop: 4, background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,.12)' }}>
            {svcMatches.map((svc) => (
              <button key={svc.id} onClick={() => addService(svc.name)} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, padding: '9px 12px', border: 0, borderTop: `1px solid ${C.hair07}`, background: C.cream, cursor: 'pointer' }}>
                <span style={{ flex: 1, fontSize: 12.5 }}>{svc.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{durLabel(svc.minutes)}</span>
                <span style={{ fontFamily: F.mono, fontSize: 11 }}>{money(svc.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Service cards */}
      <div style={{ padding: '0 22px', flex: 1 }}>
        {cards.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: C.mut45, fontSize: 12.5 }}>Search a service above to add it to the booking.</div>}
        {cards.map((c) => {
          const warn = cardWarn(c)
          const durOpts = Array.from(new Set([...DURS, c.dur])).sort((x, y) => x - y)
          return (
            <div key={c.key} style={{ border: `1px solid ${warn ? C.alert : C.hair12}`, borderRadius: 11, padding: 12, marginBottom: 10, background: C.cream }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, fontSize: 13 }}>{c.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.hair14}`, borderRadius: 7, padding: '0 6px' }}>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{CURRENCY}</span>
                  <input value={c.price} inputMode="numeric" onChange={(e) => setCard(c.key, { price: parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10) })} style={{ width: 44, border: 0, background: 'none', fontFamily: F.mono, fontSize: 11, padding: '7px 2px', textAlign: 'right' }} />
                </div>
                <button onClick={() => removeCard(c.key)} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 16, color: C.mut45 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <select value={c.staff} onChange={(e) => setCard(c.key, { staff: e.target.value })} style={selectStyle}>
                  {s.staff.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
                <select value={c.time} onChange={(e) => setCard(c.key, { time: e.target.value })} style={selectStyle}>
                  {slots(15).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={c.dur} onChange={(e) => setCard(c.key, { dur: parseInt(e.target.value, 10) })} style={selectStyle}>
                  {durOpts.map((d) => <option key={d} value={d}>{durLabel(d)}</option>)}
                </select>
                <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.mut45, alignSelf: 'center' }}>ends {toTime(toMin(c.time) + c.dur)}</span>
              </div>
              {warn && <div style={{ color: C.alert, fontSize: 11, paddingTop: 8 }}>{warn} — you can still book it.</div>}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.hair12}`, padding: 20, background: C.cream, position: 'sticky', bottom: 0 }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>
          <span>{cards.length} {cards.length === 1 ? 'service' : 'services'}</span>
          {cards.length > 0 && <span>{toTime(spanStart)}–{toTime(spanEnd)} · {durLabel(totalDur)}</span>}
          <span style={{ marginLeft: 'auto', color: C.ink, fontSize: 13 }}>{money(totalPrice)}</span>
        </div>
        <button onClick={confirm} disabled={!canConfirm} style={{ width: '100%', border: 0, background: canConfirm ? C.ink : 'rgba(0,0,0,.25)', color: C.cream, borderRadius: 10, padding: '14px 0', cursor: canConfirm ? 'pointer' : 'default', fontFamily: F.mono, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {canConfirm ? `Confirm booking · ${money(totalPrice)}` : 'Add a client and a service'}
        </button>
      </div>
    </Drawer>
  )
}
