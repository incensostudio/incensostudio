import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, callDeskAuth } from './lib/supabase'
import type {
  Appointment, Client, DeskUser, LedgerDay, Method, Product, Service, Staff,
} from './lib/types'
import { dayMeta, staffFor, toMin, toTime } from './lib/format'

interface Data {
  staff: Staff[]
  services: Service[]
  products: Product[]
  clients: Client[]
  appointments: Appointment[]
  dayoff: Set<string> // `${date}:${staffId}`
  ledger: LedgerDay[]
}

const EMPTY: Data = {
  staff: [], services: [], products: [], clients: [], appointments: [],
  dayoff: new Set(), ledger: [],
}

interface Store extends Data {
  user: DeskUser | null
  ready: boolean
  loading: boolean
  toast: string | null
  showToast: (t: string) => void
  // auth
  login: (deskUserId: string, pin: string) => Promise<'ok' | 'invalid' | 'locked' | 'error'>
  logout: () => Promise<void>
  // helpers
  staffById: (id: string | null) => Staff | undefined
  isOff: (date: string, staffId: string) => boolean
  // mutations
  reloadAppointments: () => Promise<void>
  reloadLedger: () => Promise<void>
  reloadClients: () => Promise<void>
  checkInVisit: (ids: string[]) => Promise<void>
  takePayment: (apts: Appointment[], opts: { method: Method; tip: number; note: string }) => Promise<void>
  addServiceToVisit: (primary: Appointment, svc: Service) => Promise<void>
  addProductLine: (primary: Appointment, item: { name: string; price: number }) => Promise<void>
  removeExtra: (extraId: string) => Promise<void>
  updateExtraPrice: (extraId: string, price: number) => Promise<void>
  removeAppointment: (id: string) => Promise<void>
  updateAppointment: (id: string, patch: Partial<Appointment>) => Promise<void>
  moveVisit: (visitId: string, toDate: string, staffWarnCb?: () => void) => Promise<void>
  createBooking: (
    who: { clientId: string | null; name: string; phone: string; ig: string; tt: string; note: string },
    lines: { name: string; price: number; staff: string; date: string; time: string; dur: number }[],
  ) => Promise<void>
  toggleDayOff: (date: string, staffId: string) => Promise<void>
  saveClient: (id: string, patch: Partial<Client>) => Promise<void>
  createClient: (patch: Omit<Client, 'id'>) => Promise<Client | null>
  deleteClient: (id: string) => Promise<void>
  closeDay: (date: string) => Promise<void>
  reopenDay: (date: string) => Promise<void>
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside provider')
  return s
}

function newId(): string {
  return crypto.randomUUID()
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DeskUser | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Data>(EMPTY)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((t: string) => {
    setToast(t)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  // ---- loaders -------------------------------------------------------------
  const mapAppointments = (rows: any[]): Appointment[] =>
    rows.map((r) => ({
      id: r.id, visit_id: r.visit_id, client_id: r.client_id, client_name: r.client_name,
      phone: r.phone, service_name: r.service_name, price: r.price, staff_id: r.staff_id,
      date: r.date, time: r.time, duration_min: r.duration_min, stage: r.stage,
      method: r.method, tip: r.tip, note: r.note,
      extras: (r.appointment_extras || [])
        .slice()
        .sort((a: any, b: any) => a.sort - b.sort)
        .map((e: any) => ({ id: e.id, name: e.name, price: e.price, kind: e.kind })),
    }))

  const reloadAppointments = useCallback(async () => {
    const { data: rows } = await supabase
      .from('appointments')
      .select('*, appointment_extras(*)')
    setData((d) => ({ ...d, appointments: rows ? mapAppointments(rows) : [] }))
  }, [])

  const reloadClients = useCallback(async () => {
    const { data: rows } = await supabase.from('clients').select('*').order('name')
    setData((d) => ({ ...d, clients: (rows as Client[]) || [] }))
  }, [])

  const reloadLedger = useCallback(async () => {
    const { data: rows } = await supabase
      .from('ledger_days')
      .select('*, ledger_items(*)')
      .order('date', { ascending: false })
    const ledger: LedgerDay[] = (rows || []).map((r: any) => ({
      id: r.id, date: r.date, label: r.label, note: r.note, closed_at: r.closed_at,
      items: (r.ledger_items || []).slice().sort((a: any, b: any) => (a.time < b.time ? -1 : 1)),
    }))
    setData((d) => ({ ...d, ledger }))
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [staffR, svcR, prodR, cliR, aptR, offR, ledR] = await Promise.all([
      supabase.from('staff').select('*').order('sort'),
      supabase.from('services').select('*').order('sort'),
      supabase.from('products').select('*').order('sort'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('appointments').select('*, appointment_extras(*)'),
      supabase.from('day_off').select('date, staff_id'),
      supabase.from('ledger_days').select('*, ledger_items(*)').order('date', { ascending: false }),
    ])
    setData({
      staff: (staffR.data as Staff[]) || [],
      services: (svcR.data as Service[]) || [],
      products: (prodR.data as Product[]) || [],
      clients: (cliR.data as Client[]) || [],
      appointments: aptR.data ? mapAppointments(aptR.data) : [],
      dayoff: new Set((offR.data || []).map((r: any) => `${r.date}:${r.staff_id}`)),
      ledger: (ledR.data || []).map((r: any) => ({
        id: r.id, date: r.date, label: r.label, note: r.note, closed_at: r.closed_at,
        items: (r.ledger_items || []).slice().sort((a: any, b: any) => (a.time < b.time ? -1 : 1)),
      })),
    })
    setLoading(false)
  }, [])

  // ---- session restore -----------------------------------------------------
  useEffect(() => {
    let done = false
    ;(async () => {
      const { data: sess } = await supabase.auth.getSession()
      if (sess.session) {
        const { data: prof } = await supabase.rpc('my_profile')
        const me = Array.isArray(prof) ? prof[0] : prof
        if (me && !done) {
          setUser(me as DeskUser)
          await loadAll()
        }
      }
      if (!done) setReady(true)
    })()
    return () => { done = true }
  }, [loadAll])

  // ---- auth ----------------------------------------------------------------
  const login = useCallback<Store['login']>(async (deskUserId, pin) => {
    try {
      const { status, data: res } = await callDeskAuth({ action: 'login', deskUserId, pin })
      if (status === 429) return 'locked'
      if (status !== 200 || !res.session) return 'invalid'
      const { error } = await supabase.auth.setSession({
        access_token: res.session.access_token,
        refresh_token: res.session.refresh_token,
      })
      if (error) return 'error'
      setUser(res.user as DeskUser)
      await loadAll()
      return 'ok'
    } catch {
      return 'error'
    }
  }, [loadAll])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setData(EMPTY)
  }, [])

  // ---- helpers -------------------------------------------------------------
  const staffById = useCallback((id: string | null) => data.staff.find((s) => s.id === id), [data.staff])
  const isOff = useCallback((date: string, staffId: string) => data.dayoff.has(`${date}:${staffId}`), [data.dayoff])

  // ---- mutations -----------------------------------------------------------
  const checkInVisit = useCallback<Store['checkInVisit']>(async (ids) => {
    await supabase.from('appointments').update({ stage: 'arrived' }).in('id', ids)
    await reloadAppointments()
  }, [reloadAppointments])

  const takePayment = useCallback<Store['takePayment']>(async (apts, { method, tip, note }) => {
    for (let i = 0; i < apts.length; i++) {
      const a = apts[i]
      await supabase.from('appointments').update({
        stage: 'paid', method, tip: i === 0 ? tip : 0, note: note || a.note,
        paid_at: new Date().toISOString(),
      }).eq('id', a.id)
    }
    await reloadAppointments()
    await reloadClients()
  }, [reloadAppointments, reloadClients])

  const addServiceToVisit = useCallback<Store['addServiceToVisit']>(async (primary, svc) => {
    const kin = data.appointments.filter(
      (x) => x.visit_id === primary.visit_id && x.date === primary.date && x.stage !== 'cancelled',
    )
    const end = kin.reduce((m, x) => Math.max(m, toMin(x.time) + (x.duration_min || 60)), toMin(primary.time))
    const staff = staffFor(svc.category, primary.staff_id, data.staff, (id) => isOff(primary.date, id))
    await supabase.from('appointments').insert({
      id: newId(), visit_id: primary.visit_id, client_id: primary.client_id,
      client_name: primary.client_name, phone: primary.phone, service_name: svc.name,
      price: svc.price, staff_id: staff, date: primary.date, time: toTime(end),
      duration_min: svc.minutes || 60, stage: primary.stage === 'arrived' ? 'arrived' : 'booked',
      note: '',
    })
    await reloadAppointments()
    const st = data.staff.find((s) => s.id === staff)
    showToast(`${svc.name} added at ${toTime(end)} with ${st?.name || '—'} — one ticket for ${primary.client_name}`)
  }, [data.appointments, data.staff, isOff, reloadAppointments, showToast])

  const addProductLine = useCallback<Store['addProductLine']>(async (primary, item) => {
    await supabase.from('appointment_extras').insert({
      appointment_id: primary.id, name: item.name, price: item.price, kind: 'product',
      sort: (primary.extras?.length || 0) + 1,
    })
    await reloadAppointments()
    showToast(`${item.name} added to ${primary.client_name}'s ticket`)
  }, [reloadAppointments, showToast])

  const removeExtra = useCallback<Store['removeExtra']>(async (extraId) => {
    await supabase.from('appointment_extras').delete().eq('id', extraId)
    await reloadAppointments()
  }, [reloadAppointments])

  const updateExtraPrice = useCallback<Store['updateExtraPrice']>(async (extraId, price) => {
    await supabase.from('appointment_extras').update({ price }).eq('id', extraId)
    await reloadAppointments()
  }, [reloadAppointments])

  const removeAppointment = useCallback<Store['removeAppointment']>(async (id) => {
    await supabase.from('appointments').delete().eq('id', id)
    await reloadAppointments()
  }, [reloadAppointments])

  const updateAppointment = useCallback<Store['updateAppointment']>(async (id, patch) => {
    const db: any = {}
    if (patch.time !== undefined) db.time = patch.time
    if (patch.duration_min !== undefined) db.duration_min = patch.duration_min
    if (patch.staff_id !== undefined) db.staff_id = patch.staff_id
    if (patch.price !== undefined) db.price = patch.price
    if (patch.note !== undefined) db.note = patch.note
    if (patch.stage !== undefined) db.stage = patch.stage
    if (patch.date !== undefined) db.date = patch.date
    await supabase.from('appointments').update(db).eq('id', id)
    await reloadAppointments()
  }, [reloadAppointments])

  const moveVisit = useCallback<Store['moveVisit']>(async (visitId, toDate) => {
    await supabase.from('appointments').update({ date: toDate }).eq('visit_id', visitId)
    await reloadAppointments()
  }, [reloadAppointments])

  const createBooking = useCallback<Store['createBooking']>(async (who, lines) => {
    let clientId = who.clientId
    // create the client if new
    if (!clientId && who.name.trim()) {
      const existing = data.clients.find((c) => c.name.toLowerCase() === who.name.trim().toLowerCase())
      if (existing) clientId = existing.id
      else {
        const { data: c } = await supabase.from('clients').insert({
          name: who.name.trim(), phone: who.phone, instagram: who.ig, tiktok: who.tt, note: who.note,
        }).select().single()
        if (c) { clientId = (c as Client).id; await reloadClients() }
      }
    }
    const visit = newId()
    const rows = lines.map((l) => ({
      id: newId(), visit_id: visit, client_id: clientId, client_name: who.name.trim() || 'Walk-in',
      phone: who.phone, service_name: l.name, price: l.price, staff_id: l.staff,
      date: l.date, time: l.time, duration_min: l.dur, stage: 'booked', note: who.note || '',
    }))
    await supabase.from('appointments').insert(rows)
    await reloadAppointments()
    const dm = dayMeta(lines[0].date)
    showToast(`${lines.length === 1 ? '1 service' : lines.length + ' services'} booked for ${who.name.trim() || 'Walk-in'} — ${dm.wd} ${dm.num} ${dm.mon}`)
  }, [data.clients, reloadAppointments, reloadClients, showToast])

  const toggleDayOff = useCallback<Store['toggleDayOff']>(async (date, staffId) => {
    if (isOff(date, staffId)) {
      await supabase.from('day_off').delete().eq('date', date).eq('staff_id', staffId)
    } else {
      await supabase.from('day_off').insert({ date, staff_id: staffId })
    }
    const { data: rows } = await supabase.from('day_off').select('date, staff_id')
    setData((d) => ({ ...d, dayoff: new Set((rows || []).map((r: any) => `${r.date}:${r.staff_id}`)) }))
  }, [isOff])

  const saveClient = useCallback<Store['saveClient']>(async (id, patch) => {
    await supabase.from('clients').update(patch).eq('id', id)
    setData((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }, [])

  const createClient = useCallback<Store['createClient']>(async (patch) => {
    const { data: c } = await supabase.from('clients').insert(patch).select().single()
    if (c) await reloadClients()
    return (c as Client) || null
  }, [reloadClients])

  const deleteClient = useCallback<Store['deleteClient']>(async (id) => {
    await supabase.from('clients').delete().eq('id', id)
    await reloadClients()
  }, [reloadClients])

  const closeDay = useCallback<Store['closeDay']>(async (date) => {
    const paid = data.appointments.filter((a) => a.date === date && a.stage === 'paid')
    // group by visit
    const groups = new Map<string, Appointment[]>()
    paid.forEach((a) => {
      const arr = groups.get(a.visit_id) || []
      arr.push(a)
      groups.set(a.visit_id, arr)
    })
    const m = dayMeta(date)
    const { data: day } = await supabase.from('ledger_days').insert({
      date, label: `${m.wd} ${m.num} ${m.mon}`, note: '', closed_by: user?.id || null,
    }).select().single()
    if (!day) return
    const items: any[] = []
    let sort = 0
    for (const [, arr] of groups) {
      const first = arr.slice().sort((a, b) => (a.time < b.time ? -1 : 1))[0]
      const total = arr.reduce((s, x) => s + x.price + x.extras.reduce((q, e) => q + e.price, 0) + (x.tip || 0), 0)
      const staffNames = Array.from(new Set(arr.map((x) => staffById(x.staff_id)?.name || '—')))
      const services = arr.map((x) => x.service_name)
      items.push({
        ledger_day_id: (day as any).id, time: first.time, client: first.client_name,
        service: services.join(' + '), staff_name: staffNames.join(', '),
        method: first.method || 'Cash', total, sort: sort++,
      })
    }
    if (items.length) await supabase.from('ledger_items').insert(items)
    await reloadLedger()
    showToast(`Day closed — ${items.length} tickets written to the ledger`)
  }, [data.appointments, user, staffById, reloadLedger, showToast])

  const reopenDay = useCallback<Store['reopenDay']>(async (date) => {
    await supabase.from('ledger_days').delete().eq('date', date)
    await reloadLedger()
    showToast('Day reopened')
  }, [reloadLedger, showToast])

  const value = useMemo<Store>(() => ({
    ...data, user, ready, loading, toast, showToast,
    login, logout, staffById, isOff,
    reloadAppointments, reloadLedger, reloadClients,
    checkInVisit, takePayment, addServiceToVisit, addProductLine, removeExtra,
    updateExtraPrice, removeAppointment, updateAppointment, moveVisit, createBooking,
    toggleDayOff, saveClient, createClient, deleteClient, closeDay, reopenDay,
  }), [
    data, user, ready, loading, toast, showToast, login, logout, staffById, isOff,
    reloadAppointments, reloadLedger, reloadClients, checkInVisit, takePayment,
    addServiceToVisit, addProductLine, removeExtra, updateExtraPrice, removeAppointment,
    updateAppointment, moveVisit, createBooking, toggleDayOff, saveClient, createClient,
    deleteClient, closeDay, reopenDay,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
