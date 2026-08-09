import { useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { useStore } from '../store'
import { Pill } from '../components/ui'
import type { Appointment } from '../lib/types'
import { money, ticketTotal, todayStr } from '../lib/format'

function MoneyCard({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div style={{ background: dark ? C.ink : C.cream, color: dark ? C.cream : C.ink, border: `1px solid ${dark ? '#000' : C.hair12}`, borderRadius: 11, padding: 14 }}>
      <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: dark ? 'rgba(254,254,241,.55)' : C.mut42 }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 26, paddingTop: 4 }}>{value}</div>
    </div>
  )
}

function MethodPill({ method }: { method: string }) {
  return (
    <span style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.mut45, border: `1px solid ${C.hair14}`, borderRadius: 999, padding: '2px 8px' }}>{method}</span>
  )
}

export function Payments({ openTicket, openClose }: { openTicket: (c: string, d: string) => void; openClose: (d: string) => void }) {
  const s = useStore()
  const today = todayStr()
  const [open, setOpen] = useState<string | null>(null)

  const paidToday = s.appointments.filter((a) => a.date === today && a.stage === 'paid')
  const cash = paidToday.filter((a) => a.method === 'Cash').reduce((m, a) => m + ticketTotal(a), 0)
  const whish = paidToday.filter((a) => a.method === 'Whish').reduce((m, a) => m + ticketTotal(a), 0)

  // group today's paid into visits for the ticket list
  const tickets = useMemo(() => {
    const byVisit = new Map<string, Appointment[]>()
    paidToday.forEach((a) => { const arr = byVisit.get(a.visit_id) || []; arr.push(a); byVisit.set(a.visit_id, arr) })
    return Array.from(byVisit.values()).map((arr) => {
      const sorted = arr.slice().sort((x, y) => (x.time < y.time ? -1 : 1))
      const first = sorted[0]
      const staff = Array.from(new Set(arr.map((a) => s.staffById(a.staff_id)?.name).filter(Boolean)))
      return {
        client: first.client_name, time: first.time, date: first.date,
        service: sorted.map((a) => a.service_name).join(' + '),
        staff: staff.join(', '), method: first.method || 'Cash',
        total: arr.reduce((m, a) => m + ticketTotal(a), 0),
      }
    }).sort((a, b) => (a.time < b.time ? -1 : 1))
  }, [paidToday, s.staffById])

  const isAdmin = s.user?.role === 'admin'
  const closedToday = s.ledger.some((d) => d.date === today)
  const ledgerTotal = s.ledger.reduce((m, d) => m + d.items.reduce((q, it) => q + it.total, 0), 0)

  return (
    <div>
      {/* Today's takings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, paddingBottom: 12 }}>
        <MoneyCard label="Cash" value={money(cash)} />
        <MoneyCard label="Whish" value={money(whish)} />
        <MoneyCard label="Total today" value={money(cash + whish)} dark />
      </div>

      <div style={{ background: C.cream, borderRadius: 12, border: `1px solid ${C.hair12}`, overflow: 'hidden', marginBottom: 12 }}>
        {tickets.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: C.mut45, fontSize: 12.5 }}>No tickets paid yet today.</div>}
        {tickets.map((t, i) => (
          <button key={i} onClick={() => openTicket(t.client, t.date)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', border: 0, borderTop: i ? `1px solid ${C.hair07}` : 'none', background: 'transparent', cursor: 'pointer' }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45, width: 40 }}>{t.time}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13 }}>{t.client}</div>
              <div style={{ fontSize: 10.5, color: C.mut45 }}>{t.service} · {t.staff}</div>
            </div>
            <MethodPill method={t.method} />
            <span style={{ fontFamily: F.mono, fontSize: 12 }}>{money(t.total)}</span>
          </button>
        ))}
      </div>

      {/* Close the day */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 20 }}>
        {!closedToday ? (
          <Pill dark onClick={() => (isAdmin ? openClose(today) : s.showToast('Only the owner can close the day.'))} size={10} style={{ padding: '11px 18px' }}>
            Close the day
          </Pill>
        ) : (
          <>
            <span style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: C.mut45 }}>Today is closed</span>
            {isAdmin && <Pill dark={false} onClick={() => s.reopenDay(today)} size={9.5}>Reopen</Pill>}
          </>
        )}
      </div>

      {/* Earlier days */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 2px 10px' }}>
        <div style={{ fontFamily: F.display, fontSize: 18 }}>Earlier days</div>
        <div style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: C.mut45 }}>{money(ledgerTotal)} in {s.ledger.length} {s.ledger.length === 1 ? 'day' : 'days'}</div>
      </div>

      <div style={{ background: C.cream, borderRadius: 12, border: `1px solid ${C.hair12}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderBottom: `1px solid ${C.hair07}`, fontFamily: F.mono, fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: C.mut38 }}>
          <span style={{ flex: 1 }}>Day</span>
          <span style={{ width: 54, textAlign: 'right' }}>Tickets</span>
          <span style={{ width: 64, textAlign: 'right' }}>Cash</span>
          <span style={{ width: 64, textAlign: 'right' }}>Whish</span>
          <span style={{ width: 64, textAlign: 'right' }}>Total</span>
        </div>
        {s.ledger.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: C.mut45, fontSize: 12.5 }}>No closed days yet.</div>}
        {s.ledger.map((d) => {
          const dcash = d.items.filter((it) => it.method === 'Cash').reduce((m, it) => m + it.total, 0)
          const dwhish = d.items.filter((it) => it.method === 'Whish').reduce((m, it) => m + it.total, 0)
          const expanded = open === d.id
          return (
            <div key={d.id} style={{ borderTop: `1px solid ${C.hair07}` }}>
              <button onClick={() => setOpen(expanded ? null : d.id)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', border: 0, background: expanded ? C.wheatDeep : 'transparent', cursor: 'pointer' }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: C.mut45, width: 12 }}>{expanded ? '▾' : '▸'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>{d.label}</div>
                  {d.note && <div style={{ fontSize: 10.5, color: C.mut45 }}>{d.note}</div>}
                </div>
                <span style={{ width: 54, textAlign: 'right', fontFamily: F.mono, fontSize: 11 }}>{d.items.length}</span>
                <span style={{ width: 64, textAlign: 'right', fontFamily: F.mono, fontSize: 11 }}>{money(dcash)}</span>
                <span style={{ width: 64, textAlign: 'right', fontFamily: F.mono, fontSize: 11 }}>{money(dwhish)}</span>
                <span style={{ width: 64, textAlign: 'right', fontFamily: F.mono, fontSize: 11.5 }}>{money(dcash + dwhish)}</span>
              </button>
              {expanded && (
                <div style={{ background: C.wheatDeep, padding: '2px 16px 12px' }}>
                  {d.items.map((it, k) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: k ? `1px solid ${C.hair07}` : 'none' }}>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45, width: 40 }}>{it.time}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5 }}>{it.client}</div>
                        <div style={{ fontSize: 10.5, color: C.mut45 }}>{it.service} · {it.staff_name}</div>
                      </div>
                      <MethodPill method={it.method} />
                      <span style={{ fontFamily: F.mono, fontSize: 11.5 }}>{money(it.total)}</span>
                    </div>
                  ))}
                  {isAdmin && (
                    <div style={{ paddingTop: 10 }}>
                      <Pill dark={false} size={9} onClick={() => s.reopenDay(d.date)}>Reopen this day</Pill>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
