import { useStore } from '../../store/useStore'
import { askSuggestions } from '../../lib/ask'
import { AskSquare, CloseIcon } from '../icons'

export function AskDrawer() {
  const s = useStore()
  const close = () => s.patch({ drawer: null })
  const thread = s.askThread || []

  return (
    <>
      <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.28)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 474, background: '#000', color: '#FEFEF1', zIndex: 61, overflowY: 'auto', animation: 'drawerIn .22s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 24px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <AskSquare color="#e5c07a" />
              <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 19 }}>Ask Incenso</span>
            </div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,241,.5)', paddingTop: 5 }}>Reads every ticket, millilitre and reply</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {thread.length > 0 && (
              <button onClick={() => s.patch({ askThread: [], askQ: '' })} style={{ border: '1px solid rgba(254,254,241,.25)', background: 'none', color: '#FEFEF1', borderRadius: 999, padding: '6px 12px', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Start over</button>
            )}
            <button onClick={close} title="Close" style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid rgba(254,254,241,.25)', background: 'none', color: '#FEFEF1', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><CloseIcon /></button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {thread.length === 0 ? (
            <>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(254,254,241,.86)' }}>Ask about a client, a staff member, a product, a day of the week, or a price. I answer from the ticket history, the product ledger and the booking channels.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 4 }}>
                {askSuggestions.map((q) => (
                  <button key={q} onClick={() => s.answer(q)} style={{ textAlign: 'left', border: '1px solid rgba(254,254,241,.22)', background: 'none', color: '#FEFEF1', borderRadius: 10, padding: '11px 13px', fontSize: 12.5, cursor: 'pointer' }}>{q}</button>
                ))}
              </div>
            </>
          ) : (
            thread.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.who === 'you' ? 'flex-end' : 'flex-start', gap: 4 }}>
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(254,254,241,.4)' }}>{m.who === 'you' ? 'You' : 'Incenso Mind'}</span>
                <div style={{ maxWidth: '86%', borderRadius: 11, padding: '11px 13px', fontSize: 12.5, lineHeight: 1.55, background: m.who === 'you' ? '#f3ead6' : 'transparent', color: m.who === 'you' ? '#000' : 'rgba(254,254,241,.9)', border: m.who === 'you' ? 'none' : '1px solid rgba(254,254,241,.18)' }}>{m.text}</div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px 24px 22px', display: 'flex', gap: 8, borderTop: '1px solid rgba(254,254,241,.14)' }}>
          <input
            value={s.askQ || ''}
            onChange={(e) => s.patch({ askQ: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); s.answer(s.askQ) } }}
            placeholder="Ask anything about the salon"
            style={{ flex: 1, background: 'rgba(254,254,241,.08)', border: '1px solid rgba(254,254,241,.2)', borderRadius: 10, padding: '11px 13px', color: '#FEFEF1', fontSize: 12.5, fontFamily: 'inherit' }}
          />
          <button onClick={() => s.answer(s.askQ)} style={{ border: 0, background: '#FEFEF1', color: '#000', borderRadius: 10, padding: '0 18px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Ask</button>
        </div>
      </div>
    </>
  )
}
