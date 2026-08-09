import { useEffect, useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { Drawer } from '../components/Drawer'
import { selectStyle } from '../components/ui'
import { useStore } from '../store'
import type { BookingSeed } from '../App'
import type { Method, Service } from '../lib/types'
import {
  CURRENCY, DURS, addDays, dayName, durLabel, money, slots, ticketTotal, toMin, toTime, todayStr,
} from '../lib/format'

function PriceField({ value, onCommit, readOnly }: { value: number; onCommit?: (n: number) => void; readOnly?: boolean }) {
  const [v, setV] = useState(String(value))
  useEffect(() => setV(String(value)), [value])
  if (readOnly) return <span style={{ fontFamily: F.mono, fontSize: 13 }}>{money(value)}</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.hair14}`, borderRadius: 7, padding: '0 8px', background: C.cream }}>
      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{CURRENCY}</span>
      <input value={v} inputMode="numeric"
        onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={() => onCommit && onCommit(parseInt(v || '0', 10))}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        style={{ width: 40, border: 0, background: 'none', fontFamily: F.mono, fontSize: 12, padding: '9px 2px', textAlign: 'right' }} />
    </div>
  )
}

const SectionHead = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
    <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45 }}>{title}</div>
    {right !== undefined && <div style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 13 }}>{right}</div>}
  </div>
)

export function TicketDrawer({ client, date, onClose, openBooking, openClient }: {
  client: string; date: string; onClose: () => void
  openBooking: (s?: BookingSeed) => void; openClient: (id: string) => void
}) {
  const s = useStore()
  const visit = useMemo(
    () => s.appointments.filter((a) => a.client_name === client && a.date === date).sort((a, b) => (a.time < b.time ? -1 : 1)),
    [s.appointments, client, date],
  )
  const primary = visit.find((a) => a.stage === 'booked' || a.stage === 'arrived') || visit[0]

  const [method, setMethod] = useState<Method>('Cash')
  const [tip, setTip] = useState(0)
  const [addMode, setAddMode] = useState<'svc' | 'prod'>('svc')
  const [addQ, setAddQ] = useState('')
  const [payArm, setPayArm] = useState(false)

  useEffect(() => { if (visit.length === 0) onClose() }, [visit.length, onClose])
  if (!primary) return null

  const live = visit.filter((a) => a.stage === 'booked' || a.stage === 'arrived')
  const anyArrived = visit.some((a) => a.stage === 'arrived')
  const allPaid = visit.length > 0 && live.length === 0

  const serviceExtras = visit.flatMap((a) => a.extras.filter((e) => e.kind === 'service').map((e) => ({ e, apt: a })))
  const productExtras = visit.flatMap((a) => a.extras.filter((e) => e.kind === 'product').map((e) => ({ e, apt: a })))
  const servicesSub = visit.reduce((m, a) => m + a.price, 0) + serviceExtras.reduce((m, x) => m + x.e.price, 0)
  const productsSub = productExtras.reduce((m, x) => m + x.e.price, 0)
  const grand = allPaid ? visit.reduce((m, a) => m + ticketTotal(a), 0) : servicesSub + productsSub + tip

  const endMin = visit.reduce((m, a) => Math.max(m, toMin(a.time) + (a.duration_min || 60)), toMin(primary.time))
  const staffNames = Array.from(new Set(visit.map((a) => s.staffById(a.staff_id)?.name).filter(Boolean)))
  const subtitle = [
    primary.phone || null,
    visit.length > 1 ? `${visit.length} services on one ticket` : `${primary.time}–${toTime(endMin)}`,
    dayName(date),
    visit.length === 1 ? staffNames[0] : null,
  ].filter(Boolean).join('  ·  ')

  const clientId = primary.client_id || s.clients.find((c) => c.name === client)?.id || null
  const filteredSvcs = s.services.filter((x) => x.active && (!addQ || x.name.toLowerCase().includes(addQ.toLowerCase()))).slice(0, 8)
  const filteredProds = s.products.filter((x) => x.active && (!addQ || x.name.toLowerCase().includes(addQ.toLowerCase()))).slice(0, 8)

  const staffOffOnDate = (dd: string) => visit.some((a) => a.staff_id && s.isOff(dd, a.staff_id))

  const primaryAction = async () => {
    if (allPaid) { s.showToast(`Receipt re-sent to ${primary.phone}`); return }
    if (!anyArrived) { await s.checkInVisit(live.map((a) => a.id)); s.showToast(`${client} checked in`); return }
    if (!payArm) { setPayArm(true); setTimeout(() => setPayArm(false), 2800); return }
    setPayArm(false)
    await s.takePayment(live, { method, tip, note: primary.note })
    s.showToast(`${money(grand)} taken from ${client}`)
    onClose()
  }
  const actionLabel = allPaid ? 'Send receipt again' : !anyArrived ? (live.length > 1 ? 'Check in all' : 'Check in') : payArm ? 'Tap again to take' : `Take ${money(grand)}`

  const wheatBar: React.CSSProperties = { background: C.wheatDeep, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center' }

  return (
    <Drawer width={600} onClose={onClose}>
      {/* Header */}
      <div style={{ padding: '22px 22px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: F.display, fontSize: 22 }}>{client}</div>
            <div style={{ fontFamily: F.mono, fontSize: 10.5, color: C.mut45, paddingTop: 4 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} data-tap="icon" style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, width: 34, height: 34, cursor: 'pointer', fontSize: 18, color: C.mut45, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, border: `1px solid ${C.hair14}`, borderRadius: 999, padding: '5px 12px', fontFamily: F.mono, fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: C.ink }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: C.ink }} />{allPaid ? 'Paid' : 'One receipt'}
          </span>
          {clientId && (
            <button onClick={() => { onClose(); openClient(clientId) }} style={{ border: 0, background: 'none', cursor: 'pointer', fontFamily: F.mono, fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: C.mut45 }}>Client card →</button>
          )}
        </div>
      </div>

      {/* Day (move visit) */}
      {!allPaid && (
        <div style={{ padding: '0 22px 14px' }}>
          <select value={date} onChange={(e) => s.moveVisit(primary.visit_id, e.target.value)} style={{ ...selectStyle, width: '100%', fontSize: 12, padding: '10px 12px' }}>
            {Array.from({ length: 45 }, (_, i) => addDays(todayStr(), i)).map((dd) => <option key={dd} value={dd}>{dayName(dd)}</option>)}
          </select>
          <div style={{ fontSize: 11, color: staffOffOnDate(date) ? C.alert : C.mut45, paddingTop: 8 }}>
            {staffOffOnDate(date) ? `Careful — a stylist on this visit is off on ${dayName(date)}` : 'Changes save as you pick them.'}
          </div>
        </div>
      )}

      {/* Services */}
      <div style={{ padding: '4px 22px 8px' }}>
        <SectionHead title="Services on the book" right={money(servicesSub)} />
        {visit.map((a) => {
          const who = s.staffById(a.staff_id)
          const durOpts = Array.from(new Set([...DURS, a.duration_min])).sort((x, y) => x - y)
          return (
            <div key={a.id} style={{ padding: '10px 0', borderTop: `1px solid ${C.hair07}` }}>
              <div style={{ display: 'flex', alignItems: allPaid ? 'baseline' : 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14 }}>{a.service_name}</div>
                  {allPaid && <div style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45, paddingTop: 3 }}>{a.time} · {who?.name || '—'}</div>}
                </div>
                {allPaid && <PriceField value={a.price} readOnly />}
              </div>
              {!allPaid && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                  <select value={a.time} onChange={(e) => s.updateAppointment(a.id, { time: e.target.value })} style={selectStyle}>
                    {slots(15).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={a.duration_min} onChange={(e) => s.updateAppointment(a.id, { duration_min: parseInt(e.target.value, 10) })} style={selectStyle}>
                    {durOpts.map((dd) => <option key={dd} value={dd}>{durLabel(dd)}</option>)}
                  </select>
                  <select value={a.staff_id || ''} onChange={(e) => s.updateAppointment(a.id, { staff_id: e.target.value })} style={selectStyle}>
                    {s.staff.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PriceField value={a.price} onCommit={(n) => s.updateAppointment(a.id, { price: n })} />
                    <button onClick={() => s.removeAppointment(a.id)} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 16, color: C.mut45 }}>×</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {serviceExtras.map(({ e }) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: `1px solid ${C.hair07}` }}>
            <div style={{ flex: 1, fontSize: 13, color: C.mut45 }}>+ {e.name}</div>
            {allPaid ? <PriceField value={e.price} readOnly /> : <><PriceField value={e.price} onCommit={(n) => e.id && s.updateExtraPrice(e.id, n)} /><button onClick={() => e.id && s.removeExtra(e.id)} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 15, color: C.mut45 }}>×</button></>}
          </div>
        ))}
      </div>

      {/* Products */}
      {productExtras.length > 0 && (
        <div style={{ padding: '10px 22px', background: C.wheatDeep, margin: '0 0 6px' }}>
          <SectionHead title="Products sold" right={money(productsSub)} />
          {productExtras.map(({ e }) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
              <div style={{ flex: 1, fontSize: 13 }}>{e.name}</div>
              {allPaid ? <PriceField value={e.price} readOnly /> : <><PriceField value={e.price} onCommit={(n) => e.id && s.updateExtraPrice(e.id, n)} /><button onClick={() => e.id && s.removeExtra(e.id)} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 15, color: C.mut45 }}>×</button></>}
            </div>
          ))}
        </div>
      )}

      {/* Total bar */}
      <div style={{ padding: '8px 22px 4px' }}>
        <div style={wheatBar}>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45 }}>Total</div>
          <div style={{ marginLeft: 'auto', fontFamily: F.display, fontSize: 26 }}>{money(grand)}</div>
        </div>
      </div>

      {allPaid ? (
        <div style={{ padding: '10px 22px 20px', fontSize: 12.5, color: C.mut45 }}>
          Paid by {primary.method} at {primary.time}. Receipt sent to {primary.phone || '—'}.
        </div>
      ) : (
        <>
          {/* Add */}
          <div style={{ padding: '14px 22px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45 }}>Add</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: C.wheat, borderRadius: 999, padding: 3 }}>
                {(['svc', 'prod'] as const).map((mode) => (
                  <button key={mode} onClick={() => setAddMode(mode)} style={{ border: 0, background: addMode === mode ? C.ink : 'transparent', color: addMode === mode ? C.cream : C.mut45, borderRadius: 999, padding: '6px 16px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>{mode === 'svc' ? 'Service' : 'Product'}</button>
                ))}
              </div>
            </div>
            <input value={addQ} onChange={(e) => setAddQ(e.target.value)} placeholder={addMode === 'svc' ? 'Search services — cut, balayage, gel…' : 'Search products…'} style={{ width: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9, padding: '11px 13px', fontFamily: F.ui, fontSize: 13 }} />
            {addQ && (
              <div style={{ marginTop: 8, border: `1px solid ${C.hair12}`, borderRadius: 9, overflow: 'hidden' }}>
                {addMode === 'svc' && filteredSvcs.map((svc: Service) => (
                  <button key={svc.id} onClick={() => { s.addServiceToVisit(primary, svc); setAddQ('') }} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, padding: '10px 13px', border: 0, borderTop: `1px solid ${C.hair07}`, background: C.cream, cursor: 'pointer' }}>
                    <span style={{ flex: 1, fontSize: 12.5 }}>{svc.name}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{durLabel(svc.minutes)}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 11 }}>{money(svc.price)}</span>
                  </button>
                ))}
                {addMode === 'prod' && (filteredProds.length ? filteredProds.map((p) => (
                  <button key={p.id} onClick={() => { s.addProductLine(primary, { name: p.name, price: p.price }); setAddQ('') }} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, padding: '10px 13px', border: 0, borderTop: `1px solid ${C.hair07}`, background: C.cream, cursor: 'pointer' }}>
                    <span style={{ flex: 1, fontSize: 12.5 }}>{p.name}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 11 }}>{money(p.price)}</span>
                  </button>
                )) : <div style={{ padding: 12, fontSize: 12, color: C.mut45 }}>No products in the catalogue yet.</div>)}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: C.mut45, paddingTop: 6 }}>{addMode === 'svc' ? 'Books a service onto the calendar and picks a free stylist.' : 'Adds a bill line only — no calendar block.'}</div>
          </div>

          {/* Payment: method + tip */}
          <div style={{ padding: '10px 22px 6px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {(['Cash', 'Whish'] as Method[]).map((m) => (
                <button key={m} onClick={() => setMethod(m)} style={{ flex: 1, border: `1px solid ${method === m ? '#000' : C.hair14}`, background: method === m ? C.ink : C.cream, color: method === m ? C.cream : C.ink, borderRadius: 9, padding: '11px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: 11, letterSpacing: '.06em' }}>{m}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {[0, 10, 15, 20].map((pc) => {
                const val = Math.round((servicesSub * pc) / 100)
                const on = tip === val && (pc > 0 || tip === 0)
                return <button key={pc} onClick={() => setTip(val)} style={{ border: `1px solid ${on ? '#000' : C.hair14}`, background: on ? C.ink : C.cream, color: on ? C.cream : C.ink, borderRadius: 999, padding: '7px 13px', cursor: 'pointer', fontFamily: F.mono, fontSize: 10 }}>{pc === 0 ? 'No tip' : `${pc}%`}</button>
              })}
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.hair14}`, borderRadius: 999, padding: '0 10px', background: C.cream }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{CURRENCY}</span>
                <input value={tip || ''} inputMode="numeric" placeholder="tip" onChange={(e) => setTip(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))} style={{ width: 46, border: 0, background: 'none', fontFamily: F.mono, fontSize: 11, padding: '8px 2px' }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', borderTop: `1px solid ${C.hair12}`, padding: 20, background: C.cream, position: 'sticky', bottom: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onClose} style={{ border: 0, background: 'none', cursor: 'pointer', fontFamily: F.mono, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: C.mut45 }}>Close</button>
        <button onClick={primaryAction} style={{ marginLeft: 'auto', border: 0, background: payArm ? C.alert : C.ink, color: C.cream, borderRadius: 999, padding: '13px 22px', cursor: 'pointer', fontFamily: F.mono, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>{actionLabel}</button>
        {allPaid && (
          <button onClick={() => { onClose(); openBooking({ name: client, phone: primary.phone, clientId, service: primary.service_name, staff: primary.staff_id || undefined, date: todayStr() }) }} style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '13px 18px', cursor: 'pointer', fontFamily: F.mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mut45 }}>Book again</button>
        )}
      </div>
    </Drawer>
  )
}
