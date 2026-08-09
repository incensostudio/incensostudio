import { useMemo, useState } from 'react'
import { C, F, CAL } from '../lib/tokens'
import { useStore } from '../store'
import { useNarrow } from '../lib/useNarrow'
import type { BookingSeed } from '../App'
import type { Appointment, Staff } from '../lib/types'
import {
  addDays, blockSkin, dayName, durLabel, money, offsetOf, ticketTotal,
  toMin, todayStr,
} from '../lib/format'

interface Props {
  viewedDate: string
  setViewedDate: (d: string) => void
  openTicket: (client: string, date: string) => void
  openBooking: (seed?: BookingSeed) => void
}

interface Positioned { a: Appointment; top: number; height: number; left: string; width: string; split: boolean }

// Lay out one stylist's appointments, splitting overlaps into sub-columns.
function layout(apts: Appointment[], minH: number): Positioned[] {
  const sorted = apts.slice().sort((x, y) => (x.time < y.time ? -1 : 1))
  const out: Positioned[] = []
  let i = 0
  while (i < sorted.length) {
    // build a cluster of mutually-overlapping appointments
    const cluster = [sorted[i]]
    let maxEnd = toMin(sorted[i].time) + (sorted[i].duration_min || 60)
    let j = i + 1
    while (j < sorted.length && toMin(sorted[j].time) < maxEnd) {
      cluster.push(sorted[j])
      maxEnd = Math.max(maxEnd, toMin(sorted[j].time) + (sorted[j].duration_min || 60))
      j++
    }
    const n = cluster.length
    cluster.forEach((a, k) => {
      const start = toMin(a.time)
      const top = (start - CAL.start) * CAL.px
      const height = Math.max(minH, (a.duration_min || 60) * CAL.px - 3)
      out.push({
        a, top, height,
        left: n > 1 ? `calc(${(k * 100) / n}% + 4px)` : '4px',
        width: n > 1 ? `calc(${100 / n}% - 6px)` : 'calc(100% - 8px)',
        split: n > 1,
      })
    })
    i = j
  }
  return out
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ background: C.cream, border: `1px solid ${C.hair12}`, borderRadius: 11, padding: 13 }}>
      <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut42 }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 26, padding: '4px 0 2px' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: C.mut45 }}>{note}</div>
    </div>
  )
}

function Column({
  st, apts, off, narrow, onToggleOff, openTicket, staffById,
}: {
  st: Staff; apts: Appointment[]; off: boolean; narrow: boolean
  onToggleOff: () => void; openTicket: (c: string, d: string) => void
  staffById: (id: string | null) => Staff | undefined
}) {
  const minH = narrow ? 44 : 26
  const positioned = useMemo(() => (off ? [] : layout(apts, minH)), [apts, off, minH])
  const booked = apts.filter((a) => a.stage !== 'cancelled').reduce((m, a) => m + (a.duration_min || 60), 0)
  const load = off ? 'day off' : booked ? `${durLabel(booked)} booked` : 'free'
  const colH = (CAL.end - CAL.start) * CAL.px

  return (
    <div style={{ flex: '1 1 0', minWidth: narrow ? 0 : 150, display: 'flex', flexDirection: 'column' }}>
      {/* sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: C.cream, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px 8px' }}>
        <span style={{ width: 20, height: 20, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontSize: 7.5, color: C.cream, background: off ? 'rgba(0,0,0,.3)' : st.colour }}>{st.initials}</span>
        <div style={{ lineHeight: 1.2, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: off ? C.mut45 : C.ink }}>{st.name}</div>
          <div style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mut42 }}>{load}</div>
        </div>
        <button onClick={onToggleOff} data-tap="icon" title={off ? 'Clear day off' : 'Mark day off'} style={{ marginLeft: 'auto', border: `1px solid ${off ? '#000' : C.hair14}`, background: off ? C.ink : C.cream, color: off ? C.cream : C.mut45, borderRadius: 999, padding: '5px 12px', cursor: 'pointer', fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>{off ? 'Off' : 'Off?'}</button>
      </div>

      {/* body */}
      <div style={{
        position: 'relative', height: colH, background: off ? C.off : C.creamSunk,
        border: `1px solid ${C.hair09}`, borderRadius: 9, margin: '0 4px',
        backgroundImage: off
          ? 'repeating-linear-gradient(135deg, rgba(0,0,0,.055) 0 7px, transparent 7px 14px)'
          : 'none',
      }}>
        {/* hour rules */}
        {!off && Array.from({ length: 12 }, (_, h) => (
          <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: (h * 60) * CAL.px, borderTop: `1px solid ${C.hair07}` }} />
        ))}

        {off && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: C.cream, borderRadius: 999, padding: '4px 12px', fontFamily: F.mono, fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: C.mut45 }}>Day off</span>
          </div>
        )}

        {positioned.map(({ a, top, height, left, width, split }) => {
          const skin = blockSkin[a.stage]
          const border = a.stage === 'paid' ? C.hair12 : st.colour
          const short = height < 50 || split
          const who = staffById(a.staff_id)
          return (
            <button key={a.id} data-tap="fixed" onClick={() => openTicket(a.client_name, a.date)}
              title={`${a.time} · ${a.client_name} · ${a.service_name}`}
              style={{
                position: 'absolute', top, left, width, height, textAlign: 'left',
                background: skin.bg, border: `1px solid ${skin.border}`, borderLeft: `3px solid ${border}`,
                borderRadius: 7, padding: '4px 7px', cursor: 'pointer', overflow: 'hidden',
                opacity: a.stage === 'cancelled' ? 0.4 : 1, color: C.ink,
              }}>
              {short ? (
                <div style={{ fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ fontFamily: F.mono, fontSize: 8.5 }}>{a.time}</span> {a.client_name} · {a.service_name}
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.mut45 }}>{a.time}{who ? ` · ${who.name}` : ''}</div>
                  <div style={{ fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.client_name}</div>
                  <div style={{ fontSize: 10, color: C.mut45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.service_name}</div>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Book({ viewedDate, setViewedDate, openTicket, openBooking }: Props) {
  const s = useStore()
  const narrow = useNarrow()
  const today = todayStr()
  const isToday = viewedDate === today
  const staff = s.staff.filter((x) => x.active)
  const [staffPick, setStaffPick] = useState<string>(staff[0]?.id || '')

  const dayApts = s.appointments.filter((a) => a.date === viewedDate)
  const openA = dayApts.filter((a) => a.stage === 'booked' || a.stage === 'arrived')
  const arrived = dayApts.filter((a) => a.stage === 'arrived')
  const paid = dayApts.filter((a) => a.stage === 'paid')
  const taken = paid.reduce((m, a) => m + ticketTotal(a), 0)
  const expected = openA.reduce((m, a) => m + a.price, 0)

  // chair bar (today only): clients with an arrived appointment
  const chair = useMemo(() => {
    if (!isToday) return []
    const byClient = new Map<string, Appointment[]>()
    arrived.forEach((a) => { const arr = byClient.get(a.client_name) || []; arr.push(a); byClient.set(a.client_name, arr) })
    return Array.from(byClient.entries()).map(([name]) => {
      const all = dayApts.filter((a) => a.client_name === name)
      const due = all.filter((a) => a.stage === 'booked' || a.stage === 'arrived').reduce((m, a) => m + ticketTotal(a), 0)
      return { name, due }
    })
  }, [isToday, arrived, dayApts])

  const stat = {
    apptsNote: isToday ? `${openA.length} still to come` : `${openA.length} not yet in`,
  }

  const activePick = staff.find((x) => x.id === staffPick) || staff[0]

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: narrow ? 12 : 10, paddingBottom: 16 }}>
        <StatCard label="Appointments" value={String(dayApts.length)} note={stat.apptsNote} />
        <StatCard label="In the salon" value={String(arrived.length)} note="checked in now" />
        <StatCard label="Taken" value={money(taken)} note={`${paid.length} ${paid.length === 1 ? 'ticket' : 'tickets'} paid`} />
        <StatCard label="Expected" value={money(expected)} note="if the day finishes clean" />
      </div>

      {/* Day switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '2px 0 16px' }}>
        <button onClick={() => !isToday && setViewedDate(addDays(viewedDate, -1))} disabled={isToday} data-tap="fixed"
          style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '8px 14px', cursor: isToday ? 'default' : 'pointer', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.ink, opacity: isToday ? 0.4 : 1 }}>← Prev</button>
        <div style={{ fontFamily: F.display, fontSize: 20 }}>{dayName(viewedDate)}</div>
        <button onClick={() => setViewedDate(addDays(viewedDate, 1))} data-tap="fixed"
          style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.ink }}>Next →</button>
        {!isToday && (
          <button onClick={() => setViewedDate(today)} style={{ border: 0, background: C.ink, color: C.cream, borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontFamily: F.mono, fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase' }}>Back to today</button>
        )}
        <div style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: C.mut45 }}>
          {dayApts.length} {dayApts.length === 1 ? 'service' : 'services'} on the board
        </div>
      </div>

      {/* In the chair */}
      {isToday && chair.length > 0 && (
        <div style={{ background: C.wheat, border: `1px solid ${C.hair14}`, borderRadius: 14, padding: narrow ? 16 : '12px 14px', marginBottom: 16, display: 'flex', alignItems: narrow ? 'stretch' : 'center', flexDirection: narrow ? 'column' : 'row', gap: narrow ? 8 : 10, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.mut45, marginBottom: narrow ? 2 : 0 }}>In the chair</div>
          {chair.map((c) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 999, padding: '4px 4px 4px 16px', flex: narrow ? 'none' : '0 1 auto' }}>
              <span style={{ fontSize: 13.5 }}>{c.name}</span>
              <button onClick={() => openTicket(c.name, today)} style={{ border: 0, background: C.ink, color: C.cream, borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontFamily: F.mono, fontSize: 10, letterSpacing: '.06em', whiteSpace: 'nowrap' }}>Take {money(c.due)}</button>
            </div>
          ))}
        </div>
      )}

      {/* Mobile stylist chips */}
      {narrow && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10 }}>
          {staff.map((st) => {
            const cnt = dayApts.filter((a) => a.staff_id === st.id && a.stage !== 'cancelled').length
            const off = s.isOff(viewedDate, st.id)
            const on = activePick?.id === st.id
            return (
              <button key={st.id} onClick={() => setStaffPick(st.id)} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${on ? '#000' : C.hair14}`, background: on ? C.ink : C.cream, color: on ? C.cream : C.ink, borderRadius: 999, padding: '6px 11px', cursor: 'pointer' }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontSize: 7, color: C.cream, background: st.colour }}>{st.initials}</span>
                <span style={{ fontSize: 11.5 }}>{st.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 8.5, color: on ? 'rgba(254,254,241,.6)' : C.mut42 }}>{off ? 'off' : cnt}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Calendar */}
      <div style={{ background: C.cream, borderRadius: 12, padding: '6px 8px 12px', display: 'flex', overflowX: narrow ? 'hidden' : 'auto' }}>
        {/* gutter */}
        <div style={{ width: narrow ? CAL.gutterM : CAL.gutter, flex: 'none', position: 'relative', paddingTop: 42 }}>
          {Array.from({ length: 12 }, (_, h) => (
            <div key={h} style={{ position: 'absolute', top: 42 + (h * 60) * CAL.px - 6, left: 0, fontFamily: F.mono, fontSize: 9, color: 'rgba(0,0,0,.35)' }}>{String(9 + h).padStart(2, '0')}:00</div>
          ))}
        </div>
        {(narrow ? (activePick ? [activePick] : []) : staff).map((st) => (
          <Column
            key={st.id}
            st={st}
            apts={dayApts.filter((a) => a.staff_id === st.id)}
            off={s.isOff(viewedDate, st.id)}
            narrow={narrow}
            onToggleOff={() => s.toggleDayOff(viewedDate, st.id)}
            openTicket={openTicket}
            staffById={s.staffById}
          />
        ))}
      </div>

      {offsetOf(viewedDate) > 0 && dayApts.length === 0 && (
        <div style={{ textAlign: 'center', color: C.mut45, fontSize: 12.5, padding: 24 }}>
          Nothing booked yet. <button onClick={() => openBooking({ date: viewedDate })} style={{ border: 0, background: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5 }}>Add a booking</button>.
        </div>
      )}
    </div>
  )
}
