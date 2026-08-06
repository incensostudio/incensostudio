import { useStore } from '../store/useStore'
import { useIsMobile } from '../lib/useIsMobile'
import { threads, chan as chanColors } from '../data/fixtures'
import { srcFor } from '../lib/logic'
import { View, Chip } from '../components/ui'

const chans = ['all', 'Instagram', 'WhatsApp', 'Phone', 'Website', 'App', 'Google']
const intents: Record<string, string> = { booking: 'Turn into a booking', order: 'Create an order', callback: 'Log the callback', question: 'Send and keep open', reschedule: 'Move the appointment', review: 'Post the reply' }

export function Inbox() {
  const s = useStore()
  const mobile = useIsMobile()
  const readIds = s.readThreads || []
  const inFilter = s.inboxFilter || 'all'
  const list = threads.filter((t) => inFilter === 'all' || t.ch === inFilter)
  const inList = list.some((t) => t.id === s.thread)
  const activeId = (inList ? s.thread : list[0] && list[0].id) || 't1'
  const at = threads.find((t) => t.id === activeId) || threads[0]
  const atc = chanColors[at.ch] || ['#e8e4dc', '#000']
  const sent = (s.threadSent || {})[at.id] || []
  const draft = s.threadDrafts && s.threadDrafts[at.id] !== undefined ? s.threadDrafts[at.id] : at.draft
  const msgs = at.msgs.concat(sent)

  const send = () => {
    const cur = s.threadDrafts && s.threadDrafts[at.id] !== undefined ? s.threadDrafts[at.id] : at.draft
    if (!cur || !cur.trim()) { s.showToast('Nothing to send — the reply is empty', 'warn'); return }
    s.showToast('Sent to ' + at.who + ' on ' + at.ch)
    s.patch({
      threadSent: { ...(s.threadSent || {}), [at.id]: (sent as any).concat([{ f: 'us', t: cur.trim(), at: 'now' }]) },
      threadDrafts: { ...(s.threadDrafts || {}), [at.id]: '' },
      readThreads: readIds.indexOf(at.id) >= 0 ? readIds : readIds.concat([at.id]),
    })
  }
  const book = () => {
    const known = s.allClients().find((c) => c.name === at.who)
    s.patch({ drawer: 'newbooking', nbSrcs: [srcFor(at.ch)].filter(Boolean) as string[], nbClient: known ? known.id : null, nbNewOn: false, nbQ: !known && at.who.indexOf('+') !== 0 && at.who.indexOf('@') !== 0 && at.who.indexOf('New review') !== 0 ? at.who : '', nbNote: '', nbSvcs: [], nbSvcQ: '', nbSvcCat: 'All', nbPlan: {}, nbDay: 0 })
    s.showToast(known ? 'Booking ' + known.name + ' — her file is already attached' : 'Reservation started from this thread — her source is filled in')
  }

  return (
    <View>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 12 }}>
        {chans.map((c) => {
          const on = inFilter === c
          return <button key={c} onClick={() => s.patch({ inboxFilter: c })} style={{ border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '7px 13px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : 'transparent', color: on ? '#FEFEF1' : 'rgba(0,0,0,.7)' }}>{c === 'all' ? 'All channels' : c}</button>
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '342px 1fr', gap: 12, alignItems: 'start' }}>
        <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, padding: 8 }}>
          {list.length === 0 && <div style={{ padding: '26px 14px', fontSize: 12.5, color: 'rgba(0,0,0,.5)', lineHeight: 1.5 }}>Nothing on this channel today. Everything that comes in — DMs, WhatsApp, missed calls, live chat, reviews — lands in this one list.</div>}
          {list.map((t) => {
            const c = chanColors[t.ch] || ['#e8e4dc', '#000']
            const unread = t.unread && readIds.indexOf(t.id) < 0
            const tsent = (s.threadSent || {})[t.id] || []
            const preview = tsent.length ? 'You: ' + tsent[tsent.length - 1].t : t.msgs[t.msgs.length - 1].t
            return (
              <button key={t.id} onClick={() => s.patch({ thread: t.id, readThreads: readIds.concat([t.id]) })} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, borderRadius: 9, padding: '11px 12px', cursor: 'pointer', background: t.id === activeId ? '#f3ead6' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: unread ? '#b4462f' : 'transparent', flex: 'none' }} />
                  <Chip label={t.ch} bg={c[0]} fg={c[1]} />
                  <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.4)' }}>{t.t}</span>
                </div>
                <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 15, paddingTop: 6 }}>{t.who}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.4)', paddingTop: 1 }}>{t.handle}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.6)', paddingTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>
              </button>
            )
          })}
        </div>

        <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12, minHeight: 560, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
            <div>
              <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 20 }}>{at.who}</div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, color: 'rgba(0,0,0,.4)', paddingTop: 1 }}>{at.handle}</div>
            </div>
            <span style={{ marginLeft: 'auto' }}><Chip label={at.ch} bg={atc[0]} fg={atc[1]} /></span>
          </div>

          <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {msgs.map((m, i) => {
              const mine = m.f === 'us'
              return (
                <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '74%' }}>
                  <div style={{ borderRadius: 11, padding: '11px 13px', fontSize: 12.5, lineHeight: 1.55, background: mine ? '#000' : '#f3ead6', color: mine ? 'rgba(254,254,241,.92)' : '#000' }}>{m.t}</div>
                  <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.3)', paddingTop: 3, textAlign: mine ? 'right' : 'left' }}>{m.at}</div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '0 18px 16px' }}>
            <div style={{ background: '#000', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.14em', color: '#e5c07a' }}>CONTEXT</div>
              <div style={{ fontSize: 12, color: 'rgba(254,254,241,.86)', paddingTop: 5, lineHeight: 1.5 }}>{at.ai}</div>
            </div>
            <textarea value={draft} onChange={(e) => s.patch({ threadDrafts: { ...(s.threadDrafts || {}), [at.id]: e.target.value } })} style={{ width: '100%', minHeight: 78, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 10, padding: '11px 13px', fontSize: 12.5, lineHeight: 1.55, fontFamily: 'inherit', resize: 'vertical', marginTop: 10 }} />
            <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
              <button onClick={book} style={{ border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '10px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>{intents[at.intent] || 'Reply'}</button>
              <button onClick={send} style={{ border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '10px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Send reply</button>
            </div>
          </div>
        </div>
      </div>
    </View>
  )
}
