import { View } from '../components/ui'

const finKpis = [
  { label: 'Revenue MTD', value: '$38,410', note: '+11% vs June' },
  { label: 'Gross margin', value: '61%', note: 'Product cost $4,120' },
  { label: 'Payroll + commission', value: '$14,880', note: '39% of revenue' },
  { label: 'Net', value: '$9,240', note: '24% — healthy for your size' },
  { label: 'Break-even', value: 'Day 19', note: 'Two days earlier than June' },
]
const finMix = [
  { k: 'Colour', v: '$23,810', pct: '62%', w: '100%', bg: '#7a3b5f', margin: '68% margin' },
  { k: 'Nails', v: '$8,070', pct: '21%', w: '34%', bg: '#3b4a7a', margin: '74% margin — best per hour' },
  { k: 'Cut & style', v: '$3,070', pct: '8%', w: '13%', bg: '#6b7a4a', margin: '81% margin' },
  { k: 'Retail', v: '$3,460', pct: '9%', w: '15%', bg: '#b07d1a', margin: '41% margin — most headroom' },
]
const finPay = [
  { k: 'Card', v: '$14,970', pct: '39%' }, { k: 'Cash', v: '$9,220', pct: '24%' }, { k: 'OMT', v: '$7,300', pct: '19%' },
  { k: 'Whish', v: '$3,460', pct: '9%' }, { k: 'Bank transfer', v: '$2,300', pct: '6%' }, { k: 'Online / app', v: '$1,160', pct: '3%' },
]
const finPL = [
  { k: 'Service revenue', v: '$34,950', s: false }, { k: 'Retail revenue', v: '$3,460', s: false },
  { k: 'Product cost', v: '−$4,120', s: false }, { k: 'Retail cost of goods', v: '−$2,040', s: false },
  { k: 'Gross profit', v: '$32,250', s: true }, { k: 'Salaries', v: '−$9,600', s: false },
  { k: 'Commission + tips out', v: '−$5,280', s: false }, { k: 'Rent', v: '−$4,200', s: false },
  { k: 'Utilities, laundry, cards', v: '−$1,890', s: false }, { k: 'Marketing', v: '−$2,040', s: false },
  { k: 'Net profit', v: '$9,240', s: true },
]

const panel: React.CSSProperties = { background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '15px 17px' }
const panelHead: React.CSSProperties = { fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)', paddingBottom: 10 }

export function Finance() {
  return (
    <View>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, paddingBottom: 12 }}>
        {finKpis.map((k) => (
          <div key={k.label} style={{ ...panel, padding: '13px 14px' }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>{k.label}</div>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 26, lineHeight: 1.1, paddingTop: 6 }}>{k.value}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', paddingTop: 3 }}>{k.note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr .9fr', gap: 11, alignItems: 'start' }}>
        <div style={panel}>
          <div style={panelHead}>Where the money comes from</div>
          {finMix.map((m) => (
            <div key={m.k} style={{ padding: '8px 0', borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 12.5 }}>{m.k}</span>
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: 'rgba(0,0,0,.5)' }}>{m.pct}</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{m.v}</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,.08)', margin: '6px 0 4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: m.w, background: m.bg }} />
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)' }}>{m.margin}</div>
            </div>
          ))}
        </div>

        <div style={panel}>
          <div style={panelHead}>How she paid</div>
          {finPay.map((p) => (
            <div key={p.k} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '8px 0', borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <span style={{ fontSize: 12.5 }}>{p.k}</span>
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: 'rgba(0,0,0,.5)' }}>{p.pct}</span>
              <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{p.v}</span>
            </div>
          ))}
        </div>

        <div style={panel}>
          <div style={panelHead}>July — profit and loss</div>
          {finPL.map((x) => (
            <div key={x.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: x.s ? '1.5px solid rgba(0,0,0,.32)' : '1px solid rgba(0,0,0,.08)', fontWeight: x.s ? 500 : 400 }}>
              <span style={{ fontSize: 12.5 }}>{x.k}</span>
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12 }}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>
    </View>
  )
}
