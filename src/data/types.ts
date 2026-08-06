// ---------------------------------------------------------------------------
// Incenso OS — model shapes. Ported from the design prototype's class fields.
// The *shapes* of the seed objects are the starting point for the data layer.
// ---------------------------------------------------------------------------

export type Role = 'owner' | 'manager' | 'reception' | 'staff'
export type ViewKey =
  | 'floor'
  | 'calendar'
  | 'inbox'
  | 'queue'
  | 'clients'
  | 'portal'
  | 'team'
  | 'stock'
  | 'retail'
  | 'mind'
  | 'finance'

export type StageKey = 'booked' | 'reception' | 'service' | 'review' | 'paid' | 'cancelled'

export interface Staff {
  id: string
  name: string
  init: string
  role: string
  bg: string
  skills: string[]
  pfp: string
}

export interface Stage {
  key: Exclude<StageKey, 'cancelled'>
  label: string
  dot: string
  who: string
  colBg: string
}

export interface Station {
  name: string
  dept: string
  x: string
  y: string
}

export interface Service {
  name: string
  base: number
  from?: boolean
  cat: string
  sub: string
  min: number
}

export interface ProductCat {
  name: string
  unit: string
  ml: number
  cost: number
}

export interface RetailCat {
  name: string
  price: number
}

export interface PayMethod {
  name: string
  sub: string
}

export type LineType = 'service' | 'product' | 'retail'

export interface ServiceLine {
  t: 'service'
  name: string
  base: number
  price: number
  qty: number
  from?: boolean
}
export interface ProductLine {
  t: 'product'
  name: string
  ml: number
  cost: number
  qty: number
}
export interface RetailLine {
  t: 'retail'
  name: string
  base: number
  price: number
  qty: number
}
export type Line = ServiceLine | ProductLine | RetailLine

export interface Appointment {
  id: string
  visit?: string
  client: string
  cid: string
  service: string
  min?: number
  staff: string
  time: string // "HH:MM"
  day?: number // 0-13 offset
  channel: string
  stage: StageKey
  total: number
  method?: string
  station?: string | null
  note?: string
  noShow?: boolean
  lines: Line[]
}

export interface DossierGroup {
  k: string
  fg: string
  items: string[]
}

export interface Client {
  id: string
  name: string
  phone: string
  since: string
  visits: number
  ltv: number
  tier: 'Gold' | 'Silver' | 'Bronze' | 'New'
  fav: string
  channel: string
  state: string
  next: string
  formula: string
  dossier: DossierGroup[]
  sees: string[]
}

export interface Notification {
  id: string
  kind: string
  to: string
  text: string
  t: string
  read: boolean
  dot: string
  roles: Role[]
}

export type MsgStatus = 'pending' | 'sent' | 'skipped'
export interface QueuedMessage {
  id: string
  type: string
  client: string
  ch: string
  when: string
  status: MsgStatus
  why: string
  body: string
}

export interface Decision {
  tag: string
  fg: string
  title: string
  body: string
  ev: string[]
  impact: string
  conf: string
}

export interface Perm {
  cap: string
  o: boolean | string
  m: boolean | string
  r: boolean | string
  s: boolean | string
}

export interface StockRaw {
  n: string
  b: string
  u: string
  ml: number
  on: number
  per: number
  cost: number
  use: number
  bench: string
}

export interface Variance {
  s: string
  p: string
  bench: number
  act: number
  mo: number
  note: string
}

export interface Thread {
  id: string
  ch: string
  who: string
  handle: string
  t: string
  unread: boolean
  intent: string
  msgs: { f: 'us' | 'them'; t: string; at: string }[]
  ai: string
  draft: string
}

/** Persisted across reloads (server-side / localStorage in the prototype). */
export interface PersistedState {
  apts: Appointment[]
  notifs: Notification[]
  msgs: QueuedMessage[]
  newClients: Client[]
  stockUsed: Record<string, number>
  retailSold: Record<string, number>
  ordered: string[]
  orderStep: Record<string, number>
}
