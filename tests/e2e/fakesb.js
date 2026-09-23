/* Strict fake Supabase (PostgREST + Auth + Storage) for end-to-end tests.
   It mirrors the LIVE project's rules so a write that would fail in production fails here:
   unknown columns (PGRST204), NOT NULL (23502), unique indexes (23505), identity ALWAYS (428C9),
   bad types (22P02/22007), row-level security per table (42501), the BEFORE triggers and the RPCs.
   Every request is recorded so tests can assert on, and replay, the exact writes. */
const http = require('http');
const crypto = require('crypto');
const SCHEMA = require('./schema');

const digits = (p) => String(p || '').replace(/\D/g, '');
const clone = (x) => JSON.parse(JSON.stringify(x));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class PgErr extends Error { constructor(code, message, status) { super(message); this.code = code; this.status = status || (code === '42501' ? 403 : code === 'PGRST116' ? 406 : 400); } }

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (claims) => b64u({ alg: 'HS256', typ: 'JWT' }) + '.' + b64u(claims) + '.' + 'sig';

function createFake() {
  const tables = {}; Object.keys(SCHEMA).forEach((t) => { tables[t] = []; });
  tables.ref_counters = [];
  const users = {};           // uid -> { id, phone }
  const tokens = {};          // access token -> uid
  const objects = {};         // 'bucket/path' -> { type, body }
  const log = [];             // every request { method, path, table, body, status, error }
  const faults = [];          // injected failures: { match(req) -> bool, status, body, times }
  const seq = {};             // identity sequences

  // ---------------- auth ----------------
  const addUser = (phone, opts) => {
    const id = (opts && opts.id) || crypto.randomUUID();
    users[id] = { id, phone: digits(phone) };
    const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
    const access_token = jwt({ sub: id, role: 'authenticated', phone: digits(phone), exp, aud: 'authenticated', aal: 'aal1', session_id: crypto.randomUUID() });
    tokens[access_token] = id;
    const user = { id, aud: 'authenticated', role: 'authenticated', phone: digits(phone), app_metadata: { provider: 'phone' }, user_metadata: {}, created_at: new Date().toISOString() };
    return { id, user, session: { access_token, refresh_token: 'r-' + id, token_type: 'bearer', expires_in: 86400 * 30, expires_at: exp, user } };
  };
  const ctxOf = (req) => {
    const h = req.headers.authorization || '';
    const tok = h.replace(/^Bearer\s+/i, '');
    const uid = tokens[tok] || null;
    const phone = uid ? users[uid].phone : '';
    const desk = !!uid && tables.desk_users.some((d) => d.active !== false && digits(d.phone) && digits(d.phone) === phone);
    return { role: uid ? 'authenticated' : 'anon', uid, phone, desk };
  };

  // ---------------- RLS (mirrors pg_policies) ----------------
  const D = (r, c) => c.desk;
  const own = (col) => (r, c) => c.desk || (!!c.uid && r[col] === c.uid);
  const FIN = ['fixedCosts', 'openingBalance', 'payTo', 'transferHoursBy'];
  const profilePhone = (uid) => { const p = tables.profiles.find((x) => x.id === uid); return p ? digits(p.phone) : ''; };
  const RLS = {
    bookings: { all: own('user_id') }, orders: { all: own('user_id') },
    gift_cards: {
      select: (r, c) => c.desk || (!!c.uid && (r.buyer_id === c.uid || (r.confirmed && r.to_phone && profilePhone(c.uid) && profilePhone(c.uid) === digits(r.to_phone)))),
      insert: (r, c) => c.desk || (!!c.uid && r.buyer_id === c.uid), update: D, delete: D,
    },
    newsletter: { select: D, insert: () => true, update: D, delete: D },
    profiles: { all: (r, c) => c.desk || (!!c.uid && r.id === c.uid), delete: D },
    ref_counters: { select: D, insert: () => false, update: () => false, delete: () => false },
    restock_requests: { all: (r, c) => !!c.uid && r.user_id === c.uid },
    web_categories: { select: () => true, insert: D, update: D, delete: D },
    web_services: { select: () => true, insert: D, update: D, delete: D },
    web_config: { select: (r, c) => c.desk || !FIN.includes(r.key), insert: D, update: D, delete: D },
    web_products: { select: (r, c) => c.desk || r.active === true, insert: D, update: D, delete: D },
    wa_log: { select: D, insert: () => false, update: () => false, delete: () => false },
  };
  const pol = (t, op) => { const p = RLS[t] || { all: D }; return p[op] || p.all || D; };

  // ---------------- triggers (mirrors live BEFORE triggers) ----------------
  const TRIG = {
    gift_cards: {
      insert: (row, c) => {
        // web_gift_sanitize(): a signed-in customer can only ever create an unpaid reservation for themselves.
        if (c.role === 'authenticated' && !(fake.giftSanitizeSkipsDesk && c.desk)) {
          row.buyer_id = c.uid; row.status = 'Reserved'; row.confirmed = false; row.balance = row.amount;
          row.redemptions = []; row.created_at = new Date().toISOString();
          row.expires_at = new Date(Date.now() + 365 * 864e5).toISOString();
        }
      },
    },
    bookings: {
      update: (nw, old) => { if (nw.pay_status === 'paid' && (old.pay_status || '') !== 'paid' && /await/i.test(nw.status || '')) nw.status = 'Upcoming'; },
    },
    orders: {
      update: (nw, old) => {
        if (/collect/i.test(nw.status || '') && (nw.pay_status || '') === 'due') nw.pay_status = 'paid';
        if (nw.pay_status === 'paid' && (old.pay_status || '') !== 'paid' && /await/i.test(nw.status || '')) nw.status = nw.method === 'Shipped' ? 'Paid · preparing' : 'Ready for pickup';
      },
    },
  };

  // ---------------- values & constraints ----------------
  const defaults = {
    uuid: () => crypto.randomUUID(), now: () => new Date().toISOString(),
  };
  const defaultFor = (t, col, type) => {
    if (col === 'id' && type === 'u') return defaults.uuid();
    if (/_at$|^at$|^added$|^date$/.test(col) && (type === 't')) return defaults.now();
    if (t === 'gift_cards' && col === 'expires_at') return new Date(Date.now() + 365 * 864e5).toISOString();
    if (type === 'j') return (/^(flags|drink|address|prefs|gift)$/.test(col) ? {} : []);
    if (type === 'a') return [];
    if (type === 'b') return col === 'active' || col === 'off' ? (col === 'active') : false;
    if (type === 'i' || type === 'n') return 0;
    if (t === 'gift_cards' && col === 'status') return 'Active';
    if (t === 'bookings' && col === 'status') return 'Upcoming';
    if (t === 'orders' && col === 'status') return 'Placed';
    if (t === 'profiles' && col === 'tier') return 'Member';
    if (t === 'desk_users' && col === 'colour') return '#444';
    return type === 's' ? '' : null;
  };
  const checkType = (t, col, type, v) => {
    if (v === null || v === undefined) return v;
    const bad = (code, msg) => { throw new PgErr(code || '22P02', msg || `invalid input syntax for type ${type} (column "${col}" of "${t}"): "${String(typeof v === 'object' ? JSON.stringify(v) : v).slice(0, 60)}"`); };
    switch (type) {
      case 'u': if (typeof v !== 'string' || !UUID.test(v)) bad(); return v.toLowerCase();
      case 'i': { const n = typeof v === 'string' && /^-?\d+$/.test(v.trim()) ? Number(v) : v; if (typeof n !== 'number' || !Number.isInteger(n)) bad(); return n; }
      case 'n': { const n = typeof v === 'string' && v.trim() !== '' && !isNaN(v) ? Number(v) : v; if (typeof n !== 'number' || !isFinite(n)) bad(); return n; }
      case 'b': if (typeof v !== 'boolean') { if (v === 'true' || v === 'false') return v === 'true'; bad(); } return v;
      case 'd': if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(v) || isNaN(Date.parse(v.slice(0, 10)))) bad('22007', `invalid input syntax for type date: "${v}" (column "${col}" of "${t}")`); return v.slice(0, 10);
      case 't': if (typeof v !== 'string' && typeof v !== 'number') bad(); if (v === '' || isNaN(new Date(v).getTime())) bad('22007', `invalid input syntax for type timestamp with time zone: "${v}" (column "${col}" of "${t}")`); return new Date(v).toISOString();
      case 'a': if (!Array.isArray(v)) bad('22P02', `malformed array literal (column "${col}" of "${t}"): "${JSON.stringify(v).slice(0, 60)}"`); return v;
      case 'j': return clone(v);
      default: return typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
  };
  const sch = (t) => { const s = SCHEMA[t]; if (!s) throw new PgErr('42P01', `relation "public.${t}" does not exist`, 404); return s; };
  const constraintName = (t, cols) => t + '_' + cols.join('_') + (cols.join() === 'id' || (t === 'gift_cards' && cols.join() === 'code') || (t === 'web_config' && cols.join() === 'key') || (t === 'web_categories' && cols.join() === 'name') ? '_pkey' : '_key');
  const keyOf = (row, cols) => JSON.stringify(cols.map((c) => row[c]));
  // foreign keys (live pg_constraint)
  const FK = { bookings: [['user_id', 'profiles', 'id']], orders: [['user_id', 'profiles', 'id']], gift_cards: [['buyer_id', 'profiles', 'id']], restock_requests: [['user_id', 'profiles', 'id']], purchase_orders: [['supplier_id', 'suppliers', 'id']] };
  const checkRow = (t, row, all, self) => {
    const s = sch(t);
    (FK[t] || []).forEach(([c, rt, rc]) => { if (row[c] != null && !tables[rt].some((r) => r[rc] === row[c])) throw new PgErr('23503', `insert or update on table "${t}" violates foreign key constraint "${t}_${c}_fkey"`); });
    if (t === 'profiles' && !users[row.id]) throw new PgErr('23503', 'insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"');
    for (const [c, f] of Object.entries(s.cols)) if ((row[c] === null || row[c] === undefined) && f.flag !== '?' && f.flag !== '*') throw new PgErr('23502', `null value in column "${c}" of relation "${t}" violates not-null constraint`);
    for (const u of s.unique) {
      if (u.some((c) => row[c] == null)) continue;
      const k = keyOf(row, u);
      if (all.some((o) => o !== self && keyOf(o, u) === k)) throw new PgErr('23505', `duplicate key value violates unique constraint "${constraintName(t, u)}"`);
    }
  };
  // Build the proposed tuple exactly like PostgREST: listed columns take the payload value (missing -> NULL,
  // or DEFAULT with Prefer missing=default); unlisted columns take their default.
  const buildRow = (t, obj, columns, missingDefault) => {
    const s = sch(t); const row = {};
    for (const k of Object.keys(obj)) if (!s.cols[k]) throw new PgErr('PGRST204', `Could not find the '${k}' column of '${t}' in the schema cache`);
    for (const k of columns) if (!s.cols[k]) throw new PgErr('PGRST204', `Could not find the '${k}' column of '${t}' in the schema cache`);
    for (const [c, f] of Object.entries(s.cols)) {
      const listed = columns.includes(c);
      if (f.flag === 'A' && listed) throw new PgErr('428C9', `cannot insert a non-DEFAULT value into column "${c}"`);
      if (listed && (c in obj) ) row[c] = checkType(t, c, f.type, obj[c]);
      else if (listed && !missingDefault) row[c] = null;
      else if (f.flag === 'A' || f.flag === 'B') { seq[t] = (seq[t] || Math.max(0, ...tables[t].map((r) => Number(r[c]) || 0))) + 1; row[c] = seq[t]; }
      else row[c] = (f.flag === '~' || f.flag === '*') ? defaultFor(t, c, f.type) : null;
    }
    return row;
  };

  // ---------------- PostgREST query parsing ----------------
  const parseVal = (v) => (v === 'null' ? null : v === 'true' ? true : v === 'false' ? false : v);
  const splitList = (s) => { const out = []; let cur = '', q = false; for (const ch of s) { if (ch === '"') { q = !q; continue; } if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
  const matchOne = (row, col, expr) => {
    const m = /^(not\.)?(eq|neq|gt|gte|lt|lte|in|is|like|ilike|cs)\.(.*)$/s.exec(expr); if (!m) throw new PgErr('PGRST100', 'unsupported filter ' + col + '=' + expr);
    const [, neg, op, raw] = m; const v = row[col]; let r;
    const cmp = (a, b) => { if (a == null) return NaN; const na = Number(a), nb = Number(b); return (!isNaN(na) && !isNaN(nb) && typeof a !== 'string') ? na - nb : String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0; };
    switch (op) {
      case 'eq': r = v != null && String(v) === raw; break;
      case 'neq': r = v != null && String(v) !== raw; break;
      case 'gt': r = cmp(v, raw) > 0; break; case 'gte': r = cmp(v, raw) >= 0; break;
      case 'lt': r = cmp(v, raw) < 0; break; case 'lte': r = cmp(v, raw) <= 0; break;
      case 'in': { const list = splitList(raw.replace(/^\(|\)$/g, '')); r = v != null && list.includes(String(v)); break; }
      case 'is': r = raw === 'null' ? v == null : v === parseVal(raw); break;
      case 'like': case 'ilike': { const re = new RegExp('^' + raw.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*%]/g, '.*') + '$', op === 'ilike' ? 'i' : ''); r = v != null && re.test(String(v)); break; }
      case 'cs': r = Array.isArray(v) && JSON.parse(raw.replace(/^\{/, '[').replace(/\}$/, ']')).every((x) => v.includes(x)); break;
    }
    return neg ? !r : r;
  };
  const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);
  const filtersOf = (q) => [...q.entries()].filter(([k]) => !RESERVED.has(k));
  const applyFilters = (rows, q) => rows.filter((r) => filtersOf(q).every(([k, v]) => matchOne(r, k, v)));
  const project = (rows, sel) => { if (!sel || sel === '*') return rows.map(clone); const cols = sel.split(',').map((s) => s.trim()).filter(Boolean); return rows.map((r) => { const o = {}; cols.forEach((c) => { if (c === '*') Object.assign(o, clone(r)); else { const [name, alias] = c.includes(':') ? c.split(':').reverse() : [c, c]; o[alias] = clone(r[name]); } }); return o; }); };
  const order = (rows, spec) => { if (!spec) return rows; const parts = spec.split(',').map((p) => { const [c, dir] = p.split('.'); return { c, d: dir === 'desc' ? -1 : 1 }; }); return rows.slice().sort((a, b) => { for (const { c, d } of parts) { if (a[c] === b[c]) continue; if (a[c] == null) return 1; if (b[c] == null) return -1; return (a[c] < b[c] ? -1 : 1) * d; } return 0; }); };

  const VIEWS = { web_staff_public: { from: 'web_staff', cols: ['id', 'name', 'cats', 'role', 'accent', 'bio', 'photo_url', 'sort', 'active'] } };

  // ---------------- REST handlers ----------------
  const selectRows = (t, q, c) => {
    if (VIEWS[t]) { const v = VIEWS[t]; const rows = tables[v.from].map((r) => { const o = {}; v.cols.forEach((k) => { o[k] = r[k]; }); return o; }); return applyFilters(rows, q); }
    sch(t);
    return applyFilters(tables[t].filter((r) => pol(t, 'select')(r, c)), q);
  };
  const doInsert = (t, body, q, prefer, c) => {
    const arr = Array.isArray(body) ? body : [body];
    const columns = q.get('columns') ? splitList(q.get('columns')) : [...new Set(arr.flatMap((o) => Object.keys(o)))];
    const missingDefault = /missing=default/.test(prefer);
    const merge = /resolution=merge-duplicates/.test(prefer), ignore = /resolution=ignore-duplicates/.test(prefer);
    const target = q.get('on_conflict') ? q.get('on_conflict').split(',') : sch(t).unique[0];
    const work = clone(tables[t]); const out = [];
    for (const obj of arr) {
      const row = buildRow(t, obj, columns, missingDefault);
      if (TRIG[t] && TRIG[t].insert) TRIG[t].insert(row, c);
      // NOT NULL is checked on the proposed row even when it will conflict (Postgres behaviour).
      for (const [col, f] of Object.entries(sch(t).cols)) if (row[col] == null && f.flag !== '?' && f.flag !== '*') throw new PgErr('23502', `null value in column "${col}" of relation "${t}" violates not-null constraint`);
      // Postgres: INSERT … ON CONFLICT (arbiter) needs the row to pass the SELECT policy too (live-verified: anon newsletter upsert → 42501).
      if ((merge || ignore) && !pol(t, 'select')(row, c)) throw new PgErr('42501', `new row violates row-level security policy for table "${t}"`);
      const ex = (merge || ignore) ? work.find((r) => keyOf(r, target) === keyOf(row, target)) : null;
      if (ex) {
        if (ignore) continue;
        if (!pol(t, 'select')(ex, c) || !pol(t, 'update')(ex, c)) throw new PgErr('42501', `new row violates row-level security policy (USING expression) for table "${t}"`);
        const old = clone(ex); columns.forEach((col) => { if (!target.includes(col)) ex[col] = row[col]; });
        if (TRIG[t] && TRIG[t].update) TRIG[t].update(ex, old, c);
        if (!pol(t, 'update')(ex, c)) throw new PgErr('42501', `new row violates row-level security policy for table "${t}"`);
        checkRow(t, ex, work, ex); out.push(ex);
      } else {
        if (!pol(t, 'insert')(row, c)) throw new PgErr('42501', `new row violates row-level security policy for table "${t}"`);
        checkRow(t, row, work, null); work.push(row); out.push(row);
      }
    }
    if (/return=representation/.test(prefer) && out.some((r) => !pol(t, 'select')(r, c))) throw new PgErr('42501', `new row violates row-level security policy for table "${t}"`);
    tables[t] = work; return out;
  };
  const doUpdate = (t, body, q, c) => {
    const s = sch(t); const work = clone(tables[t]);
    for (const k of Object.keys(body)) { if (!s.cols[k]) throw new PgErr('PGRST204', `Could not find the '${k}' column of '${t}' in the schema cache`); if (s.cols[k].flag === 'A') throw new PgErr('428C9', `column "${k}" can only be updated to DEFAULT`); }
    const hit = applyFilters(work.filter((r) => pol(t, 'select')(r, c) && pol(t, 'update')(r, c)), q);
    for (const r of hit) {
      const old = clone(r); for (const [k, v] of Object.entries(body)) r[k] = checkType(t, k, s.cols[k].type, v);
      if (TRIG[t] && TRIG[t].update) TRIG[t].update(r, old, c);
      if (!pol(t, 'update')(r, c)) throw new PgErr('42501', `new row violates row-level security policy for table "${t}"`);
      checkRow(t, r, work, r);
    }
    tables[t] = work; return hit;
  };
  const doDelete = (t, q, c) => {
    if (!filtersOf(q).length) throw new PgErr('21000', 'DELETE requires a WHERE clause');
    const hit = new Set(applyFilters(tables[t].filter((r) => pol(t, 'select')(r, c) && pol(t, 'delete')(r, c)), q));
    tables[t] = tables[t].filter((r) => !hit.has(r)); return [...hit];
  };

  // ---------------- RPCs (mirror the live SQL) ----------------
  const RPC = {
    next_ref: ({ p_prefix }) => { let r = tables.ref_counters.find((x) => x.prefix === p_prefix); if (!r) { r = { prefix: p_prefix, n: 0 }; tables.ref_counters.push(r); } r.n += 1; return p_prefix + String(r.n).padStart(4, '0'); },
    bump_ref: ({ p_prefix, p_to }, c) => { if (!c.desk) return null; let r = tables.ref_counters.find((x) => x.prefix === p_prefix); if (!r) { r = { prefix: p_prefix, n: 0 }; tables.ref_counters.push(r); } r.n = Math.max(r.n, Number(p_to) || 0); return null; },
    day_busy: ({ p_date }) => {
      const out = [];
      tables.bookings.filter((b) => b.date === p_date && b.start_min != null && b.mins != null && !/cancel/i.test(b.status || '')).forEach((b) => {
        if (b.staff && typeof b.staff === 'object' && !Array.isArray(b.staff)) Object.values(b.staff).forEach((v) => out.push({ staff_name: String(v), start_min: b.start_min, mins: b.mins }));
        else { const n = b.staff_name || (typeof b.staff === 'string' ? b.staff : null); if (n) out.push({ staff_name: n, start_min: b.start_min, mins: b.mins }); }
      });
      tables.blocks.filter((bl) => bl.staff && bl.mins != null && bl.start && beirutDate(bl.start) === p_date).forEach((bl) => { const d = new Date(new Date(bl.start).getTime() + 3 * 36e5); out.push({ staff_name: bl.staff, start_min: d.getUTCHours() * 60 + d.getUTCMinutes(), mins: bl.mins }); });
      return out;
    },
    gift_redeem: ({ p_code, p_amount, p_ref, p_what }, c) => {
      if (!c.uid) throw new PgErr('P0001', 'not signed in');
      const g = tables.gift_cards.find((x) => x.code.toUpperCase() === String(p_code).toUpperCase()); if (!g) throw new PgErr('P0001', 'card not found');
      if (!g.confirmed || g.status !== 'Active' || g.balance <= 0) throw new PgErr('P0001', 'card not spendable');
      if (!profilePhone(c.uid) || profilePhone(c.uid) !== digits(g.to_phone)) throw new PgErr('P0001', 'not your card');
      const used = Math.min(Math.max(p_amount, 0), g.balance); g.balance -= used; g.status = g.balance <= 0 ? 'Used' : 'Active';
      g.redemptions = (g.redemptions || []).concat([{ date: new Date().toISOString(), amount: used, ref: p_ref, what: p_what }]); return used;
    },
    gift_refund: ({ p_code, p_amount, p_ref }, c) => {
      const g = tables.gift_cards.find((x) => x.code.toUpperCase() === String(p_code).toUpperCase()); if (!g) throw new PgErr('P0001', 'card not found');
      if (c.uid && !c.desk && profilePhone(c.uid) !== digits(g.to_phone)) throw new PgErr('P0001', 'not your card');
      const red = (g.redemptions || []).filter((r) => r.ref === p_ref); const got = red.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0); const back = red.filter((r) => r.amount < 0).reduce((a, r) => a - r.amount, 0);
      const amt = Math.min(Math.max(p_amount, 0), Math.max(0, got - back)); if (amt <= 0) return null;
      g.balance += amt; if (g.status === 'Used') g.status = 'Active'; g.redemptions = g.redemptions.concat([{ date: new Date().toISOString(), amount: -amt, ref: p_ref, what: 'Refund' }]); return null;
    },
    desk_chips: () => tables.desk_users.map((d) => ({ id: d.id, name: d.name, initials: d.initials, role_label: d.role_label, colour: d.colour })),
    my_profile: (a, c) => tables.desk_users.filter((d) => c.uid && digits(d.phone) === c.phone).map((d) => ({ id: d.id, name: d.name, initials: d.initials, role: d.role, role_label: d.role_label, colour: d.colour })),
  };
  const beirutDate = (iso) => new Date(new Date(iso).getTime() + 3 * 36e5).toISOString().slice(0, 10);

  // ---------------- HTTP ----------------
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD', 'access-control-expose-headers': 'content-range,x-supabase-api-version' };
  const send = (res, status, body, extra) => { res.writeHead(status, Object.assign({ 'content-type': 'application/json' }, cors, extra || {})); res.end(body === undefined ? '' : (Buffer.isBuffer(body) ? body : JSON.stringify(body))); };

  const handle = async (req, res, raw) => {
    const url = new URL(req.url, 'http://x'); const q = url.searchParams; const c = ctxOf(req);
    const entry = { at: Date.now(), method: req.method, path: url.pathname, query: url.search, prefer: req.headers.prefer || '', role: c.role, uid: c.uid, desk: c.desk, auth: (req.headers.authorization || '').slice(0, 30) };
    log.push(entry);
    if (req.method === 'OPTIONS') return send(res, 204);
    const fault = faults.find((f) => f.times > 0 && f.match(req.method, url.pathname, entry));
    if (fault) { fault.times--; entry.status = fault.status; entry.faulted = true; return send(res, fault.status, fault.body || { message: 'injected failure' }); }
    let body = null; const ct = req.headers['content-type'] || '';
    if (raw.length && /json/.test(ct)) { try { body = JSON.parse(raw.toString()); } catch (e) { return send(res, 400, { code: 'PGRST102', message: 'bad json' }); } }
    entry.body = body;
    try {
      // --- auth ---
      if (url.pathname === '/auth/v1/user') { if (!c.uid) return send(res, 401, { code: 401, msg: 'invalid JWT' }); const u = users[c.uid]; return send(res, 200, { id: u.id, aud: 'authenticated', role: 'authenticated', phone: u.phone, app_metadata: { provider: 'phone' }, user_metadata: {} }); }
      if (url.pathname === '/auth/v1/logout') return send(res, 204);
      if (url.pathname === '/auth/v1/token') { const uid = String((body && body.refresh_token) || '').replace(/^r-/, ''); if (!users[uid]) return send(res, 400, { error: 'invalid_grant' }); const tok = Object.keys(tokens).find((k) => tokens[k] === uid); const u = users[uid]; return send(res, 200, { access_token: tok, refresh_token: 'r-' + uid, token_type: 'bearer', expires_in: 86400 * 30, expires_at: Math.floor(Date.now() / 1000) + 86400 * 30, user: { id: uid, phone: u.phone, aud: 'authenticated', role: 'authenticated' } }); }
      if (url.pathname.startsWith('/auth/v1/')) return send(res, 200, {});
      // --- storage (policies: studio bucket, desk insert/select/update/delete; public read) ---
      let m;
      if ((m = /^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/.exec(url.pathname))) { const o = objects[m[1] + '/' + m[2]]; if (!o) return send(res, 404, { message: 'not found' }); res.writeHead(200, Object.assign({ 'content-type': o.type }, cors)); return res.end(o.body); }
      if ((m = /^\/storage\/v1\/object\/([^/]+)\/(.+)$/.exec(url.pathname)) && (req.method === 'POST' || req.method === 'PUT')) {
        const key = m[1] + '/' + decodeURIComponent(m[2]); const upsert = req.headers['x-upsert'] === 'true';
        if (m[1] !== 'studio' || !c.desk) { entry.status = 400; return send(res, 400, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' }); }
        if (upsert && !fake.storageSelectPolicy) { entry.status = 400; return send(res, 400, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' }); }
        if (objects[key] && !upsert) { entry.status = 400; return send(res, 400, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' }); }
        let data = raw; if (/multipart\/form-data/.test(ct)) { const b = ct.split('boundary=')[1]; const s = raw.toString('latin1'); const i = s.indexOf('\r\n\r\n'); const j = s.lastIndexOf('\r\n--' + b); data = Buffer.from(s.slice(i + 4, j), 'latin1'); }
        objects[key] = { type: /image/.test(ct) ? ct : 'image/jpeg', body: data }; entry.status = 200; entry.stored = key;
        return send(res, 200, { Key: key, Id: crypto.randomUUID() });
      }
      // --- rpc ---
      if ((m = /^\/rest\/v1\/rpc\/(\w+)$/.exec(url.pathname))) { const fn = RPC[m[1]]; if (!fn) throw new PgErr('PGRST202', 'Could not find the function public.' + m[1], 404); const r = fn(body || {}, c); entry.status = 200; return send(res, 200, r === undefined ? null : r); }
      // --- tables ---
      if (!(m = /^\/rest\/v1\/(\w+)$/.exec(url.pathname))) return send(res, 404, { message: 'no route ' + url.pathname });
      const t = m[1]; entry.table = t; const prefer = req.headers.prefer || '';
      const single = /vnd\.pgrst\.object/.test(req.headers.accept || '');
      let rows;
      if (req.method === 'GET' || req.method === 'HEAD') rows = order(selectRows(t, q, c), q.get('order'));
      else if (req.method === 'POST') rows = doInsert(t, body, q, prefer, c);
      else if (req.method === 'PATCH') rows = doUpdate(t, body || {}, q, c);
      else if (req.method === 'DELETE') rows = doDelete(t, q, c);
      if (q.get('offset')) rows = rows.slice(Number(q.get('offset')));
      if (q.get('limit')) rows = rows.slice(0, Number(q.get('limit')));
      entry.status = 200; entry.affected = rows.length;
      const wantRows = req.method === 'GET' || /return=representation/.test(prefer);
      const outRows = project(rows, q.get('select'));
      if (single) { if (outRows.length !== 1) throw new PgErr('PGRST116', 'JSON object requested, multiple (or no) rows returned'); return send(res, 200, outRows[0]); }
      if (!wantRows) return send(res, req.method === 'POST' ? 201 : 204);
      return send(res, 200, outRows, { 'content-range': '0-' + (outRows.length - 1) + '/*' });
    } catch (e) {
      if (!(e instanceof PgErr)) { console.error('[fakesb] crash', e); e = new PgErr('XX000', String(e && e.message || e), 500); }
      entry.status = e.status; entry.error = { code: e.code, message: e.message };
      return send(res, e.status, { code: e.code, message: e.message, details: null, hint: null });
    }
  };

  const server = http.createServer((req, res) => { const chunks = []; req.on('data', (d) => chunks.push(d)); req.on('end', () => { handle(req, res, Buffer.concat(chunks)).catch((e) => { console.error(e); send(res, 500, { message: String(e) }); }); }); });
  const fake = {
    tables, users, objects, log, faults, addUser, server,
    // Toggles mirroring pending live fixes; the test run states which way each is set.
    giftSanitizeSkipsDesk: false, storageSelectPolicy: false,
    writes: () => log.filter((e) => e.method !== 'GET' && e.method !== 'OPTIONS' && e.method !== 'HEAD' && /\/rest\/v1\//.test(e.path)),
    errors: () => log.filter((e) => e.error),
    fail: (match, status, body, times) => faults.push({ match, status, body, times: times || 1 }),
    listen: () => new Promise((r) => server.listen(0, '127.0.0.1', () => r(server.address().port))),
    close: () => new Promise((r) => server.close(r)),
    seeded: [],
    seed: (t, rows) => { rows.forEach((o) => { const row = buildRow(t, o, Object.keys(o), false); checkRow(t, row, tables[t], null); tables[t].push(row); fake.seeded.push({ t, row: clone(row) }); }); },
  };
  return fake;
}

// schema.js flags → { flag, type }
Object.keys(SCHEMA).forEach((t) => { const cols = SCHEMA[t].cols; Object.keys(cols).forEach((c) => { if (typeof cols[c] === 'string') { const [flag, type] = cols[c].split(''); cols[c] = { flag, type: type || 's' }; } }); });
module.exports = { createFake, jwt };
