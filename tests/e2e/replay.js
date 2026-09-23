/* Turns the writes captured by `CAPTURE=writes.json node run.js` into ONE SQL statement that replays
   them against the LIVE database — each test inside its own sub-transaction that is always rolled
   back — as the same user (desk / customer / anonymous), and reports what the real database said.
   Nothing is kept: the whole replay ends in a rollback. Usage: node replay.js writes.json > replay.sql */
const fs = require('fs');
const cap = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const q = (v) => "'" + String(v).replace(/'/g, "''") + "'";
const id = (c) => '"' + String(c).replace(/"/g, '""') + '"';
const J = (v) => '$J$' + JSON.stringify(v) + '$J$::jsonb';
const splitList = (s) => { const out = []; let cur = '', qq = false; for (const ch of s) { if (ch === '"') { qq = !qq; continue; } if (ch === ',' && !qq) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const PK = { gift_cards: ['code'], web_config: ['key'], web_categories: ['name'], newsletter: ['phone'], shifts: ['staff', 'date'], web_pages: ['key'] };
const where = (params) => {
  const conds = [];
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue;
    const m = /^(eq|neq|in|is)\.(.*)$/s.exec(v); if (!m) throw new Error('filter ' + k + '=' + v);
    if (m[1] === 'eq') conds.push(id(k) + '::text = ' + q(m[2]));
    else if (m[1] === 'neq') conds.push(id(k) + '::text <> ' + q(m[2]));
    else if (m[1] === 'in') conds.push(id(k) + '::text in (' + splitList(m[2].replace(/^\(|\)$/g, '')).map(q).join(',') + ')');
    else conds.push(id(k) + (m[2] === 'null' ? ' is null' : ' is ' + m[2]));
  }
  return conds.length ? ' where ' + conds.join(' and ') : '';
};
const lit = (v) => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? String(v) : typeof v === 'object' ? J(v) : q(v);
const toSql = (w) => {
  const u = new URL('http://x' + w.path + (w.query || '')); const P = u.searchParams;
  let m;
  if ((m = /^\/rest\/v1\/rpc\/(\w+)$/.exec(u.pathname))) return 'select public.' + id(m[1]) + '(' + Object.entries(w.body || {}).map(([k, v]) => id(k) + ' => ' + lit(v)).join(', ') + ')';
  const t = /^\/rest\/v1\/(\w+)$/.exec(u.pathname)[1]; const T = 'public.' + id(t);
  if (w.method === 'DELETE') return 'delete from ' + T + where(P);
  if (w.method === 'PATCH') { const cols = Object.keys(w.body || {}); return 'update ' + T + ' set (' + cols.map(id).join(',') + ') = (select ' + cols.map(id).join(',') + ' from jsonb_populate_record(null::' + T + ', ' + J(w.body) + '))' + where(P); }
  const rows = Array.isArray(w.body) ? w.body : [w.body];
  const cols = P.get('columns') ? splitList(P.get('columns')) : [...new Set(rows.flatMap((r) => Object.keys(r)))];
  let sql = 'insert into ' + T + ' (' + cols.map(id).join(',') + ') select ' + cols.map(id).join(',') + ' from jsonb_populate_recordset(null::' + T + ', ' + J(rows) + ')';
  const target = P.get('on_conflict') ? P.get('on_conflict').split(',') : (PK[t] || ['id']);
  if (/resolution=merge-duplicates/.test(w.prefer)) { const set = cols.filter((c) => !target.includes(c)); sql += ' on conflict (' + target.map(id).join(',') + ') do ' + (set.length ? 'update set ' + set.map((c) => id(c) + ' = excluded.' + id(c)).join(', ') : 'nothing'); }
  else if (/resolution=ignore-duplicates/.test(w.prefer)) sql += ' on conflict (' + target.map(id).join(',') + ') do nothing';
  if (/return=representation/.test(w.prefer)) sql += ' returning 1';
  return sql;
};
const seedSql = (s0) => { const s = { t: s0.t, row: Object.assign({}, s0.row) }; ['created_at', 'added', 'updated_at'].forEach((k) => delete s.row[k]); if (s.t === 'desk_users') delete s.row.id; const cols = Object.keys(s.row).filter((c) => !(s.t === 'web_staff' && c === 'id') && !(s.t === 'audit' && c === 'id')); return 'insert into public.' + id(s.t) + ' (' + cols.map(id).join(',') + ') ' + (s.t === 'web_services' ? 'overriding system value ' : '') + 'select ' + cols.map(id).join(',') + ' from jsonb_populate_record(null::public.' + id(s.t) + ', ' + J(s.row) + ') on conflict do nothing'; };

const only = (process.env.ONLY || '').split('|').filter(Boolean);
const lib = []; const libIx = (sql) => { let i = lib.indexOf(sql); if (i < 0) { lib.push(sql); i = lib.length - 1; } return i; };
const tests = cap.filter((t) => !only.length || only.some((o) => t.test.includes(o))).map((t, ti) => ({
  test: t.test,
  users: Object.values(t.people).map((p) => ({ id: p.id, phone: p.phone })),
  seed: (t.seed || []).map((x) => libIx(seedSql(x))),
  writes: t.writes.filter((w) => !(process.env.SKIP && new RegExp(process.env.SKIP).test(w.path))).map((w, i) => ({ i, role: w.uid ? 'authenticated' : 'anon', uid: w.uid, sql: toSql(w), fake: w.error ? w.error.code : 'ok', what: w.method + ' ' + w.path })),
}));

console.log(`create or replace function pg_temp.replay(tests jsonb, lib jsonb) returns jsonb language plpgsql as $F$
declare res jsonb := '[]'; t jsonb; w jsonb; u jsonb; s text; r jsonb;
begin
  for t in select * from jsonb_array_elements(tests) loop
    begin
      reset role;
      for u in select * from jsonb_array_elements(t->'users') loop
        insert into auth.users (instance_id, id, aud, role, phone, created_at, updated_at) values ('00000000-0000-0000-0000-000000000000', (u->>'id')::uuid, 'authenticated', 'authenticated', u->>'phone', now(), now()) on conflict do nothing;
      end loop;
      for s in select lib->>(x::int) from jsonb_array_elements_text(t->'seed') x loop execute s; end loop;
      for w in select * from jsonb_array_elements(t->'writes') loop
        begin
          perform set_config('request.jwt.claims', json_build_object('sub', w->>'uid', 'role', w->>'role')::text, true);
          perform set_config('request.jwt.claim.sub', coalesce(w->>'uid', ''), true);
          perform set_config('request.jwt.claim.role', w->>'role', true);
          execute 'set local role ' || (w->>'role');
          execute w->>'sql';
          reset role;
          r := jsonb_build_object('test', t->>'test', 'i', w->'i', 'what', w->>'what', 'fake', w->>'fake', 'live', 'ok');
        exception when others then
          reset role;
          r := jsonb_build_object('test', t->>'test', 'i', w->'i', 'what', w->>'what', 'fake', w->>'fake', 'live', SQLSTATE, 'msg', SQLERRM);
        end;
        res := res || r;
      end loop;
      raise exception using errcode = 'P0R01', message = 'rollback test';
    exception when sqlstate 'P0R01' then null;
      when others then res := res || jsonb_build_object('test', t->>'test', 'setup_error', SQLSTATE || ' ' || SQLERRM);
    end;
  end loop;
  reset role;
  return res;
end $F$;
with r as (select pg_temp.replay($T$${JSON.stringify(tests)}$T$::jsonb, $L$${JSON.stringify(lib)}$L$::jsonb) v)
select (select jsonb_agg(x) from jsonb_array_elements(r.v) x where x->>'setup_error' is not null or (x->>'fake') is distinct from (x->>'live')) mismatches,
       jsonb_array_length(r.v) total_writes from r;`);
