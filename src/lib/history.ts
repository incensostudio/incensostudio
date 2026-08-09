import type { Appointment, LedgerDay, Staff } from './types'
import { offsetOf, ticketTotal, toMin, toTime } from './format'

export interface HistoryEntry {
  key: string
  when: string
  date: string
  services: string[]
  products: string[]
  staff: string[]
  total: number
  method: string
  tip?: number
}

export interface UpcomingVisit {
  visitId: string
  date: string
  timeSpan: string
  services: string[]
  staff: string[]
  total: number
}

const whenLabel = (date: string): string => {
  const off = offsetOf(date)
  if (off === 0) return 'Today'
  if (off === -1) return 'Yesterday'
  if (off < 0 && off >= -34) return `${-off} days ago`
  const d = new Date(date)
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`
}

export function clientHistory(
  name: string,
  appointments: Appointment[],
  ledger: LedgerDay[],
  staffById: (id: string | null) => Staff | undefined,
): HistoryEntry[] {
  const entries: HistoryEntry[] = []

  // 1) live paid appointments, grouped by visit
  const paid = appointments.filter((a) => a.client_name === name && a.stage === 'paid')
  const byVisit = new Map<string, Appointment[]>()
  paid.forEach((a) => { const arr = byVisit.get(a.visit_id) || []; arr.push(a); byVisit.set(a.visit_id, arr) })
  for (const [vid, arr] of byVisit) {
    const services: string[] = []
    const products: string[] = []
    const staff: string[] = []
    let total = 0
    let method = 'Cash'
    let tip = 0
    arr.forEach((a) => {
      services.push(a.service_name)
      a.extras.forEach((e) => (e.kind === 'product' ? products : services).push(e.name))
      const sn = staffById(a.staff_id)?.name
      if (sn && !staff.includes(sn)) staff.push(sn)
      total += ticketTotal(a)
      if (a.method) method = a.method
      tip += a.tip || 0
    })
    entries.push({ key: vid, when: whenLabel(arr[0].date), date: arr[0].date, services, products, staff, total, method, tip })
  }

  // 2) older closed-day ledger rows (fallback for anything before live data)
  ledger.forEach((day) => {
    day.items.forEach((it, idx) => {
      if (it.client === name) {
        entries.push({
          key: `${day.id}:${idx}`, when: whenLabel(day.date), date: day.date,
          services: [it.service], products: [], staff: [it.staff_name], total: it.total, method: it.method,
        })
      }
    })
  })

  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function clientUpcoming(
  name: string,
  appointments: Appointment[],
  staffById: (id: string | null) => Staff | undefined,
): UpcomingVisit[] {
  const live = appointments.filter(
    (a) => a.client_name === name && (a.stage === 'booked' || a.stage === 'arrived') && offsetOf(a.date) >= 0,
  )
  const byVisit = new Map<string, Appointment[]>()
  live.forEach((a) => { const arr = byVisit.get(a.visit_id) || []; arr.push(a); byVisit.set(a.visit_id, arr) })
  const out: UpcomingVisit[] = []
  for (const [vid, arr] of byVisit) {
    const sorted = arr.slice().sort((x, y) => (x.time < y.time ? -1 : 1))
    const start = sorted[0].time
    const endM = arr.reduce((m, x) => Math.max(m, toMin(x.time) + (x.duration_min || 60)), toMin(start))
    const staff: string[] = []
    arr.forEach((a) => { const sn = staffById(a.staff_id)?.name; if (sn && !staff.includes(sn)) staff.push(sn) })
    out.push({
      visitId: vid, date: sorted[0].date, timeSpan: `${start}–${toTime(endM)}`,
      services: sorted.map((a) => a.service_name), staff,
      total: arr.reduce((m, a) => m + ticketTotal(a), 0),
    })
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1))
}
