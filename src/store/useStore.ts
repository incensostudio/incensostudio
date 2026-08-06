// ---------------------------------------------------------------------------
// The Incenso OS store. Mirrors the prototype's single state class:
// one flat state object, a generic patch()/save(), and the core action
// methods (bump / advance / moveApt / answer / resetDemo). Components call
// patch() for local session edits and save() for anything persisted.
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import type {
  Appointment,
  Client,
  Line,
  Notification,
  PersistedState,
  QueuedMessage,
  Role,
  StageKey,
  ViewKey,
} from '../data/types'
import { clients as seedClients, seedPersisted, stockKey } from '../data/fixtures'
import {
  aptMin,
  clientRebook,
  clock,
  dayCards,
  firstStation,
  freeAt,
  lineTotal,
  money,
  seedLines,
  st,
  svcParts,
  toMin,
} from '../lib/logic'
import { answerFor } from '../lib/ask'
import { clearLocal, clearRemote, loadLocal, loadRemote, saveLocal, saveRemote } from '../lib/persist'

type Tone = 'ok' | 'warn'
interface Toast {
  text: string
  tone: Tone
}
type Edit = { lines: Line[]; note: string; verify?: boolean }

export interface State extends PersistedState {
  // ---- session-only ----
  view: ViewKey
  role: Role
  edit: Edit | null
  station: string
  method: string
  tip: number

  // new-booking wizard
  nbSrcs: string[]
  nbQ: string
  nbClient: string | null
  nbNewOn: boolean
  nbNew: Record<string, string>
  nbNote: string
  nbSvcs: string[]
  nbSvcQ: string
  nbSvcCat: string
  nbPlan: Record<string, { staff?: string; start?: number | null }>
  nbDay: number
  nbConfirm: boolean
  nbRemind: boolean

  // panels & calendar
  notifTab: string
  calMode: 'day' | 'week'
  calDay: number
  calStaff: string
  calDrag: string | null
  calEdit: string | null
  calEditDay: number | null
  calEditStaff: string | null
  calEditTime: number | null
  ceQ: string
  ceCat: string
  ceErr: string

  // inbox / queue / ask
  inboxFilter: string
  thread: string
  readThreads: string[]
  threadDrafts: Record<string, string>
  threadSent: Record<string, { f: 'us'; t: string; at: string }[]>
  ruleDraft: string
  ownRules: string[]
  deskNote: string
  askThread: { who: 'you' | 'ai'; text: string }[]
  askQ: string
  msgFilter: string
  stockTab: string
  clientQ: string
  coQ: string

  // overlays
  notifOpen: boolean
  drawer: string | null
  activeId: string | null
  activeClient: string | null

  mindDone: string[]
  mindLater: string[]
  toast: Toast | null
  resetArm: boolean

  // ---- actions ----
  patch: (p: Partial<State> | ((s: State) => Partial<State>)) => void
  save: (p: Partial<State>) => void
  showToast: (text: string, tone?: Tone) => void
  go: (v: ViewKey) => void
  allClients: () => Client[]
  viewsFor: (role: Role) => ViewKey[]
  switchRole: (r: Role) => void
  advance: (id: string) => void
  bump: (id: string, stage: StageKey, extra?: Partial<Appointment>) => void
  moveApt: (id: string, patch: Partial<Appointment>) => void
  setLines: (lines: Line[]) => void
  answer: (q: string) => void
  openNew: () => void
  resetDemo: () => void
}

const persistedKeys: (keyof PersistedState)[] = [
  'apts',
  'notifs',
  'msgs',
  'newClients',
  'stockUsed',
  'retailSold',
  'ordered',
  'orderStep',
]

function persistedSlice(s: State): PersistedState {
  const out = {} as PersistedState
  for (const k of persistedKeys) (out as any)[k] = (s as any)[k]
  return out
}

function persist(s: State) {
  const slice = persistedSlice(s)
  saveLocal(slice)
  saveRemote(slice)
}

export const viewsFor = (role: Role): ViewKey[] => {
  const all: ViewKey[] = ['floor', 'calendar', 'inbox', 'queue', 'clients', 'portal', 'team', 'stock', 'retail', 'mind', 'finance']
  if (role === 'manager') return all.filter((v) => v !== 'finance')
  if (role === 'reception') return ['floor', 'calendar', 'inbox', 'queue', 'clients', 'portal']
  if (role === 'staff') return ['floor', 'calendar', 'clients', 'portal']
  return all
}

let toastTimer: ReturnType<typeof setTimeout> | null = null
let resetTimer: ReturnType<typeof setTimeout> | null = null

const sessionDefaults = {
  view: 'floor' as ViewKey,
  role: 'owner' as Role,
  edit: null,
  station: 'Station 2',
  method: 'Card',
  tip: 0,
  nbSrcs: [],
  nbQ: '',
  nbClient: null,
  nbNewOn: false,
  nbNew: {},
  nbNote: '',
  nbSvcs: [],
  nbSvcQ: '',
  nbSvcCat: 'All',
  nbPlan: {},
  nbDay: 0,
  nbConfirm: true,
  nbRemind: true,
  notifTab: 'notifs',
  calMode: 'day' as const,
  calDay: 0,
  calStaff: 'all',
  calDrag: null,
  calEdit: null,
  calEditDay: null,
  calEditStaff: null,
  calEditTime: null,
  ceQ: '',
  ceCat: 'All',
  ceErr: '',
  inboxFilter: 'all',
  thread: 't1',
  readThreads: [],
  threadDrafts: {},
  threadSent: {},
  ruleDraft: '',
  ownRules: [],
  deskNote: '',
  askThread: [],
  askQ: '',
  msgFilter: 'all',
  stockTab: 'levels',
  clientQ: '',
  coQ: '',
  notifOpen: false,
  drawer: null,
  activeId: null,
  activeClient: null,
  mindDone: [],
  mindLater: [],
  toast: null,
  resetArm: false,
}

export const useStore = create<State>((set, get) => ({
  ...seedPersisted(),
  ...sessionDefaults,

  patch: (p) => set(p as any),

  save: (p) => {
    set(p as any)
    persist(get())
  },

  showToast: (text, tone = 'ok') => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: { text, tone } })
    toastTimer = setTimeout(() => set({ toast: null }), 4200)
  },

  go: (v) => set({ view: v, drawer: null }),

  allClients: () => seedClients.concat(get().newClients || []),

  viewsFor,

  switchRole: (r) => {
    const s = get()
    if (s.role === r) return
    const ok = viewsFor(r)
    const names: Record<Role, string> = { owner: 'Owner', manager: 'Manager', reception: 'Reception', staff: 'Staff' }
    set({ role: r, view: ok.indexOf(s.view) >= 0 ? s.view : 'floor', drawer: null, notifOpen: false })
    get().showToast('Signed in as ' + names[r] + ' — the sidebar now shows only what this role can reach')
  },

  advance: (id) => {
    const s = get()
    const a = s.apts.find((x) => x.id === id)
    if (!a) return
    if (a.stage === 'booked') {
      return set({ drawer: 'checkin', activeId: id, station: firstStation(a.service) })
    }
    if (a.stage === 'reception') return get().bump(id, 'service')
    if (a.stage === 'service') return set({ drawer: 'checkout', activeId: id, coQ: '', edit: { lines: seedLines(a), note: '' } })
    if (a.stage === 'review')
      return set({ drawer: 'checkout', activeId: id, coQ: '', edit: { lines: seedLines(a), note: a.note || '', verify: true } })
    return set({ drawer: 'receipt', activeId: id })
  },

  bump: (id, stage, extra) => {
    const s = get()
    const apts = s.apts.map((a) => (a.id === id ? { ...a, stage, ...(extra || {}) } : a))
    const a = apts.find((x) => x.id === id)!
    const stf = st(a.staff)
    const c = get().allClients().find((x) => x.id === a.cid)
    const care = c && (c.dossier.find((g) => g.k === 'Care flags') || ({} as any)).items
    let n: Omit<Notification, 'id' | 't' | 'read'> | null = null
    if (stage === 'reception')
      n = {
        kind: 'Client incoming',
        to: stf.name,
        dot: '#6b7a4a',
        roles: ['owner', 'manager', 'staff'],
        text: a.client + ' checked in at reception — ' + a.service + ', ' + (s.station || 'station 2') + '.' + (care ? ' ' + care[0] : ''),
      }
    if (stage === 'service')
      n = { kind: 'In service', to: 'Reception', dot: '#3b4a7a', roles: ['owner', 'manager', 'reception'], text: stf.name + ' accepted ' + a.client + '. Timer running.' }
    if (stage === 'review') {
      const prods = (a.lines || []).filter((l) => l.t === 'product').length
      n = {
        kind: 'Checkout to approve',
        to: 'Reception',
        dot: '#7a3b5f',
        roles: ['owner', 'manager', 'reception'],
        text: stf.name + ' closed ' + a.client + ' — ' + money(lineTotal(a)) + ', ' + prods + ' product' + (prods === 1 ? '' : 's') + ' logged. Collect payment.',
      }
    }
    if (stage === 'paid')
      n = {
        kind: 'Payment',
        to: 'Owner',
        dot: '#000',
        roles: ['owner', 'manager', 'reception'],
        text: a.client + ' settled ' + money(a.total) + ' — ' + (a.method || 'Card') + '. Thank-you + portal link delivered.',
      }
    const notifs = n ? [{ id: 'n' + Date.now(), t: 'now', read: false, ...n } as Notification].concat(s.notifs) : s.notifs

    const ledger: Partial<PersistedState> = {}
    if (stage === 'paid') {
      const su = { ...(s.stockUsed || {}) }
      const rs = { ...(s.retailSold || {}) }
      ;(a.lines || []).forEach((l) => {
        if (l.t === 'product') {
          const k = stockKey[l.name] || l.name
          su[k] = (su[k] || 0) + (l.ml || 0) * (l.qty || 1)
        }
        if (l.t === 'retail') rs[l.name] = (rs[l.name] || 0) + (l.qty || 1)
      })
      ledger.stockUsed = su
      ledger.retailSold = rs
    }
    get().save({ apts, notifs, drawer: null, activeId: null, edit: null, ...ledger } as Partial<State>)

    const said: Record<string, string> = {
      reception: a.client + ' is checked in at ' + (s.station || 'her station') + ' · ' + stf.name + ' has been told',
      service: stf.name + ' has ' + a.client + ' in the chair — timer running',
      review: 'Ticket closed for ' + a.client + ' — waiting at reception now, nothing charged yet',
      paid: a.client + ' settled ' + money(a.total) + ' · receipt sent, her portal is live, stock and retail updated',
    }
    if (said[stage]) get().showToast(said[stage])
  },

  moveApt: (id, patchObj) => {
    const apts = get().apts.map((a) => (a.id === id ? { ...a, ...patchObj } : a))
    get().save({ apts })
  },

  setLines: (lines) => {
    const e = get().edit || { lines: [], note: '' }
    set({ edit: { ...e, lines } })
  },

  answer: (q) => {
    if (!q) return
    const a = answerFor(q)
    const th = (get().askThread || []).concat([
      { who: 'you', text: q },
      { who: 'ai', text: a },
    ])
    set({ askThread: th, askQ: '' })
  },

  openNew: () =>
    set({
      drawer: 'newbooking',
      nbSrcs: [],
      nbQ: '',
      nbNote: '',
      nbClient: null,
      nbNewOn: false,
      nbNew: {},
      nbSvcs: [],
      nbSvcQ: '',
      nbSvcCat: 'All',
      nbPlan: {},
      nbDay: 0,
      nbConfirm: true,
      nbRemind: true,
    }),

  resetDemo: () => {
    const s = get()
    if (!s.resetArm) {
      set({ resetArm: true })
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => set({ resetArm: false }), 4000)
      get().showToast('This clears every booking, message and note you have changed. Tap again to confirm.', 'warn')
      return
    }
    if (resetTimer) clearTimeout(resetTimer)
    clearLocal()
    clearRemote()
    set({
      ...seedPersisted(),
      newClients: [],
      threadSent: {},
      threadDrafts: {},
      readThreads: [],
      mindDone: [],
      mindLater: [],
      ownRules: [],
      askThread: [],
      resetArm: false,
      drawer: null,
      activeId: null,
      edit: null,
      view: 'floor',
    })
    persist(get())
    get().showToast('Back to a clean Friday morning')
  },
}))

/** Hydrate the store from local (instant) then remote (if configured). */
export async function hydrate() {
  const local = loadLocal()
  if (local) useStore.setState(local as Partial<State>)
  const remote = await loadRemote()
  if (remote) {
    useStore.setState(remote as Partial<State>)
    saveLocal(persistedSlice(useStore.getState()))
  }
}

// Convenience exports used across views.
export { dayCards, freeAt, aptMin, toMin, clock, svcParts, clientRebook }
