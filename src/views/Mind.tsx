import { useStore } from '../store/useStore'
import { useIsMobile } from '../lib/useIsMobile'
import { decisions } from '../data/fixtures'
import { View } from '../components/ui'
import { AskSquare } from '../components/icons'

const mindStats = [
  { label: 'Decisions this month', value: '23', note: '17 approved' },
  { label: 'Tracked impact', value: '+$4,910', note: 'From approved decisions' },
  { label: 'Data behind them', value: '11,400', note: 'Tickets, millilitres, replies' },
  { label: 'Wrong calls', value: '2', note: 'Both pricing. I adjusted.' },
]

export function Mind() {
  const s = useStore()
  const mobile = useIsMobile()
  const laterList = s.mindLater || []
  const doneList = s.mindDone || []
  const open = decisions.filter((d) => laterList.indexOf(d.title) < 0)
  const pendingDec = open.filter((d) => doneList.indexOf(d.title) < 0).length
  const header =
    (pendingDec ? pendingDec + ' decisions on your desk.' : 'Nothing waiting on you right now.') +
    ' I read every ticket, every millilitre, every message reply and every empty chair, then I tell you what to do — not what happened.'

  const act = (d: (typeof decisions)[number]) => {
    const n = { id: 'n' + Date.now(), kind: 'Mind', to: 'Owner', dot: '#b07d1a', read: false, t: 'now', roles: ['owner'] as any, text: 'Approved — ' + d.title.charAt(0).toLowerCase() + d.title.slice(1) + '. ' + d.impact + '. I will report on it in next month’s summary.' }
    s.save({ mindDone: doneList.concat([d.title]), notifs: [n as any].concat(s.notifs) })
    s.showToast('Approved · ' + d.impact + '. I will report on it in next month’s summary.')
  }
  const later = (d: (typeof decisions)[number]) => { s.patch({ mindLater: laterList.concat([d.title]) }); s.showToast('Off your desk. It comes back if the numbers move.') }

  return (
    <View>
      <div style={{ background: '#000', color: '#FEFEF1', borderRadius: 14, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <AskSquare color="#e5c07a" />
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(254,254,241,.6)' }}>Incenso Mind</span>
        </div>
        <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 26, lineHeight: 1.35, maxWidth: 760, paddingTop: 12 }}>{header}</div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 0, marginTop: 20 }}>
          {mindStats.map((m, i) => (
            <div key={m.label} style={{ borderTop: '1px solid rgba(254,254,241,.2)', paddingTop: 12, paddingLeft: i ? 16 : 0 }}>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(254,254,241,.5)' }}>{m.label}</div>
              <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 22, paddingTop: 4 }}>{m.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(254,254,241,.5)', paddingTop: 2 }}>{m.note}</div>
            </div>
          ))}
        </div>
      </div>

      {laterList.length > 0 && (
        <button onClick={() => { s.patch({ mindLater: [] }); s.showToast('Back on your desk') }} style={{ margin: '12px 0 0', border: '1px solid rgba(0,0,0,.18)', background: 'none', borderRadius: 999, padding: '8px 14px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Bring back {laterList.length} you set aside
        </button>
      )}

      {open.length === 0 ? (
        <div style={{ border: '1px dashed rgba(0,0,0,.18)', borderRadius: 12, padding: '28px', textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 19 }}>Your desk is clear.</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,.5)', paddingTop: 5 }}>I am still reading the numbers. Something will surface when it is worth your attention.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2,1fr)', gap: 11, marginTop: 12 }}>
          {open.map((d) => {
            const done = doneList.indexOf(d.title) >= 0
            return (
              <div key={d.title} style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#000', color: d.fg, borderRadius: 4, padding: '3px 7px', fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase' }}>{d.tag}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 9, color: done ? '#6b7a4a' : 'rgba(0,0,0,.42)' }}>{done ? 'Approved — tracking impact' : d.conf}</span>
                </div>
                <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 19, lineHeight: 1.3, paddingTop: 10 }}>{d.title}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(0,0,0,.72)', paddingTop: 6 }}>{d.body}</div>
                <div style={{ background: '#f7f2e4', borderRadius: 9, padding: '11px 13px', marginTop: 10 }}>
                  <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>What I looked at</div>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 15 }}>
                    {d.ev.map((e, i) => (
                      <li key={i} style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(0,0,0,.68)', paddingBottom: 2 }}>{e}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: 1, minHeight: 12 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(0,0,0,.09)', paddingTop: 11, marginTop: 11 }}>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11 }}>{d.impact}</span>
                  <button onClick={() => !done && act(d)} style={{ marginLeft: 'auto', border: 0, borderRadius: 999, padding: '8px 15px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: done ? 'default' : 'pointer', background: done ? '#6b7a4a' : '#000', color: '#FEFEF1' }}>{done ? 'Approved' : 'Do it'}</button>
                  {!done && (
                    <button onClick={() => later(d)} style={{ border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '8px 14px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Later</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </View>
  )
}
