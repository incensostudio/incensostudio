import { useEffect, useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { Drawer } from '../components/Drawer'
import { selectStyle } from '../components/ui'
import { useStore } from '../store'
import type { BookingSeed } from '../App'
import type { Method, Service } from '../lib/types'
import {
  CURRENCY, DURS, addDays, dayName, durLabel, money, offsetOf, slots, stageMeta,
  ticketTotal, todayStr,
} from '../lib/format'

function PriceInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [v, setV] = useState(String(value))
  useEffect(() => setV(String(value)), [value])
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.hair14}`, borderRadius: 7, padding: '0 6px', background: C.cream }}>
      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{CURRENCY}</span>
      <input value={v} inputMode="numeric"
        onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={() => onCommit(parseInt(v || '0', 10))}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        style={{ width: 46, border: 0, background: 'none', fontFamily: F.mono, fontSize: 11, padding: '7px 2px', textAlign: 'right' }} />
    </div>
  )
}

const Section = ({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.hair07}` }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45 }}>{title}</div>
      {right && <div style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 12 }}>{right}</div>}
    </div>
    {children}
  </div>
)

export function TicketDrawer({ client, date, onClose, openBooking }: {
  client: string; date: string; onClose: () => void; openBooking: (s?: BookingSeed) => void
}) {
  const s = useStore()
  const visit = useMemo(
    () => s.appointments.filter((a) => a.client_name === client && a.date === date).sort((a, b) => (a.time < b.time ? -1 : 1)),
    [s.appointments, client, date],
  )
  const primary = visit.find((a) => a.stage === 'booked' || a.stage === 'arrived') || visit[0]

  const [method, setMethod] = useState<Method>('Cash')
  const [tip, setTip] = useState(0)
  const [note, setNote] = useState(primary?.note || '')
  const [addMode, setAddMode] = useState<'svc' | 'prod'>('svc')
  const [addQ, setAddQ] = useState('')
  const [payArm, setPayArm] = useState(false)

  useEffect(() => { if (visit.length === 0) onClose() }, [visit.length, onClose])
  if (!primary) return null

  const live = visit.filter((a) => a.stage === 'booked' || a.stage === 'arrived')
  const anyArrived = visit.some((a) => a.stage === 'arrived')
  const allPaid = visit.length > 0 && live.length === 0
  const stage = allPaid ? 'paid' : anyArrived ? 'arrived' : 'booked'
  const sm = stageMeta(stage)

  // service rows = appointments; plus service-kind extras (add-ons)
  const serviceExtras = visit.flatMap((a) => a.extras.filter((e) => e.kind === 'service').map((e) => ({ e, apt: a })))
  const productExtras = visit.flatMap((a) => a.extras.filter((e) => e.kind === 'product').map((e) => ({ e, apt: a })))

  const servicesSub = visit.reduce((m, a) => m + a.price, 0) + serviceExtras.reduce((m, x) => m + x.e.price, 0)
  const productsSub = productExtras.reduce((m, x) => m + x.e.price, 0)
  const grand = allPaid ? visit.reduce((m, a) => m + ticketTotal(a), 0) : servicesSub + productsSub + tip

  // move-day warning
  const staffOffOnDate = (d: string) => visit.some((a) => a.staff_id && s.isOff(d, a.staff_id))
  const warn = staffOffOnDate(date)
    ? `Careful — a stylist on this visit is off on ${dayName(date)}`
    : note ? '' : 'Changes save as you pick them.'

  const filteredSvcs = s.services.filter((x) => x.active && (!addQ || x.name.toLowerCase().includes(addQ.toLowerCase()))).slice(0, 8)
  const filteredProds = s.products.filter((x) => x.active && (!addQ || x.name.toLowerCase().includes(addQ.toLowerCase()))).slice(0, 8)

  const primaryAction = async () => {
    if (allPaid) return
    if (!anyArrived) {
      await s.checkInVisit(live.map((a) => a.id))
      s.showToast(`${client} checked in`)
      return
    }
    if (!payArm) { setPayArm(true); setTimeout(() => setPayArm(false), 2800); return }
    setPayArm(false)
    await s.takePayment(live, { method, tip, note })
    s.showToast(`${money(grand)} taken from ${client}`)
    onClose()
  }

  const actionLabel = allPaid ? '' : !anyArrived ? (live.length > 1 ? 'Check in all' : 'Check in') : payArm ? 'Tap again to take' : `Take ${money(grand)}`

  return (
    <Drawer width={430} onClose={onClose}>
      {/* Header */}
      <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 21 }}>{client}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45, paddingTop: 3 }}>{primary.phone || '—'}</div>
        </div>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: sm.bg, color: sm.fg, borderRadius: 999, padding: '4px 10px', fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: sm.dot }} />{sm.label}
        </span>
        <button onClick={onClose} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 20, color: C.mut45, lineHeight: 1 }}>×</button>
      </div>

      {/* Day */}
      {!allPaid && (
        <Section title="Day">
          <select value={date} onChange={(e) => s.moveVisit(primary.visit_id, e.target.value)} style={{ ...selectStyle, width: '100%', fontSize: 12, padding: '9px 10px' }}>
            {Array.from({ length: 45 }, (_, i) => addDays(todayStr(), i)).map((d) => (
              <option key={d} value={d}>{dayName(d)}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: staffOffOnDate(date) ? C.alert : C.mut45, paddingTop: 8 }}>{warn}</div>
        </Section>
      )}

      {/* Services */}
      <Section title="Services on the book" right={money(servicesSub)}>
        {visit.map((a) => {
          const who = s.staffById(a.staff_id)
          const durOpts = Array.from(new Set([...DURS, a.duration_min])).sort((x, y) => x - y)
          return (
            <div key={a.id} style={{ padding: '8px 0', borderTop: `1px solid ${C.hair07}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: allPaid ? 0 : 6 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{a.service_name}</div>
                {!allPaid ? (
                  <PriceInput value={a.price} onCommit={(n) => s.updateAppointment(a.id, { price: n })} />
                ) : (
                  <span style={{ fontFamily: F.mono, fontSize: 12 }}>{money(a.price)}</span>
                )}
                {!allPaid && (
                  <button onClick={() => s.removeAppointment(a.id)} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 16, color: C.mut45 }}>×</button>
                )}
              </div>
              {!allPaid && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <select value={a.time} onChange={(e) => s.updateAppointment(a.id, { time: e.target.value })} style={selectStyle}>
                    {slots(15).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={a.duration_min} onChange={(e) => s.updateAppointment(a.id, { duration_min: parseInt(e.target.value, 10) })} style={selectStyle}>
                    {durOpts.map((d) => <option key={d} value={d}>{durLabel(d)}</option>)}
                  </select>
                  <select value={a.staff_id || ''} onChange={(e) => s.updateAppointment(a.id, { staff_id: e.target.value })} style={selectStyle}>
                    {s.staff.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
              )}
              {allPaid && who && <div style={{ fontSize: 10.5, color: C.mut45 }}>{a.time} · {who.name}</div>}
            </div>
          )
        })}
        {serviceExtras.map(({ e }) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: `1px solid ${C.hair07}` }}>
            <div style={{ flex: 1, fontSize: 12.5, color: C.mut45 }}>+ {e.name}</div>
            <span style={{ fontFamily: F.mono, fontSize: 11.5 }}>{money(e.price)}</span>
            {!allPaid && e.id && <button onClick={() => s.removeExtra(e.id!)} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 15, color: C.mut45 }}>×</button>}
          </div>
        ))}
      </Section>

      {/* Products */}
      {productExtras.length > 0 && (
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.hair07}`, background: C.wheatDeep }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45 }}>Products sold</div>
            <div style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 12 }}>{money(productsSub)}</div>
          </div>
          {productExtras.map(({ e }) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <div style={{ flex: 1, fontSize: 12.5 }}>{e.name}</div>
              <span style={{ fontFamily: F.mono, fontSize: 11.5 }}>{money(e.price)}</span>
              {!allPaid && e.id && <button onClick={() => s.removeExtra(e.id!)} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 15, color: C.mut45 }}>×</button>}
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {!allPaid && (
        <Section title="Tip">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {[0, 10, 15, 20].map((p) => {
              const val = Math.round((servicesSub * p) / 100)
              const on = tip === val && (p > 0 || tip === 0)
              return (
                <button key={p} onClick={() => setTip(val)} style={{ border: `1px solid ${on ? '#000' : C.hair14}`, background: on ? C.ink : C.cream, color: on ? C.cream : C.ink, borderRadius: 999, padding: '7px 12px', cursor: 'pointer', fontFamily: F.mono, fontSize: 10 }}>{p === 0 ? 'No tip' : `${p}%`}</button>
              )
            })}
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.hair14}`, borderRadius: 999, padding: '0 10px', background: C.cream }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{CURRENCY}</span>
              <input value={tip || ''} inputMode="numeric" placeholder="custom" onChange={(e) => setTip(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))} style={{ width: 54, border: 0, background: 'none', fontFamily: F.mono, fontSize: 11, padding: '8px 2px' }} />
            </div>
          </div>
        </Section>
      )}

      {/* Add */}
      {!allPaid && (
        <Section title="Add to this visit">
          <div style={{ display: 'flex', gap: 4, background: C.wheat, borderRadius: 999, padding: 3, marginBottom: 8, width: 'fit-content' }}>
            {(['svc', 'prod'] as const).map((mode) => (
              <button key={mode} onClick={() => setAddMode(mode)} style={{ border: 0, background: addMode === mode ? C.ink : 'transparent', color: addMode === mode ? C.cream : C.mut45, borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>{mode === 'svc' ? 'Service' : 'Product'}</button>
            ))}
          </div>
          <input value={addQ} onChange={(e) => setAddQ(e.target.value)} placeholder={addMode === 'svc' ? 'Search services…' : 'Search products…'} style={{ width: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9, padding: '10px 12px', fontFamily: F.ui, fontSize: 13 }} />
          <div style={{ fontSize: 10.5, color: C.mut45, paddingTop: 6 }}>
            {addMode === 'svc' ? 'Adds a service to the calendar and picks a free stylist.' : 'Adds a bill line only — no calendar block.'}
          </div>
          {addQ && (
            <div style={{ marginTop: 8, border: `1px solid ${C.hair12}`, borderRadius: 9, overflow: 'hidden' }}>
              {addMode === 'svc' && filteredSvcs.map((svc: Service) => (
                <button key={svc.id} onClick={() => { s.addServiceToVisit(primary, svc); setAddQ('') }} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, padding: '9px 12px', border: 0, borderTop: `1px solid ${C.hair07}`, background: C.cream, cursor: 'pointer' }}>
                  <span style={{ flex: 1, fontSize: 12.5 }}>{svc.name}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{durLabel(svc.minutes)}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 11 }}>{money(svc.price)}</span>
                </button>
              ))}
              {addMode === 'prod' && (filteredProds.length ? filteredProds.map((p) => (
                <button key={p.id} onClick={() => { s.addProductLine(primary, { name: p.name, price: p.price }); setAddQ('') }} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, padding: '9px 12px', border: 0, borderTop: `1px solid ${C.hair07}`, background: C.cream, cursor: 'pointer' }}>
                  <span style={{ flex: 1, fontSize: 12.5 }}>{p.name}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 11 }}>{money(p.price)}</span>
                </button>
              )) : (
                <div style={{ padding: 12, fontSize: 12, color: C.mut45 }}>No products in the catalogue yet.</div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Note */}
      {!allPaid && (
        <Section title="Note">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => primary && s.updateAppointment(primary.id, { note })} rows={2} placeholder="Anything to remember for this visit…" style={{ width: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9, padding: '10px 12px', fontFamily: F.ui, fontSize: 12.5 }} />
        </Section>
      )}

      {/* Total + payment */}
      <div style={{ marginTop: 'auto', borderTop: `1px solid ${C.hair12}`, padding: 20, background: C.cream, position: 'sticky', bottom: 0 }}>
        {!allPaid && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['Cash', 'Whish'] as Method[]).map((m) => (
              <button key={m} onClick={() => setMethod(m)} style={{ flex: 1, border: `1px solid ${method === m ? '#000' : C.hair14}`, background: method === m ? C.ink : C.cream, color: method === m ? C.cream : C.ink, borderRadius: 9, padding: '10px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: 11, letterSpacing: '.06em' }}>{m}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: allPaid ? 0 : 12 }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45 }}>{allPaid ? 'Paid' : 'Total'}</div>
          <div style={{ marginLeft: 'auto', fontFamily: F.display, fontSize: 26 }}>{money(grand)}</div>
        </div>
        {allPaid ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mut45 }}>
            <span>Receipt · {primary.method}</span>
            {(primary.tip || 0) > 0 && <span>· tip {money(primary.tip)}</span>}
          </div>
        ) : (
          <button onClick={primaryAction} style={{ width: '100%', border: 0, background: payArm ? C.alert : C.ink, color: C.cream, borderRadius: 10, padding: '14px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>{actionLabel}</button>
        )}
        {allPaid && offsetOf(date) <= 0 && (
          <button onClick={() => { onClose(); openBooking({ name: client, phone: primary.phone, clientId: primary.client_id, service: primary.service_name, staff: primary.staff_id || undefined, date: todayStr() }) }} style={{ width: '100%', marginTop: 10, border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 10, padding: '11px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mut45 }}>Book again</button>
        )}
      </div>
    </Drawer>
  )
}
