import { useStore } from '../../store/useStore'
import { svcCat, prodCat, retailCat } from '../../data/fixtures'
import { elapsedFor, fileNote, lineTotal, money, nextVisitFor, st } from '../../lib/logic'
import type { Line } from '../../data/types'
import { Drawer, DrawerClose } from './Drawer'
import { useIsMobile } from '../../lib/useIsMobile'

const tagFor: Record<string, [string, string, string]> = {
  service: ['#e8e4dc', '#000', 'Service'],
  product: ['#f3ead6', '#8a5a20', 'Product'],
  retail: ['#e6e2f2', '#3b4a7a', 'Retail'],
}

export function CheckoutDrawer() {
  const s = useStore()
  const mobile = useIsMobile()
  const a = s.apts.find((x) => x.id === s.activeId)
  const close = () => s.patch({ drawer: null, activeId: null, edit: null })
  if (!a || !s.edit) return null
  const E = s.edit
  const L = E.lines
  const stf = st(a.staff)
  const seeCost = s.role === 'owner' || s.role === 'manager'
  const verifying = !!E.verify
  const coq = (s.coQ || '').trim().toLowerCase()

  const svc = L.filter((l) => l.t === 'service').reduce((n, l) => n + (l as any).price * (l.qty || 1), 0)
  const ret = L.filter((l) => l.t === 'retail').reduce((n, l) => n + (l as any).price * (l.qty || 1), 0)
  const cost = L.filter((l) => l.t === 'product').reduce((n, l) => n + (l as any).cost * (l.qty || 1), 0)
  const above = L.filter((l) => l.t === 'service').reduce((n, l) => n + Math.max(0, (l as any).price - (l as any).base) * (l.qty || 1), 0)
  const grand = svc + ret
  const marg = grand ? Math.round(((grand - cost) / grand) * 100) : 0

  const setQty = (i: number, d: number) => s.setLines(L.map((x, j) => (j === i ? { ...x, qty: Math.max(1, (x.qty || 1) + d) } : x)))
  const setPrice = (i: number, v: number) => s.setLines(L.map((x, j) => (j === i ? { ...x, price: v } : x)))
  const removeLine = (i: number) => s.setLines(L.filter((_, j) => j !== i))
  const addLine = (l: Line) => s.setLines(L.concat([l]))

  const totals = [
    { k: 'Services', v: money(svc), fg: '#000' },
    { k: 'Charged above base', v: above ? '+' + money(above) : '—', fg: above ? '#6b7a4a' : 'rgba(0,0,0,.4)' },
    { k: 'Retail', v: ret ? money(ret) : '—', fg: ret ? '#000' : 'rgba(0,0,0,.4)' },
    seeCost ? { k: 'Product cost (internal)', v: cost ? '−' + money(cost) : '—', fg: cost ? '#b4462f' : 'rgba(0,0,0,.4)' } : null,
    s.role !== 'reception' ? { k: 'Commission to ' + stf.name, v: money(svc * 0.18), fg: 'rgba(0,0,0,.6)' } : null,
  ].filter(Boolean) as { k: string; v: string; fg: string }[]

  const menu = svcCat.filter((x) => !coq || (x.name + ' ' + x.cat + ' ' + x.sub).toLowerCase().indexOf(coq) >= 0)

  const heading = { fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(0,0,0,.55)' }
  const addBtn = (bg: string): React.CSSProperties => ({ border: '1px solid rgba(0,0,0,.14)', background: bg, borderRadius: 8, padding: '7px 10px', fontSize: 11.5, cursor: 'pointer', textAlign: 'left' })

  return (
    <Drawer width="min(1020px,94vw)" onClose={close}>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 316px', minHeight: '100dvh' }}>
        {/* Left pane */}
        <div style={{ padding: '22px 24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div>
              <div style={heading}>{verifying ? 'Reception — verify what staff logged, then charge' : 'Staff checkout — log what actually happened'}</div>
              <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 25, paddingTop: 4 }}>{a.client}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5 }}>{stf.name}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)' }}>{elapsedFor(a)}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)' }}>Booked as {a.service}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '18px 0 8px' }}>
            <span style={heading}>Ticket</span>
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,.5)' }}>{verifying ? 'Everything here came from ' + stf.name + '. Edit anything that is wrong and add what she is buying at the desk.' : 'Prices marked “from” can be raised — long hair, extra tubes, extra time.'}</span>
          </div>

          {verifying && (
            <div style={{ border: '1px solid #7a3b5f', borderRadius: 9, padding: '9px 12px', marginBottom: 10, fontSize: 11.5, color: '#7a3b5f' }}>Closed by {stf.name} — Nothing is charged until you accept it.</div>
          )}

          <div style={{ border: '1px solid rgba(0,0,0,.14)', borderRadius: 11, overflow: 'hidden' }}>
            {L.length === 0 && <div style={{ padding: '18px 14px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>{verifying ? 'Nothing logged — add it before charging' : 'Add what you did below'}</div>}
            {L.map((l, i) => {
              const tg = tagFor[l.t] || tagFor.service
              const isProd = l.t === 'product'
              const sub = isProd
                ? ((l as any).ml * (l.qty || 1)).toFixed(1) + 'ml drawn' + (seeCost ? ' · cost ' + money((l as any).cost * (l.qty || 1)) : '') + ' · not billed'
                : (l as any).from
                  ? 'Starts at ' + money((l as any).base) + ' — raise it for length or extra work'
                  : 'Fixed ' + money((l as any).base)
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 92px 74px 30px', alignItems: 'center', gap: 6, padding: '9px 12px', borderTop: i ? '1px solid rgba(0,0,0,.08)' : 'none', background: isProd ? '#fbf7ec' : 'transparent' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'inline-block', background: tg[0], color: tg[1], borderRadius: 4, padding: '1px 5px', fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.08em', textTransform: 'uppercase', marginRight: 6 }}>{tg[2]}</span>
                    <span style={{ fontSize: 13 }}>{l.name}</span>
                    <div style={{ fontSize: 10, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{sub}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifySelf: 'center' }}>
                    <button onClick={() => setQty(i, -1)} style={stepBtn}>−</button>
                    <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, minWidth: 14, textAlign: 'center' }}>{l.qty || 1}</span>
                    <button onClick={() => setQty(i, 1)} style={stepBtn}>+</button>
                  </div>
                  <div style={{ justifySelf: 'end' }}>
                    {isProd ? (
                      seeCost ? <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: 'rgba(0,0,0,.45)' }}>{money((l as any).cost * (l.qty || 1))}</span> : null
                    ) : (
                      <input value={String((l as any).price || 0)} onChange={(e) => setPrice(i, Number(e.target.value) || 0)} style={{ width: 64, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 6, padding: '5px 7px', fontFamily: "'Geist Mono',monospace", fontSize: 11, textAlign: 'right' }} />
                    )}
                  </div>
                  <button onClick={() => removeLine(i)} title="Remove" style={{ border: 0, background: 'none', cursor: 'pointer', color: 'rgba(0,0,0,.4)', fontSize: 16, justifySelf: 'center' }}>×</button>
                </div>
              )
            })}
          </div>

          {/* Services performed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 0 8px' }}>
            <span style={heading}>Services performed</span>
            <input value={s.coQ || ''} onChange={(e) => s.patch({ coQ: e.target.value })} placeholder="Filter the menu" style={{ marginLeft: 'auto', width: 180, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 8, padding: '6px 10px', fontSize: 11.5 }} />
          </div>
          {menu.length === 0 ? (
            <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.5)' }}>Nothing in the menu matches that.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 6 }}>
              {menu.map((x) => (
                <button key={x.name} onClick={() => addLine({ t: 'service', name: x.name, base: x.base, price: x.base, qty: 1, from: !!x.from })} style={addBtn('transparent')}>
                  <div>{x.name}</div>
                  <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{(x.from ? 'from ' : '') + money(x.base)}</div>
                </button>
              ))}
            </div>
          )}

          {/* Products consumed */}
          <div style={{ padding: '18px 0 8px' }}>
            <span style={heading}>Products consumed — deducted from stock at millilitre level</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 6 }}>
            {prodCat.map((p) => (
              <button key={p.name} onClick={() => addLine({ t: 'product', name: p.name, ml: p.ml, cost: p.cost, qty: 1 })} style={addBtn('#f3ead6')}>
                <div>{p.name}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{p.unit}</div>
              </button>
            ))}
          </div>

          {/* Retail */}
          <div style={{ padding: '18px 0 8px' }}>
            <span style={heading}>{verifying ? 'Retail she is taking home — most of it is rung up here' : 'Retail she is taking home'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 6 }}>
            {retailCat.map((p) => (
              <button key={p.name} onClick={() => addLine({ t: 'retail', name: p.name, base: p.price, price: p.price, qty: 1 })} style={addBtn('#e6e2f2')}>
                <div>{p.name}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>{money(p.price)}</div>
              </button>
            ))}
          </div>

          {/* Note */}
          <div style={{ padding: '18px 0 8px' }}>
            <span style={heading}>Note</span>
          </div>
          <textarea
            value={E.note}
            onChange={(e) => s.patch({ edit: { ...E, note: e.target.value } })}
            placeholder="wanted it a bit warmer than last time, asked about the copper for september, left cuticle sensitive so went slow"
            style={{ width: '100%', minHeight: 64, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 10, padding: '11px 13px', fontSize: 12, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ background: '#000', color: '#FEFEF1', borderRadius: 8, padding: '9px 12px', marginTop: 8 }}>
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.14em', color: '#e5c07a' }}>MIND FILES IT AS</span>
            <div style={{ fontSize: 11, color: 'rgba(254,254,241,.86)', paddingTop: 4, lineHeight: 1.5 }}>{fileNote(E.note)}</div>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ background: '#f7f2e4', borderLeft: mobile ? 'none' : '1px solid rgba(0,0,0,.12)', borderTop: mobile ? '1px solid rgba(0,0,0,.12)' : 'none', padding: '22px 22px 26px', display: 'flex', flexDirection: 'column' }}>
          {totals.map((t) => (
            <div key={t.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
              <span style={{ color: 'rgba(0,0,0,.6)' }}>{t.k}</span>
              <span style={{ fontFamily: "'Geist Mono',monospace", color: t.fg }}>{t.v}</span>
            </div>
          ))}
          <div style={{ borderTop: '1.5px solid #000', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Client pays</span>
            <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 29 }}>{money(grand)}</span>
          </div>

          {seeCost && (
            <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 11, padding: '12px 14px', marginTop: 14 }}>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Margin</div>
              <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 24, paddingTop: 2 }}>{marg}%</div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,.09)', marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.max(4, Math.min(100, marg)) + '%', background: '#6b7a4a' }} />
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', paddingTop: 5 }}>{cost ? 'after ' + money(cost) + ' of product' : 'no product logged yet'}</div>
            </div>
          )}

          <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 11, padding: '12px 14px', marginTop: 12 }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Next visit — predicted</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(0,0,0,.7)', paddingTop: 5 }}>{nextVisitFor(L)}</div>
          </div>

          <div style={{ flex: 1, minHeight: 12 }} />

          <button
            onClick={() =>
              verifying
                ? s.save({ apts: s.apts.map((x) => (x.id === a.id ? { ...x, lines: L, note: E.note, total: grand } : x)), drawer: 'pay', method: 'Card', tip: 0, edit: null })
                : s.bump(a.id, 'review', { lines: L, note: E.note, total: grand })
            }
            style={{ border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '13px 18px', fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', marginTop: 6 }}
          >
            {verifying ? 'Accept · take payment' : 'Close ticket → reception'}
          </button>
          <button onClick={close} style={{ border: 0, background: 'none', color: 'rgba(0,0,0,.55)', padding: '10px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
            {verifying ? 'Back to the floor' : 'Keep working'}
          </button>
          <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)', textAlign: 'center', paddingTop: 4 }}>{money(lineTotal(a))}</div>
        </div>
      </div>
    </Drawer>
  )
}

const stepBtn: React.CSSProperties = { width: 20, height: 20, border: '1px solid rgba(0,0,0,.16)', borderRadius: 5, background: '#FEFEF1', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'grid', placeItems: 'center' }
