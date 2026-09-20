/* Incenso Studio — account + phone-OTP sign-in, backed by Supabase.
   The account object (name, phone, bookings[], orders[], visits, prefs, gift)
   stays a synchronous local cache so pages are unchanged; it is hydrated from
   and mirrored to Supabase. Real SMS codes are sent once Twilio is connected
   to Supabase Auth. */
(() => {
  const SB = window.SB;
  const AKEY = 'incenso-account', SKEY = 'incenso-signedin';
  const digits = (p) => String(p || '').replace(/\D/g, '');
  const e164 = (p) => { const d = digits(p); return d ? '+' + d : ''; };
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(AKEY) || 'null'); } catch (e) { return null; } };
  const writeLocal = (a) => { try { if (a) localStorage.setItem(AKEY, JSON.stringify(a)); else localStorage.removeItem(AKEY); } catch (e) {} };
  let acc = readLocal();
  const get = () => acc;
  const signedIn = () => { try { return localStorage.getItem(SKEY) === '1' && !!acc; } catch (e) { return !!acc; } };

  const TIERS = [
    { name: 'Member',  min: 0,    color: '#CFDFDD', perk: 'Welcome — every dollar counts toward Insider' },
    { name: 'Insider', min: 1000, color: '#EED4D3', perk: '10% off everything — services and the shelf' },
    { name: 'Loyal',   min: 2000, color: '#EFE2AF', perk: '20% off everything — services and the shelf' },
  ];
  const tierFor = (spend) => TIERS.filter((t) => spend >= t.min).pop();
  const nextTier = (spend) => TIERS.find((t) => spend < t.min) || null;

  // Effective order total after partial cancellations: active items minus a prorated discount plus delivery
  const orderTotal = (o) => {
    if (!o || !o.items) return (o && o.total) || 0;
    const full = o.items.reduce((s, l) => s + l.price * l.q, 0);
    const act = o.items.filter((l) => !l.removed).reduce((s, l) => s + l.price * l.q, 0);
    if (act === full) return o.total || 0;
    const disc = full ? Math.round((o.discount || 0) * act / full) : 0;
    const ship = o.method === 'Shipped' ? 5 : 0;
    return Math.max(0, act - disc + ship);
  };

  // Sequential references — BK0001 (bookings), OR0001 (orders), GF0001 (gift cards).
  // Prototype counter; the backend issues the real sequence in production.
  // Global, unique, in-order references from the server counter (next_ref RPC).
  // Falls back to a local counter only when offline / signed out.
  const nextRef = async (prefix) => {
    if (SB) { try { const { data, error } = await SB.rpc('next_ref', { p_prefix: prefix }); if (!error && data) return data; } catch (e) {} }
    const k = 'incenso-seq'; let m = {}; try { m = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) {} m[prefix] = (m[prefix] || 0) + 1; try { localStorage.setItem(k, JSON.stringify(m)); } catch (e) {} return prefix + String(m[prefix]).padStart(4, '0');
  };

  // Normalize a booking's top-ups into an array. Legacy rows stored a single
  // {amount,pay,status,placedAt} object; new rows store an array so multiple
  // top-ups of different methods (card / whish / omt) stay separate.
  const exArr = (b) => { const x = b && (b.extras != null ? b.extras : b.extra); return Array.isArray(x) ? x.filter((e) => e && e.amount) : (x && x.amount ? [x] : []); };

  // One-line payment label for a booking, derived from the money actually held
  const payLabel = (b) => {
    if (!b) return '';
    if (/no.?show/i.test(b.status || '')) return 'No-show · nothing charged';
    if (/cancel/i.test(b.status || '')) return 'Cancelled';
    if (b.final && typeof b.final.total === 'number') return 'Settled';
    const price = b.price || 0, gift = b.gift && b.gift.amount ? b.gift.amount : 0;
    const paid = typeof b.paid === 'number' ? b.paid : 0;
    const extras = exArr(b), exSum = extras.reduce((s, e) => s + (e.amount || 0), 0), method = (b.pay || '').replace(/^Paid (by|via) /, '');
    const due = typeof b.due === 'number' ? b.due : Math.max(0, price - gift - paid - exSum);
    if (b.payStatus === 'pending' || /await/i.test(b.status || '')) return 'Awaiting ' + method;
    const parts = [];
    if (gift > 0) parts.push(gift >= price && !extras.length && !due ? 'Gift balance' : '$' + gift + ' gift');
    if (paid > 0) parts.push('$' + paid + ' ' + (/card/i.test(method) ? 'card' : method));
    extras.forEach((ex) => { const em = (ex.pay || '').replace(/^Paid (by|via) /, ''); const el = /card/i.test(em) ? 'card' : em; parts.push('$' + ex.amount + ' ' + el + (ex.status === 'paid' ? '' : ' pending')); });
    if (due > 0) parts.push('$' + due + ' at studio');
    if (b.quote) parts.push(price ? '+ quote at studio' : 'Quote at studio');
    if (b.refund > 0) parts.push('$' + b.refund + ' refund on its way');
    if (!parts.length) parts.push(price ? (/studio/i.test(method) ? 'Pay at studio' : method) : 'Pay at studio');
    return parts.join(' · ');
  };

  const yearSpend = (a) => {
    if (!a) return 0;
    const cutoff = Date.now() - 365 * 24 * 3600 * 1000;
    let s = 0;
    // Orders count once the money is real: card / confirmed transfer immediately, cash only when Delivered / Collected.
    (a.orders || []).forEach((o) => {
      if (/cancel/i.test(o.status || '') || new Date((o.date || '') + 'T12:00:00').getTime() < cutoff) return;
      const paid = o.payStatus === 'paid' || (/^Paid (by|via)/.test(o.pay || '') && o.payStatus !== 'pending');
      const og = o.gift && o.gift.amount ? o.gift.amount : 0; // gift money already counted for the buyer
      if (paid || /deliver|collect/i.test(o.status || '')) s += Math.max(0, orderTotal(o) - og);
    });
    // Bookings — money counts only when it is real; final bill (settled) replaces every estimate.
    (a.bookings || []).forEach((b) => {
      const st = b.status || '';
      if (/cancel|no.?show|await/i.test(st) || b.payStatus === 'pending') return;
      const t = new Date(b.date + 'T23:59:59').getTime(); if (t < cutoff) return;
      const giftPart = b.gift && b.gift.amount ? b.gift.amount : 0;
      if (b.final && typeof b.final.total === 'number') { s += Math.max(0, b.final.total - giftPart); return; }
      const completed = /complet/i.test(st) || b.completed === true;
      const prepaid = b.payStatus === 'paid' || (b.paid > 0 && b.payStatus !== 'due');
      const extraPaid = exArr(b).reduce((s2, e) => s2 + (e.status === 'paid' ? (e.amount || 0) : 0), 0);
      if (prepaid) s += (b.paid || 0) + (completed ? (b.due || 0) : 0) + extraPaid;
      else if (completed) s += Math.max(0, (b.price || 0) - giftPart);
      else s += extraPaid;
    });
    // Gift cards bought by this account count for the buyer once paid.
    const G = window.IncensoGift;
    if (G && G.boughtBy) G.boughtBy(a.phone).forEach((x) => { if (x.status === 'Reserved' || (x.status === 'Expired' && x.expiredReason)) return; const t = new Date(x.created).getTime(); if (t >= cutoff) s += x.amount || 0; });
    return s;
  };
  const seed = (name, phone, email, birthday) => ({ name, phone, email: email || '', birthday: birthday || '', created: new Date().toISOString(), visits: [], orders: [], bookings: [], prefs: {} });

  // ---- Supabase <-> account-object mapping ----
  const bkFromRow = (r) => ({ ref: r.ref, services: r.services || [], serviceMins: r.service_mins || [], staff: r.staff || {}, date: r.date, time: r.time, start: r.start_min, mins: r.mins, price: r.price, priceFrom: r.price_from, quote: r.quote, quoteItems: r.quote_items || [], pay: r.pay, paid: r.paid, due: r.due, refund: r.refund, gift: r.gift && Object.keys(r.gift).length ? r.gift : null, status: r.status, payStatus: r.pay_status, completed: !!r.completed, extras: exArr({ extra: r.extra }), final: r.final || null, placedAt: r.placed_at ? new Date(r.placed_at).getTime() : undefined, payDeadline: r.pay_deadline ? new Date(r.pay_deadline).getTime() : undefined, notes: r.notes, mood: r.mood, flags: r.flags || [], drink: r.drink || [], smoke: r.smoke, created: r.created_at, updated: r.updated_at, cancelled: r.cancelled_at, cancelReason: r.cancel_reason, service: (r.services || []).join(' + ') });
  const bkToRow = (b, uid) => ({ ref: b.ref, user_id: uid, services: b.services || [], service_mins: b.serviceMins || [], staff: b.staff || {}, date: b.date || null, time: b.time || null, start_min: (b.start != null ? b.start : null), mins: b.mins || null, price: b.price || 0, price_from: !!b.priceFrom, quote: !!b.quote, quote_items: b.quoteItems || [], pay: b.pay || null, paid: b.paid || 0, due: b.due || 0, refund: b.refund || 0, gift: b.gift || {}, status: b.status || 'Upcoming', pay_status: b.payStatus || null, completed: !!b.completed, extra: exArr(b), final: b.final || null, placed_at: b.placedAt ? new Date(b.placedAt).toISOString() : null, pay_deadline: b.payDeadline ? new Date(b.payDeadline).toISOString() : null, notes: b.notes || null, mood: b.mood || null, flags: b.flags || [], drink: b.drink || [], smoke: b.smoke || null, cancelled_at: b.cancelled || null, cancel_reason: b.cancelReason || null });
  const orFromRow = (r) => ({ ref: r.ref, date: (r.created_at || '').slice(0, 10), items: r.items || [], total: r.total, status: r.status, method: r.method, pay: r.pay, name: r.name, phone: r.phone, email: r.email, address: (r.address && r.address.text) || '', discount: r.discount, tier: r.tier, payStatus: r.pay_status, gift: r.gift || null, courier: r.courier || null, toPay: (r.to_pay != null ? r.to_pay : undefined), placedAt: r.placed_at ? new Date(r.placed_at).getTime() : undefined, payDeadline: r.pay_deadline ? new Date(r.pay_deadline).getTime() : undefined, cancelReason: r.cancel_reason });
  const orToRow = (o, uid) => ({ ref: o.ref, user_id: uid, items: o.items || [], total: o.total || 0, status: o.status || 'Placed', method: o.method || null, pay: o.pay || null, name: o.name || null, phone: o.phone || null, email: o.email || null, address: (typeof o.address === 'string' ? { text: o.address } : (o.address || {})), discount: o.discount || 0, tier: o.tier || null, pay_status: o.payStatus || null, gift: o.gift || null, courier: o.courier || null, to_pay: (o.toPay != null ? o.toPay : null), placed_at: o.placedAt ? new Date(o.placedAt).toISOString() : null, pay_deadline: o.payDeadline ? new Date(o.payDeadline).toISOString() : null, cancel_reason: o.cancelReason || null });

  let currentUid = null;
  let lastPersist = Promise.resolve();
  const persist = async (a) => {
    if (!SB || !a) return;
    try {
      // Prefer the locally-cached session (no network round-trip) so a save can
      // finish before a page navigation; fall back to getUser if needed.
      let user = null;
      try { const s = await SB.auth.getSession(); user = s && s.data && s.data.session ? s.data.session.user : null; } catch (e) {}
      if (!user) { const u = await SB.auth.getUser(); user = u && u.data ? u.data.user : null; }
      if (!user) return;
      const uid = user.id; currentUid = uid;
      await SB.from('profiles').upsert({ id: uid, phone: a.phone || null, name: a.name || null, email: a.email || null, birthday: a.birthday || null, photo_url: a.photo || null, prefs: a.prefs || {}, tier: (tierFor(yearSpend(a)) || {}).name || 'Member', spend_12mo: yearSpend(a), updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if ((a.bookings || []).length) await SB.from('bookings').upsert(a.bookings.map((b) => bkToRow(b, uid)), { onConflict: 'ref' });
      if ((a.orders || []).length) await SB.from('orders').upsert(a.orders.map((o) => orToRow(o, uid)), { onConflict: 'ref' });
      if ((a.restocks || []).length) await SB.from('restock_requests').upsert(a.restocks.map((r) => ({ user_id: uid, product: r.name, phone: a.phone || null })), { onConflict: 'user_id,product' });
    } catch (e) { console.warn('[Incenso] persist failed', e); }
  };
  const set = (a) => { acc = a; writeLocal(a); lastPersist = persist(a).catch(() => {}); return a; };
  // Remove a wait-list (restock) request everywhere. persist() only upserts restocks,
  // so a removal needs its own DELETE or the row comes back on the next hydrate.
  const removeRestock = async (name) => {
    if (!acc) return;
    acc.restocks = (acc.restocks || []).filter((r) => r.name !== name);
    writeLocal(acc);
    if (!SB) return;
    try {
      let uid = currentUid;
      if (!uid) { const u = await SB.auth.getUser(); uid = u && u.data && u.data.user ? u.data.user.id : null; }
      if (uid) await SB.from('restock_requests').delete().eq('user_id', uid).eq('product', name);
    } catch (e) { console.warn('[Incenso] removeRestock failed', e); }
  };
  // Resolves once the most recent save() has finished writing to Supabase.
  // Callers that navigate right after set() should await this first.
  const flush = () => lastPersist;

  const hydrate = async (uid) => {
    if (!SB) return null;
    try {
      const [pr, bk, od, rs] = await Promise.all([
        SB.from('profiles').select('*').eq('id', uid).maybeSingle(),
        SB.from('bookings').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        SB.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        SB.from('restock_requests').select('product, created_at').eq('user_id', uid),
      ]);
      const prof = pr.data;
      if (!prof) return null;
      const a = { id: uid, name: prof.name, phone: prof.phone, email: prof.email || '', birthday: prof.birthday || '', photo: prof.photo_url || '', prefs: prof.prefs || {}, tier: prof.tier, created: prof.created_at,
        bookings: (bk.data || []).map(bkFromRow), orders: (od.data || []).map(orFromRow),
        restocks: (rs.data || []).map((r) => ({ name: r.product, date: (r.created_at || '').slice(0, 10) })), visits: [] };
      a.visits = a.bookings.filter((b) => /complete/i.test(b.status || '')).map((b) => ({ date: b.date, price: b.price, service: b.service }));
      if (window.IncensoGift && window.IncensoGift.attach) { try { await window.IncensoGift.attach(a); } catch (e) {} }
      return a;
    } catch (e) { console.warn('[Incenso] hydrate failed', e); return null; }
  };

  // Pull the latest server state into the cache and tell pages to re-render. This is how
  // order / booking / gift pages reflect changes the studio (or the scheduler) made
  // server-side — the server is the single source of truth, the client only displays it.
  let resyncing = false;
  const resync = async () => {
    if (!SB || resyncing) return;
    resyncing = true;
    try {
      const { data: { session } } = await SB.auth.getSession();
      if (session && session.user) {
        const a = await hydrate(session.user.id);
        if (a) { acc = a; writeLocal(a); document.dispatchEvent(new Event('account:updated')); }
      }
    } catch (e) { /* offline / transient — keep the current cache */ }
    finally { resyncing = false; }
  };
  // Re-sync whenever the tab regains focus/visibility (cheap, catches studio changes fast).
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resync(); });


  const css = '.au{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:clamp(16px,3vw,40px);opacity:0;pointer-events:none;transition:opacity 240ms cubic-bezier(0.16,1,0.3,1)}' +
  '.au.open{opacity:1;pointer-events:auto}body.au-open{overflow:hidden}' +
  '.au-scrim{position:absolute;inset:0;background:rgba(30,26,18,0.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}' +
  '.au-card{position:relative;z-index:1;width:min(420px,100%);background:#FEFEF1;border:1px solid rgba(0,0,0,0.25);box-shadow:0 24px 64px rgba(0,0,0,0.28);padding:clamp(26px,4vw,36px);transform:translateY(10px) scale(0.985);transition:transform 280ms cubic-bezier(0.16,1,0.3,1)}' +
  '.au.open .au-card{transform:none}' +
  '.au-close{position:absolute;right:10px;top:10px;appearance:none;width:34px;height:34px;border-radius:999px;border:1px solid rgba(0,0,0,0.18);background:transparent;color:#000;font-size:19px;line-height:1;display:grid;place-items:center;cursor:pointer;padding:0 0 2px;transition:background-color 180ms}' +
  '.au-close:hover{background:rgba(0,0,0,0.06)}' +
  '.au-kicker{font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(0,0,0,0.45);margin:0 0 10px}' +
  '.au-title{font-weight:600;font-size:22px;letter-spacing:-0.015em;margin:0 0 8px}' +
  '.au-sub{margin:0 0 20px;font-size:13px;line-height:1.55;color:rgba(0,0,0,0.62)}' +
  '.au-field{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}' +
  '.au-field label{font-size:13px;font-weight:500}' +
  '.au-field input{appearance:none;width:100%;height:44px;padding:0 18px;border-radius:999px;border:1px solid rgba(0,0,0,0.25);background:rgba(229,220,201,0.25);font:inherit;font-size:14px;color:#000}' +
  '.au-field input:focus{outline:none;border-color:rgba(0,0,0,0.6)}' +
  '.au-btn{appearance:none;display:flex;align-items:center;justify-content:center;width:100%;height:46px;border-radius:999px;border:0;background:#000;color:#FEFEF1;font:inherit;font-size:14px;font-weight:500;cursor:pointer;transition:transform 160ms}' +
  '.au-btn:active{transform:scale(0.98)}' +
  '.au-code{display:flex;gap:10px;justify-content:center;margin:6px 0 16px}' +
  '.au-code input{width:52px;height:58px;text-align:center;font-family:var(--font-mono,monospace);font-size:22px;font-weight:600;border:1px solid rgba(0,0,0,0.25);border-radius:12px;background:rgba(229,220,201,0.25);color:#000}' +
  '.au-code input:focus{outline:none;border-color:#000}' +
  '.au-sms{display:flex;align-items:center;gap:10px;margin:0 0 16px;padding:12px 16px;border:1px dashed rgba(0,0,0,0.3);background:rgba(229,220,201,0.3);font-size:13px;line-height:1.45}' +
  '.au-sms .c{font-family:var(--font-mono,monospace);font-weight:600;font-size:16px;letter-spacing:0.14em}' +
  '.au-err{color:#C81E2D;font-size:12px;margin:-6px 0 12px;display:none}' +
  '.au-alt{margin:14px 0 0;font-size:12px;color:rgba(0,0,0,0.55);text-align:center}' +
  '.au-alt button{appearance:none;border:0;background:none;font:inherit;font-weight:600;color:#000;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:0}' +
  '.au-photo{display:flex;align-items:center;gap:14px;margin-bottom:14px}' +
  '.au-photo .av{width:56px;height:56px;border-radius:999px;border:1px dashed rgba(0,0,0,0.35);background:rgba(229,220,201,0.3) center/cover no-repeat;display:grid;place-items:center;flex:none;overflow:hidden}' +
  '.au-photo .av svg{width:20px;height:20px;opacity:0.4}' +
  '.au-photo .av.filled{border-style:solid}' +
  '.au-photo .av.filled svg{display:none}' +
  '.au-photo-btn{appearance:none;border:1px solid rgba(0,0,0,0.3);background:transparent;border-radius:999px;height:36px;padding:0 18px;font:inherit;font-size:13px;font-weight:500;color:#000;cursor:pointer;transition:background-color 160ms}' +
  '.au-photo-btn:hover{background:rgba(0,0,0,0.05)}' +
  '.au-photo .hint{font-size:11px;color:rgba(0,0,0,0.45);margin:6px 0 0}' +
  '[data-account-btn].has-photo{background-size:cover;background-position:center;border-color:rgba(0,0,0,0.35)}' +
  '[data-account-btn].has-photo svg{display:none}';

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.className = 'au';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="au-scrim"></div><div class="au-card"><button type="button" class="au-close" aria-label="Close">&times;</button><div class="au-body"></div></div>';
  const mount = () => { if (!el.isConnected) document.body.appendChild(el); };
  const body = () => el.querySelector('.au-body');


  let onDone = null, pendingPhone = '', pendingE164 = '';
  const open = (cb, prefill) => { mount(); onDone = cb || null; stepPhone(prefill); el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); document.body.classList.add('au-open'); };
  const close = () => { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); document.body.classList.remove('au-open'); };

  const stepPhone = (prefill) => {
    const pre = prefill || (acc ? String(acc.phone) : '');
    body().innerHTML = '<p class="au-kicker">Incenso Studio</p><h2 class="au-title">Enter your phone to continue</h2>' +
      '<p class="au-sub">Enter your number and we’ll message you a one-time code on WhatsApp — no password needed. New here? Your account is created automatically.</p>' +
      '<form id="auPhoneForm"><div class="au-field"><label for="auPhone">Phone</label><div class="phone-combo"><select class="pc-cc" aria-label="Country code"></select><input id="auPhone" type="tel" inputmode="tel" placeholder="Phone number" required value="' + pre.replace(/^\+[\d]+\s*/, '') + '" /></div></div>' +
      '<p class="au-err" id="auErr"></p>' +
      '<button type="submit" class="au-btn" id="auSend">Send code</button></form>';
    if (window.IncensoPhone) window.IncensoPhone.fill(body());
    const preCC = String(pre).match(/^\+\d+/);
    if (preCC) { const sel = body().querySelector('.pc-cc'); if (sel) sel.value = preCC[0]; }
    body().querySelector('#auPhoneForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      pendingPhone = (body().querySelector('.pc-cc').value + ' ' + body().querySelector('#auPhone').value.trim()).trim();
      pendingE164 = e164(pendingPhone);
      const err = body().querySelector('#auErr'); const btn = body().querySelector('#auSend');
      err.style.display = 'none'; btn.disabled = true; btn.textContent = 'Sending…';
      if (!SB) { err.textContent = 'Sign-in is being connected. Please try again shortly.'; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Send code'; return; }
      const { error } = await SB.auth.signInWithOtp({ phone: pendingE164 });
      if (error) { err.textContent = /provider|sms|not enabled|unsupported/i.test(error.message) ? 'WhatsApp sign-in is being switched on — hang tight, it’s almost ready.' : error.message; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Send code'; return; }
      stepCode();
    });
  };

  const stepCode = () => {
    body().innerHTML = '<p class="au-kicker">Verify</p><h2 class="au-title">Enter the code</h2>' +
      '<p class="au-sub">Sent by WhatsApp to ' + pendingPhone + '.</p>' +
      '<form id="auCodeForm"><div class="au-code">' +
      [0,1,2,3,4,5].map((i) => '<input type="text" inputmode="numeric" maxlength="1" aria-label="Digit ' + (i+1) + '" />').join('') +
      '</div><p class="au-err" id="auErr">Enter the 6-digit code from the WhatsApp message.</p>' +
      '<button type="submit" class="au-btn" id="auVerify">Verify</button></form>' +
      '<p class="au-alt" id="auResendRow">Didn’t get it? <button type="button" id="auResend">Send code again</button></p>' +
      '<p class="au-alt">Wrong number? <button type="button" id="auBack">Go back</button></p>';
    const inputs = [...body().querySelectorAll('.au-code input')];
    inputs[0].focus();
    inputs.forEach((inp, i) => {
      inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 1); if (inp.value && inputs[i + 1]) inputs[i + 1].focus(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && inputs[i - 1]) inputs[i - 1].focus(); });
      inp.addEventListener('paste', (e) => { const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6); if (t) { e.preventDefault(); t.split('').forEach((d, k) => { if (inputs[k]) inputs[k].value = d; }); (inputs[Math.min(t.length, 5)] || inputs[5]).focus(); } });
    });
    body().querySelector('#auBack').addEventListener('click', () => stepPhone(pendingPhone));
    const resend = body().querySelector('#auResend');
    resend.addEventListener('click', async () => {
      if (SB) await SB.auth.signInWithOtp({ phone: pendingE164 });
      inputs.forEach((x) => { x.value = ''; }); inputs[0].focus();
      const row = body().querySelector('#auResendRow'); let left = 30; resend.style.display = 'none';
      row.childNodes[0].textContent = 'Code sent — again in ' + left + 's ';
      const t = setInterval(() => { left -= 1; if (left <= 0) { clearInterval(t); row.childNodes[0].textContent = 'Didn’t get it? '; resend.style.display = ''; return; } row.childNodes[0].textContent = 'Code sent — again in ' + left + 's '; }, 1000);
    });
    body().querySelector('#auCodeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const entered = inputs.map((x) => x.value).join('');
      const err = body().querySelector('#auErr');
      if (entered.length !== 6) { err.textContent = 'Enter the 6-digit code from the WhatsApp message.'; err.style.display = 'block'; return; }
      const btn = body().querySelector('#auVerify'); btn.disabled = true; btn.textContent = 'Verifying…';
      const { data, error } = await SB.auth.verifyOtp({ phone: pendingE164, token: entered, type: 'sms' });
      if (error || !data || !data.user) { err.textContent = 'That code didn’t match. Try again.'; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Verify'; inputs.forEach((x) => { x.value = ''; }); inputs[0].focus(); return; }
      const existing = await hydrate(data.user.id);
      if (existing && existing.name) finish(existing); else stepDetails();
    });
  };

  const stepDetails = () => {
    body().innerHTML = '<p class="au-kicker">New account</p><h2 class="au-title">Almost there</h2>' +
      '<p class="au-sub">So we know who’s in the chair — and where to send updates.</p>' +
      '<form id="auDetForm"><div class="au-field"><label for="auName">Full name</label><input id="auName" type="text" autocomplete="name" required /></div>' +
      '<div class="au-field"><label for="auEmail">E-mail</label><input id="auEmail" type="email" autocomplete="email" required /></div>' +
      '<div class="au-field"><label for="auBirthday">Birthday</label><input id="auBirthday" type="date" autocomplete="bday" max="' + new Date().toISOString().slice(0, 10) + '" required /></div>' +
      '<div class="au-field"><label>Photo <span style="font-weight:400;color:rgba(0,0,0,0.45)">— optional</span></label>' +
      '<div class="au-photo"><span class="av" id="auAv"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.4"></circle><path d="M5 19.5c1.3-3.2 4-4.8 7-4.8s5.7 1.6 7 4.8"></path></svg></span>' +
      '<span><button type="button" class="au-photo-btn" id="auPhotoBtn">Upload photo</button><p class="hint">JPG or PNG, up to 5 MB</p></span>' +
      '<input id="auPhoto" type="file" accept="image/*" hidden /></div></div>' +
      '<button type="submit" class="au-btn">Create account</button></form>';
    let photoData = '';
    const photoInput = body().querySelector('#auPhoto');
    const av = body().querySelector('#auAv');
    body().querySelector('#auPhotoBtn').addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', () => {
      const f = photoInput.files && photoInput.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => { photoData = r.result; av.style.backgroundImage = 'url(' + photoData + ')'; av.classList.add('filled'); body().querySelector('#auPhotoBtn').textContent = 'Change photo'; };
      r.readAsDataURL(f);
    });
    body().querySelector('#auDetForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const a = seed(body().querySelector('#auName').value.trim(), pendingPhone, body().querySelector('#auEmail').value.trim(), body().querySelector('#auBirthday').value);
      if (photoData) a.photo = photoData;
      finish(a);
    });
  };

  const finish = (a) => {
    if (window.IncensoGift && window.IncensoGift.attach) { try { window.IncensoGift.attach(a); } catch (e) {} }
    acc = a; writeLocal(a);
    try { localStorage.setItem(SKEY, '1'); } catch (e) {}
    persist(a);
    syncButtons();
    close();
    if (onDone) onDone(a);
  };

  el.addEventListener('click', (e) => { if (e.target.closest('.au-scrim') || e.target.closest('.au-close')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('open')) close(); });

  const syncButtons = () => {
    const a = signedIn() ? acc : null;
    document.querySelectorAll('[data-account-btn]').forEach((b) => {
      b.setAttribute('aria-label', signedIn() ? 'Your account' : 'Sign in');
      b.classList.toggle('signed', signedIn());
      const ph = a && a.photo;
      const textPill = b.classList.contains('m-acc');
      b.classList.toggle('has-photo', !!ph && !textPill);
      b.style.backgroundImage = ph && !textPill ? 'url(' + ph + ')' : '';
    });
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-account-btn]');
    if (!b) return;
    e.preventDefault();
    if (signedIn()) location.href = '/account';
    else open(() => { location.href = '/account'; });
  });

  const signOut = async () => { try { if (SB) await SB.auth.signOut(); } catch (e) {} try { localStorage.setItem(SKEY, '0'); } catch (e) {} acc = null; writeLocal(null); syncButtons(); };

  // findByPhone/all kept as no-op-ish shims for any legacy callers
  const findByPhone = () => null;
  const all = () => ({});

  // ---- Re-verify a signed-in member's detail change with a real WhatsApp OTP ----
  let detailChange = null; // { phone, type }
  const sendDetailOtp = async (newPhoneRaw) => {
    if (!SB) return { ok: false, offline: true };
    const cur = acc ? e164(acc.phone) : '';
    const newPhoneE164 = newPhoneRaw ? e164(newPhoneRaw) : '';
    let phone = cur, type = 'sms', error;
    if (newPhoneE164 && cur && newPhoneE164 !== cur) {
      phone = newPhoneE164; type = 'phone_change';
      ({ error } = await SB.auth.updateUser({ phone }));
    } else {
      ({ error } = await SB.auth.signInWithOtp({ phone: cur }));
    }
    if (error) return { ok: false, error };
    detailChange = { phone, type };
    return { ok: true, phone, type };
  };
  const verifyDetailOtp = async (token) => {
    if (!SB || !detailChange) return { ok: false };
    const { data, error } = await SB.auth.verifyOtp({ phone: detailChange.phone, token, type: detailChange.type });
    if (error || !data || !data.user) return { ok: false, error };
    detailChange = null;
    return { ok: true };
  };

  // ---- Card payment via Stripe Checkout (server creates the session; we redirect) ----
  const SB_FN = 'https://gcqkkruzgxpqpqxeymqx.supabase.co/functions/v1/';
  const SB_ANON = 'sb_publishable_cRcQdQ7ZPXQMUoBOGm71DA_2d22DyLu';
  const stripeCheckout = async (kind, ref) => {
    try {
      const r = await fetch(SB_FN + 'create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SB_ANON, 'Authorization': 'Bearer ' + SB_ANON },
        body: JSON.stringify({ kind, ref, origin: location.origin }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d && d.url) { location.href = d.url; return true; }
      console.warn('[Incenso] checkout failed', r.status, d);
      alert('Card payment couldn’t start' + (d && (d.error || d.detail) ? ' (' + (d.detail || d.error) + ')' : '') + '. Please try again in a moment, or choose another payment method.');
      return false;
    } catch (e) {
      console.warn('[Incenso] checkout error', e);
      alert('Card payment couldn’t start — please check your connection and try again.');
      return false;
    }
  };

  window.IncensoAuth = { get, set, flush, removeRestock, resync, signedIn, open, close, signOut, tierFor, nextTier, yearSpend, orderTotal, payLabel, nextRef, TIERS, sync: syncButtons, findByPhone, all, hydrate, sendDetailOtp, verifyDetailOtp, stripeCheckout, exArr };

  // ---- Newsletter subscribe (persists to Supabase; members pass straight through) ----
  document.addEventListener('submit', (e) => {
    const nf = e.target && e.target.id === 'newsForm' ? e.target : null;
    if (!nf) return;
    e.preventDefault(); e.stopPropagation();
    const raw = nf.email.value; const dd = raw.replace(/\D/g, '');
    if (raw.includes('+')) { nf.email.setCustomValidity('Just the number — the country code is picked on the left'); nf.email.reportValidity(); return; }
    if (dd.length < 6 || dd.length > 12) { nf.email.setCustomValidity('Enter a valid phone number'); nf.email.reportValidity(); return; }
    const cc = nf.querySelector('.pc-cc');
    const full = ((cc ? cc.value : '') + ' ' + raw.trim()).trim();
    const done = () => { nf.innerHTML = '<span class="news-done">Noted ✦ We’ll keep you up to date</span>'; };
    if (SB) { SB.from('newsletter').upsert({ phone: e164(full) }, { onConflict: 'phone' }).then(() => {}, () => {}); }
    const accDigits = acc ? digits(acc.phone) : '';
    if (acc && accDigits && (accDigits === dd || accDigits.endsWith(dd) || dd.endsWith(accDigits))) { done(); return; }
    open(done, full);
  }, true);

  // ---- Session reconcile on load ----
  const boot = async () => {
    syncButtons();
    if (!SB) return;
    try {
      const { data: { session } } = await SB.auth.getSession();
      if (session && session.user) {
        currentUid = session.user.id;
        if (!acc) {
          const a = await hydrate(session.user.id);
          if (a) { acc = a; writeLocal(a); try { localStorage.setItem(SKEY, '1'); } catch (e) {}
            if (!sessionStorage.getItem('incenso-hydrated')) { try { sessionStorage.setItem('incenso-hydrated', '1'); } catch (e) {} location.reload(); return; }
          }
        } else {
          hydrate(session.user.id).then((a) => { if (a) { acc = a; writeLocal(a); document.dispatchEvent(new Event('account:updated')); } });
        }
        try { localStorage.setItem(SKEY, '1'); } catch (e) {}
      } else if (acc) {
        acc = null; writeLocal(null); try { localStorage.setItem(SKEY, '0'); } catch (e) {}
      }
    } catch (e) { console.warn('[Incenso] auth boot', e); }
    syncButtons();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
