import { useState } from 'react'
import { C, F } from '../lib/tokens'
import { Drawer } from '../components/Drawer'
import { useStore } from '../store'
import { dayName, money, ticketTotal } from '../lib/format'

export function CloseDayDrawer({ date, onClose }: { date: string; onClose: () => void }) {
  const s = useStore()
  const [arm, setArm] = useState(false)
  const [busy, setBusy] = useState(false)

  const paid = s.appointments.filter((a) => a.date === date && a.stage === 'paid')
  const open = s.appointments.filter((a) => a.date === date && (a.stage === 'booked' || a.stage === 'arrived'))
  const cash = paid.filter((a) => a.method === 'Cash').reduce((m, a) => m + ticketTotal(a), 0)
  const whish = paid.filter((a) => a.method === 'Whish').reduce((m, a) => m + ticketTotal(a), 0)

  const close = async () => {
    if (!arm) { setArm(true); setTimeout(() => setArm(false), 3000); return }
    setBusy(true)
    await s.closeDay(date)
    onClose()
  }

  return (
    <Drawer width={430} onClose={onClose}>
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: F.display, fontSize: 21 }}>Close the day</div>
        <button onClick={onClose} data-tap="icon" style={{ marginLeft: 'auto', border: 0, background: 'none', cursor: 'pointer', fontSize: 20, color: C.mut45 }}>×</button>
      </div>
      <div style={{ padding: '0 20px 16px', fontFamily: F.mono, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: C.mut45 }}>{dayName(date)}</div>

      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[['Cash', cash], ['Whish', whish], ['Total', cash + whish]].map(([l, v], i) => (
          <div key={i} style={{ background: i === 2 ? C.ink : C.cream, color: i === 2 ? C.cream : C.ink, border: `1px solid ${i === 2 ? '#000' : C.hair12}`, borderRadius: 11, padding: 12 }}>
            <div style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: i === 2 ? 'rgba(254,254,241,.55)' : C.mut42 }}>{l as string}</div>
            <div style={{ fontFamily: F.display, fontSize: 20, paddingTop: 3 }}>{money(v as number)}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 20, flex: 1 }}>
        <div style={{ fontSize: 12.5, color: C.mut45, lineHeight: 1.5 }}>
          {paid.length} {paid.length === 1 ? 'ticket' : 'tickets'} will be written into the ledger.
          {open.length > 0 && (
            <span style={{ color: C.alert }}> {open.length} appointment{open.length === 1 ? '' : 's'} {open.length === 1 ? 'is' : 'are'} still unpaid — {open.length === 1 ? 'it' : 'they'} won’t be counted.</span>
          )}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.hair12}`, padding: 20, background: C.cream }}>
        <button onClick={close} disabled={busy} style={{ width: '100%', border: 0, background: arm ? C.alert : C.ink, color: C.cream, borderRadius: 10, padding: '14px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {busy ? 'Closing…' : arm ? 'Tap again to close the day' : `Close the day · ${money(cash + whish)}`}
        </button>
      </div>
    </Drawer>
  )
}
