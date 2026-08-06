import { useStore } from '../store/useStore'
import { stages } from '../data/fixtures'
import { chan as chanColors } from '../data/fixtures'
import type { Role, StageKey } from '../data/types'
import { elapsedFor, lineTotal, money, st, svcPrice } from '../lib/logic'
import { Chip, Disc, StatCard, View } from '../components/ui'
import { DotsIcon } from '../components/icons'
import { toMin } from '../lib/logic'

const stageActions: Record<string, { label: string; roles: Role[] }> = {
  booked: { label: 'Check in', roles: ['reception', 'manager', 'owner'] },
  reception: { label: 'Staff accept', roles: ['staff', 'manager', 'owner'] },
  service: { label: 'Close & itemise', roles: ['staff', 'manager', 'owner'] },
  review: { label: 'Verify & charge', roles: ['reception', 'manager', 'owner'] },
  paid: { label: 'View receipt', roles: ['owner', 'manager', 'reception', 'staff'] },
}
const byWho: Record<string, string> = { booked: 'Reception only', reception: 'Her stylist only', service: 'Her stylist only', review: 'Reception only', paid: '' }
const flags: Record<string, string> = {
  a2: 'Rubber base lasts her 4.2 weeks — rebooking nudge queued for 21 Aug.',
  a4: 'Rim cancelled twice on Mondays. Confirm deposit before starting keratin.',
  a7: 'First visit from Google. Patch test required — 48h before any lightener.',
  a3: 'Ammonia sensitivity on file. Rania has the substitute formula pinned.',
}

export function Floor() {
  const s = useStore()
  const today = s.apts.filter((a) => (a.day || 0) === 0)
  const active = today.filter((a) => a.stage !== 'cancelled')
  const cancelled = today.filter((a) => a.stage === 'cancelled').length
  const revToday = active.filter((a) => a.stage === 'paid').reduce((n, a) => n + a.total, 0)
  const paidCount = active.filter((a) => a.stage === 'paid').length
  const valueOf = (a: (typeof active)[number]) => (a.stage === 'paid' ? a.total || 0 : a.lines && a.lines.length ? lineTotal(a) : svcPrice(a.service))
  const expected = active.reduce((n, a) => n + valueOf(a), 0)
  const stillOut = Math.max(0, expected - revToday)
  const withRetail = active.filter((x) => (x.lines || []).some((l) => l.t === 'retail'))
  const retail = active.reduce((n, x) => n + (x.lines || []).filter((l) => l.t === 'retail').reduce((m, l) => m + ((l as any).price || 0) * (l.qty || 1), 0), 0)
  const done = active.filter((x) => x.stage === 'review' || x.stage === 'paid')

  const statCards = [
    { label: 'On the books', value: String(active.length), note: cancelled ? cancelled + (cancelled === 1 ? ' cancellation' : ' cancellations') : 'No cancellations' },
    { label: 'Collected', value: money(revToday), note: paidCount + (paidCount === 1 ? ' client checked out' : ' clients checked out') },
    { label: 'Expected payment', value: money(stillOut), note: money(expected) + ' booked today · ' + money(revToday) + ' in' },
    {
      label: 'Retail attached',
      value: money(retail),
      note: withRetail.length + ' of ' + (done.length || active.length) + ' closed tickets · ' + (done.length ? Math.round((withRetail.length / done.length) * 100) : 0) + '% attach rate',
    },
  ]

  return (
    <View>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, paddingBottom: 16 }}>
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10, alignItems: 'start' }}>
        {stages.map((stg) => {
          const cards = active.filter((a) => a.stage === (stg.key as StageKey))
          return (
            <div key={stg.key} style={{ background: stg.colBg, border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '11px 10px 12px', minHeight: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: stg.dot }} />
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.13em', textTransform: 'uppercase' }}>{stg.label}</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, color: 'rgba(0,0,0,.42)' }}>{cards.length}</span>
              </div>
              <div style={{ fontSize: 10, lineHeight: 1.4, color: 'rgba(0,0,0,.45)', padding: '1px 3px 9px' }}>{stg.who}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.length === 0 && (
                  <div style={{ border: '1px dashed rgba(0,0,0,.18)', borderRadius: 10, padding: '18px 10px', textAlign: 'center', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.3)' }}>Empty</div>
                )}
                {cards.map((a) => {
                  const stf = st(a.staff)
                  const ch = chanColors[a.channel] || ['#e8e4dc', '#000']
                  const act = stageActions[a.stage]
                  const allowed = act.roles.indexOf(s.role) >= 0
                  const amt = a.stage === 'paid' ? money(a.total) : a.lines && a.lines.length ? money(lineTotal(a)) : '≈' + money(svcPrice(a.service))
                  const where =
                    a.stage === 'reception'
                      ? (a.station || 'Seated') + ' · waiting for her stylist'
                      : a.stage === 'service'
                        ? elapsedFor(a) + (a.station ? ' · ' + a.station : '')
                        : a.stage === 'review'
                          ? 'Closed by ' + stf.name + ' · waiting at the desk'
                          : ''
                  const flag = a.note || flags[a.id] || null
                  return (
                    <div key={a.id} style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.13)', borderRadius: 10, padding: '10px 11px 11px', animation: 'fadeIn .3s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 7 }}>
                        <Chip label={a.channel} bg={ch[0]} fg={ch[1]} />
                        <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 10, color: 'rgba(0,0,0,.5)' }}>{a.time}</span>
                        <button
                          onClick={() => s.patch({ calEdit: a.id, calEditDay: a.day || 0, calEditStaff: a.staff, calEditTime: toMin(a.time), ceErr: '' })}
                          title="Edit booking"
                          style={{ width: 20, height: 20, border: '1px solid rgba(0,0,0,.14)', borderRadius: 6, background: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'rgba(0,0,0,.6)' }}
                        >
                          <DotsIcon />
                        </button>
                      </div>
                      <button onClick={() => s.patch({ drawer: 'client', activeClient: a.cid })} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: "'ALT Gumbo',serif", fontSize: 15.5, lineHeight: 1.2 }}>
                        {a.client}
                      </button>
                      <div style={{ fontSize: 11.5, lineHeight: 1.35, color: 'rgba(0,0,0,.62)', paddingTop: 3 }}>{a.service}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingTop: 8 }}>
                        <Disc init={stf.init} bg={stf.bg} />
                        <span style={{ fontSize: 11, color: 'rgba(0,0,0,.55)' }}>{stf.name}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 11 }}>{amt}</span>
                      </div>
                      {where && <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(0,0,0,.45)', paddingTop: 7 }}>{where}</div>}
                      {flag && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, background: '#f3ead6', borderRadius: 6, padding: '6px 7px' }}>
                          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: '#b4462f', flex: 'none' }}>AI</span>
                          <span style={{ fontSize: 10.5, lineHeight: 1.4, color: 'rgba(0,0,0,.7)' }}>{flag}</span>
                        </div>
                      )}
                      <button
                        onClick={() =>
                          allowed ? s.advance(a.id) : s.showToast(byWho[a.stage] + ' can move this one — switch role at the bottom of the sidebar to try it', 'warn')
                        }
                        style={{ width: '100%', marginTop: 9, borderRadius: 7, padding: 8, border: 0, fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', background: allowed ? (a.stage === 'review' ? '#b4462f' : '#000') : '#e8e4dc', color: allowed ? '#FEFEF1' : 'rgba(0,0,0,.35)', cursor: allowed ? 'pointer' : 'not-allowed' }}
                      >
                        {allowed ? act.label : byWho[a.stage]}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </View>
  )
}
