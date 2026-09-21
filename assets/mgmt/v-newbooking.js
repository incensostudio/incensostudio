/* Incenso Management — desk booking / walk-in. Same rules and the same flow as /book:
   client · services (many, across categories) · a chair per category · when (calendar + free starts) · details · payment ·
   level discount · gift balance first · pay at studio / card link / Whish / OMT (held until min(24h, start)) · quotes paid at the studio. */
(() => {
  const M = window.IncensoMgmt, U = window.MgmtUI, { el, esc, icon } = U;
  const MOODS = ['Chat with your stylist', 'Enjoy the quiet'], SMOKES = ['I don\u2019t smoke', 'I\u2019ll bring my IQOS', 'Lend me an IQOS'];
  const FLAGS = ['Hijab \u2014 women-only studio, please', 'Allergies (say which below)', 'Fragrance-free products only', 'Pregnant or nursing', 'Recent colour, keratin or relaxer', 'Tight schedule \u2014 must leave on time', 'First time here', 'No photos of me, please'];
  M.PREFS = { MOODS, SMOKES, FLAGS };
  const hm = M.hm; const dayIso = (d) => new Date(M.T0 + d * M.DAY).toISOString();
  const worksOn = (s, iso) => { const sh = M.shiftFor(s, iso); return !!sh && !sh.off; };
  const cats = () => [...new Set(M.db.services.filter((s) => s.active).map((s) => s.cat))];
  const chairsFor = (c) => M.db.staff.filter((s) => s.active && s.cats.includes(c));
  const fmtT = (t) => String(Math.floor(t)).padStart(2, '0') + ':' + String(Math.round((t % 1) * 60)).padStart(2, '0');
  const dur = (m) => m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min';
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const price = (s) => s.price == null ? '<span class="bkf-q">quote</span>' : (s.from ? '<small>from</small>' : '') + M.money(s.price);

  const newBooking = (o) => {
    o = o || {};
    const E = o.edit ? o.edit.filter((x) => !['cancelled', 'no-show'].includes(x.status)) : null; const E0 = E && E[0];
    const svcId = (name) => { const x = M.db.services.find((y) => y.name === name); return x ? x.id : null; };
    if (E0) { o.clientId = E0.clientId; o.day = Math.round((new Date(E0.start).setHours(0, 0, 0, 0) - M.T0) / M.DAY); o.time = hm(E0.start); }
    const st = { clientId: o.clientId || '', newGuest: false, cq: '', svcs: [], staffBy: {}, date: M.lkey(dayIso(o.day || 0)), time: o.time != null ? fmtT(o.time) : (o.walkIn ? fmtT(Math.ceil(hm(new Date().toISOString()) * 4) / 4) : ''), other: false, pay: E0 ? E0.pay : 'cash', gift: false, mood: '', flags: [], smoke: '', notes: E0 ? E0.notes || '' : '', cat: cats()[0], q: '' };
    const exceptRefs = E ? E.map((x) => x.ref) : null; const paidAlready = E ? E.reduce((a, x) => a + x.paid + x.gift + (x.extra || []).filter((e) => e.status === 'paid').reduce((q, e) => q + e.amount, 0), 0) : 0;
    if (E) { E.forEach((x) => { x.services.forEach((sv) => { const id = svcId(sv.name); if (id && !st.svcs.includes(id)) st.svcs.push(id); }); st.staffBy[x.cat] = x.staff; }); const p = E0.prefs; if (p) { st.mood = p.mood || ''; st.flags = (p.flags || []).slice(); st.smoke = p.smoke || ''; } if (st.svcs.length) st.cat = M.db.services.find((y) => y.id === st.svcs[0]).cat; }
    const v0 = new Date(st.date + 'T00:00:00'); const view = { y: v0.getFullYear(), m: v0.getMonth() };
    if (o.staff) { const s = M.staffOf(o.staff); if (s) { st.cat = s.cats[0]; st.staffBy[s.cats[0]] = s.name; } }
    const sel = () => st.svcs.map((id) => M.db.services.find((s) => s.id === id)).filter(Boolean);
    const selCats = () => [...new Set(sel().map((s) => s.cat))];
    const client = () => st.clientId ? M.client(st.clientId) : null;
    const gross = () => sel().reduce((a, s) => a + (s.price || 0), 0);
    const disc = () => client() ? M.discountFor(client().id) : { rate: 0, name: '' };
    const net = () => Math.round(gross() * (1 - disc().rate));
    const anyQuote = () => sel().some((s) => s.price == null), anyFrom = () => sel().some((s) => s.from);
    const quoteOnly = () => anyQuote() && net() === 0;
    const giftBal = () => client() ? M.giftBalance(client()) : 0;
    const giftAmt = () => st.gift ? Math.min(giftBal(), net()) : 0;
    const toPay = () => Math.max(0, net() - giftAmt());
    const totalMins = () => sel().reduce((a, s) => a + s.mins, 0);
    const startDate = () => { if (!st.date || !st.time) return null; const [hh, mm] = st.time.split(':').map(Number); const d = new Date(st.date + 'T00:00:00'); d.setHours(hh, mm, 0, 0); return d; };
    const perms = (a) => a.length <= 1 ? [a] : a.flatMap((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).map((p) => [x].concat(p)));
    const segFits = (g) => { const stf = M.staffOf(g.staff); if (!stf) return false; const sh = M.shiftFor(stf, g.start.toISOString()); const tt = hm(g.start.toISOString()); return sh && !sh.off && tt >= sh.start && tt + g.mins / 60 <= sh.end && !M.overlaps(g.staff, g.start, g.mins, exceptRefs).length; };
    // Chairs run back to back in whichever order the day allows — first ordering where every chair is free wins (picked order when it fits)
    const segments = (from) => { if (!from) return planFor(selCats(), from); const orders = perms(selCats()); for (const o of orders) { const plan = planFor(o, from); if (plan.every(segFits)) return plan; } return planFor(selCats(), from); };
    const planFor = (order, from) => { const out = []; let t = from ? from.getTime() : 0; order.forEach((c) => { const svcs = sel().filter((s) => s.cat === c); const mins = svcs.reduce((a, s) => a + s.mins, 0); let staff = st.staffBy[c]; if (!staff || staff === 'any') staff = firstFree(c, from ? new Date(t) : null, mins); out.push({ cat: c, staff, svcs, mins, start: from ? new Date(t) : null }); t += mins * 6e4; }); return out; };
    const firstFree = (c, start, mins) => { const team = chairsFor(c); if (!start) return team[0] ? team[0].name : ''; const iso = start.toISOString(); const ok = team.filter((s) => worksOn(s, iso) && !M.overlaps(s.name, start, mins, exceptRefs).length); return (ok[0] || team.find((s) => worksOn(s, iso)) || team[0] || {}).name || ''; };
    const problems = () => { const from = startDate(); if (!from) return []; return segments(from).map((g) => { const s = M.staffOf(g.staff); if (!s) return null; const sh = M.shiftFor(s, g.start.toISOString()); const t = hm(g.start.toISOString()); const off = !sh || sh.off; const outside = !off && (t < sh.start || t + g.mins / 60 > sh.end); const clash = M.overlaps(g.staff, g.start, g.mins, exceptRefs); return off ? g.staff + ' is off that day' : outside ? g.staff + ' is not working at ' + M.fmtTime(g.start.toISOString()) : clash.length ? g.staff + ' has ' + (clash[0].label || M.client(clash[0].clientId).name) + ' at ' + M.fmtTime(clash[0].start) : null; }).filter(Boolean); };
    const freeStartsOn = (dateKey) => { if (!dateKey || !sel().length || M.isStudioClosed(dateKey + 'T12:00:00')) return []; const d0 = new Date(dateKey + 'T00:00:00'); const H = M.hoursForDate(dateKey + 'T12:00:00'); if (H.closed) return []; const total = totalMins(); const out = []; for (let t = H.open; t + total / 60 <= H.close + 1e-9; t += 0.5) { const s = new Date(d0); s.setHours(Math.floor(t), Math.round((t % 1) * 60), 0, 0); if (s < new Date()) continue; const segs = segments(s); if (segs.every(segFits)) out.push(fmtT(t)); } return out; };
    const freeStarts = () => freeStartsOn(st.date);

    if (E && st.time && !o.walkIn && !freeStarts().includes(st.time)) st.other = true;
    const body = el('<div class="bkf"></div>');
    const step = (n, id, t) => '<section class="bkf-step" data-step="' + id + '"><div class="bkf-head"><p class="bkf-eyebrow"><span class="n">0' + n + '</span>' + t + '</p><span class="bkf-sum" data-sum="' + id + '"></span></div><div data-' + id + '></div></section>';
    body.innerHTML = step(1, 'client', 'Client') + step(2, 'svcs', 'Service') + step(3, 'staff', 'With') + step(4, 'when', 'When') + step(5, 'prefs', 'Details') + step(6, 'pay', 'Payment') + '<aside class="bkf-summary" data-summary></aside>';
    const Q = (s) => body.querySelector(s);
    const lock = () => { const hasSvc = !!sel().length, hasWhen = o.walkIn || !!startDate(); ['staff', 'when', 'prefs'].forEach((k) => Q('[data-step="' + k + '"]').classList.toggle('locked', !hasSvc)); Q('[data-step="pay"]').classList.toggle('locked', !hasSvc || !hasWhen); };

    // 1 · client — shared picker (same as Sell and gift cards); locked while editing a visit
    let picker = null;
    const renderClient = () => {
      const host = Q('[data-client]'); host.innerHTML = '';
      picker = U.clientPicker({ clientId: st.clientId, locked: !!E, onChange: (ps) => { st.clientId = ps.clientId || ''; st.newGuest = ps.newGuest; st.gift = false; if (st.clientId) { const p = client().prefs; if (p) { st.mood = p.mood || ''; st.flags = (p.flags || []).slice(); st.smoke = p.smoke || ''; renderPrefs(); } } renderPay(); renderSummary(); sums(); } });
      host.appendChild(picker.el); host.addEventListener('input', sums);
    };
    // 2 · services — search, category tabs, checkbox list grouped
    const renderSvcs = () => {
      const host = Q('[data-svcs]'); host.innerHTML = '';
      host.insertAdjacentHTML('beforeend', '<div class="bkf-search">' + icon('search') + '<input type="search" placeholder="Search all services\u2026" autocomplete="off" value="' + esc(st.q) + '"></div><div class="bkf-cats" role="group"></div><div class="bkf-svc"></div><p class="bkf-note">Pick more than one \u2014 chairs line up back to back in a single visit.</p>');
      const tabs = host.querySelector('.bkf-cats'); cats().forEach((c) => { const n = sel().filter((s) => s.cat === c).length; const b = el('<button type="button" class="bkf-cat" aria-pressed="' + (c === st.cat && !st.q) + '">' + esc(c) + (n ? '<span class="cnt">' + n + '</span>' : '') + '</button>'); b.onclick = () => { st.cat = c; st.q = ''; renderSvcs(); }; tabs.appendChild(b); });
      host.querySelector('input').oninput = (e) => { st.q = e.target.value; drawList(); tabs.querySelectorAll('.bkf-cat').forEach((b) => b.setAttribute('aria-pressed', !st.q && b.textContent.replace(/\d+$/, '') === st.cat)); };
      const L = host.querySelector('.bkf-svc');
      const drawList = () => { L.innerHTML = ''; const q = st.q.trim().toLowerCase(); const items = M.db.services.filter((s) => s.active && (q ? (s.name + ' ' + s.group + ' ' + s.cat).toLowerCase().includes(q) : s.cat === st.cat)); let grp = ''; items.forEach((s) => { if (!q && s.group !== grp) { grp = s.group; L.insertAdjacentHTML('beforeend', '<p class="bkf-group">' + esc(grp) + '</p>'); } const on = st.svcs.includes(s.id); const r = el('<button type="button" aria-pressed="' + on + '"><span class="bx">' + icon('check') + '</span><span class="nm">' + esc(s.name) + '<small>' + s.mins + ' min' + (q ? ' · ' + esc(s.cat) : '') + '</small></span><span class="pr">' + price(s) + '</span></button>'); r.onclick = () => { st.svcs = on ? st.svcs.filter((x) => x !== s.id) : st.svcs.concat(s.id); Object.keys(st.staffBy).forEach((c) => { if (!selCats().includes(c)) delete st.staffBy[c]; }); if (st.time && !o.walkIn && !st.other && !freeStarts().includes(st.time)) st.time = ''; renderSvcs(); renderStaff(); renderWhen(); renderPay(); renderSummary(); sums(); lock(); }; L.appendChild(r); }); if (!items.length) L.innerHTML = '<p class="bkf-none">Nothing matches.</p>'; };
      drawList();
    };
    // 3 · a chair per category
    const renderStaff = () => {
      const host = Q('[data-staff]'); host.innerHTML = ''; const cs = selCats();
      if (!cs.length) { host.innerHTML = '<p class="bkf-note">Pick services first.</p>'; return; }
      cs.forEach((c) => { const team = chairsFor(c); const w = el('<div class="bkf-row">' + (cs.length > 1 ? '<p class="bkf-sg">' + esc(c) + '</p>' : '') + '<div class="bkf-pills"></div></div>'); const P = w.querySelector('.bkf-pills'); const opts = team.length > 1 ? [{ name: 'any', label: 'First available' }].concat(team) : team; if (team.length === 1) st.staffBy[c] = team[0].name; opts.forEach((s) => { const cur = st.staffBy[c] || 'any'; const b = el('<button type="button" class="bkf-pill" aria-pressed="' + (cur === s.name) + '">' + esc(s.label || s.name) + (s.name !== 'any' && st.date && !worksOn(s, st.date + 'T12:00:00') ? '<small>off</small>' : '') + '</button>'); b.onclick = () => { st.staffBy[c] = s.name; if (st.time && !o.walkIn && !st.other && !freeStarts().includes(st.time)) st.time = ''; renderStaff(); renderWhen(); renderPay(); renderSummary(); sums(); lock(); }; P.appendChild(b); }); host.appendChild(w); });
      host.insertAdjacentHTML('beforeend', '<p class="bkf-note">' + (cs.length > 1 ? 'The visit spans ' + esc(cs.join(' and ')) + ' \u2014 ask for someone by name for each, or let the soonest hands line up back to back.' : 'Ask for someone by name, or let the first free chair take it.') + '</p>');
    };
    // 4 · when — calendar + free starts (the desk may still type any time)
    const renderWhen = () => {
      const host = Q('[data-when]'); host.innerHTML = '';
      if (o.walkIn) { host.innerHTML = '<p class="bkf-note">Walk-in \u2014 starts now, ' + M.fmtTime(new Date().toISOString()) + '.</p>'; return; }
      if (!sel().length) { host.innerHTML = '<p class="bkf-note">Pick services first.</p>'; return; }
      const cal = el('<div class="bkf-cal"><div class="ch"><button type="button" class="nav" data-pm aria-label="Previous month">' + icon('left') + '</button><b></b><button type="button" class="nav" data-nm aria-label="Next month">' + icon('right') + '</button></div><div class="cg">' + ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((x) => '<span class="dow">' + x + '</span>').join('') + '</div></div>'); host.appendChild(cal);
      const today = key(new Date()); const first = new Date(view.y, view.m, 1); const pad = (first.getDay() + 6) % 7; const days = new Date(view.y, view.m + 1, 0).getDate(); const G = cal.querySelector('.cg');
      cal.querySelector('b').textContent = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      for (let i = 0; i < pad; i++) G.insertAdjacentHTML('beforeend', '<span></span>');
      for (let n = 1; n <= days; n++) { const d = new Date(view.y, view.m, n); const k = key(d); const past = k < today; const closed = M.isStudioClosed(k + 'T12:00:00'); const b = el('<button type="button" class="day' + (k === today ? ' today' : '') + '" aria-pressed="' + (k === st.date) + '"' + (past || closed ? ' disabled' : '') + '>' + n + '</button>'); b.onclick = () => { st.date = k; st.time = ''; renderStaff(); renderWhen(); renderPay(); renderSummary(); sums(); lock(); }; G.appendChild(b); }
      cal.querySelector('[data-pm]').onclick = () => { view.m -= 1; if (view.m < 0) { view.m = 11; view.y -= 1; } renderWhen(); }; cal.querySelector('[data-nm]').onclick = () => { view.m += 1; if (view.m > 11) { view.m = 0; view.y += 1; } renderWhen(); };
      const S = el('<div class="bkf-slotwrap"><p class="bkf-sg">' + esc(M.fmtDay(st.date + 'T12:00:00')) + ' · takes ' + dur(totalMins()) + '</p><div class="bkf-slots"></div></div>'); host.appendChild(S); const SL = S.querySelector('.bkf-slots');
      if (M.isStudioClosed(st.date + 'T12:00:00')) SL.innerHTML = '<div class="bkf-empty"><b>Closed that day.</b>Pick another day.</div>';
      else { const free = freeStarts(); if (!free.length) SL.innerHTML = '<div class="bkf-empty"><b>Nothing fits on this day.</b>Try another day or \u201cFirst available\u201d.</div>'; free.forEach((t) => { const b = el('<button type="button" class="bkf-slot" aria-pressed="' + (t === st.time && !st.other) + '">' + t + '</button>'); b.onclick = () => { st.time = t; st.other = false; renderWhen(); renderPay(); renderSummary(); sums(); lock(); }; SL.appendChild(b); }); }
      const oth = el('<div class="bkf-other">' + (st.other ? '<div class="field" style="max-width:160px"><label>Other time</label><input type="time" name="time" value="' + esc(st.time) + '"></div>' : '<button type="button" class="bkf-link">Another time (desk only)</button>') + '</div>'); host.appendChild(oth);
      if (st.other) oth.querySelector('input').onchange = (e) => { st.time = e.target.value; renderPay(); renderSummary(); sums(); lock(); const pr = problems(); Q('[data-when-warn]').innerHTML = pr.length ? pr.map(esc).join(' · ') + ' \u2014 the desk can still book it.' : ''; }; else oth.querySelector('button').onclick = () => { st.other = true; renderWhen(); setTimeout(() => { const i = host.querySelector('input[type=time]'); if (i) i.focus(); }, 50); };
      const pr = problems(); host.insertAdjacentHTML('beforeend', '<p class="bkf-note" style="color:var(--warn)" data-when-warn>' + (pr.length ? pr.map(esc).join(' · ') + ' \u2014 the desk can still book it.' : '') + '</p>');
    };
    // 5 · details
    const renderPrefs = () => {
      const host = Q('[data-prefs]'); host.innerHTML = '';
      const pills = (label, list, k, multi) => { const w = el('<div class="bkf-row"><p class="bkf-sg">' + label + '</p><div class="bkf-pills"></div></div>'); const P = w.querySelector('.bkf-pills'); list.forEach((x) => { const on = multi ? st[k].includes(x) : st[k] === x; const b = el('<button type="button" class="bkf-pill sm" aria-pressed="' + on + '">' + esc(x) + '</button>'); b.onclick = () => { if (multi) st[k] = on ? st[k].filter((y) => y !== x) : st[k].concat(x); else st[k] = on ? '' : x; renderPrefs(); }; P.appendChild(b); }); host.appendChild(w); };
      pills('While in the chair, would they rather\u2026', MOODS, 'mood'); pills('Good to know', FLAGS, 'flags', true); pills('Smoking \u2014 IQOS-only studio', SMOKES, 'smoke');
      const n = el('<div class="field"><label>Anything else? <span class="ref">optional</span></label><textarea name="notes" rows="2" placeholder="Which allergy, inspiration, how they like their coffee\u2026">' + esc(st.notes) + '</textarea></div>'); n.querySelector('textarea').oninput = (e) => { st.notes = e.target.value; }; host.appendChild(n);
    };
    // 6 · payment
    const renderPay = () => {
      const host = Q('[data-pay]'); host.innerHTML = ''; if (!sel().length) { host.innerHTML = '<p class="bkf-note">Pick services first.</p>'; return; }
      if (E && paidAlready) { const bal = net() - paidAlready; host.innerHTML = '<div class="bkf-locked">' + icon('lock') + '<span><b>' + M.money(paidAlready) + ' already paid</b> \u2014 ' + (bal > 0 ? M.money(bal) + ' more settles at the studio.' : bal < 0 ? M.money(-bal) + ' comes back to the client when the visit is settled.' : 'nothing more to pay.') + '</span></div>'; return; }
      if (giftBal() && !quoteOnly()) { const g = el('<div class="bkf-gift"><span><b>' + M.money(giftBal()) + '</b> gift balance on this account</span><button type="button" class="bkf-pill sm" aria-pressed="' + st.gift + '">' + (st.gift ? 'Using it' : 'Use it') + '</button></div>'); g.querySelector('button').onclick = () => { st.gift = !st.gift; renderPay(); renderSummary(); }; host.appendChild(g); }
      if (quoteOnly()) { st.pay = 'cash'; host.insertAdjacentHTML('beforeend', '<div class="bkf-locked">' + icon('lock') + '<span><b>Custom quote</b> \u2014 priced in the chair and paid at the studio. Nothing is taken now.</span></div>'); return; }
      if (giftAmt() && toPay() === 0) { st.pay = 'cash'; host.insertAdjacentHTML('beforeend', '<div class="bkf-locked">' + icon('lock') + '<span><b>Covered by gift balance</b> \u2014 nothing else to pay.</span></div>'); return; }
      const P = M.db.settings.payments; const opts = [['cash', 'Pay at the studio'], ['card', 'Card \u2014 Stripe link on WhatsApp'], ['whish', 'Whish Money'], ['omt', 'OMT Pay']].filter((x) => P[x[0]] !== false);
      if (giftAmt()) host.insertAdjacentHTML('beforeend', '<p class="bkf-sg">Settle the difference</p>');
      const W = el('<div class="bkf-pills col"></div>'); opts.forEach(([k, l]) => { const b = el('<button type="button" class="bkf-pill" aria-pressed="' + (st.pay === k) + '">' + l + '</button>'); b.onclick = () => { st.pay = k; renderPay(); }; W.appendChild(b); }); host.appendChild(W);
      const from = startDate(); const dl = (st.pay === 'whish' || st.pay === 'omt') ? new Date(Math.min(Date.now() + (M.transferHoursFor ? M.transferHoursFor(st.pay) : 24) * 36e5, from ? from.getTime() : Infinity)) : null;
      host.insertAdjacentHTML('beforeend', '<p class="bkf-note">' + ({ cash: 'Cash or card at the studio, after the visit.', card: 'The client gets a Stripe link on WhatsApp \u2014 confirms itself when paid.', whish: 'Transfer from Whish \u2014 confirmed by the desk once it lands.', omt: 'Transfer with OMT Pay \u2014 confirmed by the desk once it lands.' })[st.pay] + (dl ? ' Must land by <b>' + esc(M.fmtDT(dl.toISOString())) + '</b> or the slot is released.' : '') + (st.pay !== 'cash' && (anyFrom() || anyQuote()) ? ' Any difference against the final price is settled at the studio.' : '') + '</p>');
    };
    // summary — "Your appointment"
    const renderSummary = () => {
      const S = Q('[data-summary]'); const s = sel(); const d = disc(); const from = o.walkIn ? new Date() : startDate();
      const segs = s.length ? segments(from) : [];
      S.innerHTML = '<h2>The appointment</h2>' + (s.length ? '<div class="svcs">' + s.map((x) => '<div class="r"><span>' + esc(x.name) + '</span><span class="v mono">' + price(x) + '</span></div>').join('') + '</div>' : '<p class="bkf-note" style="margin:0 0 6px">No services yet.</p>') +
        '<div class="r"><span>With</span><span class="v">' + (segs.length ? esc(segs.map((g) => (g.staff || 'First available') + (segs.length > 1 ? ' (' + g.cat + ')' : '')).join(' · ')) : '\u2014') + '</span></div>' +
        '<div class="r"><span>When</span><span class="v">' + (from && s.length ? esc(M.fmtDay(from.toISOString()) + ' · ' + M.fmtTime(from.toISOString())) : '\u2014') + '</span></div>' +
        '<div class="r"><span>Takes</span><span class="v">' + (s.length ? dur(totalMins()) : '\u2014') + '</span></div>' +
        (d.rate && s.length ? '<div class="r"><span>' + esc(d.name) + ' · ' + Math.round(d.rate * 100) + '% off</span><span class="v mono">\u2212' + M.money(gross() - net()) + '</span></div>' : '') +
        '<div class="tot"><span>Total</span><span class="v mono">' + (quoteOnly() ? 'Quote' : (anyFrom() ? 'from ' : '') + M.money(net()) + (anyQuote() ? ' + quote' : '')) + '</span></div>' +
        (giftAmt() ? '<div class="r"><span>Gift balance</span><span class="v mono">\u2212' + M.money(giftAmt()) + '</span></div><div class="tot"><span>To pay</span><span class="v mono">' + M.money(toPay()) + '</span></div>' : '') +
        (anyFrom() ? '<p class="bkf-note">Starting prices \u2014 the final amount is confirmed in the chair.</p>' : '');
    };
    const sums = () => { const c = client(); const nm = Q('[name=cp-name]'); Q('[data-sum="client"]').textContent = c && !st.newGuest ? c.name : (nm && nm.value.trim()) || ''; Q('[data-sum="svcs"]').textContent = sel().map((s) => s.name).join(' + '); const cs = selCats(); Q('[data-sum="staff"]').textContent = cs.map((x) => (st.staffBy[x] && st.staffBy[x] !== 'any' ? st.staffBy[x] : 'First available')).join(' · '); Q('[data-sum="when"]').textContent = o.walkIn ? 'Now' : (st.date && st.time ? M.fmtDay(st.date + 'T12:00:00') + ' · ' + st.time : ''); Q('[data-sum="pay"]').textContent = sel().length ? ({ cash: 'At the studio', card: 'Card link', whish: 'Whish', omt: 'OMT' })[st.pay] : ''; };
    const renderAll = () => { renderClient(); renderSvcs(); renderStaff(); renderWhen(); renderPrefs(); renderPay(); renderSummary(); sums(); lock(); };
    renderAll();

    // Edit: reconcile the new segment plan with the existing rows — same category keeps its row (and its payments, products, status); dropped categories are cancelled; new ones are added
    let saved = false;
    const saveEdit = (segs, from) => { saved = true;
      const rate = disc().rate; const visitRef = E0.visit || E0.ref; const prefs = { mood: st.mood, flags: st.flags.slice(), smoke: st.smoke }; const c = client(); c.prefs = prefs;
      const used = new Set(); let letters = M.db.bookings.filter((x) => x.visit === visitRef).length;
      segs.forEach((g) => { const services = g.svcs.map((x) => ({ name: x.name, mins: x.mins, price: x.price, from: !!x.from })); const segGross = g.svcs.reduce((a, x) => a + (x.price || 0), 0); const p = Math.round(segGross * (1 - rate));
        let row = E.find((x) => x.cat === g.cat && !used.has(x)); if (row) { used.add(row); Object.assign(row, { staff: g.staff, services, start: g.start.toISOString(), mins: g.mins, price: p, gross: segGross, discount: segGross - p, notes: st.notes.trim(), prefs, quote: g.svcs.some((x) => x.price == null) }); if (row.pay === 'cash' && row.payStatus === 'unpaid') row.due = Math.max(0, p - row.gift); if (!paidAlready) { row.pay = st.pay; } return; }
        const nb = { ref: visitRef + String.fromCharCode(65 + letters++), visit: visitRef, cat: g.cat, clientId: c.id, staff: g.staff, services, start: g.start.toISOString(), mins: g.mins, price: p, gross: segGross, discount: segGross - p, level: disc().name, pay: paidAlready ? 'cash' : st.pay, paid: 0, due: 0, gift: 0, giftParts: [], extra: [], products: [], payStatus: 'unpaid', status: E0.status === 'held' ? 'held' : (E0.status === 'settled' ? 'confirmed' : E0.status), deadline: null, final: null, notes: st.notes.trim(), prefs, quote: g.svcs.some((x) => x.price == null), source: E0.source, placedAt: new Date().toISOString() };
        if (nb.pay === 'cash') nb.due = p; else nb.payStatus = 'pending'; M.db.bookings.push(nb); });
      E.filter((x) => !used.has(x)).forEach((x) => { if (x.paid || x.gift || (x.products || []).length) { const keep = E.find((y) => used.has(y)); if (keep) { keep.paid += x.paid; keep.gift += x.gift; keep.giftParts = (keep.giftParts || []).concat(x.giftParts || []); keep.extra = (keep.extra || []).concat(x.extra || []); keep.products = (keep.products || []).concat(x.products || []); if (keep.payStatus === 'unpaid' && (keep.paid || keep.gift)) keep.payStatus = keep.paid + keep.gift >= keep.price ? 'paid' : keep.payStatus; keep.due = keep.pay === 'cash' ? Math.max(0, keep.price - keep.paid - keep.gift) : 0; } } M.db.bookings = M.db.bookings.filter((y) => y !== x); });
      M.db.bookings.sort((x, y) => x.start < y.start ? -1 : 1);
      M.log('Visit updated', visitRef, M.user().name); M.save(); sh.close(true); U.toast('Visit updated \u2014 client messaged'); M.openBooking(M.db.bookings.find((x) => x.visit === visitRef || x.ref === visitRef).ref);
    };
    const foot = el('<div style="display:flex;gap:8px;width:100%"><button class="btn" type="button" data-o>' + (E ? 'Save changes' : o.walkIn ? 'Seat walk-in' : 'Book') + '</button></div>');
    const sh = U.sheet({ title: E ? 'Edit visit' : o.walkIn ? 'Walk-in' : 'New booking', sub: E ? esc(E0.visit || E0.ref) + ' · add or remove services, change chairs or the time' : o.walkIn ? 'Starts now · ' + M.fmtTime(new Date().toISOString()) : 'Same rules as the website', body, foot, wide: true, back: E ? () => M.openBooking(E0.ref) : null, onClose: () => { if (E && !saved) M.openBooking(E0.ref); } });
    foot.querySelector('[data-o]').onclick = async () => {
      let c = E ? client() : picker.commit(); if (!c) return; st.clientId = c.id;
      if (!sel().length) { U.toast('Pick at least one service'); return; }
      const from = o.walkIn ? new Date() : startDate(); if (!from) { U.toast('Pick a day and a time'); return; } if (M.isStudioClosed(from.toISOString())) { U.toast('The studio is closed that day'); return; }
      const segs = segments(from); if (segs.some((g) => !g.staff)) { U.toast('No chair does one of these categories'); return; }
      const pr = problems(); if (pr.length && !(await U.confirm({ title: 'Book anyway?', text: pr.map(esc).join('<br>'), ok: 'Book anyway' }))) return;
      if (E) { saveEdit(segs, from); return; }
      const rate = disc().rate, visit = M.nextRef('BK'), total = net(); let giftLeft = giftAmt(); const parts = giftLeft ? M.redeemGift(c, giftLeft, visit) : [];
      const deadline = (st.pay === 'whish' || st.pay === 'omt') ? new Date(Math.min(Date.now() + (M.transferHoursFor ? M.transferHoursFor(st.pay) : 24) * 36e5, from.getTime())).toISOString() : null;
      const prefs = { mood: st.mood, flags: st.flags.slice(), smoke: st.smoke }; c.prefs = prefs;
      segs.forEach((g, i) => {
        const services = g.svcs.map((x) => ({ name: x.name, mins: x.mins, price: x.price, from: !!x.from })); const segGross = g.svcs.reduce((a, x) => a + (x.price || 0), 0); const p = Math.round(segGross * (1 - rate)); const gift = Math.min(giftLeft, p); giftLeft -= gift; const rest = p - gift;
        const b = { ref: i === 0 ? visit : visit + String.fromCharCode(65 + i), visit, cat: g.cat, clientId: c.id, staff: g.staff, services, start: g.start.toISOString(), mins: g.mins, price: p, gross: segGross, discount: segGross - p, level: disc().name, pay: st.pay, paid: 0, due: 0, gift, giftParts: i === 0 ? parts : [], extra: [], products: [], payStatus: 'unpaid', status: o.walkIn ? 'in-chair' : 'confirmed', deadline: null, final: null, notes: st.notes.trim(), prefs, quote: g.svcs.some((x) => x.price == null), source: o.walkIn ? 'walk-in' : 'desk', placedAt: new Date().toISOString() };
        if (rest === 0) { b.payStatus = gift ? 'paid' : (b.quote ? 'unpaid' : 'paid'); }
        else if (st.pay === 'cash') b.due = rest;
        else if (st.pay === 'card') { b.payStatus = 'pending'; b.cardLink = true; }
        else if (gift) { b.extra.push({ amount: rest, pay: st.pay, status: 'pending', placedAt: b.placedAt, deadline }); b.payStatus = 'gift'; }
        else { b.payStatus = 'pending'; if (!o.walkIn) b.status = 'held'; b.deadline = deadline; }
        M.db.bookings.push(b);
      });
      M.db.bookings.sort((x, y) => x.start < y.start ? -1 : 1);
      M.log(o.walkIn ? 'Walk-in seated' : 'Booked at desk' + (segs.length > 1 ? ' · ' + segs.length + ' chairs' : ''), visit, M.user().name); M.save(); sh.close(true);
      U.toast(visit + ' · ' + (o.walkIn ? 'seated' : 'booked \u2014 confirmation sent') + (total ? ' · ' + M.money(total) : '')); M.openBooking(visit);
    };
  };
  M.newBooking = newBooking;
})();
