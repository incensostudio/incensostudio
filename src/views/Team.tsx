import { useStore } from '../store/useStore'
import { teamPerf, perms } from '../data/fixtures'
import { money, st } from '../lib/logic'
import { View, Disc } from '../components/ui'

const th: React.CSSProperties = { fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.38)', textAlign: 'left', padding: '0 4px 8px', fontWeight: 400 }

export function Team() {
  const s = useStore()
  const rows = teamPerf.map((r) => ({ ...r, stf: st(r.id) }))
  const cell = (v: boolean | string) => (v === true ? 'Yes' : v || 'No')
  const fg = (v: boolean | string) => (v ? '#000' : 'rgba(0,0,0,.28)')

  return (
    <View>
      <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr .9fr .8fr .7fr 1.9fr' }}>
          {['Staff', 'Revenue', 'Utilisation', 'Product eff.', 'Retail', 'What I would say to them'].map((h) => (
            <div key={h} style={th}>{h}</div>
          ))}
        </div>
        {rows.map((r) => (
          <button key={r.id} onClick={() => { s.patch({ view: 'calendar', calStaff: r.id, calMode: 'week', calDay: 0 }); s.showToast(r.stf.name + '’s week — every chair she is in, drag to move any of it') }} style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr .9fr .8fr .7fr 1.9fr', alignItems: 'center', gap: 4, width: '100%', textAlign: 'left', border: 0, background: 'none', borderTop: '1px solid rgba(0,0,0,.08)', padding: '12px 4px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Disc init={r.stf.init} bg={r.stf.bg} size={22} />
              <div>
                <div style={{ fontSize: 13 }}>{r.stf.name}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,.45)', paddingTop: 2 }}>{r.stf.role}</div>
              </div>
            </div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12.5 }}>{money(r.rev)}</div>
            <div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{r.util}%</div>
              <div style={{ height: 4, borderRadius: 999, background: 'rgba(0,0,0,.09)', marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: r.util + '%', background: '#000' }} />
              </div>
            </div>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 19, color: r.eff >= 100 ? '#6b7a4a' : r.eff >= 90 ? '#b07d1a' : '#b4462f' }}>{r.eff}</div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{r.attach}%</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'rgba(0,0,0,.65)' }}>{r.note}</div>
          </button>
        ))}
      </div>

      <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)', paddingBottom: 8 }}>Who can do what</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.4fr' }}>
          {['Capability', 'Owner', 'Manager', 'Reception', 'Staff'].map((h) => (
            <div key={h} style={th}>{h}</div>
          ))}
          {perms.map((p) => (
            <ContentsRow key={p.cap}>
              <div style={{ fontSize: 12, padding: '10px 4px', borderTop: '1px solid rgba(0,0,0,.08)' }}>{p.cap}</div>
              {[p.o, p.m, p.r, p.s].map((v, i) => (
                <div key={i} style={{ fontSize: 11.5, padding: '10px 4px', borderTop: '1px solid rgba(0,0,0,.08)', color: fg(v) }}>{cell(v)}</div>
              ))}
            </ContentsRow>
          ))}
        </div>
      </div>
    </View>
  )
}

function ContentsRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'contents' }}>{children}</div>
}
