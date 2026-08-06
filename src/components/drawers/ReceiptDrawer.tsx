import { useStore } from '../../store/useStore'
import { clientRebook, money, st } from '../../lib/logic'

export function ReceiptDrawer() {
  const s = useStore()
  const a = s.apts.find((x) => x.id === s.activeId)
  const close = () => s.patch({ drawer: null, activeId: null, edit: null })
  if (!a) return null
  const stf = st(a.staff)
  const c = s.allClients().find((x) => x.id === a.cid)
  const L = (a.lines || []).filter((l) => l.t !== 'product')

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.32)', zIndex: 61, display: 'grid', placeItems: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', animation: 'fadeIn .25s ease' }}>
        {/* Settled receipt */}
        <div style={{ width: 330, background: '#FEFEF1', borderRadius: 14, padding: '22px 22px 20px', boxShadow: '0 30px 80px rgba(0,0,0,.32)' }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Receipt</div>
          <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 22, paddingTop: 3 }}>{a.client}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{(a.method || 'Card') + ' · ' + a.time + ' · ' + stf.name}</div>

          <div style={{ paddingTop: 14 }}>
            {L.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i ? '1px solid rgba(0,0,0,.08)' : 'none', fontSize: 12.5 }}>
                <span>{l.name + (l.qty > 1 ? ' ×' + l.qty : '')}</span>
                <span style={{ fontFamily: "'Geist Mono',monospace" }}>{money((l as any).price * (l.qty || 1))}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1.5px solid #000', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Paid — {a.method || 'Card'}</span>
            <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 26 }}>{money(a.total)}</span>
          </div>

          <button onClick={close} style={{ width: '100%', marginTop: 16, border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '11px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>Close</button>
        </div>

        {/* Her portal view of the same visit */}
        <div style={{ width: 262, background: '#000', borderRadius: 30, padding: 10 }}>
          <div style={{ background: '#FEFEF1', borderRadius: 22, overflow: 'hidden', padding: '16px 16px 18px' }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.45)' }}>Signed in as {a.client.split(' ')[0]} · {c ? c.phone : 'her mobile'}</div>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 18, paddingTop: 8 }}>Thank you, {a.client.split(' ')[0]}</div>
            <div style={{ background: '#f3ead6', borderRadius: 10, padding: '10px 12px', marginTop: 10 }}>
              {L.map((l, i) => (
                <div key={i} style={{ fontSize: 11, color: 'rgba(0,0,0,.7)', padding: '2px 0' }}>{l.t === 'retail' ? l.name + ' — taken home' : l.name + ' with ' + stf.name}</div>
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,.14)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(0,0,0,.5)' }}>Total</span>
                <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 21 }}>{money(a.total)}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(0,0,0,.7)', paddingTop: 10 }}>{clientRebook(L, stf.name)}</div>
            <button
              onClick={() => {
                s.patch({ drawer: 'newbooking', nbClient: a.cid, nbNewOn: false, nbQ: '', nbSrcs: ['Staff'], nbNote: '', nbSvcs: [], nbSvcQ: '', nbSvcCat: 'All', nbPlan: {}, nbDay: 0 })
                s.showToast('Rebooking ' + a.client + ' at the desk — pick the service')
              }}
              style={{ width: '100%', marginTop: 12, border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '10px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Book it now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
