import { useStore } from '../store/useStore'
import { useIsMobile } from '../lib/useIsMobile'
import { msgTypes } from '../data/fixtures'
import { View, StatCard } from '../components/ui'

const baseRules = [
  { who: 'Mind', k: 'Rubber base', v: 'nudge at week 3', note: 'Measured across 34 sets — it holds 4.2 weeks here' },
  { who: 'Mind', k: 'Balayage', v: 'gloss at week 5, colour at week 9', note: 'Measured across 61 tickets' },
  { who: 'Mind', k: 'Keratin', v: 'nudge at week 9', note: 'Fades from week 11 on your clients' },
  { who: 'You', k: 'Never message before 10:00', v: 'hard rule', note: 'Added by you, 12 June' },
  { who: 'You', k: 'No discount codes to Gold clients', v: 'hard rule', note: 'Added by you, 3 July' },
  { who: 'You', k: 'Bride enquiries go to Rania only', v: 'routing', note: 'Added by you, 21 May' },
]
const filters = ['all', 'reminder', 'rebook', 'winback', 'care', 'thanks', 'birthday']

export function Queue() {
  const s = useStore()
  const mobile = useIsMobile()
  const pend = (s.msgs || []).filter((m) => m.status === 'pending').length
  const sentToday = (s.msgs || []).filter((m) => m.status === 'sent').length
  const stats = [
    { label: 'Waiting for a human yes', value: String(pend), note: 'Nothing sends on its own' },
    { label: 'Sent today', value: String(sentToday), note: 'Thank-yous fire on payment' },
    { label: 'Reply rate', value: '71%', note: 'WhatsApp 78% · app push 54%' },
    { label: 'Bookings from nudges', value: '34', note: '$6,140 this month' },
  ]
  const rules = baseRules.concat((s.ownRules || []).map((r) => ({ who: 'You', k: r, v: 'hard rule', note: 'Added by you just now' })))
  const shown = (s.msgs || []).filter((m) => s.msgFilter === 'all' || m.type === s.msgFilter)

  const addRule = () => {
    if (!s.ruleDraft || !s.ruleDraft.trim()) { s.showToast('Type the rule first — “never message Sundays”, “brides go to Rania”', 'warn'); return }
    s.showToast('Your rule is in force from now — mine give way to it')
    s.patch({ ownRules: (s.ownRules || []).concat([s.ruleDraft.trim()]), ruleDraft: '' })
  }

  return (
    <View>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, paddingBottom: 12 }}>
        {stats.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Timing rules */}
      <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: '15px 17px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Timing rules</div>
          <div style={{ marginLeft: 'auto', fontSize: 11.5, color: 'rgba(0,0,0,.5)' }}>Your rules always beat mine.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 22px', paddingTop: 8 }}>
          {rules.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 0', borderTop: '1px solid rgba(0,0,0,.07)' }}>
              <span style={{ background: r.who === 'You' ? '#000' : '#f3ead6', color: r.who === 'You' ? '#FEFEF1' : '#8a5a20', borderRadius: 4, padding: '3px 6px', fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.08em', textTransform: 'uppercase', flex: 'none' }}>{r.who === 'You' ? 'YOU' : 'MIND'}</span>
              <div>
                <div style={{ fontSize: 12.5 }}>{r.k} — {r.v}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.45)', paddingTop: 2 }}>{r.note}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
          <input value={s.ruleDraft || ''} onChange={(e) => s.patch({ ruleDraft: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRule() } }} placeholder="Add a rule — “never message Sundays”" style={{ flex: 1, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 9, padding: '9px 12px', fontSize: 12 }} />
          <button onClick={addRule} style={{ border: 0, background: '#000', color: '#FEFEF1', borderRadius: 9, padding: '0 16px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Add rule</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 12 }}>
        {filters.map((f) => {
          const on = s.msgFilter === f
          return (
            <button key={f} onClick={() => s.patch({ msgFilter: f })} style={{ border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '7px 13px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : 'transparent', color: on ? '#FEFEF1' : 'rgba(0,0,0,.72)' }}>
              {f === 'all' ? 'Everything' : msgTypes[f][0]}
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <div style={{ border: '1px dashed rgba(0,0,0,.18)', borderRadius: 12, padding: '26px', textAlign: 'center', fontSize: 12.5, color: 'rgba(0,0,0,.5)' }}>Nothing of this kind is queued. Messages appear here the moment a ticket closes, a rhythm slips or a birthday comes round.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map((m) => {
            const t = msgTypes[m.type]
            const sent = m.status === 'sent'
            const skipped = m.status === 'skipped'
            const statusBg = sent ? '#e2ebdd' : skipped ? '#eae6de' : '#f5efe0'
            const statusLabel = sent ? 'Sent' : skipped ? 'Skipped' : 'Waiting for you'
            return (
              <div key={m.id} style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 292px', gap: 18, padding: '14px 16px 15px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: t[1] }}>{t[0]}</span>
                    <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 17 }}>{m.client}</span>
                    <span style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)' }}>{m.ch}</span>
                    <span style={{ background: statusBg, borderRadius: 999, padding: '2px 8px', fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.06em', textTransform: 'uppercase' }}>{statusLabel}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, color: 'rgba(0,0,0,.45)' }}>{m.when}</span>
                  </div>
                  <textarea value={m.body} onChange={(e) => s.save({ msgs: s.msgs.map((x) => (x.id === m.id ? { ...x, body: e.target.value } : x)) })} style={{ width: '100%', minHeight: 70, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 10, padding: '10px 12px', fontSize: 12, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical', marginTop: 10 }} />
                  <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
                    {!sent && !skipped && (
                      <>
                        <button onClick={() => { s.save({ msgs: s.msgs.map((x) => (x.id === m.id ? { ...x, status: 'sent' } : x)) }); s.showToast('Sent to ' + m.client + ' on ' + m.ch) }} style={{ border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '9px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Approve &amp; send</button>
                        <button onClick={() => { s.save({ msgs: s.msgs.map((x) => (x.id === m.id ? { ...x, status: 'skipped' } : x)) }); s.showToast('Skipped — ' + m.client + ' will not get this one. You can put it back.') }} style={{ border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '9px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Not this one</button>
                      </>
                    )}
                    {skipped && (
                      <button onClick={() => { s.save({ msgs: s.msgs.map((x) => (x.id === m.id ? { ...x, status: 'pending' } : x)) }); s.showToast('Back in the queue, waiting for your yes') }} style={{ border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '9px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Put it back in the queue</button>
                    )}
                  </div>
                </div>
                <div style={{ background: '#000', color: '#FEFEF1', borderRadius: 10, padding: '13px 15px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: '#e5c07a' }}>Why I drafted this</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.55, color: 'rgba(254,254,241,.86)', paddingTop: 6 }}>{m.why}</div>
                  <div style={{ flex: 1, minHeight: 8 }} />
                  <div style={{ fontSize: 10.5, color: 'rgba(254,254,241,.4)', paddingTop: 8 }}>{t[2]}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </View>
  )
}
