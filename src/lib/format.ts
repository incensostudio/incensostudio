import type { Appointment, Service, Staff } from './types'

export const CURRENCY = '$'

export const pad = (n: number) => (n < 10 ? '0' : '') + n
export const money = (n: number) => CURRENCY + Math.round(n).toLocaleString()

export const toMin = (t: string) => {
  const p = (t || '09:00').split(':')
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10)
}
export const toTime = (m: number) => {
  m = Math.max(0, Math.min(23 * 60 + 45, m))
  return pad(Math.floor(m / 60)) + ':' + pad(m % 60)
}
export const durLabel = (m: number) => {
  const h = Math.floor(m / 60)
  const r = m % 60
  return (h ? h + 'h' : '') + (h && r ? ' ' : '') + (r ? r + 'm' : h ? '' : '0m')
}

export const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ---- date strings (local, YYYY-MM-DD) --------------------------------------
export const todayStr = (): string => dateToStr(new Date())
export const dateToStr = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10))
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number): string => {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return dateToStr(d)
}
export const offsetOf = (s: string): number =>
  Math.round((parseDate(s).getTime() - parseDate(todayStr()).getTime()) / 86400000)

export interface DayMeta { wd: string; wdLong: string; num: number; mon: string }
export const dayMeta = (s: string): DayMeta => {
  const d = parseDate(s)
  return { wd: WD[d.getDay()], wdLong: WD_LONG[d.getDay()], num: d.getDate(), mon: MO[d.getMonth()] }
}
// "Today 13 Aug" / "Tomorrow 14 Aug" / "Thu 15 Aug"
export const dayName = (s: string): string => {
  const off = offsetOf(s)
  const m = dayMeta(s)
  return (off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : m.wd) + ' ' + m.num + ' ' + m.mon
}
// "Thursday 13 Aug"
export const dayLabelLong = (s: string): string => {
  const m = dayMeta(s)
  return m.wdLong + ' ' + m.num + ' ' + m.mon
}

export const slots = (step = 15): string[] => {
  const out: string[] = []
  for (let m = 9 * 60; m <= 20 * 60; m += step) out.push(toTime(m))
  return out
}
export const DURS = [15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240, 300, 480]

export const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE

export const initialsOf = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export const priceLabel = (s: Pick<Service, 'price' | 'is_from' | 'is_quote'>) =>
  s.is_quote ? 'quote' : s.is_from ? 'from ' + money(s.price) : money(s.price)

// Total for a single appointment/ticket line (tip only counts once paid).
export const ticketTotal = (a: Appointment): number => {
  const ex = (a.extras || []).reduce((s, x) => s + x.price, 0)
  return a.price + ex + (a.stage === 'paid' ? a.tip || 0 : 0)
}

// Auto-pick a stylist who performs `cat` and is not off; falls back sensibly.
export const staffFor = (
  cat: string,
  fallback: string | null,
  staff: Staff[],
  isOff: (id: string) => boolean,
): string | null => {
  const free = (id: string) => !isOff(id)
  const can = staff.filter((s) => (s.does || []).includes(cat))
  if (!can.length) {
    if (fallback && free(fallback)) return fallback
    const any = staff.find((s) => free(s.id))
    return any ? any.id : fallback
  }
  const fb = can.find((s) => s.id === fallback)
  if (fb && free(fb.id)) return fb.id
  const hit = can.find((s) => free(s.id)) || can[0]
  return hit.id
}

export const stageMeta = (k: string) => {
  const m: Record<string, { label: string; dot: string; bg: string; fg: string }> = {
    booked: { label: 'Booked', dot: '#b07d1a', bg: '#efe8d8', fg: '#5c4a1a' },
    arrived: { label: 'Arrived', dot: '#3b4a7a', bg: '#e6e2f2', fg: '#2b3556' },
    paid: { label: 'Paid', dot: '#000', bg: '#e6e2d6', fg: '#000' },
    cancelled: { label: 'No-show', dot: '#b4462f', bg: '#f0e2de', fg: '#7d2f1e' },
  }
  return m[k] || m.booked
}

export const blockSkin: Record<string, { bg: string; border: string }> = {
  booked: { bg: '#FEFEF1', border: 'rgba(0,0,0,.16)' },
  arrived: { bg: '#f6e7c8', border: 'rgba(0,0,0,.28)' },
  paid: { bg: '#ece8db', border: 'rgba(0,0,0,.12)' },
  cancelled: { bg: '#FEFEF1', border: 'rgba(0,0,0,.16)' },
}
