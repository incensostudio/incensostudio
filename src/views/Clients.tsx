import { useStore } from '../store/useStore'
import { useIsMobile } from '../lib/useIsMobile'
import { money } from '../lib/logic'
import { View } from '../components/ui'

const segments = [
  { k: 'Loyal — every 5 weeks or better', v: '418', note: '71% of revenue' },
  { k: 'Regular', v: '506', note: 'Nudge-responsive' },
  { k: 'At risk — past their rhythm', v: '193', note: '11 worth a call, 4 worth a good one' },
  { k: 'First visit this month', v: '62', note: '38% came back a second time' },
  { k: 'Dormant over a year', v: '105', note: 'Leave them alone' },
]
const th: React.CSSProperties = { fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.38)', textAlign: 'left', padding: '0 4px 8px', fontWeight: 400 }

export function Clients() {
  const s = useStore()
  const mobile = useIsMobile()
  const q = (s.clientQ || '').toLowerCase()
  const rows = s.allClients().filter((c) => !q || (c.name + ' ' + c.phone + ' ' + c.tier).toLowerCase().indexOf(q) >= 0)
  const count = q
    ? rows.length + (rows.length === 1 ? ' match' : ' matches') + ' in 1,284 profiles'
    : 'Showing the ' + rows.length + ' with a ticket this week — the rest of the 1,284 load as you scroll'
  const tierBg = (t: string) => (t === 'Gold' ? '#f2e6d9' : t === 'Silver' ? '#e8e4dc' : t === 'New' ? '#e6e2f2' : '#eae6de')
  const stateFg = (st: string) => (st === 'At risk' ? '#b4462f' : st === 'First visit' ? '#3b4a7a' : 'rgba(0,0,0,.6)')

  return (
    <View>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 316px', gap: 12, alignItems: 'start' }}>
        <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '12px 16px 16px' }}>
          <input value={s.clientQ || ''} onChange={(e) => s.patch({ clientQ: e.target.value })} placeholder="Search by name, number or tier" style={{ width: '100%', background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, marginBottom: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .6fr .5fr .7fr .9fr' }}>
            {['Client', 'Tier', 'Visits', 'Lifetime', 'Next visit'].map((h) => (
              <div key={h} style={th}>{h}</div>
            ))}
          </div>
          {rows.length === 0 && <div style={{ fontSize: 12.5, color: 'rgba(0,0,0,.5)', padding: '18px 4px' }}>Nobody in the book matches that. Try part of her name or the last digits of her number.</div>}
          {rows.map((c) => (
            <button key={c.id} onClick={() => s.patch({ drawer: 'client', activeClient: c.id })} style={{ display: 'grid', gridTemplateColumns: '1.5fr .6fr .5fr .7fr .9fr', alignItems: 'center', gap: 4, width: '100%', textAlign: 'left', border: 0, background: 'none', borderTop: '1px solid rgba(0,0,0,.08)', padding: '11px 4px', cursor: 'pointer' }}>
              <div>
                <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 15.5 }}>{c.name}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, color: 'rgba(0,0,0,.45)', paddingTop: 1 }}>{c.phone}</div>
              </div>
              <div><span style={{ background: tierBg(c.tier), borderRadius: 999, padding: '3px 8px', fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase' }}>{c.tier}</span></div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{c.visits}</div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{money(c.ltv)}</div>
              <div>
                <div style={{ fontSize: 12 }}>{c.next}</div>
                {(c.state === 'At risk' || c.state === 'First visit') && <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.06em', textTransform: 'uppercase', color: stateFg(c.state), paddingTop: 2 }}>{c.state}</div>}
              </div>
            </button>
          ))}
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,.4)', paddingTop: 12 }}>{count}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)', paddingBottom: 4 }}>How the book breaks down</div>
            {segments.map((sg) => (
              <div key={sg.k} style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(0,0,0,.08)', padding: '11px 2px' }}>
                <div>
                  <div style={{ fontSize: 12 }}>{sg.k}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{sg.note}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontFamily: "'ALT Gumbo',serif", fontSize: 20 }}>{sg.v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#000', color: '#FEFEF1', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 17 }}>What a dossier is for</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(254,254,241,.82)', paddingTop: 8 }}>Not a marketing profile. It is what the last person who touched her hair wrote down so the next one does not have to ask. Her coffee, her sensitivities, what she nearly bought. Open any client to see hers.</div>
          </div>
        </div>
      </div>
    </View>
  )
}
