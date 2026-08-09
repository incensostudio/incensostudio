// Offline demo data — used ONLY in dev (`import.meta.env.DEV`) with `?demo` in
// the URL, so I can render the authenticated screens locally and compare them
// pixel-by-pixel against the design references. Never active in production.
import type { Appointment, Client, DeskUser, LedgerDay, Service, Staff } from './types'
import { pad } from './format'

const today = new Date()
const d = (off: number) => {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate() + off)
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}

export const mockUser: DeskUser = {
  id: 'ad', name: 'Admin', initials: 'AD', role: 'admin', role_label: 'Owner', colour: '#3b4a7a',
}

export const mockStaff: Staff[] = [
  { id: 'hu', name: 'Hussein', initials: 'HU', role: 'Hair', colour: '#7a3b5f', does: ['Cuts & Styling', 'Color', 'Treatments', 'Extensions'], sort: 0, active: true },
  { id: 'ay', name: 'Aya', initials: 'AY', role: 'Nails', colour: '#b07d1a', does: ['Nails', 'Pedicure', 'Designer Experience'], sort: 1, active: true },
  { id: 'ha', name: 'Hala', initials: 'HA', role: 'Nails', colour: '#3b4a7a', does: ['Nails', 'Pedicure', 'Designer Experience'], sort: 2, active: true },
  { id: 'ja', name: 'Jana', initials: 'JA', role: 'Hair · Nails · Brows', colour: '#3f5a42', does: ['Cuts & Styling', 'Color', 'Treatments', 'Nails', 'Pedicure', 'Designer Experience', 'Brows & Lashes'], sort: 3, active: true },
  { id: 'no', name: 'Nof', initials: 'NO', role: 'Makeup', colour: '#8a5a20', does: ['Makeup'], sort: 4, active: true },
]

const svc = (name: string, price: number, category: string, minutes: number, is_from = false, is_quote = false, sort = 0): Service =>
  ({ id: name, name, price, category, minutes, is_from, is_quote, active: true, sort })
export const mockServices: Service[] = [
  svc('Haircut', 40, 'Cuts & Styling', 45, true, false, 0),
  svc('Blow-dry', 10, 'Cuts & Styling', 30, false, false, 2),
  svc('Hair Styling', 15, 'Cuts & Styling', 30, false, false, 3),
  svc('Root Color', 30, 'Color', 90, true, false, 7),
  svc('Highlights', 130, 'Color', 150, true, false, 8),
  svc('Toner Refresh', 30, 'Color', 45, true, false, 11),
  svc('Keratin Smoothing Treatment', 60, 'Treatments', 150, true, false, 12),
  svc('Rubber Base', 20, 'Nails', 60, false, false, 25),
  svc('Dip Powder', 20, 'Nails', 60, false, false, 27),
  svc('Nail Art Simple — per nail', 1, 'Nails', 10, false, false, 40),
  svc('Classic Pedicure', 15, 'Pedicure', 45, false, false, 43),
  svc('Chanel Manicure', 20, 'Designer Experience', 60, false, false, 48),
  svc('Brow Shaping', 10, 'Brows & Lashes', 20, false, false, 52),
  svc('Lash Lift & Tint', 30, 'Brows & Lashes', 60, false, false, 56),
  svc('Full Glam Makeup', 70, 'Makeup', 60, false, false, 61),
  svc('Bridal Makeup', 200, 'Makeup', 120, false, false, 63),
]

export const mockClients: (Client & { visits: number; spend: number; last_visit: string })[] = [
  { id: 'c1', name: 'Layal Haddad', phone: '03 421 880', instagram: '@layalhaddad', tiktok: '', note: 'Ammonia-free base only', visits: 41, spend: 9840, last_visit: d(-12) },
  { id: 'c2', name: 'Nour Chalhoub', phone: '70 118 342', instagram: '@nour.ch', tiktok: '@nourch', note: '', visits: 12, spend: 1460, last_visit: d(-21) },
  { id: 'c3', name: 'Rita Azar', phone: '71 903 217', instagram: '', tiktok: '', note: 'Always runs ten minutes late', visits: 7, spend: 720, last_visit: d(-60) },
  { id: 'c4', name: 'Maya Fares', phone: '03 774 105', instagram: '@mayafares', tiktok: '', note: '', visits: 23, spend: 3980, last_visit: d(-6) },
  { id: 'c5', name: 'Sabine Rizk', phone: '76 220 918', instagram: '', tiktok: '@sabinerizk', note: '', visits: 3, spend: 210, last_visit: d(-35) },
  { id: 'c6', name: 'Hala Mansour', phone: '70 664 273', instagram: '@halamansour', tiktok: '', note: 'Prefers Jana', visits: 19, spend: 2870, last_visit: d(-9) },
  { id: 'c7', name: 'Zeina Khoury', phone: '03 559 401', instagram: '', tiktok: '', note: '', visits: 5, spend: 480, last_visit: d(-42) },
]

const ap = (
  id: string, visit: string, client: string, phone: string, service: string, price: number,
  staff: string, time: string, dur: number, off: number, stage: Appointment['stage'],
  method: Appointment['method'] = null, extras: Appointment['extras'] = [], note = '',
): Appointment => ({
  id, visit_id: visit, client_id: null, client_name: client, phone, service_name: service, price,
  staff_id: staff, date: d(off), time, duration_min: dur, stage, method, tip: 0, note, extras,
})

export const mockAppointments: Appointment[] = [
  ap('a1', 'v1', 'Layal Haddad', '03 421 880', 'Highlights', 130, 'hu', '09:30', 150, 0, 'paid', 'Whish', [{ id: 'e1', name: 'Toner Refresh', price: 30, kind: 'service' }]),
  ap('a2', 'v2', 'Maya Fares', '03 774 105', 'Rubber Base', 20, 'ha', '10:00', 60, 0, 'paid', 'Cash', [{ id: 'e2', name: 'Nail Art Simple — per nail', price: 4, kind: 'service' }]),
  ap('a3', 'v3', 'Hala Mansour', '70 664 273', 'Haircut', 40, 'ja', '11:00', 45, 0, 'arrived'),
  ap('a4', 'v4', 'Nour Chalhoub', '70 118 342', 'Root Color', 30, 'hu', '11:30', 90, 0, 'arrived'),
  ap('a5', 'v5', 'Rita Azar', '71 903 217', 'Brow Shaping', 10, 'ja', '12:30', 20, 0, 'booked'),
  ap('a6', 'v6', 'Zeina Khoury', '03 559 401', 'Blow-dry', 10, 'ja', '14:00', 30, 0, 'booked'),
  ap('a7', 'v7', 'Sabine Rizk', '76 220 918', 'Root Color', 30, 'hu', '13:30', 90, 0, 'arrived'),
  ap('a7b', 'v7', 'Sabine Rizk', '76 220 918', 'Blow-dry', 10, 'ja', '15:00', 30, 0, 'arrived'),
  ap('a7c', 'v7', 'Sabine Rizk', '76 220 918', 'Classic Pedicure', 15, 'ay', '15:30', 45, 0, 'booked'),
  ap('a8', 'v8', 'Layal Haddad', '03 421 880', 'Keratin Smoothing Treatment', 60, 'hu', '16:30', 150, 0, 'booked', null, [], 'Bringing her sister for a consult'),
]

export const mockLedger: LedgerDay[] = [
  { id: 'l1', date: d(-1), label: 'Sat 8 Aug', note: 'Hussein, Jana and Hala all full', closed_at: '', items: [
    { time: '09:30', client: 'Layal Haddad', service: 'Highlights + Toner Refresh', staff_name: 'Hussein', method: 'Whish', total: 160 },
    { time: '14:00', client: 'Hala Mansour', service: 'Haircut + Blow-dry', staff_name: 'Jana', method: 'Whish', total: 50 },
    { time: '16:00', client: 'Zeina Khoury', service: 'Full Glam Makeup', staff_name: 'Nof', method: 'Whish', total: 70 },
  ] },
  { id: 'l2', date: d(-2), label: 'Fri 7 Aug', note: 'Busy day — one walk-in', closed_at: '', items: [
    { time: '10:00', client: 'Hala Mansour', service: 'Highlights', staff_name: 'Hussein', method: 'Whish', total: 130 },
    { time: '18:00', client: 'Maya Fares', service: 'Natural Makeup', staff_name: 'Nof', method: 'Cash', total: 50 },
  ] },
]

export const isDemo = () =>
  import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
