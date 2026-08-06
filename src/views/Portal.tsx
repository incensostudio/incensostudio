import { useStore } from '../store/useStore'
import { clientRebook, clientTier, money, st } from '../lib/logic'
import { View } from '../components/ui'

export function Portal() {
  const s = useStore()
  const paidToday = (s.apts || []).filter((a) => (a.day || 0) === 0 && a.stage === 'paid')
  const pa = paidToday[paidToday.length - 1]
  const pc = pa ? s.allClients().find((x) => x.id === pa.cid) : null
  const pl = pa ? pa.lines || [] : []

  const empty = !pa
  const bill = pl.filter((l) => l.t !== 'product')
  const used = pl.filter((l) => l.t === 'product')
  const orders = pl.filter((l) => l.t === 'retail')

  return (
    <View>
      <div style={{ display: 'grid', gridTemplateColumns: '308px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Phone mock */}
        <div style={{ background: '#000', borderRadius: 34, padding: 11 }}>
          <div style={{ background: '#FEFEF1', borderRadius: 26, overflow: 'hidden', padding: '14px 16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.45)' }}>
              <span>10:41</span>
              <span>incenso.app</span>
            </div>
            {empty ? (
              <div style={{ paddingTop: 18 }}>
                <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 21 }}>Nobody has checked out yet</div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: 'rgba(0,0,0,.6)', paddingTop: 8 }}>Her portal writes itself the moment reception takes a payment on the floor.</div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.45)', paddingTop: 12 }}>Signed in · {pc ? pc.phone : 'her mobile'}</div>
                <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 21, paddingTop: 4 }}>{pa!.client.split(' ')[0]}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.6)', paddingTop: 4, lineHeight: 1.5 }}>Today · {pl.filter((l) => l.t === 'service').map((l) => l.name).join(', ') || pa!.service} with {st(pa!.staff).name}</div>

                <div style={{ background: '#f3ead6', borderRadius: 12, padding: '12px 14px', marginTop: 12 }}>
                  {bill.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '3px 0' }}>
                      <span>{l.name + (l.qty > 1 ? ' ×' + l.qty : '')}</span>
                      <span style={{ fontFamily: "'Geist Mono',monospace" }}>{money((l as any).price * (l.qty || 1))}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(0,0,0,.14)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)' }}>Paid by {pa!.method || 'Card'}</span>
                    <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 21 }}>{money(pa!.total)}</span>
                  </div>
                </div>

                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', paddingTop: 14 }}>Your formula</div>
                <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(0,0,0,.7)', paddingTop: 4 }}>{pc ? pc.formula : 'Nothing on file yet — written up after her first colour'}</div>

                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', paddingTop: 14 }}>Time to come back</div>
                <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(0,0,0,.7)', paddingTop: 4 }}>{clientRebook(pl, st(pa!.staff).name)}</div>
                <button onClick={() => { s.patch({ view: 'clients', drawer: 'newbooking', nbClient: pc ? pc.id : null, nbNewOn: false, nbQ: '', nbSrcs: ['App'], nbNote: '', nbSvcs: [], nbSvcQ: '', nbSvcCat: 'All', nbPlan: {}, nbDay: 0 }); s.showToast('Rebooking ' + pa!.client + ' from her portal — pick the service') }} style={{ width: '100%', marginTop: 10, border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '11px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Book your next visit</button>

                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', paddingTop: 14 }}>What we remember about you</div>
                <ul style={{ margin: '5px 0 0', paddingLeft: 15 }}>
                  {(pc && pc.sees.length ? pc.sees : ['This is your first visit — we start your notes today']).map((x, i) => (
                    <li key={i} style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(0,0,0,.7)', paddingBottom: 2 }}>{x}</li>
                  ))}
                </ul>

                <div style={{ borderTop: '1px solid rgba(0,0,0,.12)', marginTop: 12, paddingTop: 10, fontSize: 10.5, lineHeight: 1.5, color: 'rgba(0,0,0,.55)' }}>{clientTier(pc)}</div>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '15px 17px' }}>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 18 }}>She signs in with her phone number. Nothing else.</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(0,0,0,.6)', paddingTop: 6 }}>This whole screen is derived from the last ticket closed today — her receipt, her formula, her rebooking window. Everything inside the phone is written for her, in the second person. No staff notes, no tactics, no lifetime spend, no product costs.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Products used on her today</div>
              {empty ? (
                <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.45)', paddingTop: 8 }}>Nothing yet.</div>
              ) : (
                <div style={{ paddingTop: 8 }}>
                  {used.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, padding: '4px 0', borderTop: i ? '1px solid rgba(0,0,0,.07)' : 'none' }}>{l.name} — {((l as any).ml * (l.qty || 1)).toFixed(1)}ml</div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 10, lineHeight: 1.5, color: 'rgba(0,0,0,.45)', paddingTop: 8 }}>Shown because clients ask, and because it makes the price legible. Costs are never shown.</div>
            </div>

            <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Her shelf</div>
              {orders.length === 0 ? (
                <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.45)', paddingTop: 8 }}>Nothing taken home today.</div>
              ) : (
                <div style={{ paddingTop: 8 }}>
                  {orders.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, padding: '4px 0', borderTop: i ? '1px solid rgba(0,0,0,.07)' : 'none' }}>{l.name}</div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 10, lineHeight: 1.5, color: 'rgba(0,0,0,.45)', paddingTop: 8 }}>Reordering from here lands in Retail as an app order.</div>
            </div>
          </div>
        </div>
      </div>
    </View>
  )
}
