// ---------------------------------------------------------------------------
// Pure domain logic, ported from the prototype's helper methods.
// Scheduling, service matching, money/time formatting, and the
// staff-vs-client copy rules (nextVisitFor / clientRebook must stay separate).
// ---------------------------------------------------------------------------

import { svcCat, staff, stations } from '../data/fixtures'
import type { Appointment, Client, Line, Service } from '../data/types'

// The prototype is pinned to a fixed "now" of Friday 31 July 2026, 10:41.
export const NOW_MIN = 10 * 60 + 41
export const DAY_START = 9 * 60
export const DAY_END = 20 * 60

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

export function hm(m: number): string {
  const h = Math.floor(m / 60)
  const r = m % 60
  return (h ? h + 'h' : '') + (r ? (h ? ' ' : '') + r + 'm' : h ? '' : '0m')
}

export function clock(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m
}

export function toMin(t: string): number {
  const p = String(t || '').split(':')
  return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0)
}

function hsh(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h * 16777619) | 0
  }
  h ^= h >>> 13
  return Math.abs(h)
}

export interface DayCard {
  i: number
  wd: string
  num: string
  mon: string
  label: string
  long: string
  closed: boolean
}

export function dayCards(): DayCard[] {
  const base = new Date(2026, 6, 31)
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const out: DayCard[] = []
  for (let i = 0; i < 14; i++) {
    const dt = new Date(base.getTime() + i * 86400000)
    out.push({
      i,
      wd: wd[dt.getDay()],
      num: String(dt.getDate()),
      mon: mo[dt.getMonth()],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : wd[dt.getDay()],
      long: i === 0 ? 'today' : i === 1 ? 'tomorrow' : wd[dt.getDay()] + ' ' + dt.getDate() + ' ' + mo[dt.getMonth()],
      closed: dt.getDay() === 0,
    })
  }
  return out
}

export function gridSlots(): number[] {
  const out: number[] = []
  for (let m = 9 * 60; m <= 19 * 60 + 30; m += 30) out.push(m)
  return out
}

export const slotTaken = (day: number, staffId: string, min: number) => hsh(day + '|' + staffId + '|' + min) % 100 < 11

function svcMatch(part: string): Service | null {
  const p = String(part || '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!p) return null
  const exact = svcCat.find((x) => x.name.toLowerCase() === p)
  if (exact) return exact
  let inside: Service | null = null
  svcCat.forEach((x) => {
    const n = x.name.toLowerCase()
    if (p.indexOf(n) >= 0 && (!inside || n.length > inside!.name.length)) inside = x
  })
  if (inside) return inside
  let around: Service | null = null
  svcCat.forEach((x) => {
    const n = x.name.toLowerCase()
    if (n.indexOf(p) >= 0 && (!around || x.name.length < around!.name.length)) around = x
  })
  return around
}

export function svcParts(name: string): Service[] {
  const whole = svcMatch(name)
  const norm = String(name || '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  if (whole && whole.name.toLowerCase() === norm) return [whole]
  return String(name || '')
    .split(' + ')
    .map((p) => svcMatch(p))
    .filter((x): x is Service => !!x)
}

export function svcMin(name: string): number {
  const hits = svcParts(name)
  return hits.length ? hits.reduce((a, x) => a + x.min, 0) : 60
}

export function svcPrice(name: string): number {
  const hits = svcParts(name)
  return hits.length ? hits.reduce((a, x) => a + x.base, 0) : 55
}

export function aptMin(a: Appointment | undefined | null): number {
  return a && typeof a.min === 'number' && a.min > 0 ? a.min : svcMin(a ? a.service : '')
}

export function bookedFor(apts: Appointment[], day: number, staffId: string, skipId?: string): [number, number][] {
  return apts
    .filter((a) => (a.day || 0) === day && a.staff === staffId && a.stage !== 'cancelled' && a.id !== skipId)
    .map((a) => {
      const st = toMin(a.time)
      return [st, st + aptMin(a)] as [number, number]
    })
}

export function freeAt(apts: Appointment[], day: number, staffId: string, start: number, dur: number, skipId?: string): boolean {
  if (start < 9 * 60 || start + dur > 20 * 60) return false
  return !bookedFor(apts, day, staffId, skipId).some((iv) => start < iv[1] && iv[0] < start + dur)
}

export function slotFits(apts: Appointment[], day: number, staffId: string, min: number, dur: number): boolean {
  if (min + dur > 20 * 60 + 30) return false
  for (let t = min; t < min + dur; t += 30) {
    if (slotTaken(day, staffId, t)) return false
  }
  return !bookedFor(apts, day, staffId).some((iv) => min < iv[1] && iv[0] < min + dur)
}

export const st = (id: string) => staff.find((s) => s.id === id) || staff[0]

export function elapsedFor(a: Appointment): string {
  const mins = NOW_MIN - toMin(a.time)
  if (mins < 3) return 'just seated'
  if (mins < 60) return mins + 'm in chair'
  return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm in chair'
}

export function depositFor(a: Appointment, c?: Client): string {
  if (c && c.visits === 0)
    return '$50 held — first visit' + (/balayage|keratin|colour|highlight|correction/i.test(a.service) ? ', colour booked' : '')
  if (/keratin|balayage/i.test(a.service)) return '25% taken at booking — service over $200'
  if (c && c.state === 'At risk') return '$50 held — two late cancellations on file'
  return 'None taken — loyal client, no friction'
}

export function briefFor(c?: Client): { tag: string; fg: string; text: string }[] {
  if (!c) return [{ tag: 'Intake', fg: '#000', text: 'No history. Take her preferences as she talks and write them at checkout.' }]
  const order = ['Care flags', 'Hospitality', 'Behaviour', 'Intake', 'Wishlist', 'Personal']
  return c.dossier
    .slice()
    .sort((x, y) => order.indexOf(x.k) - order.indexOf(y.k))
    .slice(0, 3)
    .map((g) => ({ tag: g.k, fg: g.fg, text: g.items.join('. ') + '.' }))
}

export function lineTotal(a: Appointment): number {
  return (a.lines || []).filter((l) => l.t !== 'product').reduce((s, l) => s + (l as any).price * (l.qty || 1), 0)
}

export function fileNote(txt: string): string {
  const t = (txt || '').toLowerCase()
  const out: string[] = []
  if (/espresso|coffee|tea|water|drink|latte/.test(t)) out.push('Hospitality — beverage preference')
  if (/sensitiv|allerg|irritat|burn|cuticle|scalp/.test(t)) out.push('Care flags — sensitivity, shown to every staff member before touching her')
  if (/instagram|pink|colou?r|inspo|septem|next|wants/.test(t)) out.push('Wishlist — surfaced at her next consult and to marketing')
  if (/late|early|rush|hurry|time/.test(t)) out.push('Behaviour — scheduling buffer adjusted')
  if (/talk|quiet|music|phone/.test(t)) out.push('Room preference — pinned to her chair card')
  if (!out.length)
    return 'Write freely — Mind sorts it into hospitality, care flags, wishlist, behaviour and room preference, then shows it to whoever meets her next.'
  return out.join(' · ')
}

/** Staff-facing rebooking copy — tactics and conversion rates allowed. */
export function nextVisitFor(lines: Line[]): string {
  const n = lines.map((l) => l.name.toLowerCase()).join(' ')
  if (/rubber base|gel manicure/.test(n)) return 'Rubber base holds 4.2 weeks on her. Nudge drafted for 21 Aug, three weeks out.'
  if (/root|touch-up|toner/.test(n)) return 'Her root shadow reads at 5.4 weeks. Nudge at week 4, and offer the gloss at the same time — she takes it 6 times out of 10.'
  if (/balayage|gloss/.test(n)) return 'Her regrowth reads at 7.5 weeks. Gloss refresh nudge at week 5, full balayage at week 9.'
  if (/keratin/.test(n)) return 'Keratin fades from week 11. Nudge at week 9 with the aftercare bundle attached.'
  if (/manicure|pedicure/.test(n)) return 'She rebooks nails every 3.1 weeks. Nudge queued 4 days before that.'
  return 'Mind will set the rebooking window once this ticket closes.'
}

/** Client-facing rebooking copy — second person, no tactics or conversion rates. */
export function clientRebook(lines: Line[], who?: string): string {
  const n = (lines || []).map((l) => l.name.toLowerCase()).join(' ')
  const w = who ? ' ' + who + ' will keep the slot she usually gives you.' : ''
  if (/rubber base|gel manicure/.test(n)) return 'Your set holds about four weeks. We will message you a few days before, so nothing grows out on you.'
  if (/root|touch-up|toner/.test(n)) return 'Your roots usually want us again around week five.' + w
  if (/balayage|gloss/.test(n)) return 'A gloss refresh sits nicely around week five, and the full balayage around week nine.' + w
  if (/keratin/.test(n)) return 'Your keratin holds about eleven weeks. We will check in before it starts to fade.'
  if (/manicure|pedicure/.test(n)) return 'You come back for nails about every three weeks. We will remind you.'
  return 'We will let you know when it is time to come back.'
}

export function clientTier(c?: Client | null): string {
  if (!c || !c.visits) return 'Your first visit — welcome.'
  if (c.tier === 'Gold') return c.visits + ' visits with us · Gold — your birthday ritual and every tenth blowdry are on the house'
  if (c.tier === 'Silver') return c.visits + ' visits with us · Silver — five more and you are Gold'
  return c.visits + ' visits with us · your birthday ritual is on us whenever you want it'
}

export function seedLines(a: Appointment): Line[] {
  if (a.lines && a.lines.length) return a.lines.map((l) => ({ ...l }))
  const guess = svcCat.filter((s2) => a.service.toLowerCase().indexOf(s2.name.toLowerCase().split(' ')[0]) >= 0)
  return (guess.length ? guess : [svcCat[0]]).map((s2) => ({ t: 'service', name: s2.name, base: s2.base, price: s2.base, qty: 1, from: !!s2.from }))
}

export function srcFor(ch: string): string | null {
  return (
    ({ Instagram: 'Instagram', WhatsApp: 'WhatsApp', Phone: 'Phone', Google: 'Google search', TikTok: 'TikTok', ChatGPT: 'ChatGPT', Staff: 'Staff referral' } as Record<string, string>)[
      ch
    ] || null
  )
}

export function firstStation(service: string): string {
  const dept = (svcParts(service)[0] || ({} as Service)).cat || 'Hair'
  return (stations.filter((x) => x.dept === dept)[0] || stations[0]).name
}
