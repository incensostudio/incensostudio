export type Role = 'admin' | 'receptionist'

export interface DeskUser {
  id: string
  name: string
  initials: string
  role: Role
  role_label: string
  colour: string
}

export interface DeskChip {
  id: string
  name: string
  initials: string
  role_label: string
  colour: string
}

export interface Staff {
  id: string
  name: string
  initials: string
  role: string
  colour: string
  does: string[]
  sort: number
  active: boolean
}

export interface Service {
  id: string
  name: string
  price: number
  category: string
  minutes: number
  is_from: boolean
  is_quote: boolean
  active: boolean
  sort: number
}

export interface Product {
  id: string
  name: string
  price: number
  active: boolean
  sort: number
}

export interface Client {
  id: string
  name: string
  phone: string
  instagram: string
  tiktok: string
  note: string
}

export type ExtraKind = 'service' | 'product'

export interface Extra {
  id?: string
  name: string
  price: number
  kind: ExtraKind
}

export type Stage = 'booked' | 'arrived' | 'paid' | 'cancelled'
export type Method = 'Cash' | 'Whish'

export interface Appointment {
  id: string
  visit_id: string
  client_id: string | null
  client_name: string
  phone: string
  service_name: string
  price: number
  staff_id: string | null
  date: string // YYYY-MM-DD
  time: string // HH:MM
  duration_min: number
  stage: Stage
  method: Method | null
  tip: number
  note: string
  extras: Extra[]
}

export interface LedgerItem {
  time: string
  client: string
  service: string
  staff_name: string
  method: Method
  total: number
}

export interface LedgerDay {
  id: string
  date: string
  label: string
  note: string
  closed_at: string
  items: LedgerItem[]
}
