import { useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { useStore } from '../store'
import { useNarrow } from '../lib/useNarrow'
import type { Appointment } from '../lib/types'
import { money, ticketTotal, todayStr } from '../lib/format'

const CardLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut42 }}>{children}</div>
)
const MethodPill = ({ method }: { method: string }) => (
  <span style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.mut45, border: `1px solid ${C.hair14}`, borderRadius: 999, padding: '3px 10px' }}>{method}</span>
)

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.max(3, Math.round((value / total) * 100)) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
      <span style={{ width: 44, fontFamily: F.mono, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mut45 }}>{label}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'rgba(0,0,0,.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.ink, borderRadius: 999 }} />
      </div>
      <span style={{ width: 54, textAlign: 'right', fontFamily: F.mono, fontSize: 12 }}>{money(value)}</span>
    </div>
  )
}

export function Payments({ openTicket, openClose }: { openTicket: (c: string, d: string) => void; openClose: (d: string) => void }) {
  const s = useStore()
  const narrow = useNarrow()
  const today = todayStr()
  const [open, setOpen] = useState<string | null>(null)

  const dayApts = s.appointments.filter((a) => a.date === today)
  const paidToday = dayApts.filter((a) => a.stage === 'paid')
  const unpaid = dayApts.filter((a) => a.stage === 'booked' || a.stage === 'arrived')
  const arrived = dayApts.filter((a) => a.stage === 'arrived')
  const cash = paidToday.filter((a) => a.method === 'Cash').reduce((m, a) => m + ticketTotal(a), 0)
  const whish = paidToday.filter((a) => a.method === 'Whish').reduce((m, a) => m + ticketTotal(a), 0)
  const expected = unpaid.reduce((m, a) => m + a.price, 0)

  const tickets = useMemo(() => {
    const byVisit = new Map<string, Appointment[]>()
    paidToday.forEach((a) => { const arr = byVisit.get(a.visit_id) || []; arr.push(a); byVisit.set(a.visit_id, arr) })
    return Array.from(byVisit.values()).map((arr) => {
      const sorted = arr.slice().sort((x, y) => (x.time < y.time ? -1 : 1))
      const first = sorted[0]
      return {
        client: first.client_name, time: first.time, date: first.date,
        service: sorted.map((a) => a.service_name).join(' + '),
        method: first.method || 'Cash', total: arr.reduce((m, a) => m + ticketTotal(a), 0),
      }
    }).sort((a, b) => (a.time < b.time ? -1 : 1))
  }, [paidToday])

  const isAdmin = s.user?.role === 'admin'
  const closedToday = s.ledger.some((d) => d.date === today)
  const ledgerTotal = s.ledger.reduce((m, d) => m + d.items.reduce((q, it) => q + it.total, 0), 0)

  const card: React.CSSProperties = { background: C.cream, border: `1px solid ${C.hair12}`, borderRadius: 14 }

  return (
    <div>
      {/* top: two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1.55fr 1fr', gap: 14, alignItems: 'start' }}>
        {/* Paid today */}
        <div style={card}>
          <div style={{ padding: '16px 20px 6px' }}><CardLabel>Paid today</CardLabel></div>
          {tickets.length === 0 && <div style={{ padding: '8px 20px 20px', color: C.mut45, fontSize: 12.5 }}>No tickets paid yet today.</div>}
          {tickets.map((t, i) => (
            <button key={i} onClick={() => openTicket(t.client, t.date)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', border: 0, borderTop: `1px solid ${C.hair07}`, background: 'transparent', cursor: 'pointer' }}>
              <span style={{ fontFamily: F.mono, fontSize: 10.5, color: C.mut45, width: 42 }}>{t.time}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14 }}>{t.client}</div>
                <div style={{ fontSize: 11, color: C.mut45 }}>{t.service}</div>
              </div>
              <MethodPill method={t.method} />
              <span style={{ fontFamily: F.mono, fontSize: 13, width: 56, textAlign: 'right' }}>{money(t.total)}</span>
            </button>
          ))}
        </div>

        {/* right column */}
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ ...card, padding: 20 }}>
            <CardLabel>Takings today</CardLabel>
            <div style={{ fontFamily: F.display, fontSize: 40, padding: '6px 0 4px' }}>{money(cash + whish)}</div>
            <Bar label="Cash" value={cash} total={cash + whish} />
            <Bar label="Whish" value={whish} total={cash + whish} />
          </div>
          <div style={{ ...card, padding: 20 }}>
            <CardLabel>Still to collect</CardLabel>
            <div style={{ fontFamily: F.display, fontSize: 40, padding: '6px 0 2px' }}>{money(expected)}</div>
            <div style={{ fontSize: 12.5, color: C.mut45, marginBottom: 16 }}>
              {unpaid.length} {unpaid.length === 1 ? 'booking' : 'bookings'} not paid yet{arrived.length ? ` — ${arrived.length} of them ${arrived.length === 1 ? 'is' : 'are'} in the chair` : ''}
            </div>
            {!closedToday ? (
              <button onClick={() => (isAdmin ? openClose(today) : s.showToast('Only the owner can close the day.'))}
                style={{ width: '100%', border: 0, background: C.ink, color: C.cream, borderRadius: 999, padding: '14px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase' }}>Close the day</button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: C.mut45 }}>Today is closed</span>
                {isAdmin && <button onClick={() => s.reopenDay(today)} style={{ marginLeft: 'auto', border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase' }}>Reopen</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Earlier days */}
      <div style={{ ...card, marginTop: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '16px 20px 12px' }}>
          <CardLabel>Earlier days</CardLabel>
          <div style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: C.mut45 }}>{money(ledgerTotal)} in {s.ledger.length} {s.ledger.length === 1 ? 'day' : 'days'}</div>
        </div>
        {!narrow && (
          <div style={{ display: 'flex', gap: 8, padding: '6px 20px', borderTop: `1px solid ${C.hair07}`, fontFamily: F.mono, fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: C.mut38 }}>
            <span style={{ flex: 1 }}>Day</span>
            <span style={{ width: 70, textAlign: 'right' }}>Tickets</span>
            <span style={{ width: 80, textAlign: 'right' }}>Cash</span>
            <span style={{ width: 80, textAlign: 'right' }}>Whish</span>
            <span style={{ width: 80, textAlign: 'right' }}>Total</span>
          </div>
        )}
        {s.ledger.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: C.mut45, fontSize: 12.5 }}>No closed days yet.</div>}
        {s.ledger.map((day) => {
          const dcash = day.items.filter((it) => it.method === 'Cash').reduce((m, it) => m + it.total, 0)
          const dwhish = day.items.filter((it) => it.method === 'Whish').reduce((m, it) => m + it.total, 0)
          const expanded = open === day.id
          return (
            <div key={day.id} style={{ borderTop: `1px solid ${C.hair07}` }}>
              <button onClick={() => setOpen(expanded ? null : day.id)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', border: 0, background: expanded ? C.wheatDeep : 'transparent', cursor: 'pointer' }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: C.mut45, width: 12 }}>{expanded ? '▾' : '▸'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14 }}>{day.label}</div>
                  {day.note && <div style={{ fontSize: 11, color: C.mut45 }}>{day.note}</div>}
                </div>
                {narrow ? (
                  <span style={{ fontFamily: F.mono, fontSize: 13 }}>{money(dcash + dwhish)}</span>
                ) : (
                  <>
                    <span style={{ width: 70, textAlign: 'right', fontFamily: F.mono, fontSize: 12 }}>{day.items.length}</span>
                    <span style={{ width: 80, textAlign: 'right', fontFamily: F.mono, fontSize: 12 }}>{money(dcash)}</span>
                    <span style={{ width: 80, textAlign: 'right', fontFamily: F.mono, fontSize: 12 }}>{money(dwhish)}</span>
                    <span style={{ width: 80, textAlign: 'right', fontFamily: F.mono, fontSize: 13 }}>{money(dcash + dwhish)}</span>
                  </>
                )}
              </button>
              {expanded && (
                <div style={{ background: C.wheatDeep, padding: '2px 20px 14px' }}>
                  {day.items.map((it, k) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: k ? `1px solid ${C.hair07}` : 'none' }}>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45, width: 42 }}>{it.time}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5 }}>{it.client}</div>
                        <div style={{ fontSize: 10.5, color: C.mut45 }}>{it.service} · {it.staff_name}</div>
                      </div>
                      <MethodPill method={it.method} />
                      <span style={{ fontFamily: F.mono, fontSize: 12 }}>{money(it.total)}</span>
                    </div>
                  ))}
                  {isAdmin && <div style={{ paddingTop: 10 }}><button onClick={() => s.reopenDay(day.date)} style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '7px 14px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mut45 }}>Reopen this day</button></div>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
