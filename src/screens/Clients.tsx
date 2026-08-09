import { useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { useStore } from '../store'
import { inputStyle } from '../components/ui'
import { clientHistory, clientUpcoming } from '../lib/history'

export function Clients({ openClient }: { openClient: (id: string) => void; openTicket: (c: string, d: string) => void }) {
  const s = useStore()
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return s.clients
      .filter((c) => !term || c.name.toLowerCase().includes(term) || c.phone.includes(term))
      .map((c) => {
        const hist = clientHistory(c.name, s.appointments, s.ledger, s.staffById)
        const upcoming = clientUpcoming(c.name, s.appointments, s.staffById)
        return { c, visits: hist.length, upcoming: upcoming.length, last: hist[0]?.when || '' }
      })
  }, [q, s.clients, s.appointments, s.ledger, s.staffById])

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients — name or phone" style={{ ...inputStyle, marginBottom: 12 }} />

      <div style={{ background: C.cream, borderRadius: 12, border: `1px solid ${C.hair12}`, overflow: 'hidden' }}>
        {rows.length === 0 && (
          <div style={{ padding: 22, textAlign: 'center', color: C.mut45, fontSize: 12.5 }}>
            {s.clients.length === 0 ? 'No clients yet — they’re added automatically when you take a booking.' : 'No matches.'}
          </div>
        )}
        {rows.map(({ c, visits, upcoming, last }, i) => (
          <button key={c.id} onClick={() => openClient(c.id)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: 0, borderTop: i ? `1px solid ${C.hair07}` : 'none', background: 'transparent', cursor: 'pointer', animation: 'fadeIn .25s ease' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5 }}>{c.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45, paddingTop: 2 }}>{c.phone || '—'}</div>
            </div>
            {upcoming > 0 && (
              <span style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.cream, background: C.ink, borderRadius: 999, padding: '3px 8px' }}>{upcoming} upcoming</span>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{visits} {visits === 1 ? 'visit' : 'visits'}</div>
              {last && <div style={{ fontSize: 10, color: C.mut38, paddingTop: 2 }}>{last}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
