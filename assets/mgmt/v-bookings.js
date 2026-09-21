/* Incenso Management — Bookings list + Clients */
(() => {
  const M = window.IncensoMgmt, U = window.MgmtUI, { el, esc, icon, pill } = U;
  const money = (n) => M.may('amounts') ? M.money(n) : '';
  const bs = { f: 'upcoming', q: '', staff: 'all' };
  const isOpen = (b) => !['settled', 'cancelled', 'no-show'].includes(b.status);
  const dayLabel = (iso) => { const d = Math.floor((new Date(iso).setHours(0, 0, 0, 0) - M.T0) / M.DAY); return d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : M.fmtDay(iso); };
  const grouped = (list, fn) => { const out = []; let cur = null; list.forEach((b) => { const k = M.lkey(b.start); if (k !== cur) { cur = k; out.push('<div class="row nolead" style="min-height:0;padding:10px 16px 4px;background:rgba(0,0,0,.025)"><span class="eyebrow">' + esc(dayLabel(b.start)) + '</span><span class="ref">' + list.filter((x) => M.lkey(x.start) === k).length + '</span></div>'); } out.push(fn(b)); }); return out; };

  // Bookings live on the calendar (Home). #/bookings/:ref deep-links open the booking sheet on top of it.
  const exportCsv = () => U.csv('bookings', [['Ref', 'Date', 'Time', 'Client', 'Phone', 'Chair', 'Services', 'Minutes', 'Price', 'Final', 'Pay', 'Pay status', 'Status', 'Source']].concat(M.db.bookings.map((b) => [b.ref, M.fmtDate(b.start), M.fmtTime(b.start), M.client(b.clientId).name, M.client(b.clientId).phone, b.staff, b.services.map((s) => s.name).join('; '), b.mins, b.price, b.final == null ? '' : b.final, M.PAY_LABEL[b.pay], b.payStatus, b.status, b.source])));
  // History sheet: awaiting payment / past / cancelled — the only lists the calendar can't show at a glance
  const history = () => {
    const me = M.myStaff(); const seen = new Set(); const all = M.db.bookings.filter((b) => (!me || b.staff === me) && (bs.staff === 'all' || b.staff === bs.staff)).filter((b) => { const k = b.visit || b.ref; if (seen.has(k)) return false; seen.add(k); return true; }); const now = new Date().toISOString();
    const sets = {
      held: all.filter((b) => b.status === 'held' || (b.extra || []).some((x) => x.status === 'pending' && x.pay !== 'cash')).sort((a, b) => a.start < b.start ? -1 : 1),
      past: all.filter((b) => b.status === 'settled' || (b.start < now && isOpen(b))).sort((a, b) => a.start < b.start ? 1 : -1),
      cancelled: all.filter((b) => b.status === 'cancelled' || b.status === 'no-show').sort((a, b) => a.start < b.start ? 1 : -1),
    };
    if (bs.f === 'upcoming') bs.f = 'past';
    const body = el('<div class="stack"></div>'); body.appendChild(U.search('Search name, phone or BK ref', (q) => { bs.q = q; draw(); }));
    body.appendChild(U.chips([{ v: 'held', l: 'Awaiting payment', n: sets.held.length }, { v: 'past', l: 'Past' }, { v: 'cancelled', l: 'Cancelled' }], bs.f, (v) => { bs.f = v; draw(); }));
    const host = el('<div></div>'); body.appendChild(host);
    const draw = () => {
      let list = sets[bs.f] || [];
      if (bs.q) list = all.filter((b) => (M.client(b.clientId).name + ' ' + M.client(b.clientId).phone + ' ' + b.ref + ' ' + b.staff + ' ' + b.services.map((s) => s.name).join(' ')).toLowerCase().includes(bs.q)).sort((a, b) => a.start < b.start ? 1 : -1);
      host.innerHTML = '';
      const unsettled = bs.f === 'past' && !bs.q ? list.filter((b) => isOpen(b)) : [];
      if (unsettled.length) host.appendChild(U.card('Not closed yet', unsettled.map((b) => M.bookingRow(b)), '<span class="pill warn">' + unsettled.length + '</span>'));
      const rest = list.filter((b) => !unsettled.includes(b));
      host.appendChild(U.card(null, rest.length ? grouped(rest.slice(0, 60), (b) => M.bookingRow(b)) : U.empty(bs.q ? 'No matches' : 'Nothing here')));
    };
    draw();
    U.sheet({ title: 'Booking history', sub: 'Everything not on the calendar', body, foot: me ? null : '<button class="btn ghost wide" data-exp>' + icon('download') + 'Export all bookings (CSV)</button>' }).el.querySelectorAll('[data-exp]').forEach((x) => x.onclick = exportCsv);
  };
  M.bookingHistory = history; M.exportBookings = exportCsv;
  M.views.bookings = { title: 'Bookings', render(ctx) { M.views.home.render(ctx); if (ctx.param) M.openBooking(ctx.param); } };
  M.views.booking = { title: 'Booking', render(ctx) { location.hash = '#/bookings/' + ctx.param; } };

  // ---- clients ----
  const cs = { q: '', sort: 'name', tag: 'all' };
  // Tags are derived from behaviour — never set by hand
  const autoTags = (c) => { const bks = M.db.bookings.filter((x) => x.clientId === c.id); const settled = bks.filter((x) => x.status === 'settled'); const lastV = settled.map((x) => x.start).sort().pop(); const t = []; const sp = M.spend12(c.id); if (M.tierFor(sp) === 'Gold') t.push('VIP'); if (new Date(c.since) > new Date(Date.now() - 30 * M.DAY) || settled.length <= 1) t.push('New'); else if (settled.length >= 6) t.push('Regular'); if (lastV && Date.now() - new Date(lastV) > 60 * M.DAY) t.push('Lapsed'); if (bks.filter((x) => x.status === 'no-show').length >= 2) t.push('No-shows'); if (c.birthday && bdays(c) <= 30) t.push('Birthday soon'); return t; };
  M.autoTags = autoTags;
  const bdays = (c) => { if (!c.birthday) return 999; const t = new Date(); const b = new Date(c.birthday); b.setFullYear(t.getFullYear()); if (b < new Date(M.T0)) b.setFullYear(t.getFullYear() + 1); return Math.round((b - M.T0) / M.DAY); };
  M.views.clients = { title: 'Clients', render(ctx) {
    const R = ctx.root; const me = M.myStaff();
    const spend = {}; M.db.clients.forEach((c) => { spend[c.id] = M.spend12(c.id); });
    const last = {}; M.db.bookings.forEach((b) => { if (b.status === 'settled' && (!last[b.clientId] || b.start > last[b.clientId])) last[b.clientId] = b.start; });
    const lapsed = M.db.clients.filter((c) => last[c.id] && Date.now() - new Date(last[c.id]) > 60 * M.DAY);
    const head = el('<div class="spread"><div style="flex:1"></div><div class="inline">' + (me ? '' : '<button class="btn sm soft" data-exp>' + icon('download') + '</button><button class="btn sm" data-add>' + icon('plus') + 'Add</button>') + '</div></div>'); head.firstChild.appendChild(U.search('Search name or phone', (q) => { cs.q = q; draw(); })); if (!me) { head.querySelector('[data-add]').onclick = addClient; head.querySelector('[data-exp]').onclick = () => U.csv('clients', [['Name', 'Phone', 'Email', 'Birthday', 'Level', 'Spend 12m', 'Last visit', 'Tags', 'Notes']].concat(M.db.clients.map((c) => [c.name, c.phone, c.email, c.birthday, M.tierFor(spend[c.id]), spend[c.id], last[c.id] ? M.fmtDate(last[c.id]) : '', (c.tags || []).join('; '), c.notes]))); } R.appendChild(head);
    const all = M.db.clients; const recentN = all.filter((c) => (last[c.id] && Date.now() - new Date(last[c.id]) <= 30 * M.DAY) || new Date(c.since) > new Date(Date.now() - 30 * M.DAY)).length; const spendN = all.filter((c) => spend[c.id] > 0).length; const bdayN = all.filter((c) => c.birthday && bdays(c) <= 30).length;
    R.appendChild(U.chips([{ v: 'name', l: 'All', n: all.length }, { v: 'recent', l: 'Recent', n: recentN }, { v: 'spend', l: 'Top spend', n: spendN }].concat(M.db.settings.tiers.map((t) => ({ v: 'tier:' + t.name, l: t.name, n: all.filter((c) => M.tierFor(spend[c.id]) === t.name).length }))).concat([{ v: 'lapsed', l: 'Lapsed', n: lapsed.length }, { v: 'birthday', l: 'Birthdays soon', n: bdayN }, { v: 'blocked', l: 'Blocked', n: all.filter((c) => c.blocked).length }]), cs.sort, (v) => { cs.sort = v; draw(); }));
    const host = el('<div></div>'); R.appendChild(host);
    const draw = () => {
      let list = M.db.clients.filter((c) => !cs.q || (c.name + ' ' + c.phone + ' ' + (c.email || '')).toLowerCase().includes(cs.q));
      if (cs.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name)); else if (cs.sort === 'spend') list = list.filter((c) => spend[c.id] > 0).sort((a, b) => spend[b.id] - spend[a.id]); else if (cs.sort === 'birthday') list = list.filter((c) => c.birthday && bdays(c) <= 30).sort((a, b) => bdays(a) - bdays(b)); else if (cs.sort === 'lapsed') list = lapsed.slice().sort((a, b) => last[a.id] < last[b.id] ? -1 : 1); else if (cs.sort === 'blocked') list = list.filter((c) => c.blocked); else if (cs.sort.startsWith('tier:')) list = list.filter((c) => M.tierFor(spend[c.id]) === cs.sort.slice(5)).sort((a, b) => a.name.localeCompare(b.name)); else if (cs.sort.startsWith('tag:')) list = list.filter((c) => (c.tags || []).includes(cs.sort.slice(4))); else list = list.filter((c) => (last[c.id] && Date.now() - new Date(last[c.id]) <= 30 * M.DAY) || new Date(c.since) > new Date(Date.now() - 30 * M.DAY)).sort((a, b) => (last[b.id] || b.since) < (last[a.id] || a.since) ? -1 : 1);
      host.innerHTML = ''; host.appendChild(U.card(null, list.length ? list.map((c) => U.row({ href: '#/client/' + c.id, lead: U.clientAvatar(c, 'lg'), title: esc(c.name) + (c.blocked ? ' <span class="pill bad plain" style="height:16px;font-size:8.5px">blocked</span>' : '') + autoTags(c).map((t) => ' <span class="pill dim plain" style="height:16px;font-size:8.5px">' + esc(t) + '</span>').join(''), sub: esc(c.phone) + (cs.sort === 'birthday' ? ' · birthday in ' + bdays(c) + 'd' : last[c.id] ? ' · last visit ' + esc(dayLabel(last[c.id])) : ' · no visits yet'), end: '<span class="amt">' + (me ? '' : money(spend[c.id])) + '</span><span class="pill dim plain">' + esc(M.tierFor(spend[c.id])) + '</span>' })) : U.empty('No clients found')));
    };
    draw();
  } };
  const addClient = async () => { const r = await U.prompt({ title: 'New client', ok: 'Add client', fields: [{ name: 'name', label: 'Name', required: true }, { name: 'phone', label: 'WhatsApp number', type: 'tel', required: true, placeholder: '+961 …' }, { name: 'email', label: 'Email', type: 'email', opt: true }, { name: 'birthday', label: 'Birthday', type: 'date', opt: true }, { name: 'notes', label: 'Notes', type: 'textarea', opt: true }] }); if (!r) return; const dup = M.db.clients.find((c) => c.phone.replace(/\s/g, '') === r.phone.replace(/\s/g, '')); if (dup) { U.toast('That number is already ' + dup.name); location.hash = '#/client/' + dup.id; return; } const c = Object.assign({ id: 'c' + Date.now(), tier: 'Member', since: new Date().toISOString(), tags: ['New'], blocked: false, photo: null }, r); M.db.clients.push(c); M.log('Client added', c.name, M.user().name); M.save(); location.hash = '#/client/' + c.id; };

  M.views.client = { title: 'Client', render(ctx) {
    const c = M.db.clients.find((x) => x.id === ctx.param); if (!c) { location.hash = '#/clients'; return; }
    const me = M.myStaff(); const R = ctx.root; ctx.title(''); document.title = c.name + ' — Incenso Studio management'; const canEdit = !me;
    const bks = M.db.bookings.filter((b) => b.clientId === c.id && (!me || b.staff === me)).sort((a, b) => a.start < b.start ? 1 : -1);
    const ords = M.db.orders.filter((o) => o.clientId === c.id).sort((a, b) => a.placedAt < b.placedAt ? 1 : -1);
    const gifts = M.db.gifts.filter((g) => g.buyerId === c.id || g.toPhone === c.phone);
    const sp = M.spend12(c.id); const tier = M.tierFor(sp); const next = M.db.settings.tiers.find((t) => t.min > sp);
    const settledB = bks.filter((b) => b.status === 'settled'); const fav = {}; settledB.forEach((b) => { fav[b.staff] = (fav[b.staff] || 0) + 1; b.services.forEach((s) => { fav['svc:' + s.name] = (fav['svc:' + s.name] || 0) + 1; }); }); const favStaff = Object.keys(fav).filter((k) => !k.startsWith('svc:')).sort((a, b) => fav[b] - fav[a])[0]; const favSvc = Object.keys(fav).filter((k) => k.startsWith('svc:')).sort((a, b) => fav[b] - fav[a])[0];
    const head = el('<div class="card pad"><div class="spread"><div class="inline">' + (c.photo ? U.thumb(c.photo, 'circle').replace('class="thumb', 'style="width:44px;height:44px" class="thumb') : '<span class="avatar" style="width:44px;height:44px;font-size:14px">' + esc(U.initials(c.name)) + '</span>') + '<div><b style="font-size:17px">' + esc(c.name) + '</b><div class="note">' + esc(c.phone) + (c.email ? ' · ' + esc(c.email) : '') + '</div></div></div><div class="inline"><a class="icon-btn" href="' + U.wa(c.phone) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon('wa') + '</a>' + (canEdit ? '<button class="icon-btn" data-edit aria-label="Edit">' + icon('edit') + '</button>' : '') + '</div></div><div class="tagrow" style="margin-top:10px">' + (c.blocked ? '<span class="pill bad">Blocked online</span>' : '') + autoTags(c).map((t) => '<span class="pill dim plain">' + esc(t) + '</span>').join('') + '</div><div class="hr" style="margin:12px 0"></div><dl class="kv"><dt>Level</dt><dd>' + esc(tier) + (next && M.may('amounts') ? ' <span class="ref">' + M.money(next.min - sp) + ' to ' + esc(next.name) + '</span>' : '') + '</dd>' + (M.may('amounts') ? '<dt>Spend · 12 months</dt><dd class="mono">' + M.money(sp) + '</dd>' : '') + '<dt>Visits</dt><dd>' + settledB.length + ' settled · ' + bks.filter((b) => b.status === 'no-show').length + ' no-show</dd>' + (favStaff ? '<dt>Usually with</dt><dd>' + esc(favStaff) + (favSvc ? ' · ' + esc(favSvc.slice(4)) : '') + '</dd>' : '') + (c.birthday ? '<dt>Birthday</dt><dd>' + esc(new Date(c.birthday).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })) + (bdays(c) <= 14 ? ' <span class="pill warn plain">in ' + bdays(c) + 'd</span>' : '') + '</dd>' : '') + '<dt>Member since</dt><dd>' + esc(M.fmtDate(c.since)) + '</dd></dl></div>');
    if (canEdit) { head.querySelector('[data-edit]').onclick = () => editClient(c); }
    R.appendChild(head);
    const amounts = M.may('amounts');
    // Level — same view as the account page
    if (!me) { const tiers = M.db.settings.tiers; const cur = tiers.find((t) => t.name === tier) || tiers[0]; const pct = next ? Math.min(100, Math.round((sp - cur.min) / Math.max(1, next.min - cur.min) * 100)) : 100;
      R.appendChild(el('<div class="card pad"><div class="spread"><h3>Level</h3><span class="pill dim plain">' + esc(tier) + (cur.rate ? ' · ' + Math.round(cur.rate * 100) + '% off' : '') + '</span></div><div style="margin-top:10px;height:6px;border-radius:99px;background:var(--surface-2);overflow:hidden"><i style="display:block;height:100%;width:' + pct + '%;background:var(--fg)"></i></div><p class="note" style="margin-top:8px">' + (next ? (amounts ? M.money(next.min - sp) + ' more in the next 12 months reaches ' + esc(next.name) : 'On the way to ' + esc(next.name)) : 'Top level') + (cur.perk ? ' · ' + esc(cur.perk) : '') + '</p></div>')); }
    // Notes
    const notes = el('<div class="card pad"><div class="spread"><h3>Chair notes</h3><button class="btn sm soft" data-n>' + icon('edit') + 'Edit</button></div><p class="note" style="margin-top:6px' + (c.notes ? ';color:var(--fg)' : '') + '">' + (esc(c.notes) || 'Allergies, preferences, how they like their coffee.') + '</p></div>');
    notes.querySelector('[data-n]').onclick = async () => { const r = await U.prompt({ title: 'Chair notes', fields: [{ name: 'notes', label: 'Visible to every chair', type: 'textarea', value: c.notes }] }); if (r) { c.notes = r.notes; M.save(); } };
    R.appendChild(notes);
    // Gift cards — received (spendable) and sent
    if (!me) { const mine = gifts.filter((g) => M.digits(g.toPhone) === M.digits(c.phone)); const sent = gifts.filter((g) => g.buyerId === c.id && M.digits(g.toPhone) !== M.digits(c.phone)); const gb = mine.filter((g) => g.status === 'Active').reduce((a, g) => a + g.balance, 0);
      const gcard = U.card({ t: 'Gift balance', sub: M.money(gb) + ' spendable' }, mine.length ? mine.map((g) => U.row({ href: '#/gift/' + g.code, lead: '<span class="mono" style="font-size:10px">' + esc(g.code.slice(2)) + '</span>', title: 'From ' + esc(g.from), sub: M.money(g.balance) + ' of ' + M.money(g.amount) + ' left · expires ' + M.fmtDate(g.expiry), end: pill(g.status) })) : U.empty('No gift cards yet', 'Cards addressed to ' + c.phone + ' show here'), canEdit ? '<button class="link" data-gift>+ Add a card</button>' : '');
      const gbtn = gcard.querySelector('[data-gift]'); if (gbtn) gbtn.onclick = () => M.sellGift({ to: c.name, toPhone: c.phone, from: 'Incenso Studio' }); R.appendChild(gcard);
      if (sent.length) R.appendChild(U.card('Sent to others', sent.map((g) => U.row({ href: '#/gift/' + g.code, lead: '<span class="mono" style="font-size:10px">' + esc(g.code.slice(2)) + '</span>', title: 'To ' + esc(g.to), sub: M.money(g.balance) + ' of ' + M.money(g.amount) + ' left', end: pill(g.status) })))); }
    // Appointments — upcoming, then history
    const bkRow = (v) => U.row({ lead: '<span style="font-size:10px;text-align:center;line-height:1.2">' + new Date(v.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace(' ', '<br>') + '</span>', title: esc(v.services.map((s) => s.name).join(' + ')) + (v.products.length ? ' <span class="ref">+ products</span>' : ''), sub: esc(v.staff.join(' & ')) + ' · ' + M.fmtTime(v.start) + ' · ' + esc(v.ref) + (v.notes ? ' · ' + esc(v.notes) : ''), end: '<span class="amt">' + (amounts ? money(v.total) : '') + '</span>' + pill(v.status), onClick: () => M.openBooking(v.lead.ref) });
    const VS = M.visits(bks); const upcoming = VS.filter((v) => new Date(v.start) >= new Date() && !['settled', 'cancelled', 'no-show'].includes(v.status)).sort((a, b) => a.start < b.start ? -1 : 1); const history = VS.filter((v) => !upcoming.includes(v));
    R.appendChild(U.card({ t: 'Upcoming', sub: upcoming.length + ' booked' }, upcoming.length ? upcoming.map(bkRow) : U.empty('Nothing booked', 'Use the calendar to book for ' + c.name.split(' ')[0])));
    R.appendChild(U.card({ t: 'Visit history', sub: VS.filter((v) => v.status === 'settled').length + ' visits' }, history.length ? history.slice(0, 25).map(bkRow) : U.empty('No visits yet'), history.length > 25 ? '<span class="ref">latest 25</span>' : ''));
    // Orders + restock requests
    if (!me) { R.appendChild(U.card({ t: 'Orders', sub: ords.length + ' orders' }, ords.length ? ords.map((o) => U.row({ href: '#/order/' + o.ref, lead: '<span class="mono" style="font-size:10px">' + esc(o.ref.slice(2)) + '</span>', title: esc(o.items.map((i) => (i.qty > 1 ? i.qty + '× ' : '') + i.name).join(', ')), sub: M.fmtDay(o.placedAt) + ' · ' + esc(M.PAY_LABEL[o.method] || o.method), end: '<span class="amt">' + money(o.total) + '</span>' + pill(o.status) })) : U.empty('No orders yet')));
      const rs = (M.db.restocks || []).filter((r) => M.digits(r.phone) === M.digits(c.phone)); if (rs.length) R.appendChild(U.card('Waiting for restock', rs.map((r) => U.row({ title: esc(r.product), sub: 'asked ' + M.fmtDate(r.at) })))); }
    if (canEdit && M.may('refunds')) { const dz = el('<div class="actions"><button class="btn ghost" data-blk>' + (c.blocked ? 'Unblock online booking' : 'Block from online booking') + '</button><button class="btn danger" data-del>Delete client</button></div>'); dz.querySelector('[data-blk]').onclick = async () => { if (c.blocked || await U.confirm({ title: 'Block ' + c.name + '?', text: 'They can\u2019t book or order on the site; the desk still can. Existing bookings stay.', ok: 'Block', danger: true })) { c.blocked = !c.blocked; M.log(c.blocked ? 'Client blocked' : 'Client unblocked', c.name, M.user().name); M.save(); } }; dz.querySelector('[data-del]').onclick = async () => { if (await U.confirm({ title: 'Delete ' + c.name + '?', text: 'Profile and notes are removed; bookings and orders keep the name for the books. This cannot be undone.', ok: 'Delete', danger: true })) { M.db.clients = M.db.clients.filter((x) => x !== c); M.log('Client deleted', c.name, M.user().name); M.save(); location.hash = '#/clients'; } }; R.appendChild(dz); }
  } };
  const editClient = (c) => {
    const form = el('<form class="form"></form>'); const pic = U.imagePicker({ value: c.photo, label: 'Photo', shape: 'circle' }); form.appendChild(pic);
    [{ name: 'name', label: 'Name', value: c.name, required: true }, { name: 'phone', label: 'WhatsApp number', type: 'tel', value: c.phone, required: true }, { name: 'email', label: 'E-mail', type: 'email', value: c.email, required: true }, { name: 'birthday', label: 'Birthday', type: 'date', value: c.birthday, required: true, max: new Date().toISOString().slice(0, 10) }].forEach((f) => form.appendChild(U.field(f)));
    const foot = el('<div style="display:flex;gap:8px;width:100%"><button class="btn" data-o>Save</button></div>');
    const s = U.sheet({ title: 'Edit client', body: form, foot }); 
    foot.querySelector('[data-o]').onclick = (e) => { e.preventDefault(); if (!form.reportValidity()) return; if (!form.birthday.value) { U.toast('Pick their birthday'); return; } const dup = M.clientByPhone(form.phone.value); if (dup && dup.id !== c.id) { U.toast('That number already belongs to ' + dup.name); return; } M.setProfile(c.phone, { name: form.name.value, phone: form.phone.value, email: form.email.value, birthday: form.birthday.value, photo: pic.value() }); M.log('Client updated', c.name, M.user().name); M.save(); s.close(true); };
  };
})();
