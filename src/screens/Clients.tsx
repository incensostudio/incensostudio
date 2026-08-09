import { useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { useStore } from '../store'
import { useNarrow } from '../lib/useNarrow'
import type { BookingSeed } from '../App'
import type { Client } from '../lib/types'
import { money, relativeAgo } from '../lib/format'

function Avatar({ name }: { name: string }) {
  const init = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span style={{ width: 36, height: 36, borderRadius: 999, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.06)', color: 'rgba(0,0,0,.5)', fontFamily: F.mono, fontSize: 10 }}>{init}</span>
  )
}

function Reach({ c }: { c: Client }) {
  return (
    <div style={{ lineHeight: 1.4 }}>
      <div style={{ fontFamily: F.mono, fontSize: 11.5, color: 'rgba(0,0,0,.7)' }}>{c.phone || '—'}</div>
      {(c.instagram || c.tiktok) && (
        <div style={{ fontFamily: F.mono, fontSize: 9.5, color: C.mut42, marginTop: 2 }}>
          {c.instagram && <span>IG {c.instagram}</span>}{c.instagram && c.tiktok ? '  ' : ''}{c.tiktok && <span>TT {c.tiktok}</span>}
        </div>
      )}
    </div>
  )
}

const OutlineBtn = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button onClick={onClick} style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: C.ink }}>{children}</button>
)

export function Clients({ openClient, openBooking }: {
  openClient: (id: string) => void
  openTicket: (c: string, d: string) => void
  openBooking: (seed?: BookingSeed) => void
}) {
  const s = useStore()
  const narrow = useNarrow()
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return s.clients.filter((c) => !term
      || c.name.toLowerCase().includes(term) || c.phone.includes(term)
      || (c.instagram || '').toLowerCase().includes(term) || (c.tiktok || '').toLowerCase().includes(term))
  }, [q, s.clients])

  const book = (c: Client) => openBooking({ clientId: c.id, name: c.name, phone: c.phone })

  return (
    <div>
      {/* Search + new client */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or handle"
          style={{ flex: 1, minWidth: 0, background: C.cream, border: `1px solid ${C.hair12}`, borderRadius: 12, padding: '14px 18px', fontFamily: F.ui, fontSize: 14 }} />
        <button onClick={() => openBooking()} style={{ flex: 'none', border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 12, padding: narrow ? '0 16px' : '0 22px', cursor: 'pointer', fontFamily: F.mono, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: C.ink }}>+ New{narrow ? '' : ' client'}</button>
      </div>

      <div style={{ background: C.cream, borderRadius: 14, border: `1px solid ${C.hair12}`, overflow: 'hidden' }}>
        {/* header (desktop) */}
        {!narrow && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: `1px solid ${C.hair07}`, fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut42 }}>
            <span style={{ flex: 1, minWidth: 0 }}>Client</span>
            <span style={{ width: 210 }}>Reach</span>
            <span style={{ width: 120 }}>Last visit</span>
            <span style={{ width: 70, textAlign: 'right' }}>Visits</span>
            <span style={{ width: 100, textAlign: 'right' }}>Spend</span>
            <span style={{ width: 168 }} />
          </div>
        )}

        {rows.length === 0 && (
          <div style={{ padding: 22, textAlign: 'center', color: C.mut45, fontSize: 12.5 }}>
            {s.clients.length === 0 ? 'No clients yet — they’re added when you take a booking.' : 'No matches.'}
          </div>
        )}

        {rows.map((c, i) => narrow ? (
          <div key={c.id} style={{ padding: 16, borderTop: i ? `1px solid ${C.hair07}` : 'none', animation: 'fadeIn .2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={c.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15 }}>{c.name}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10.5, color: C.mut45, marginTop: 2 }}>{c.phone || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
              <div style={{ flex: 1, fontFamily: F.mono, fontSize: 10.5, color: C.mut45 }}>
                {relativeAgo(c.last_visit)} · {c.visits || 0} {(c.visits || 0) === 1 ? 'visit' : 'visits'} · {money(c.spend || 0)}
              </div>
              <OutlineBtn onClick={() => openClient(c.id)}>Open</OutlineBtn>
              <OutlineBtn onClick={() => book(c)}>Book</OutlineBtn>
            </div>
          </div>
        ) : (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderTop: i ? `1px solid ${C.hair07}` : 'none', animation: 'fadeIn .2s ease' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={c.name} />
              <div style={{ fontSize: 15 }}>{c.name}</div>
            </div>
            <div style={{ width: 210 }}><Reach c={c} /></div>
            <div style={{ width: 120, fontSize: 12.5, color: C.mut45 }}>{relativeAgo(c.last_visit)}</div>
            <div style={{ width: 70, textAlign: 'right', fontFamily: F.mono, fontSize: 13 }}>{c.visits || 0}</div>
            <div style={{ width: 100, textAlign: 'right', fontFamily: F.mono, fontSize: 13 }}>{money(c.spend || 0)}</div>
            <div style={{ width: 168, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <OutlineBtn onClick={() => openClient(c.id)}>Open</OutlineBtn>
              <OutlineBtn onClick={() => book(c)}>Book</OutlineBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
