import { useStore } from '../store/useStore'
import { staff, stages } from '../data/fixtures'
import { aptMin, clock, dayCards, freeAt, hm, st, toMin } from '../lib/logic'
import { View } from '../components/ui'
import { Disc } from '../components/ui'
import type { Appointment } from '../data/types'

const START = 9 * 60
const NOW = 10 * 60 + 41

interface Block {
  ap: Appointment
  s: number
  e: number
  k: number
  left: string
  width: string
  slim: boolean
}

function lane(list: Appointment[]): Block[] {
  const arr: Block[] = list
    .map((ap) => ({ ap, s: toMin(ap.time), e: toMin(ap.time) + aptMin(ap), k: 0, left: '', width: '', slim: false }))
    .sort((a, b) => a.s - b.s)
  let i = 0
  while (i < arr.length) {
    let j = i
    let end = arr[i].e
    while (j + 1 < arr.length && arr[j + 1].s < end) {
      j++
      if (arr[j].e > end) end = arr[j].e
    }
    const cluster = arr.slice(i, j + 1)
    const ends: number[] = []
    cluster.forEach((b) => {
      let k = 0
      while (k < ends.length && ends[k] > b.s) k++
      b.k = k
      ends[k] = b.e
    })
    const n = Math.max(1, ends.length)
    cluster.forEach((b) => {
      b.left = `calc(${(b.k * 100) / n}% + 3px)`
      b.width = `calc(${100 / n}% - 6px)`
      b.slim = n > 1
    })
    i = j + 1
  }
  return arr
}

export function Calendar() {
  const s = useStore()
  const d = dayCards()
  const day = s.calDay || 0
  const sel = s.calStaff || 'all'
  const mode = s.calMode || 'day'
  const chairs = staff.filter((x) => x.skills.length && (sel === 'all' || x.id === sel))

  const title = (() => {
    if (mode === 'day') return (day === 0 ? 'Today · ' : day === 1 ? 'Tomorrow · ' : d[day].wd + ' ') + d[day].num + ' ' + d[day].mon
    const b = day < 7 ? 0 : 7
    return d[b].num + ' ' + d[b].mon + ' – ' + d[b + 6].num + ' ' + d[b + 6].mon
  })()

  const openEdit = (ap: Appointment) => s.patch({ calEdit: ap.id, calEditDay: ap.day || 0, calEditStaff: ap.staff, calEditTime: toMin(ap.time), ceErr: '' })

  const dropDay = (e: React.DragEvent, staffId: string) => {
    e.preventDefault()
    const id = s.calDrag || (e.dataTransfer ? e.dataTransfer.getData('text/plain') : null)
    const ap2 = s.apts.find((z) => z.id === id)
    if (!ap2) return
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const raw = 9 * 60 + Math.round((e.clientY - box.top) / 15) * 15
    const dur2 = aptMin(ap2)
    const startM = Math.max(9 * 60, Math.min(20 * 60 - dur2, raw))
    if (!freeAt(s.apts, day, staffId, startM, dur2, id!)) {
      s.patch({ calDrag: null })
      s.showToast(st(staffId).name + ' is not free at ' + clock(startM) + ' — nothing moved', 'warn')
      return
    }
    s.moveApt(id!, { day, staff: staffId, time: clock(startM) })
    s.patch({ calDrag: null })
    s.showToast(ap2.client + ' moved to ' + clock(startM) + ' with ' + st(staffId).name)
  }

  const segBtn = (label: string, on: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{ padding: '7px 15px', borderRadius: 999, border: 0, fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : 'transparent', color: on ? '#FEFEF1' : 'rgba(0,0,0,.65)' }}>{label}</button>
  )

  return (
    <View>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingBottom: 14 }}>
        <button onClick={() => s.patch({ calDay: Math.max(0, day - (mode === 'week' ? 7 : 1)) })} style={navBtn}>‹</button>
        <button onClick={() => s.patch({ calDay: Math.min(13, day + (mode === 'week' ? 7 : 1)) })} style={navBtn}>›</button>
        <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 22, paddingLeft: 4 }}>{title}</span>
        <button onClick={() => s.patch({ calDay: 0 })} style={{ border: '1px solid rgba(0,0,0,.18)', background: 'none', borderRadius: 999, padding: '7px 13px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Today</button>
        <div style={{ marginLeft: 'auto', display: 'flex', background: '#f7f2e4', borderRadius: 999, padding: 4 }}>
          {segBtn('Day', mode === 'day', () => s.patch({ calMode: 'day' }))}
          {segBtn('Week', mode === 'week', () => s.patch({ calMode: 'week' }))}
        </div>
      </div>

      {/* Chair chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 12 }}>
        {[{ id: 'all', name: 'All chairs' }, ...staff.filter((x) => x.skills.length)].map((x) => {
          const on = sel === x.id
          return <button key={x.id} onClick={() => s.patch({ calStaff: x.id })} style={{ border: '1px solid rgba(0,0,0,.16)', borderRadius: 999, padding: '7px 13px', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : '#FEFEF1', color: on ? '#FEFEF1' : 'rgba(0,0,0,.7)' }}>{x.name}</button>
        })}
      </div>

      {d[day].closed && mode === 'day' && (
        <div style={{ background: '#eee9dc', border: '1px solid rgba(0,0,0,.1)', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase' }}>Closed</span>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,.6)', marginLeft: 10 }}>The salon does not open on Sundays — nothing can be booked into this day.</span>
        </div>
      )}

      {mode === 'day' ? (
        <DayGrid chairs={chairs} day={day} isToday={day === 0} openEdit={openEdit} dropDay={dropDay} setDrag={(id) => s.patch({ calDrag: id })} apts={s.apts} />
      ) : (
        <WeekGrid />
      )}
    </View>
  )
}

const navBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(0,0,0,.18)', background: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }

function DayGrid({ chairs, day, isToday, openEdit, dropDay, setDrag, apts }: { chairs: typeof staff; day: number; isToday: boolean; openEdit: (a: Appointment) => void; dropDay: (e: React.DragEvent, id: string) => void; setDrag: (id: string) => void; apts: Appointment[] }) {
  const minW = 56 + Math.max(1, chairs.length) * 168
  const hours: number[] = []
  for (let m = 9 * 60; m < 20 * 60; m += 60) hours.push(m)

  return (
    <div style={{ border: '1px solid rgba(0,0,0,.13)', borderRadius: 12, background: '#FEFEF1', overflowX: 'auto' }}>
      <div style={{ minWidth: minW }}>
        {/* Header strip */}
        <div style={{ display: 'flex', background: '#f7f2e4', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
          <div style={{ width: 56, flex: 'none' }} />
          {chairs.map((x) => {
            const n = apts.filter((a) => (a.day || 0) === day && a.staff === x.id && a.stage !== 'cancelled').length
            return (
              <div key={x.id} style={{ flex: 1, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 7, borderLeft: '1px solid rgba(0,0,0,.06)' }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: x.bg }} />
                <span style={{ fontSize: 13 }}>{x.name}</span>
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.4)' }}>{x.skills.join(' · ')}</span>
                {n > 0 && <span style={{ marginLeft: 'auto', fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.35)' }}>{n}</span>}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', position: 'relative' }}>
          {/* Time gutter */}
          <div style={{ width: 56, flex: 'none' }}>
            {hours.map((m) => (
              <div key={m} style={{ height: 60, borderTop: '1px solid rgba(0,0,0,.07)', fontFamily: "'Geist Mono',monospace", fontSize: 9.5, color: 'rgba(0,0,0,.4)', padding: '3px 0 0 8px' }}>{clock(m)}</div>
            ))}
          </div>

          {chairs.map((x) => {
            const list = apts.filter((a) => (a.day || 0) === day && a.staff === x.id && a.stage !== 'cancelled')
            const blocks = lane(list)
            return (
              <div key={x.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => dropDay(e, x.id)} style={{ flex: 1, position: 'relative', borderLeft: '1px solid rgba(0,0,0,.06)', minHeight: hours.length * 60 }}>
                {hours.map((m) => (
                  <div key={m} style={{ height: 60, borderTop: '1px solid rgba(0,0,0,.07)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 30, left: 0, right: 0, borderTop: '1px dashed rgba(0,0,0,.05)' }} />
                  </div>
                ))}
                {isToday && NOW > START && NOW < 20 * 60 && <div style={{ position: 'absolute', left: 0, right: 0, top: NOW - START, borderTop: '1.5px solid rgba(180,70,47,.55)', zIndex: 3 }} />}
                {blocks.map((b) => {
                  const stf = st(b.ap.staff)
                  const stg = stages.find((y) => y.key === b.ap.stage) || stages[0]
                  return (
                    <div
                      key={b.ap.id}
                      draggable
                      onDragStart={(e) => { try { e.dataTransfer.setData('text/plain', b.ap.id); e.dataTransfer.effectAllowed = 'move' } catch { /* */ } setDrag(b.ap.id) }}
                      onClick={() => openEdit(b.ap)}
                      style={{ position: 'absolute', top: b.s - START, left: b.left, width: b.width, height: Math.max(30, aptMin(b.ap) - 2), background: '#FEFEF1', border: '1px solid rgba(0,0,0,.14)', borderLeft: `3px solid ${stf.bg}`, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: '5px 8px', overflow: 'hidden', zIndex: 2, cursor: 'grab' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ width: 5, height: 5, borderRadius: 999, background: stg.dot, flex: 'none' }} />
                        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, color: 'rgba(0,0,0,.5)' }}>{clock(b.s)}–{clock(b.e)}</span>
                      </div>
                      <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.ap.client}</div>
                      {!b.slim && <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.ap.service}</div>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function WeekGrid() {
  const s = useStore()
  const d = dayCards()
  const base = (s.calDay || 0) < 7 ? 0 : 7
  const sel = s.calStaff || 'all'
  const chairs = staff.filter((x) => x.skills.length && (sel === 'all' || x.id === sel))
  const minW = 126 + 7 * 132

  return (
    <div style={{ border: '1px solid rgba(0,0,0,.13)', borderRadius: 12, background: '#FEFEF1', overflowX: 'auto' }}>
      <div style={{ minWidth: minW }}>
        <div style={{ display: 'flex', background: '#f7f2e4', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
          <div style={{ width: 126, flex: 'none' }} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const dd = d[base + i]
            return (
              <div key={i} style={{ flex: 1, minWidth: 132, padding: '8px 10px', borderLeft: '1px solid rgba(0,0,0,.06)', background: dd.closed ? '#eee9dc' : base + i === 0 ? '#f3ead6' : 'transparent' }}>
                <div style={{ fontSize: 12.5 }}>{dd.label}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, color: 'rgba(0,0,0,.45)', paddingTop: 1 }}>{dd.num + ' ' + dd.mon + (dd.closed ? ' · closed' : '')}</div>
              </div>
            )
          })}
        </div>

        {chairs.map((x) => (
          <div key={x.id} style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,.06)' }}>
            <div style={{ width: 126, flex: 'none', padding: '10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Disc init={x.init} bg={x.bg} size={22} />
              <div>
                <div style={{ fontSize: 12.5 }}>{x.name}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8, color: 'rgba(0,0,0,.4)' }}>{x.skills.join(' · ')}</div>
              </div>
            </div>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const items = s.apts.filter((a) => (a.day || 0) === base + i && a.staff === x.id && a.stage !== 'cancelled').sort((p, q) => toMin(p.time) - toMin(q.time))
              const mins = items.reduce((n, a) => n + aptMin(a), 0)
              const onDrop = (e: React.DragEvent) => {
                e.preventDefault()
                const id = s.calDrag || (e.dataTransfer ? e.dataTransfer.getData('text/plain') : null)
                const ap2 = s.apts.find((z) => z.id === id)
                if (!ap2) return
                const dur2 = aptMin(ap2)
                const startM = toMin(ap2.time)
                const dn = d[base + i]
                if (!freeAt(s.apts, base + i, x.id, startM, dur2, id!)) { s.patch({ calDrag: null }); s.showToast(x.name + ' already has that time on ' + dn.wd + ' ' + dn.num + ' — nothing moved', 'warn'); return }
                s.moveApt(id!, { day: base + i, staff: x.id })
                s.patch({ calDrag: null })
                s.showToast(ap2.client + ' moved to ' + dn.wd + ' ' + dn.num + ' with ' + x.name)
              }
              return (
                <div key={i} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} style={{ flex: 1, minWidth: 132, padding: '8px', borderLeft: '1px solid rgba(0,0,0,.06)', minHeight: 78, display: 'flex', flexDirection: 'column', gap: 5, background: base + i === 0 ? '#f7f2e4' : '#FEFEF1' }}>
                  {items.map((ap) => {
                    const stg = stages.find((y) => y.key === ap.stage) || stages[0]
                    return (
                      <div key={ap.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData('text/plain', ap.id) } catch { /* */ } s.patch({ calDrag: ap.id }) }} onClick={() => s.patch({ calEdit: ap.id, calEditDay: ap.day || 0, calEditStaff: ap.staff, calEditTime: toMin(ap.time) })} style={{ border: '1px solid rgba(0,0,0,.12)', borderLeft: `3px solid ${x.bg}`, borderRadius: 6, padding: '5px 7px', cursor: 'grab', background: '#FEFEF1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: 999, background: stg.dot, flex: 'none' }} />
                          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, color: 'rgba(0,0,0,.5)' }}>{clock(toMin(ap.time))} · {hm(aptMin(ap))}</span>
                        </div>
                        <div style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ap.client}</div>
                        <div style={{ fontSize: 9.5, color: 'rgba(0,0,0,.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ap.service}</div>
                      </div>
                    )
                  })}
                  <div style={{ flex: 1 }} />
                  {mins > 0 && <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,.32)' }}>{hm(mins)}</div>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
