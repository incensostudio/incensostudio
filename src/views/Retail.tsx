import { useStore } from '../store/useStore'
import { retailShelf, outsideOrders, orderSteps } from '../data/fixtures'
import { money } from '../lib/logic'
import { View, Chip } from '../components/ui'
import { chan as chanColors } from '../data/fixtures'

const th: React.CSSProperties = { fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.38)', textAlign: 'left', padding: '0 4px 8px', fontWeight: 400 }
const retailNote = 'Every one of these deducts from the same shelf the staff sell from. When Chanel 151 drops under three bottles the salon menu hides it before a client can be promised it.'

export function Retail() {
  const s = useStore()
  const sold = s.retailSold || {}
  const rows = retailShelf.map((r) => {
    const extra = sold[r.n] || 0
    const stock = Math.max(0, r.stock - extra)
    const soldN = r.sold + extra
    return { name: r.n, price: money(r.p), margin: Math.round(((r.p - r.c) / r.p) * 100) + '%', stock, sold: soldN, split: extra ? r.split + ' · ' + extra + ' at checkout today' : r.split }
  })

  const orders = outsideOrders.map((o) => {
    const steps = orderSteps[o.id]
    const i = Math.min(steps.length - 1, (s.orderStep || {})[o.id] || 0)
    const done = i === steps.length - 1
    return { o, steps, i, done, status: steps[i], next: done ? '' : steps[i + 1] }
  })
  const advance = (id: string, next: string, who: string) => {
    s.patch((st) => ({ orderStep: { ...(st.orderStep || {}), [id]: Math.min((orderSteps[id].length - 1), ((st.orderStep || {})[id] || 0) + 1) } }))
    s.showToast(id + ' · ' + who + ' — ' + next.toLowerCase())
  }

  return (
    <View>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 356px', gap: 12, alignItems: 'start' }}>
        <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .6fr .6fr .6fr .7fr 1.1fr' }}>
            {['Product', 'Price', 'Margin', 'Shelf', 'Sold MTD', 'Where it sold'].map((h) => (
              <div key={h} style={th}>{h}</div>
            ))}
          </div>
          {rows.map((r) => (
            <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr .6fr .6fr .6fr .7fr 1.1fr', alignItems: 'center', gap: 4, borderTop: '1px solid rgba(0,0,0,.08)', padding: '11px 4px' }}>
              <div style={{ fontSize: 13 }}>{r.name}</div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{r.price}</div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, color: 'rgba(0,0,0,.6)' }}>{r.margin}</div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, color: r.stock < 5 ? '#b4462f' : 'rgba(0,0,0,.6)' }}>{r.stock}</div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{r.sold}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.55)' }}>{r.split}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Orders from outside the salon</div>
          {orders.map(({ o, done, status, next }) => {
            const ch = chanColors[o.ch] || ['#e8e4dc', '#000']
            return (
              <div key={o.id} style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Chip label={o.ch} bg={ch[0]} fg={ch[1]} />
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: 'rgba(0,0,0,.45)' }}>{o.id}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{o.amt}</span>
                </div>
                <div style={{ fontSize: 12.5, paddingTop: 7 }}>{o.who}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.55)', paddingTop: 2 }}>{o.what}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10 }}>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,.55)' }}>{status}</span>
                  {!done && (
                    <button onClick={() => advance(o.id, next, o.who)} style={{ marginLeft: 'auto', border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '6px 12px', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>{next}</button>
                  )}
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 10.5, lineHeight: 1.5, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{retailNote}</div>
        </div>
      </div>
    </View>
  )
}
