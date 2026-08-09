import { useEffect, useMemo, useState } from 'react'
import { C, F } from '../lib/tokens'
import { Drawer } from '../components/Drawer'
import { inputStyle } from '../components/ui'
import { useStore } from '../store'
import { clientHistory, clientUpcoming } from '../lib/history'
import { dayName, money } from '../lib/format'

export function ClientDrawer({ clientId, onClose, openTicket }: {
  clientId: string; onClose: () => void; openTicket: (c: string, d: string) => void
}) {
  const s = useStore()
  const client = s.clients.find((c) => c.id === clientId)
  const [name, setName] = useState(client?.name || '')
  const [phone, setPhone] = useState(client?.phone || '')
  const [ig, setIg] = useState(client?.instagram || '')
  const [tt, setTt] = useState(client?.tiktok || '')
  const [note, setNote] = useState(client?.note || '')
  const [delArm, setDelArm] = useState(false)

  useEffect(() => { if (!client) onClose() }, [client, onClose])

  const history = useMemo(() => client ? clientHistory(client.name, s.appointments, s.ledger, s.staffById) : [], [client, s.appointments, s.ledger, s.staffById])
  const upcoming = useMemo(() => client ? clientUpcoming(client.name, s.appointments, s.staffById) : [], [client, s.appointments, s.staffById])

  if (!client) return null

  const save = (patch: Record<string, string>) => s.saveClient(client.id, patch)

  return (
    <Drawer width={430} onClose={onClose}>
      <div style={{ padding: '20px 20px 6px', display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => save({ name })} style={{ fontFamily: F.display, fontSize: 21, border: 0, background: 'none', width: '100%', padding: 0 }} />
        </div>
        <button onClick={onClose} data-tap="icon" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 20, color: C.mut45 }}>×</button>
      </div>

      <div style={{ padding: '8px 20px 16px', display: 'grid', gap: 8 }}>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => save({ phone })} placeholder="Phone" style={{ ...inputStyle, fontFamily: F.mono, fontSize: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={ig} onChange={(e) => setIg(e.target.value)} onBlur={() => save({ instagram: ig })} placeholder="Instagram" style={{ ...inputStyle, fontSize: 12 }} />
          <input value={tt} onChange={(e) => setTt(e.target.value)} onBlur={() => save({ tiktok: tt })} placeholder="TikTok" style={{ ...inputStyle, fontSize: 12 }} />
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => save({ note })} rows={2} placeholder="Notes about this client…" style={{ ...inputStyle, fontSize: 12.5 }} />
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.hair07}` }}>
          <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45, marginBottom: 8 }}>Upcoming</div>
          {upcoming.map((v) => (
            <button key={v.visitId} onClick={() => { onClose(); openTicket(client.name, v.date) }} style={{ width: '100%', textAlign: 'left', border: `1px solid ${C.hair12}`, borderRadius: 9, padding: '10px 12px', marginBottom: 8, background: C.cream, cursor: 'pointer' }}>
              <div style={{ fontSize: 12.5 }}>{dayName(v.date)} · {v.timeSpan}</div>
              <div style={{ fontSize: 11, color: C.mut45, padding: '2px 0' }}>{v.services.join(' + ')}</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45 }}>{v.staff.join(', ')} · {money(v.total)}</div>
            </button>
          ))}
        </div>
      )}

      {/* History */}
      <div style={{ padding: '10px 20px 20px', borderTop: `1px solid ${C.hair07}`, flex: 1 }}>
        <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45, marginBottom: 8 }}>History</div>
        {history.length === 0 && <div style={{ fontSize: 12, color: C.mut45 }}>No visits yet.</div>}
        {history.map((h) => (
          <div key={h.key} style={{ padding: '10px 0', borderTop: `1px solid ${C.hair07}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 12.5, flex: 1 }}>{h.when} · {h.services.join(' + ')}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12 }}>{money(h.total)}</div>
            </div>
            {h.products.length > 0 && <div style={{ fontSize: 11, color: C.mut45, paddingTop: 2 }}>Took home: {h.products.join(', ')}</div>}
            <div style={{ fontFamily: F.mono, fontSize: 10, color: C.mut45, paddingTop: 3 }}>
              with {h.staff.join(', ')} · paid {h.method}{h.tip ? ` · tip ${money(h.tip)}` : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Delete */}
      <div style={{ borderTop: `1px solid ${C.hair12}`, padding: 16, background: C.cream }}>
        <button onClick={() => { if (!delArm) { setDelArm(true); setTimeout(() => setDelArm(false), 2800); return } s.deleteClient(client.id); onClose() }} style={{ width: '100%', border: `1px solid ${delArm ? C.alert : C.hair14}`, background: C.cream, color: delArm ? C.alert : C.mut45, borderRadius: 9, padding: '11px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {delArm ? 'Tap again to delete this client' : 'Delete client'}
        </button>
      </div>
    </Drawer>
  )
}
