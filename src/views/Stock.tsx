import { useStore } from '../store/useStore'
import { useIsMobile } from '../lib/useIsMobile'
import { stockRaw, variance } from '../data/fixtures'
import { money, st } from '../lib/logic'
import { View, Disc } from '../components/ui'

const stockAlerts = [
  'Rim’s keratin at 11:00 needs 220ml. You hold 340ml and a 12:00 booking wants 180ml — one of them gets turned away unless you order this morning.',
  'Rubber base runs dry Wednesday 5 August mid-shift at the rate Lynn and Joud are actually drawing it. Supplier lead time is four days.',
  'Chanel Le Vernis 151 has moved nine times in a month and you hold 1.4 bottles. It is also your highest-margin retail line — hold three.',
]

const th: React.CSSProperties = { fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.38)', textAlign: 'left', padding: '0 4px 8px', fontWeight: 400 }

export function Stock() {
  const s = useStore()
  const mobile = useIsMobile()
  const usedMap = s.stockUsed || {}
  const orderedList = s.ordered || []

  const rows = stockRaw.map((p) => {
    const usedMl = usedMap[p.n] || 0
    const ordered = orderedList.indexOf(p.n) >= 0
    const totalMl = Math.max(0, p.on * p.ml - usedMl)
    const left = Math.floor(totalMl / p.per)
    const perWeek = p.use / 4.3
    const weeks = perWeek ? left / perWeek : 99
    const crit = weeks < 1.6
    const low = weeks < 3.2
    return {
      p,
      onHand: (p.on % 1 ? p.on.toFixed(1) : p.on) + ' × ' + p.u,
      remaining: Math.round(totalMl) + 'ml on hand' + (usedMl ? ' · ' + usedMl.toFixed(1) + 'ml drawn today' : ''),
      left,
      weeks: weeks > 20 ? '20+ wks' : weeks.toFixed(1) + ' wks',
      costPer: money((p.cost * p.per) / p.ml) + ' / client',
      barW: Math.max(3, Math.min(100, Math.round((weeks / 8) * 100))) + '%',
      barBg: crit ? '#b4462f' : low ? '#b07d1a' : '#6b7a4a',
      statusBg: ordered ? '#e2ebdd' : crit ? '#f4e0da' : low ? '#f5eddb' : '#e2ebdd',
      status: ordered ? 'Ordered · 4 days' : crit ? 'Order today' : low ? 'Order this week' : 'Order more',
      ordered,
    }
  })

  const order = (name: string, brand: string) => {
    if ((s.ordered || []).indexOf(name) >= 0) return
    const nn = { id: 'n' + Date.now(), kind: 'Stock', to: 'Manager', dot: '#6b7a4a', read: false, t: 'now', roles: ['owner', 'manager'] as any, text: name + ' ordered from ' + brand + ' — supplier confirmed, four days out.' }
    s.save({ ordered: (s.ordered || []).concat([name]), notifs: [nn as any].concat(s.notifs) })
    s.showToast(name + ' ordered from ' + brand + ' · four days out')
  }

  const varianceRows = variance.map((v) => {
    const stf = st(v.s)
    const over = v.act > v.bench
    const pct = Math.round(((v.act - v.bench) / v.bench) * 100)
    return { stf, over, pct, ...v }
  })

  return (
    <View>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 356px', gap: 12, alignItems: 'start' }}>
        <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr .8fr 1fr .7fr', alignItems: 'end' }}>
            {['Product', 'On hand', 'Per client', 'Clients left', 'Status'].map((h) => (
              <div key={h} style={th}>{h}</div>
            ))}
          </div>
          {rows.map((r) => (
            <div key={r.p.n} style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr .8fr 1fr .7fr', alignItems: 'center', gap: 4, borderTop: '1px solid rgba(0,0,0,.08)', padding: '11px 4px' }}>
              <div>
                <div style={{ fontSize: 13 }}>{r.p.n}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, color: 'rgba(0,0,0,.45)', paddingTop: 2 }}>{r.p.b}</div>
              </div>
              <div>
                <div style={{ fontSize: 12 }}>{r.onHand}</div>
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{r.remaining}</div>
              </div>
              <div>
                <div style={{ fontSize: 12 }}>{r.p.bench} / client</div>
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{r.costPer}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 20 }}>{r.left}</span>
                  <span style={{ fontSize: 10, color: 'rgba(0,0,0,.5)' }}>{r.weeks}</span>
                </div>
                <div style={{ height: 4, borderRadius: 999, background: 'rgba(0,0,0,.09)', marginTop: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: r.barW, background: r.barBg }} />
                </div>
              </div>
              <div style={{ justifySelf: 'end' }}>
                <button onClick={() => !r.ordered && order(r.p.n, r.p.b)} style={{ border: 0, borderRadius: 999, padding: '6px 11px', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', background: r.statusBg, cursor: r.ordered ? 'default' : 'pointer' }}>{r.status}</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#000', color: '#FEFEF1', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 17 }}>Order today, not Friday</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 10 }}>
              {stockAlerts.map((a, i) => (
                <div key={i} style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(254,254,241,.82)', borderTop: i ? '1px solid rgba(254,254,241,.14)' : 'none', paddingTop: i ? 9 : 0 }}>{a}</div>
              ))}
            </div>
          </div>

          <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)', paddingBottom: 4 }}>Per-staff variance</div>
            {varianceRows.map((v) => (
              <button key={v.s + v.p} onClick={() => { s.patch({ view: s.viewsFor(s.role).indexOf('team') >= 0 ? 'team' : 'stock' }); s.showToast(v.stf.name + ' in Team — revenue, utilisation and product discipline side by side') }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'none', borderTop: '1px solid rgba(0,0,0,.08)', padding: '11px 2px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Disc init={v.stf.init} bg={v.stf.bg} />
                  <span style={{ fontSize: 12.5 }}>{v.stf.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,.5)' }}>· {v.p}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 12, color: v.over ? '#b4462f' : '#6b7a4a' }}>{(v.pct > 0 ? '+' : '') + v.pct}%</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', paddingTop: 4 }}>{v.bench}ml bench · {v.act}ml actual · {(v.mo > 0 ? '−' : '+') + money(Math.abs(v.mo))} / mo</div>
                <div style={{ fontSize: 11, lineHeight: 1.45, color: 'rgba(0,0,0,.65)', paddingTop: 3 }}>{v.note}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </View>
  )
}
