import { useStore } from '../../store/useStore'
import { payMethods } from '../../data/fixtures'
import { elapsedFor, money, st } from '../../lib/logic'
import { Drawer, DrawerClose } from './Drawer'

const tagFor: Record<string, [string, string, string]> = {
  service: ['#e8e4dc', '#000', 'Service'],
  retail: ['#e6e2f2', '#3b4a7a', 'Retail'],
}

export function PayDrawer() {
  const s = useStore()
  const a = s.apts.find((x) => x.id === s.activeId)
  const close = () => s.patch({ drawer: null, activeId: null, edit: null })
  if (!a) return null
  const stf = st(a.staff)
  const L = a.lines || []
  const bill = L.filter((l) => l.t !== 'product')
  const due = bill.reduce((n, l) => n + (l as any).price * (l.qty || 1), 0)
  const tipAmt = Math.round((due * s.tip) / 100)
  const at = elapsedFor(a).replace(' in chair', ' ago')

  const willSend =
    'Thank-you message on ' +
    (a.channel === 'WhatsApp' ? 'WhatsApp' : 'her preferred channel') +
    ' with today’s itemised summary · portal link, she logs in with her phone number · rebooking nudge scheduled by Mind · stock deducted at millilitre level · ' +
    stf.name +
    '’s commission and tip posted.'

  return (
    <Drawer width={520} onClose={close}>
      <div style={{ padding: '22px 24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Reception — approve &amp; collect</div>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 24, paddingTop: 4 }}>{a.client}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.5)', paddingTop: 3 }}>Closed by {stf.name} · {at}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}><DrawerClose onClose={close} /></div>
        </div>

        <div style={{ border: '1px solid rgba(0,0,0,.12)', borderRadius: 11, marginTop: 18, overflow: 'hidden' }}>
          {bill.map((l, i) => {
            const tg = tagFor[l.t] || tagFor.service
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderTop: i ? '1px solid rgba(0,0,0,.08)' : 'none' }}>
                <span style={{ background: tg[0], color: tg[1], borderRadius: 4, padding: '1px 5px', fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.08em', textTransform: 'uppercase' }}>{tg[2]}</span>
                <span style={{ fontSize: 12.5 }}>{l.name}</span>
                <span style={{ fontSize: 10.5, color: 'rgba(0,0,0,.45)' }}>{(l.qty > 1 ? '×' + l.qty + ' · ' : '') + ((l as any).price > (l as any).base ? 'base ' + money((l as any).base) + ' → raised' : '')}</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{money((l as any).price * (l.qty || 1))}</span>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 2px 4px' }}>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Due</span>
          <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 30 }}>{money(due)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingTop: 8 }}>
          {payMethods.map((m) => {
            const on = s.method === m.name
            return (
              <button key={m.name} onClick={() => s.patch({ method: m.name })} style={{ textAlign: 'left', border: '1px solid rgba(0,0,0,.16)', borderRadius: 9, padding: '10px 12px', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : '#000' }}>
                <div style={{ fontSize: 12.5 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: on ? 'rgba(254,254,241,.6)' : 'rgba(0,0,0,.45)', paddingTop: 2 }}>{m.sub}</div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 6, paddingTop: 12 }}>
          {[0, 10, 15, 20].map((p) => {
            const on = s.tip === p
            return (
              <button key={p} onClick={() => s.patch({ tip: p })} style={{ flex: 1, border: '1px solid rgba(0,0,0,.16)', borderRadius: 8, padding: '9px', fontFamily: "'Geist Mono',monospace", fontSize: 10.5, cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : '#000' }}>
                {p ? p + '%' : 'No tip'}
              </button>
            )
          })}
        </div>

        <input value={s.deskNote || ''} onChange={(e) => s.patch({ deskNote: e.target.value })} placeholder="Desk note (optional)" style={{ width: '100%', marginTop: 12, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 9, padding: '10px 12px', fontSize: 12 }} />

        <div style={{ background: '#f3ead6', borderRadius: 10, padding: '11px 13px', marginTop: 12 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a5a20' }}>On confirm</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.55, color: 'rgba(0,0,0,.72)', paddingTop: 4 }}>{willSend}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 18 }}>
          <button
            onClick={() => {
              s.save({ apts: s.apts.map((x) => (x.id === a.id ? { ...x, stage: 'service' } : x)), drawer: null, activeId: null })
              s.showToast('Back to ' + stf.name + ' to fix the ticket — nothing was charged', 'warn')
            }}
            style={{ flex: 'none', border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '11px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Send back to {stf.name}
          </button>
          <button onClick={() => s.bump(a.id, 'paid', { total: due + tipAmt, method: s.method })} style={{ flex: 1, border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '11px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Confirm {s.method}{tipAmt ? ' + ' + money(tipAmt) + ' tip' : ''}
          </button>
        </div>
      </div>
    </Drawer>
  )
}
