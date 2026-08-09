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
  login: (deskUserId: string, pin: string) => Promise<'ok' | 'invalid' | 'locked' | 'error'>
  logout: () => Promise<void>
  staffById: (id: string | null) => Staff | undefined
  isOff: (date: string, staffId: string) => boolean
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
  moveVisit: (visitId: string, toDate: string) => Promise<void>
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

const newId = (): string => crypto.randomUUID()

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
        .slice().sort((a: any, b: any) => a.sort - b.sort)
        .map((e: any) => ({ id: e.id, name: e.name, price: e.price, kind: e.kind })),
    }))

  const reloadAppointments = useCallback(async () => {
    const { data: rows } = await supabase.from('appointments').select('*, appointment_extras(*)')
    if (rows) setData((d) => ({ ...d, appointments: mapAppointments(rows) }))
  }, [])

  const reloadClients = useCallback(async () => {
    const { data: rows } = await supabase.from('clients').select('*').order('name')
    if (rows) setData((d) => ({ ...d, clients: rows as Client[] }))
  }, [])

  const reloadLedger = useCallback(async () => {
    const { data: rows } = await supabase.from('ledger_days').select('*, ledger_items(*)').order('date', { ascending: false })
    if (rows) setData((d) => ({
      ...d,
      ledger: rows.map((r: any) => ({
        id: r.id, date: r.date, label: r.label, note: r.note, closed_at: r.closed_at,
        items: (r.ledger_items || []).slice().sort((a: any, b: any) => (a.time < b.time ? -1 : 1)),
      })),
    }))
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

  // ---- background persistence with resync-on-error -------------------------
  // Mutations update local state immediately (instant UI); the DB write runs in
  // the background. If a write fails, we resync from the server so nothing drifts.
  const persist = useCallback((p: PromiseLike<{ error: unknown }>, resync?: () => void) => {
    Promise.resolve(p)
      .then((res: any) => {
        if (res && res.error) {
          showToast('Could not save — refreshing')
          ;(resync || reloadAppointments)()
        }
      })
      .catch(() => (resync || reloadAppointments)())
  }, [showToast, reloadAppointments])

  const setApts = useCallback((fn: (a: Appointment[]) => Appointment[]) =>
    setData((d) => ({ ...d, appointments: fn(d.appointments) })), [])

  // ---- session restore -----------------------------------------------------
  useEffect(() => {
    let done = false
    ;(async () => {
      const { data: sess } = await supabase.auth.getSession()
      if (sess.session) {
        const { data: prof } = await supabase.rpc('my_profile')
        const me = Array.isArray(prof) ? prof[0] : prof
        if (me && !done) { setUser(me as DeskUser); await loadAll() }
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
        access_token: res.session.access_token, refresh_token: res.session.refresh_token,
      })
      if (error) return 'error'
      setUser(res.user as DeskUser)
      await loadAll()
      return 'ok'
    } catch { return 'error' }
  }, [loadAll])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setData(EMPTY)
  }, [])

  // ---- helpers -------------------------------------------------------------
  const staffById = useCallback((id: string | null) => data.staff.find((s) => s.id === id), [data.staff])
  const isOff = useCallback((date: string, staffId: string) => data.dayoff.has(`${date}:${staffId}`), [data.dayoff])

  // ---- mutations (optimistic) ----------------------------------------------
  const checkInVisit = useCallback<Store['checkInVisit']>(async (ids) => {
    setApts((a) => a.map((x) => (ids.includes(x.id) ? { ...x, stage: 'arrived' } : x)))
    persist(supabase.from('appointments').update({ stage: 'arrived' }).in('id', ids))
  }, [setApts, persist])

  const takePayment = useCallback<Store['takePayment']>(async (apts, { method, tip, note }) => {
    const ids = apts.map((a) => a.id)
    setApts((a) => a.map((x) => {
      const i = ids.indexOf(x.id)
      return i >= 0 ? { ...x, stage: 'paid', method, tip: i === 0 ? tip : 0, note: note || x.note } : x
    }))
    const nowIso = new Date().toISOString()
    apts.forEach((a, i) => persist(
      supabase.from('appointments').update({
        stage: 'paid', method, tip: i === 0 ? tip : 0, note: note || a.note, paid_at: nowIso,
      }).eq('id', a.id),
    ))
  }, [setApts, persist])

  const addServiceToVisit = useCallback<Store['addServiceToVisit']>(async (primary, svc) => {
    const kin = data.appointments.filter(
      (x) => x.visit_id === primary.visit_id && x.date === primary.date && x.stage !== 'cancelled',
    )
    const end = kin.reduce((m, x) => Math.max(m, toMin(x.time) + (x.duration_min || 60)), toMin(primary.time))
    const staff = staffFor(svc.category, primary.staff_id, data.staff, (id) => isOff(primary.date, id))
    const na: Appointment = {
      id: newId(), visit_id: primary.visit_id, client_id: primary.client_id, client_name: primary.client_name,
      phone: primary.phone, service_name: svc.name, price: svc.price, staff_id: staff,
      date: primary.date, time: toTime(end), duration_min: svc.minutes || 60,
      stage: primary.stage === 'arrived' ? 'arrived' : 'booked', method: null, tip: 0, note: '', extras: [],
    }
    setApts((a) => [...a, na])
    persist(supabase.from('appointments').insert({
      id: na.id, visit_id: na.visit_id, client_id: na.client_id, client_name: na.client_name,
      phone: na.phone, service_name: na.service_name, price: na.price, staff_id: na.staff_id,
      date: na.date, time: na.time, duration_min: na.duration_min, stage: na.stage, note: '',
    }))
    const st = data.staff.find((s) => s.id === staff)
    showToast(`${svc.name} added at ${na.time} with ${st?.name || '—'} — one ticket for ${primary.client_name}`)
  }, [data.appointments, data.staff, isOff, setApts, persist, showToast])

  const addProductLine = useCallback<Store['addProductLine']>(async (primary, item) => {
    const id = newId()
    setApts((a) => a.map((x) => (x.id === primary.id
      ? { ...x, extras: [...x.extras, { id, name: item.name, price: item.price, kind: 'product' as const }] } : x)))
    persist(supabase.from('appointment_extras').insert({
      id, appointment_id: primary.id, name: item.name, price: item.price, kind: 'product',
      sort: (primary.extras?.length || 0) + 1,
    }))
    showToast(`${item.name} added to ${primary.client_name}'s ticket`)
  }, [setApts, persist, showToast])

  const removeExtra = useCallback<Store['removeExtra']>(async (extraId) => {
    setApts((a) => a.map((x) => ({ ...x, extras: x.extras.filter((e) => e.id !== extraId) })))
    persist(supabase.from('appointment_extras').delete().eq('id', extraId))
  }, [setApts, persist])

  const updateExtraPrice = useCallback<Store['updateExtraPrice']>(async (extraId, price) => {
    setApts((a) => a.map((x) => ({ ...x, extras: x.extras.map((e) => (e.id === extraId ? { ...e, price } : e)) })))
    persist(supabase.from('appointment_extras').update({ price }).eq('id', extraId))
  }, [setApts, persist])

  const removeAppointment = useCallback<Store['removeAppointment']>(async (id) => {
    setApts((a) => a.filter((x) => x.id !== id))
    persist(supabase.from('appointments').delete().eq('id', id))
  }, [setApts, persist])

  const updateAppointment = useCallback<Store['updateAppointment']>(async (id, patch) => {
    setApts((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const db: any = {}
    for (const k of ['time', 'duration_min', 'staff_id', 'price', 'note', 'stage', 'date'] as const) {
      if (patch[k] !== undefined) db[k] = patch[k]
    }
    persist(supabase.from('appointments').update(db).eq('id', id))
  }, [setApts, persist])

  const moveVisit = useCallback<Store['moveVisit']>(async (visitId, toDate) => {
    setApts((a) => a.map((x) => (x.visit_id === visitId ? { ...x, date: toDate } : x)))
    persist(supabase.from('appointments').update({ date: toDate }).eq('visit_id', visitId))
  }, [setApts, persist])

  const createBooking = useCallback<Store['createBooking']>(async (who, lines) => {
    let clientId = who.clientId
    const trimmed = who.name.trim()
    if (!clientId && trimmed) {
      const existing = data.clients.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
      if (existing) clientId = existing.id
      else {
        clientId = newId()
        const nc: Client = { id: clientId, name: trimmed, phone: who.phone, instagram: who.ig, tiktok: who.tt, note: who.note }
        setData((d) => ({ ...d, clients: [...d.clients, nc].sort((a, b) => a.name.localeCompare(b.name)) }))
        persist(supabase.from('clients').insert(nc), reloadClients)
      }
    }
    const visit = newId()
    const rows = lines.map((l) => ({
      id: newId(), visit_id: visit, client_id: clientId, client_name: trimmed || 'Walk-in',
      phone: who.phone, service_name: l.name, price: l.price, staff_id: l.staff,
      date: l.date, time: l.time, duration_min: l.dur, stage: 'booked' as const, note: who.note || '',
    }))
    setApts((a) => [...a, ...rows.map((r) => ({ ...r, method: null, tip: 0, extras: [] }))])
    persist(supabase.from('appointments').insert(rows))
    const dm = dayMeta(lines[0].date)
    showToast(`${lines.length === 1 ? '1 service' : lines.length + ' services'} booked for ${trimmed || 'Walk-in'} — ${dm.wd} ${dm.num} ${dm.mon}`)
  }, [data.clients, setApts, persist, reloadClients, showToast])

  const toggleDayOff = useCallback<Store['toggleDayOff']>(async (date, staffId) => {
    const key = `${date}:${staffId}`
    const currentlyOff = data.dayoff.has(key)
    setData((d) => {
      const next = new Set(d.dayoff)
      if (currentlyOff) next.delete(key); else next.add(key)
      return { ...d, dayoff: next }
    })
    if (currentlyOff) persist(supabase.from('day_off').delete().eq('date', date).eq('staff_id', staffId), () => {})
    else persist(supabase.from('day_off').insert({ date, staff_id: staffId }), () => {})
  }, [data.dayoff, persist])

  const saveClient = useCallback<Store['saveClient']>(async (id, patch) => {
    setData((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
    persist(supabase.from('clients').update(patch).eq('id', id), reloadClients)
  }, [persist, reloadClients])

  const createClient = useCallback<Store['createClient']>(async (patch) => {
    const c: Client = { id: newId(), ...patch }
    setData((d) => ({ ...d, clients: [...d.clients, c].sort((a, b) => a.name.localeCompare(b.name)) }))
    persist(supabase.from('clients').insert(c), reloadClients)
    return c
  }, [persist, reloadClients])

  const deleteClient = useCallback<Store['deleteClient']>(async (id) => {
    setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }))
    persist(supabase.from('clients').delete().eq('id', id), reloadClients)
  }, [persist, reloadClients])

  const closeDay = useCallback<Store['closeDay']>(async (date) => {
    const paid = data.appointments.filter((a) => a.date === date && a.stage === 'paid')
    const groups = new Map<string, Appointment[]>()
    paid.forEach((a) => { const arr = groups.get(a.visit_id) || []; arr.push(a); groups.set(a.visit_id, arr) })
    const m = dayMeta(date)
    const dayId = newId()
    const items = Array.from(groups.values()).map((arr, idx) => {
      const first = arr.slice().sort((a, b) => (a.time < b.time ? -1 : 1))[0]
      const total = arr.reduce((s, x) => s + x.price + x.extras.reduce((q, e) => q + e.price, 0) + (x.tip || 0), 0)
      const staffNames = Array.from(new Set(arr.map((x) => staffById(x.staff_id)?.name || '—')))
      return {
        id: newId(), ledger_day_id: dayId, time: first.time, client: first.client_name,
        service: arr.map((x) => x.service_name).join(' + '), staff_name: staffNames.join(', '),
        method: (first.method || 'Cash') as Method, total, sort: idx,
      }
    })
    const day: LedgerDay = {
      id: dayId, date, label: `${m.wd} ${m.num} ${m.mon}`, note: '',
      closed_at: new Date().toISOString(),
      items: items.map(({ time, client, service, staff_name, method, total }) => ({ time, client, service, staff_name, method, total })),
    }
    setData((d) => ({ ...d, ledger: [day, ...d.ledger].sort((a, b) => (a.date < b.date ? 1 : -1)) }))
    persist(supabase.from('ledger_days').insert({ id: dayId, date, label: day.label, note: '', closed_by: user?.id || null }), reloadLedger)
    if (items.length) persist(supabase.from('ledger_items').insert(items), reloadLedger)
    showToast(`Day closed — ${items.length} ${items.length === 1 ? 'ticket' : 'tickets'} written to the ledger`)
  }, [data.appointments, user, staffById, persist, reloadLedger, showToast])

  const reopenDay = useCallback<Store['reopenDay']>(async (date) => {
    setData((d) => ({ ...d, ledger: d.ledger.filter((x) => x.date !== date) }))
    persist(supabase.from('ledger_days').delete().eq('date', date), reloadLedger)
    showToast('Day reopened')
  }, [persist, reloadLedger, showToast])

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
