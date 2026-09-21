/* Incenso Management — Today (day calendar by chair + week view) + booking detail + new booking / walk-in / block */
(() => {
  const M = window.IncensoMgmt, U = window.MgmtUI, { el, esc, icon, pill } = U;
  const HOUR_H = 64;
  const state = { day: 0, staff: 'all' };
  const dayIso = (d) => new Date(M.T0 + d * M.DAY).toISOString();
  const dow = (d) => new Date(M.T0 + d * M.DAY).getDay();
  const CAL_OPEN = 7.5, CAL_CLOSE = 22.5; const closeAt = (d) => CAL_CLOSE;
  const openAt = (d) => CAL_OPEN;
  const isClosedDay = (d) => !!M.hoursForDate(dayIso(d)).closed;
  const shift = (s, d) => M.shiftFor(s, dayIso(d)); const worksOn = (s, d) => { const sh = shift(s, d); return !!sh && !sh.off; };
  const bookingsOn = (d) => M.db.bookings.filter((b) => M.isSameDay(b.start, dayIso(d)));
  const hm = M.hm;
  const clientName = (b) => M.client(b.clientId).name;
  const svcNames = (b) => b.services.map((s) => s.name).join(' + ');
  const upcoming = (b) => new Date(b.start) > new Date() && !['settled', 'cancelled', 'no-show'].includes(b.status);
  const isOpen = (b) => !['settled', 'cancelled', 'no-show'].includes(b.status);
  const isLate = (b) => (b.status === 'confirmed' || b.status === 'held') && Date.now() - new Date(b.start) > 10 * 6e4 && M.isSameDay(b.start, new Date().toISOString());
  const money = (n) => M.may('amounts') ? M.money(n) : '';
  const overlaps = (staff, start, mins, exceptRef) => M.db.bookings.filter((x) => x.staff === staff && !(Array.isArray(exceptRef) ? exceptRef.includes(x.ref) : x.ref === exceptRef) && isOpen(x) && new Date(x.start) < new Date(start.getTime() + mins * 6e4) && new Date(new Date(x.start).getTime() + x.mins * 6e4) > start).concat(M.db.blocks.filter((x) => x.staff === staff && new Date(x.start) < new Date(start.getTime() + mins * 6e4) && new Date(new Date(x.start).getTime() + x.mins * 6e4) > start));
  const STATUS_ICON = { confirmed: icon('check'), held: icon('late'), arrived: icon('walk'), 'in-chair': icon('scissors'), settled: icon('check'), cancelled: icon('close'), 'no-show': icon('close') };
  // ---- drag & drop: move an appointment in time (15-min snap) or to another chair; confirm with conflict check ----
  const dragify = (elm, b, staff, d) => {
    let sx, sy, moved = false, startTop, cols, open = openAt(d);
    const down = (e) => { if (e.button && e.button !== 0) return; sx = e.clientX; sy = e.clientY; startTop = parseFloat(elm.style.top); cols = [...elm.closest('.cal-cols').querySelectorAll('.cal-col')]; elm.setPointerCapture(e.pointerId); elm.addEventListener('pointermove', move); elm.addEventListener('pointerup', up); elm.addEventListener('pointercancel', up); };
    const move = (e) => { const dy = e.clientY - sy, dx = e.clientX - sx; if (!moved && Math.hypot(dx, dy) < 6) return; if (!moved) { moved = true; elm.classList.add('dragging'); } const snap = HOUR_H / 4; const top = Math.max(0, Math.round((startTop + dy) / snap) * snap); elm.style.top = top + 'px'; const col = cols.find((c) => { const r = c.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right; }); cols.forEach((c) => c.classList.toggle('drop', c === col && c !== elm.parentElement)); elm.dataset.col = col ? col.dataset.staff : ''; const t = open + top / HOUR_H; const sv = elm.querySelector('.sv'); if (sv) sv.textContent = String(Math.floor(t)).padStart(2, '0') + ':' + String(Math.round((t % 1) * 60)).padStart(2, '0') + ' → ' + (elm.dataset.col || staff); };
    const up = async (e) => { elm.removeEventListener('pointermove', move); elm.removeEventListener('pointerup', up); elm.removeEventListener('pointercancel', up); cols.forEach((c) => c.classList.remove('drop')); if (!moved) return; moved = false; elm.classList.remove('dragging'); elm.dataset.dragged = '1';
      const top = parseFloat(elm.style.top); const t = open + top / HOUR_H; const newStaff = elm.dataset.col || staff; const ns = new Date(b.start); ns.setHours(Math.floor(t), Math.round((t % 1) * 60), 0, 0);
      if (ns.getTime() === new Date(b.start).getTime() && newStaff === staff) { M.refresh(); return; }
      const clash = overlaps(newStaff, ns, b.mins, b.ref); const stf = M.staffOf(newStaff); const sh = M.shiftFor(stf, ns.toISOString()); const outside = !sh || sh.off || t < sh.start || t + b.mins / 60 > sh.end;
      const ok = await U.confirm({ title: 'Move ' + clientName(b) + '?', text: M.fmtTime(b.start) + ' · ' + esc(staff) + ' → <b>' + M.fmtTime(ns.toISOString()) + ' · ' + esc(newStaff) + '</b>' + (clash.length ? '<br><span style="color:var(--bad)">Overlaps ' + esc(clash[0].label || clientName(clash[0])) + ' at ' + M.fmtTime(clash[0].start) + '.</span>' : '') + (outside ? '<br><span style="color:var(--warn)">' + esc(newStaff) + ' is not working then.</span>' : '') + '<br>The client is messaged the new time.', ok: 'Move' });
      if (!ok) { M.refresh(); return; }
      b.start = ns.toISOString(); b.staff = newStaff; M.log('Moved → ' + M.fmtDT(b.start) + ' · ' + newStaff, b.ref, M.user().name); M.save(); U.toast('Moved — client messaged'); };
    elm.addEventListener('pointerdown', down);
  };
  const STATUS_DOT = { confirmed: '#1F9A56', held: '#B7791F', arrived: '#2563EB', 'in-chair': '#2563EB', settled: 'rgba(0,0,0,.3)', cancelled: 'rgba(0,0,0,.3)', 'no-show': '#B42318' };

  // Calendar controls (mode · week strip · date jump · chair filter · desk actions). Home renders this together with the KPIs.
  const controls = (R, me) => {
    const d = state.day;
    const bar = el('<div class="cal-bar"><div class="cal-bar-l"></div></div>');
    const l = bar.querySelector('.cal-bar-l');
    const lbl = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : new Date(M.T0 + d * M.DAY).toLocaleDateString('en-GB', { weekday: 'long' });
    const nav = el('<div class="daynav"><button type="button" class="day-title" data-pick aria-label="Pick a date"><h2>' + esc(lbl) + icon('chevd') + '</h2><small>' + esc(new Date(M.T0 + d * M.DAY).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })) + '</small></button><div class="day-arrows"><button type="button" data-prev aria-label="Previous day">' + icon('left') + '</button><button type="button" data-next aria-label="Next day">' + icon('right') + '</button></div>' + '</div>');
    nav.querySelector('[data-prev]').onclick = () => { state.day--; M.refresh(); }; nav.querySelector('[data-next]').onclick = () => { state.day++; M.refresh(); };
    nav.querySelector('[data-pick]').onclick = (e) => datePicker(e.currentTarget, d);
    l.appendChild(nav);
    const a = el('<div class="inline" style="margin-left:auto">' + (me ? '<button class="btn sm" data-book>' + icon('plus') + 'Book</button>' : '<button class="btn sm soft" data-block>' + icon('block') + 'Block time</button>' + '<button class="btn sm" data-book>' + icon('plus') + 'Book</button>') + '</div>'); const bb = a.querySelector('[data-block]'); if (bb) bb.onclick = () => blockTime(d); const kb = a.querySelector('[data-book]'); if (kb) kb.onclick = () => M.newBooking(me ? { day: d, staff: me } : { day: d }); bar.appendChild(a);
    R.appendChild(bar);
    const w = el('<div class="weekstrip"></div>');
    const wk = Math.floor((d + 1) / 7) * 7 - 1; for (let i = wk; i < wk + 7; i++) { const dt = new Date(M.T0 + i * M.DAY); const b = el('<button type="button" class="' + (i === 0 ? 'today ' : '') + (isClosedDay(i) ? 'closed' : '') + '" aria-pressed="' + (i === d) + '"><small>' + dt.toLocaleDateString('en-GB', { weekday: 'short' }) + '</small><span class="n">' + dt.getDate() + '</span><span class="dots">' + M.db.staff.filter((s) => s.active && worksOn(s, i) && bookingsOn(i).some((b) => b.staff === s.name && isOpen(b))).slice(0, 5).map((s) => '<i style="background:' + s.accent + '"></i>').join('') + '</span></button>'); b.onclick = () => { state.day = i; M.refresh(); }; w.appendChild(b); }
    R.appendChild(w);
    if (!me) { const strip = el('<div class="stylist-strip"></div>'); [{ name: 'all', label: 'All chairs' }].concat(M.db.staff.filter((s) => s.active)).forEach((s) => { const b = el('<button type="button" aria-pressed="' + (state.staff === s.name) + '">' + (s.accent ? U.staffAvatar(s.name) : '<span class="avatar" style="width:26px;height:26px;font-size:10px">' + M.db.staff.filter((x) => x.active).length + '</span>') + esc(s.label || s.name) + (s.name !== 'all' && !worksOn(s, d) ? ' <span class="ref">off</span>' : '') + '</button>'); b.onclick = () => { state.staff = s.name; M.refresh(); }; strip.appendChild(b); }); R.appendChild(strip); }
    if (isClosedDay(d)) { const cl = M.db.settings.closedDates.find((x) => x.date === M.lkey(dayIso(d))); R.insertAdjacentHTML('beforeend', '<div class="card">' + U.empty('Closed' + (cl && cl.label ? ' · ' + esc(cl.label) : ''), 'The studio is closed this day — nothing can be booked.') + '</div>'); return; }
    R.appendChild(calendar(d));
  };
  // Month picker popover (own UI — native date pickers are unreliable in embedded views)
  const datePicker = (anchor, d) => {
    document.querySelectorAll('.datepop').forEach((x) => x.remove());
    const sel = new Date(M.T0 + d * M.DAY); let view = new Date(sel.getFullYear(), sel.getMonth(), 1);
    const pop = el('<div class="datepop" role="dialog"></div>');
    const draw = () => {
      const first = (view.getDay() + 6) % 7; const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate(); const t0 = new Date(M.T0);
      let h = '<div class="dp-h"><button type="button" class="icon-btn sm" data-pm>' + icon('left') + '</button><b>' + view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + '</b><button type="button" class="icon-btn sm" data-nm>' + icon('right') + '</button></div><div class="dp-g">' + ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((x) => '<small>' + x + '</small>').join('');
      for (let i = 0; i < first; i++) h += '<span></span>';
      for (let n = 1; n <= days; n++) { const dt = new Date(view.getFullYear(), view.getMonth(), n); const off = Math.round((dt - t0) / M.DAY); const cnt = bookingsOn(off).filter(isOpen).length; h += '<button type="button" data-off="' + off + '" class="' + (off === 0 ? 'today ' : '') + (off === d ? 'sel ' : '') + (isClosedDay(off) ? 'closed' : '') + '">' + n + (cnt ? '<i></i>' : '') + '</button>'; }
      pop.innerHTML = h + '</div><button type="button" class="btn sm ghost wide" data-today>Today</button>';
      pop.querySelector('[data-pm]').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); draw(); };
      pop.querySelector('[data-nm]').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); draw(); };
      pop.querySelector('[data-today]').onclick = () => { state.day = 0; pop.remove(); M.refresh(); };
      pop.querySelectorAll('[data-off]').forEach((b) => b.onclick = () => { state.day = +b.dataset.off; pop.remove(); M.refresh(); });
    };
    draw();
    const r = anchor.getBoundingClientRect(); const H = 340; const below = r.bottom + 6 + H <= window.innerHeight || r.top < H; pop.style.top = (below ? r.bottom + 6 : r.top - 6 - H) + window.scrollY + 'px'; pop.style.left = Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - 300)) + 'px';
    document.body.appendChild(pop);
    const away = (e) => { if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) { pop.remove(); document.removeEventListener('pointerdown', away, true); } }; document.addEventListener('pointerdown', away, true);
  };
  M.cal = { state, controls, isOpen, isLate, worksOn, bookingsOn, dayIso };
  // #/today is the same page as the dashboard now
  M.views.today = { title: 'Calendar', render(ctx) { return M.views.home.render(ctx); } };

  const attention = (d, me) => {
    const items = [];
    const list = bookingsOn(d).filter((b) => state.staff === 'all' || b.staff === state.staff);
    list.filter(isLate).forEach((b) => items.push({ p: 0, row: bookingRow(b, 'late') }));
    if (!me) {
      list.filter((b) => b.status === 'arrived').forEach((b) => items.push({ p: 1, row: bookingRow(b, 'waiting') }));
      list.filter((b) => b.status === 'held' || (b.extra || []).some((x) => x.status === 'pending' && x.pay !== 'cash')).forEach((b) => items.push({ p: 2, row: bookingRow(b, true) }));
      if (M.may('refunds')) { M.db.bookings.filter((b) => b.refund && !b.refundSent).slice(0, 3).forEach((b) => items.push({ p: 3, row: U.row({ lead: '<span style="font-size:10px">REF</span>', title: esc(clientName(b)) + ' <span class="ref">' + esc(b.ref) + '</span>', sub: 'Refund ' + money(b.refund) + ' to send · ' + esc(M.PAY_LABEL[b.pay]), end: pill('to send'), onClick: () => M.openBooking(b.ref) }) })); }
      if (M.can('orders')) M.db.orders.filter((o) => o.status === 'placed' && o.fulfil === 'pickup' && o.payStatus !== 'pending').slice(0, 3).forEach((o) => items.push({ p: 4, row: U.row({ href: '#/order/' + o.ref, lead: '<span style="font-size:10px">OR</span>', title: esc(M.client(o.clientId).name) + ' <span class="ref">' + esc(o.ref) + '</span>', sub: 'Pickup waiting · ' + esc(o.items.map((i) => i.name).join(', ')), end: pill('placed', 'To collect') }) }));
      if (M.can('products')) { const low = M.db.products.filter((p) => p.active && p.stock <= p.low); if (low.length) items.push({ p: 5, row: U.row({ href: '#/products', lead: icon('products'), title: low.length + ' product' + (low.length > 1 ? 's' : '') + ' low or out', sub: esc(low.slice(0, 3).map((p) => p.name).join(', ')) + (low.length > 3 ? '…' : ''), end: pill('low') }) }); }
      const soon = M.db.clients.filter((c) => { if (!c.birthday) return false; const t = new Date(); const b = new Date(c.birthday); b.setFullYear(t.getFullYear()); const dd = Math.round((b - M.T0) / M.DAY); return dd >= 0 && dd <= 3; });
      soon.forEach((c) => items.push({ p: 7, row: U.row({ href: '#/client/' + c.id, lead: esc(U.initials(c.name)), title: esc(c.name) + ' · birthday ' + (M.lkey(new Date(new Date(c.birthday).setFullYear(new Date().getFullYear())).toISOString()) === M.lkey(new Date().toISOString()) ? 'today' : 'soon'), sub: 'Send a wish · ' + esc(c.phone), end: icon('chev') }) }));
    }
    if (!items.length) return el('<div></div>');
    items.sort((a, b) => a.p - b.p);
    return U.card('Needs attention', items.map((i) => i.row), '<span class="pill warn">' + items.length + '</span>');
  };

  const calendar = (d) => {
    const open = openAt(d), close = closeAt(d); const hours = Math.max(1, close - open);
    const staff = M.db.staff.filter((s) => s.active && (state.staff === 'all' || s.name === state.staff));
    const wrap = el('<div class="cal" style="--hour-h:' + HOUR_H + 'px"><div class="cal-times"></div><div class="cal-cols"></div></div>');
    const times = wrap.querySelector('.cal-times'); times.style.height = (hours * HOUR_H + 40) + 'px';
    for (let h = Math.ceil(open); h <= Math.floor(close); h++) times.insertAdjacentHTML('beforeend', '<div style="top:' + ((h - open) * HOUR_H + 40) + 'px">' + String(h).padStart(2, '0') + ':00</div>');
    const cols = wrap.querySelector('.cal-cols'); cols.style.gridTemplateColumns = 'repeat(' + staff.length + ',minmax(' + (staff.length > 2 ? 132 : 160) + 'px,1fr))';
    const head = el('<div class="cal-head"></div>'); head.style.gridTemplateColumns = cols.style.gridTemplateColumns; head.style.gridColumn = '1 / -1'; head.style.display = 'grid';
    cols.style.gridTemplateRows = '40px ' + (hours * HOUR_H) + 'px';
    staff.forEach((s) => { const n = bookingsOn(d).filter((b) => b.staff === s.name && isOpen(b)).length; const sh = shift(s, d); head.insertAdjacentHTML('beforeend', '<div>' + U.staffAvatar(s.name) + '<span>' + esc(s.name) + '</span><span class="cnt">' + (worksOn(s, d) ? n + ' · ' + sh.start + '–' + sh.end : esc(sh ? sh.label.toLowerCase() : 'off')) + '</span></div>'); });
    cols.appendChild(head);
    staff.forEach((s) => {
      const col = el('<div class="cal-col' + (worksOn(s, d) ? '' : ' off') + '"></div>');
      const sh = shift(s, d); if (worksOn(s, d) && (sh.start > open || sh.end < close)) { if (sh.start > open) col.insertAdjacentHTML('beforeend', '<div class="appt block" style="top:0;height:' + ((sh.start - open) * HOUR_H - 2) + 'px;pointer-events:none;box-shadow:none;border-radius:0"></div>'); if (sh.end < close) col.insertAdjacentHTML('beforeend', '<div class="appt block" style="top:' + ((sh.end - open) * HOUR_H) + 'px;height:' + ((close - sh.end) * HOUR_H) + 'px;pointer-events:none;box-shadow:none;border-radius:0"></div>'); }
      col.dataset.staff = s.name;
      col.onclick = (e) => { const meNow = M.myStaff(); if (e.target !== col || (meNow && s.name !== meNow)) return; const y = e.offsetY; const t = open + Math.floor(y / (HOUR_H / 2)) / 2; M.newBooking({ day: d, staff: s.name, time: t }); };
      bookingsOn(d).filter((b) => b.staff === s.name && b.status !== 'cancelled').forEach((b) => {
        const top = (hm(b.start) - open) * HOUR_H, h = Math.max(28, b.mins / 60 * HOUR_H - 3); const late = isLate(b);
        const a = el('<button type="button" class="appt ' + (b.status === 'held' ? 'held' : '') + (b.status === 'settled' ? ' done' : '') + (b.status === 'no-show' ? ' no-show' : '') + (b.status === 'in-chair' || b.status === 'arrived' ? ' here' : '') + '" data-ref="' + b.ref + '" style="top:' + top + 'px;height:' + h + 'px;--acc:' + s.accent + ';--acc-bg:' + U.hexA(s.accent, 0.38) + '"><div class="n' + (late ? ' late' : '') + '">' + (late ? icon('late').replace('<svg', '<svg style="width:12px;height:12px;flex:0 0 auto"') : '') + esc(clientName(b)) + '</div>' + (h > 40 ? '<div class="sv">' + esc(svcNames(b)) + '</div>' : '') + (h > 58 ? '<div class="sv">' + M.fmtTime(b.start) + (M.may('amounts') ? ' · ' + M.money(b.final != null ? b.final : b.price) : '') + (b.payStatus === 'paid' ? ' · paid' : b.status === 'held' ? ' · unpaid' : '') + '</div>' : '') + (h > 44 ? '<span class="dur">' + b.mins + 'm</span>' : '') + '</button>');
        a.onclick = () => { if (a.dataset.dragged) { delete a.dataset.dragged; return; } M.openBooking(b.ref); }; if (!M.myStaff() && isOpen(b)) dragify(a, b, s.name, d); col.appendChild(a);
      });
      M.db.blocks.filter((x) => x.staff === s.name && M.isSameDay(x.start, dayIso(d))).forEach((x) => { const a = el('<button type="button" class="appt block" style="top:' + ((hm(x.start) - open) * HOUR_H) + 'px;height:' + (x.mins / 60 * HOUR_H - 3) + 'px"><div class="n">' + esc(x.label) + '</div><div class="sv">' + x.mins + ' min</div></button>'); a.onclick = async () => { if (M.myStaff()) return; if (await U.confirm({ title: 'Remove block?', text: esc(x.label) + ' · ' + esc(s.name) + ' · ' + M.fmtTime(x.start), ok: 'Remove', danger: true })) { M.db.blocks = M.db.blocks.filter((y) => y.id !== x.id); M.save('blocks'); } }; col.appendChild(a); });
      if (d === 0) { const now = hm(new Date().toISOString()); if (now > open && now < close) col.insertAdjacentHTML('beforeend', '<div class="nowline" style="top:' + ((now - open) * HOUR_H) + 'px"></div>'); }
      cols.appendChild(col);
    });
    if (d === 0) { const now = hm(new Date().toISOString()); if (now > open && now < close) times.insertAdjacentHTML('beforeend', '<div class="nowtag" style="top:' + ((now - open) * HOUR_H + 40) + 'px;left:4px">' + M.fmtTime(new Date().toISOString()) + '</div>'); }
    return wrap;
  };

  const bookingRow = (b0, att) => { const v = M.visits([b0])[0]; const b = v.lead; const pend = v.live.flatMap((x) => x.extra || []).filter((x) => x.status === 'pending' && x.pay !== 'cash'); const sub = v.staff.map((s) => U.staffAvatar(s, 'sm') + '<b>' + esc(s) + '</b>').join(' + ') + ' · ' + esc(v.services.map((s) => s.name).join(' + ')) + (att === 'late' ? ' · <span class="late">' + Math.round((Date.now() - new Date(b.start)) / 6e4) + ' min late</span>' : att === 'waiting' ? ' · waiting ' + (b.arrivedAt ? M.rel(b.arrivedAt).replace(' ago', '') : '') : '') + (att === true && b.status === 'held' ? ' · ' + esc(M.PAY_LABEL[b.pay]) + ' due ' + M.until(b.deadline) : '') + (att === true && pend.length ? ' · top-up ' + money(pend.reduce((a, x) => a + x.amount, 0)) + ' pending' : ''); return U.row({ lead: U.clientAvatar(M.client(b.clientId)), title: '<span class="mono" style="font-size:12px;color:var(--muted);font-weight:500">' + M.fmtTime(b.start) + '</span>' + esc(clientName(b)) + (b.source === 'walk-in' ? ' <span class="ref">walk-in</span>' : '') + (M.client(b.clientId).tags || []).map((t) => ' <span class="pill dim plain" style="height:16px;font-size:8.5px">' + esc(t) + '</span>').join(''), sub, end: '<span class="amt">' + money(v.total) + '</span>' + (att === 'late' ? '<span class="pill bad">Late</span>' : pill(v.status)), onClick: () => M.openBooking(b.ref) }); };
  M.bookingRow = bookingRow;

  // ---- visit detail: one sheet, one status, one payment for every chair in the visit ----
  const DONE = ['cancelled', 'no-show', 'settled'];
  const liveOf = (V) => V.filter((x) => !['cancelled', 'no-show'].includes(x.status));
  const visitStatus = (V) => { const L = liveOf(V); if (!L.length) return V.some((x) => x.status === 'no-show') ? 'no-show' : 'cancelled'; if (L.every((x) => x.status === 'settled')) return 'settled'; if (L.some((x) => x.status === 'in-chair')) return 'in-chair'; if (L.some((x) => x.status === 'arrived')) return 'arrived'; if (L.some((x) => x.status === 'held')) return 'held'; return 'confirmed'; };
  const visitPay = (V) => { const L = liveOf(V).filter((x) => x.status !== 'settled'); if (!L.length) return 'paid'; if (L.every((x) => x.payStatus === 'paid' || x.payStatus === 'gift')) return 'paid'; if (L.some((x) => x.payStatus === 'pending')) return 'pending'; return 'unpaid'; };
  const segTotal = (x) => x.final != null ? x.final : x.price + (x.extra || []).reduce((a, e) => a + e.amount, 0) + (x.products || []).reduce((a, p) => a + p.qty * p.price, 0);
  M.openBooking = (ref) => {
    const b0 = M.db.bookings.find((x) => x.ref === ref); if (!b0) return;
    const V = M.visitOf(b0); const b = V[0]; const L = liveOf(V);
    const c = M.client(b.clientId); const me = M.myStaff(); const canPay = M.may('settle'); const canRefund = M.may('refunds');
    const vs = visitStatus(V), vp = visitPay(V); const late = L.some(isLate);
    const first = L[0] || b, last = L[L.length - 1] || b; const endIso = new Date(new Date(last.start).getTime() + last.mins * 6e4).toISOString();
    const total = L.reduce((a, x) => a + segTotal(x), 0); const lvl = L.reduce((a, x) => a + (x.lvlDisc != null ? x.lvlDisc : x.discount || 0), 0); const xtra = L.reduce((a, x) => a + (x.extraDisc || 0), 0); const tips = L.reduce((a, x) => a + (x.tip || 0), 0);
    const body = el('<div class="stack"></div>'); const P = b.prefs || c.prefs;
    const segHtml = (x) => { const st = M.staffOf(x.staff); return '<div class="vseg' + (DONE.includes(x.status) && x.status !== 'settled' ? ' off' : '') + '"><div class="spread"><span class="inline" style="gap:8px">' + U.staffAvatar(x.staff, 'sm') + '<b>' + esc(x.staff) + '</b><span class="ref">' + esc(x.cat || '') + '</span>' + (V.length > 1 && x.status !== vs ? pill(x.status) : '') + '</span><span class="mono" style="font-size:12.5px">' + M.fmtTime(x.start) + ' – ' + M.fmtTime(new Date(new Date(x.start).getTime() + x.mins * 6e4).toISOString()) + '</span></div>' + x.services.map((s) => '<div class="spread" style="font-size:14px;padding:3px 0 3px 30px"><span>' + esc(s.name) + (s.final != null && s.adj ? ' <span class="ref">menu ' + money(s.price || 0) + ' ' + (s.adj > 0 ? '+' : '−') + money(Math.abs(s.adj)) + '</span>' : '') + '</span><span class="mono" style="font-size:13px">' + (s.final != null ? money(s.final) : s.price == null ? 'quote' : (s.from ? 'from ' : '') + money(s.price)) + '</span></div>').join('') + '</div>'; };
    body.innerHTML = '<div class="inline">' + (late ? '<span class="pill bad">Late</span>' : pill(vs)) + pill(vp) + '<span class="ref">' + esc(b.visit || b.ref) + ' · ' + esc(b.source) + (V.length > 1 ? ' · ' + V.length + ' chairs' : '') + '</span></div>' +
      '<div class="card pad"><div class="spread"><div><b>' + esc(M.fmtDay(first.start)) + '</b> · ' + M.fmtTime(first.start) + ' – ' + M.fmtTime(endIso) + '<div class="note">' + L.reduce((a, x) => a + x.mins, 0) + ' min' + (V.length > 1 ? ' · back to back' : ' · ' + esc(first.staff)) + '</div></div></div><div class="hr" style="margin:12px 0"></div><div class="vsegs">' + V.map(segHtml).join('') + '</div>' + (function () { const prods = L.flatMap((x) => x.products || []); return prods.length ? '<div class="hr" style="margin:10px 0"></div><p class="eyebrow" style="margin:0 0 4px">Products <span style="letter-spacing:0;text-transform:none;font-weight:400">· counted in Shop</span></p>' + prods.map((p) => '<div class="spread" style="font-size:14px;padding:3px 0"><span>' + (p.qty > 1 ? p.qty + '× ' : '') + esc(p.name) + (p.final != null && p.adj ? ' <span class="ref">shelf ' + money(p.qty * p.price) + ' ' + (p.adj > 0 ? '+' : '−') + money(Math.abs(p.adj)) + '</span>' : '') + '</span><span class="mono" style="font-size:13px">' + money(p.final != null ? p.final : p.qty * p.price) + '</span></div>').join('') : ''; })() + ((lvl || xtra || (vs === 'settled' && tips)) ? '<div class="hr" style="margin:10px 0"></div>' : '') + (lvl ? '<div class="spread" style="font-size:13px;color:var(--ok);padding:3px 0"><span>' + esc(b.level || 'Level') + ' discount</span><span class="mono">−' + money(lvl) + '</span></div>' : '') + (xtra ? '<div class="spread" style="font-size:13px;color:var(--ok);padding:3px 0"><span>Extra discount</span><span class="mono">−' + money(xtra) + '</span></div>' : '') + (vs === 'settled' && tips ? '<div class="spread" style="font-size:13px;color:var(--muted);padding:3px 0"><span>Tips</span><span class="mono">' + money(tips) + '</span></div>' : '') + '<div class="hr" style="margin:10px 0"></div><div class="spread"><b>' + (vs === 'settled' ? 'Settled' : 'Total') + '</b><b class="mono">' + money(total) + '</b></div>' + ((upcoming(first) || vs === 'arrived' || vs === 'in-chair') && !me ? '<div class="inline" style="margin-top:12px"><button class="btn sm soft" data-edit>' + icon('edit') + 'Edit visit</button>' + (M.can('products') ? '<button class="btn sm soft" data-prod>' + icon('pos') + 'Add product</button>' : '') + '</div>' : '') + '</div>' +
      '<div class="card pad"><div class="spread"><div><b>' + esc(c.name) + '</b> <span class="pill dim plain">' + esc(c.tier || 'Member') + '</span>' + (M.autoTags ? M.autoTags(c) : []).map((t) => ' <span class="pill dim plain">' + esc(t) + '</span>').join('') + '<div class="note">' + esc(M.maskPhone(c.phone)) + '</div></div><div class="inline">' + (M.seePhones() ? '<a class="icon-btn" href="' + U.wa(c.phone, late ? 'Hi ' + c.name.split(' ')[0] + ', it\u2019s Incenso — we have your ' + M.fmtTime(first.start) + ' ready. Are you on your way?' : '') + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon('wa') + '</a>' : '') + '<a class="icon-btn" href="#/client/' + c.id + '" data-x aria-label="Profile">' + icon('chev') + '</a></div></div>' + (c.notes ? '<p class="note" style="margin-top:8px;color:var(--fg)">' + esc(c.notes) + '</p>' : '') + (c.blocked ? '<p class="note" style="margin-top:8px;color:var(--bad)">Client is blocked from online booking.</p>' : '') + '</div>' +
      (M.may('amounts') ? '<div class="card pad"><div class="spread"><h3>Payment</h3><span class="mono" style="font-size:13px">' + money(total) + '</span></div><div data-pay></div></div>' : '') +
      (P && (P.mood || P.smoke || (P.flags || []).length) ? '<div class="card pad"><h3>Preferences</h3><div class="chips" style="margin-top:8px">' + [P.mood, P.smoke].concat(P.flags || []).filter(Boolean).map((x) => '<span class="pill dim plain">' + esc(x) + '</span>').join('') + '</div></div>' : '') +
      '<div class="card pad"><div class="spread"><h3>Notes</h3><button class="btn sm soft" data-note>' + icon('edit') + 'Edit</button></div><p class="note" style="margin-top:6px' + (b.notes ? ';color:var(--fg)' : '') + '">' + (esc(b.notes) || 'No notes yet.') + '</p></div>';
    const pay = body.querySelector('[data-pay]');
    if (pay) {
      // One payment view for the visit: same method + same status collapse into one line
      const agg = {}; const order = []; L.forEach((x) => M.bookingPieces(x).forEach((p) => { const k = (p.extra ? 'x' : 'b') + '|' + p.label + '|' + p.status; if (!agg[k]) { agg[k] = Object.assign({}, p, { amount: 0, segs: [] }); order.push(k); } agg[k].amount += p.amount; agg[k].segs.push({ b: x, p }); }));
      const rows = order.map((k) => agg[k]); pay.innerHTML = U.paylines(rows);
      if (canPay) pay.querySelectorAll('.payline').forEach((line, i) => { const r = rows[i]; if (!r || r.status !== 'pending') return; const btn = el('<button class="btn sm' + (r.extra ? ' soft' : '') + '" style="grid-column:1/-1;justify-self:start">' + icon('check') + 'Confirm ' + esc(r.label.replace(' · top-up', '')) + ' received</button>'); btn.onclick = () => { r.segs.forEach(({ b: x, p }) => { if (p.extra) { p.extra.status = 'paid'; p.extra.paidAt = new Date().toISOString(); } else { x.paid = x.price; x.payStatus = 'paid'; if (x.status === 'held') x.status = 'confirmed'; x.deadline = null; } }); M.log(r.extra ? 'Top-up confirmed' : 'Transfer confirmed', b.visit || b.ref, M.user().name); M.save(); U.toast('Payment confirmed — client messaged'); M.openBooking(ref); }; line.appendChild(btn); });
      const held = L.find((x) => x.status === 'held'); if (held) pay.insertAdjacentHTML('beforeend', '<p class="note" style="margin-top:10px">Held until <b>' + esc(M.fmtDT(held.deadline)) + '</b> (' + esc(M.until(held.deadline)) + '). Auto-released if unpaid.</p>');
      if (L.some((x) => x.cardLink && x.payStatus === 'pending')) pay.insertAdjacentHTML('beforeend', '<p class="note" style="margin-top:10px">Stripe link sent on WhatsApp — confirms itself when paid.</p>');
    }
    const foot = el('<div style="display:flex;gap:8px;width:100%;flex-wrap:wrap"></div>');
    const act = (label, cls, fn) => { const x = el('<button class="btn ' + cls + '">' + label + '</button>'); x.onclick = fn; foot.appendChild(x); };
    if (vs === 'confirmed' || vs === 'held') act('Arrived', '', () => setStatus(V, 'arrived'));
    if ((vs === 'in-chair' || vs === 'arrived') && canPay) act('Settle visit', '', () => settle(V));
    if (L.some(isOpen) && !me) act('More', 'ghost', () => moreActions(V));
    if (vs === 'settled') foot.insertAdjacentHTML('beforeend', '<p class="note" style="flex:1;text-align:center">Settled ' + (first.settledAt ? M.rel(first.settledAt) : '') + ' · ' + money(total) + (first.settleMethod ? ' · ' + esc(M.PAY_LABEL[first.settleMethod] || first.settleMethod) : '') + '</p>');
    if (vs === 'no-show' || vs === 'cancelled') { const refund = V.reduce((a, x) => a + (x.refund || 0), 0); const toSend = V.filter((x) => x.refund && !x.refundSent); foot.insertAdjacentHTML('beforeend', '<p class="note" style="flex:1;text-align:center">' + esc(U.STATUS[vs][0]) + (refund ? ' · refund ' + money(refund) + (toSend.length ? ' to send' : ' sent') : '') + '</p>'); if (toSend.length && canRefund) act('Mark refund sent', 'ghost', () => { toSend.forEach((x) => { x.refundSent = true; }); M.log('Refund sent', b.visit || b.ref, M.user().name); M.save(); U.toast('Refund marked sent — client messaged'); M.openBooking(ref); }); }
    U.sheet({ title: c.name, sub: esc(L.map(svcNames).join(' + ') || svcNames(b)), body, foot: foot.children.length ? foot : null });
    const editBtn = body.querySelector('[data-edit]'); if (editBtn) editBtn.onclick = () => M.newBooking({ edit: V });
    const prodBtn = body.querySelector('[data-prod]'); if (prodBtn) prodBtn.onclick = () => M.deskSale({ booking: first });
    body.querySelector('[data-note]').onclick = async () => { const r = await U.prompt({ title: 'Visit notes', back: true, fields: [{ name: 'notes', label: 'Notes for the chairs', type: 'textarea', value: b.notes }] }); if (r) { V.forEach((x) => { x.notes = r.notes; }); M.save(); } M.openBooking(ref); };
  };
  const setStatus = (V, st) => { const L = liveOf(V).filter((x) => x.status !== 'settled'); L.forEach((x) => { x.status = st; if (st === 'arrived') x.arrivedAt = new Date().toISOString(); }); const b = V[0]; M.log(U.STATUS[st][0], b.visit || b.ref, M.user().name); M.save(); U.toast(M.client(b.clientId).name + ' · ' + U.STATUS[st][0]); M.openBooking(b.ref); };
  const moreActions = (V) => {
    const b = V[0]; const L = liveOf(V); const c = M.client(b.clientId);
    const body = el('<div class="card"><div class="list"></div></div>'); const l = body.querySelector('.list');
    const item = (t, s, fn, danger) => l.appendChild(U.row({ title: (danger ? '<span style="color:var(--bad)">' : '<span>') + t + '</span>', sub: s, end: icon('chev'), onClick: fn }));
    item('Edit visit', 'Services, chairs, date and time — all in one place', () => M.newBooking({ edit: V }));
    item('Message client', 'Opens WhatsApp with a ready line', () => { window.open(U.wa(c.phone, 'Hi ' + c.name.split(' ')[0] + ', it\u2019s Incenso about your visit on ' + M.fmtDay(b.start) + ' at ' + M.fmtTime(b.start) + ' — '), '_blank'); });
    if (L.some((x) => x.payStatus === 'unpaid' && x.pay === 'cash') && M.may('settle')) item('Record a prepayment', 'Whish / OMT / card taken now, for the visit', () => switchPay(V));
    if (M.may('refunds')) { if (new Date(b.start) < new Date()) item('Mark no-show', 'Cancels the visit · prepaid amounts are refunded', () => noShow(V), true); item('Cancel visit', L.some((x) => x.paid) ? 'Refund ' + money(L.reduce((a, x) => a + x.paid, 0)) + ' the same way' : 'Nothing was charged', () => cancel(V), true); if (L.length > 1) item('Cancel one chair only', 'Keep the rest of the visit', () => cancelOne(V), true); if (L.some((x) => x.status === 'held')) item('Release slot now', 'Unpaid transfer · frees the time', () => cancel(V, true), true); }
    else l.insertAdjacentHTML('beforeend', '<p class="note" style="padding:12px 16px">Cancelling and refunds need the owner.</p>');
    U.sheet({ title: 'Visit ' + (b.visit || b.ref), sub: esc(c.name) + ' · ' + M.fmtDT(b.start), body, back: () => M.openBooking(b.ref), onClose: () => M.openBooking(b.ref) });
  };
  // Settle: every service is its own line — menu price preset, +/- adjustment next to it — then products, level discount, what's already paid, balance, method, tips
  const settle = (V) => {
    const L = liveOf(V).filter((x) => x.status !== 'settled'); const b = V[0]; const c = M.client(b.clientId);
    const rate = (M.discountFor(b.clientId) || {}).rate || 0; const level = (M.discountFor(b.clientId) || {}).name || '';
    const lines = []; L.forEach((x) => x.services.forEach((s, i) => lines.push({ x, i, s, base: s.price || 0, adj: 0 })));
    const prods = L.flatMap((x) => (x.products || []).map((p) => ({ x, p, base: p.qty * p.price, adj: 0 })));
    const paid = L.reduce((a, x) => a + x.paid + x.gift + (x.extra || []).filter((e) => e.status === 'paid').reduce((q, e) => q + e.amount, 0), 0);
    const P = M.db.settings.payments; const methods = [['cash', 'Cash'], ['card', 'Card (terminal)'], ['whish', 'Whish Money'], ['omt', 'OMT Pay']].filter((o) => P[o[0]] !== false);
    const st = { method: 'cash', extra: 0, tips: {} };
    const body = el('<div class="stack settle"></div>');
    const svcGross = () => lines.reduce((a, l) => a + Math.max(0, l.base + l.adj), 0); const prodTot = () => prods.reduce((a, q) => a + Math.max(0, q.base + q.adj), 0);
    const lvlDisc = () => Math.round(svcGross() * rate); const total = () => Math.max(0, svcGross() - lvlDisc() + prodTot() - (st.extra || 0)); const bal = () => total() - paid;
    const draw = () => {
      body.innerHTML = '<div class="card pad"><p class="eyebrow" style="margin:0 0 6px">Services</p>' + lines.map((l, i) => '<div class="stl"><div class="nm"><b>' + esc(l.s.name) + '</b><small>' + esc(l.x.staff) + (l.s.price == null ? ' · quote' : '') + '</small></div><span class="mono base">' + (l.s.price == null ? '—' : M.money(l.base)) + '</span><div class="stp' + (l.adj < 0 ? ' neg' : l.adj > 0 ? ' pos' : '') + '"><input type="number" step="1" inputmode="decimal" data-adj="' + i + '" value="' + (l.adj || '') + '" placeholder="0"></div><span class="mono tot">' + M.money(Math.max(0, l.base + l.adj)) + '</span></div>').join('') +
        (prods.length ? '<p class="eyebrow" style="margin:14px 0 6px">Products</p>' + prods.map((q, i) => '<div class="stl"><div class="nm"><b>' + (q.p.qty > 1 ? q.p.qty + '× ' : '') + esc(q.p.name) + '</b><small>product</small></div><span class="mono base">' + M.money(q.base) + '</span><div class="stp' + (q.adj < 0 ? ' neg' : q.adj > 0 ? ' pos' : '') + '"><input type="number" step="1" inputmode="decimal" data-padj="' + i + '" value="' + (q.adj || '') + '" placeholder="0"></div><span class="mono tot">' + M.money(Math.max(0, q.base + q.adj)) + '</span></div>').join('') : '') +
        '<div class="hr" style="margin:12px 0"></div>' +
        (rate ? '<div class="spread sum"><span>' + esc(level) + ' · ' + Math.round(rate * 100) + '% off services</span><span class="mono">−' + M.money(lvlDisc()) + '</span></div>' : '') +
        '<div class="spread sum total"><b>Total</b><b class="mono">' + M.money(total() + (st.extra || 0)) + '</b></div>' +
        '<div class="spread sum"><span>Extra discount</span><span class="stp"><input type="number" step="1" min="0" inputmode="numeric" data-extra value="' + (st.extra || '') + '" placeholder="0"></span></div>' +
        (paid ? '<div class="spread sum"><span>Already paid</span><span class="mono">−' + M.money(paid) + '</span></div>' : '') +
        '<div class="spread sum total"><b>' + (bal() < 0 ? 'Refund' : 'Balance due') + '</b><b class="mono">' + M.money(Math.abs(bal())) + '</b></div></div>' +
        (bal() > 0 ? '<div class="card pad"><p class="eyebrow" style="margin:0 0 8px">Balance settled by</p><div class="bkf-pills">' + methods.map(([k, l]) => '<button type="button" class="bkf-pill sm" data-method="' + k + '" aria-pressed="' + (st.method === k) + '">' + l + '</button>').join('') + '</div></div>' : '') +
        '<div class="card pad"><p class="eyebrow" style="margin:0 0 8px">Tips</p><div class="two">' + L.map((x) => '<div class="field"><label>' + esc(x.staff) + '</label><div class="unit"><input type="number" step="1" min="0" inputmode="numeric" data-tip="' + esc(x.ref) + '" value="' + (st.tips[x.ref] || '') + '" placeholder="0"></div></div>').join('') + '</div></div>';
      body.querySelectorAll('[data-adj]').forEach((inp) => { inp.onchange = () => sgn(lines, inp); });
      const sgn = (arr, inp) => { const i = +(inp.dataset.adj != null ? inp.dataset.adj : inp.dataset.padj); arr[i].adj = Math.round(+inp.value || 0); draw(); };
      body.querySelectorAll('[data-padj]').forEach((inp) => { inp.onchange = () => sgn(prods, inp); });
      const ex = body.querySelector('[data-extra]'); ex.onchange = () => { st.extra = Math.max(0, Math.round(+ex.value || 0)); draw(); };
      body.querySelectorAll('[data-method]').forEach((x) => x.onclick = () => { st.method = x.dataset.method; draw(); });
      body.querySelectorAll('[data-tip]').forEach((inp) => { inp.onchange = () => { st.tips[inp.dataset.tip] = Math.max(0, Math.round(+inp.value || 0)); }; });
    };
    draw();
    const foot = el('<div style="display:flex;gap:8px;width:100%"><button class="btn" data-o>Close visit</button></div>');
    const sh = U.sheet({ title: 'Settle visit', sub: esc(c.name) + (L.length > 1 ? ' · ' + L.length + ' chairs' : ''), body, foot, back: () => M.openBooking(b.ref), onClose: () => M.openBooking(b.ref) });
    foot.querySelector('[data-o]').onclick = () => {
      const now = new Date().toISOString(); const finalTotal = total(); const extra = st.extra || 0; const gross = svcGross();
      let extraLeft = extra;
      L.forEach((x, idx) => {
        const mine = lines.filter((l) => l.x === x); const segGross = mine.reduce((a, l) => a + Math.max(0, l.base + l.adj), 0); mine.forEach((l) => { l.s.final = Math.max(0, l.base + l.adj); if (l.adj) l.s.adj = l.adj; });
        const segDisc = Math.round(segGross * rate); const share = gross ? segGross / gross : 1 / L.length; const segExtra = idx === L.length - 1 ? extraLeft : Math.round(extra * share); extraLeft -= segExtra;
        const segProd = prods.filter((q) => q.x === x).reduce((a, q) => { const f = Math.max(0, q.base + q.adj); q.p.final = f; if (q.adj) q.p.adj = q.adj; return a + f; }, 0);
        const f = Math.max(0, segGross - segDisc + segProd - segExtra); const paidX = x.paid + x.gift + (x.extra || []).filter((e) => e.status === 'paid').reduce((q, e) => q + e.amount, 0);
        x.gross = segGross; x.final = f; x.discount = segDisc + segExtra; x.lvlDisc = segDisc; x.extraDisc = segExtra; x.status = 'settled'; x.settledAt = now; x.settleMethod = st.method; x.tip = st.tips[x.ref] || 0;
        const balX = f - paidX; if (balX > 0) { x.due = 0; x.paid = paidX + balX; x.settledBalance = balX; } else if (balX < 0) { x.refund = -balX; x.refundSent = false; x.due = 0; } else x.due = 0;
        (x.extra || []).forEach((e) => { if (e.status !== 'paid') e.status = 'paid'; }); x.payStatus = 'paid';
        (x.products || []).forEach((p) => { const pr = M.db.products.find((q) => q.id === p.productId); if (pr) { pr.stock = Math.max(0, pr.stock - p.qty); pr.sold30 += p.qty; } });
      });
      M.log('Visit settled · ' + M.money(finalTotal), b.visit || b.ref, M.user().name); M.save(); sh.close(true); U.toast('Visit settled — one receipt sent on WhatsApp'); M.openBooking(b.ref);
    };
  };
  const addService = async (b) => {
    const opts = M.db.services.filter((s) => s.active).map((s) => [s.id, s.name + ' · ' + s.cat + ' · ' + (s.price == null ? 'quote' : M.money(s.price)) + ' · ' + s.mins + 'm']);
    const r = await U.prompt({ title: 'Add service', ok: 'Add', fields: [{ name: 'svc', label: 'Service (any category)', type: 'select', options: opts }, { name: 'pay', label: 'Top-up paid by', type: 'select', value: 'cash', options: [['cash', 'Cash at studio (no timer)'], ['card', 'Card — send Stripe link'], ['whish', 'Whish Money (24h)'], ['omt', 'OMT Pay (24h)']] }] });
    if (!r) return; const s = M.db.services.find((x) => x.id === r.svc); const rate = (M.discountFor(b.clientId) || {}).rate || 0; const amt = Math.round((s.price || 0) * (1 - rate));
    const mine = M.staffOf(b.staff) && M.staffOf(b.staff).cats.includes(s.cat);
    const visit = M.visitOf(b); const last = visit[visit.length - 1]; const endOfVisit = new Date(new Date(last.start).getTime() + last.mins * 6e4);
    const x = { amount: amt, pay: r.pay, status: 'pending', placedAt: new Date().toISOString(), deadline: (r.pay === 'whish' || r.pay === 'omt') ? new Date(Math.min(Date.now() + (M.transferHoursFor ? M.transferHoursFor(r.pay) : 24) * 36e5, new Date(b.start).getTime())).toISOString() : null };
    if (mine) {
      const clash = overlaps(b.staff, new Date(new Date(b.start).getTime() + b.mins * 6e4), s.mins, b.ref);
      if (clash.length && !(await U.confirm({ title: 'Runs into the next booking', text: 'Adding ' + s.mins + ' min overlaps ' + esc(clash[0].label || M.client(clash[0].clientId).name) + ' at ' + M.fmtTime(clash[0].start) + '. Add anyway?', ok: 'Add anyway' }))) return;
      b.services.push({ name: s.name, mins: s.mins, price: s.price, from: s.from }); b.mins += s.mins; b.price += amt; if (amt) b.extra.push(x);
      M.log('Service added · ' + s.name, b.ref, M.user().name); M.save(); U.toast(s.name + ' added' + (amt ? ' · ' + M.money(amt) + ' ' + M.PAY_LABEL[r.pay] : '')); M.openBooking(b.ref); return;
    }
    // Different category → another chair, back to back after the visit (website rule)
    const team = M.db.staff.filter((st) => st.active && st.cats.includes(s.cat)); if (!team.length) { U.toast('No chair does ' + s.cat); return; }
    const free = team.filter((st) => { const sh = M.shiftFor(st, endOfVisit.toISOString()); return sh && !sh.off && !overlaps(st.name, endOfVisit, s.mins).length; });
    const who = await U.prompt({ title: s.cat + ' · which chair?', ok: 'Add to visit', fields: [{ name: 'staff', label: 'Chair · starts ' + M.fmtTime(endOfVisit.toISOString()) + ' after ' + esc(last.staff), type: 'select', value: (free[0] || team[0]).name, options: team.map((st) => [st.name, st.name + (free.includes(st) ? '' : ' · busy / off then')]) }] });
    if (!who) return;
    if (!b.visit) { b.visit = b.ref; }
    const nb = { ref: b.visit + String.fromCharCode(65 + visit.length), visit: b.visit, cat: s.cat, clientId: b.clientId, staff: who.staff, services: [{ name: s.name, mins: s.mins, price: s.price, from: s.from }], start: endOfVisit.toISOString(), mins: s.mins, price: amt, gross: s.price || 0, discount: (s.price || 0) - amt, level: b.level, pay: r.pay, paid: 0, due: r.pay === 'cash' ? amt : 0, gift: 0, extra: [], products: [], payStatus: r.pay === 'cash' ? 'unpaid' : 'pending', status: b.status === 'held' ? 'held' : 'confirmed', deadline: x.deadline, final: null, notes: '', prefs: b.prefs, quote: s.price == null, source: b.source, placedAt: new Date().toISOString() };
    if (r.pay === 'card') nb.cardLink = true;
    M.db.bookings.push(nb); M.db.bookings.sort((p, q) => p.start < q.start ? -1 : 1);
    M.log('Chair added to visit · ' + s.name + ' · ' + who.staff, b.visit, M.user().name); M.save(); U.toast(s.name + ' with ' + who.staff + ' at ' + M.fmtTime(nb.start)); M.openBooking(nb.ref);
  };
  const switchPay = async (V) => { const L = liveOf(V).filter((x) => x.payStatus === 'unpaid' && x.pay === 'cash'); const r = await U.prompt({ title: 'Record payment · ' + M.money(L.reduce((a, x) => a + x.price, 0)), ok: 'Record', fields: [{ name: 'pay', label: 'Paid by', type: 'select', value: 'whish', options: [['whish', 'Whish Money'], ['omt', 'OMT Pay'], ['card', 'Card (terminal)']] }] }); if (!r) return; L.forEach((x) => { x.pay = r.pay; x.paid = x.price; x.due = 0; x.payStatus = 'paid'; }); M.log('Prepaid recorded', V[0].visit || V[0].ref, M.user().name); M.save(); M.openBooking(V[0].ref); };
  const reschedule = async (V) => {
    const L = liveOf(V); const b = L[0] || V[0];
    const fields = [{ name: 'date', label: 'Date', type: 'date', value: M.lkey(b.start), required: true }, { name: 'time', label: 'Starts', type: 'time', value: M.fmtTime(b.start), required: true }];
    if (L.length === 1) fields.push({ name: 'staff', label: 'Chair', type: 'select', value: b.staff, options: M.db.staff.filter((s) => s.active && s.cats.includes(b.cat)).map((s) => s.name) });
    const r = await U.prompt({ title: L.length > 1 ? 'Move the visit' : 'Reschedule', ok: 'Move', fields });
    if (!r) return; if (M.isStudioClosed(r.date + 'T12:00:00')) { U.toast('The studio is closed that day'); return; } const [hh, mm] = r.time.split(':').map(Number); const d = new Date(r.date + 'T00:00:00'); d.setHours(hh, mm, 0, 0);
    const delta = d.getTime() - new Date(b.start).getTime(); const moves = L.map((x) => ({ x, start: new Date(new Date(x.start).getTime() + delta), staff: L.length === 1 ? r.staff : x.staff }));
    const clash = moves.map((m) => ({ m, c: overlaps(m.staff, m.start, m.x.mins, m.x.ref).filter((y) => !L.includes(y)) })).find((z) => z.c.length);
    if (clash && !(await U.confirm({ title: 'Overlaps another booking', text: esc(clash.c[0].label || M.client(clash.c[0].clientId).name) + ' at ' + M.fmtTime(clash.c[0].start) + ' on ' + esc(clash.m.staff) + '. Move anyway?', ok: 'Move anyway' }))) return;
    moves.forEach((m) => { m.x.start = m.start.toISOString(); m.x.staff = m.staff; }); M.db.bookings.sort((p, q) => p.start < q.start ? -1 : 1);
    M.log('Rescheduled → ' + M.fmtDT(d.toISOString()), b.visit || b.ref, M.user().name); M.save(); U.toast('Moved — client messaged the new time'); M.openBooking(b.ref);
  };
  const undoSeg = (x) => { if (x.paid) { x.refund = x.paid; x.refundSent = false; } if (x.gift && x.giftParts && x.giftParts.length) { M.refundGift(x.giftParts, x.ref); x.giftBack = x.gift; } x.due = 0; };
  const noShow = async (V) => { const L = liveOf(V); const b = V[0]; const c = M.client(b.clientId); const paid = L.reduce((a, x) => a + x.paid, 0); if (!(await U.confirm({ title: 'Mark as no-show?', text: esc(c.name) + ' didn\u2019t arrive. The visit is cancelled, nothing is charged' + (paid ? ', and ' + M.money(paid) + ' is refunded the same way.' : '.'), ok: 'No-show', danger: true }))) return; L.forEach((x) => { x.status = 'no-show'; undoSeg(x); }); c.noShows = (c.noShows || 0) + 1; M.log('No-show', b.visit || b.ref, M.user().name); M.save(); U.toast('Marked no-show' + (c.noShows >= 2 ? ' · ' + c.noShows + ' no-shows — consider blocking' : '')); M.openBooking(b.ref); };
  const cancel = async (V, release) => { const L = release ? liveOf(V).filter((x) => x.status === 'held') : liveOf(V); const b = V[0]; const c = M.client(b.clientId); const paid = L.reduce((a, x) => a + x.paid, 0), gift = L.reduce((a, x) => a + x.gift, 0); if (!(await U.confirm({ title: release ? 'Release slot?' : 'Cancel visit?', text: (release ? 'The transfer wasn\u2019t received. ' : '') + esc(c.name) + ' is told on WhatsApp' + (paid ? ' and ' + M.money(paid) + ' is refunded the same way.' : gift ? ' and ' + M.money(gift) + ' goes back on the gift balance.' : '. Nothing was charged.'), ok: release ? 'Release' : 'Cancel visit', danger: true }))) return; L.forEach((x) => { x.status = 'cancelled'; undoSeg(x); }); M.log(release ? 'Released · unpaid' : 'Cancelled by studio', b.visit || b.ref, M.user().name); M.save(); U.toast(release ? 'Slot released' : 'Visit cancelled'); M.openBooking(b.ref); };
  const cancelOne = async (V) => { const L = liveOf(V); const r = await U.prompt({ title: 'Cancel one chair', ok: 'Continue', fields: [{ name: 'ref', label: 'Which chair', type: 'select', options: L.map((x) => [x.ref, x.staff + ' · ' + svcNames(x) + ' · ' + M.fmtTime(x.start)]) }] }); if (!r) return; const x = L.find((y) => y.ref === r.ref); if (!x) return; if (!(await U.confirm({ title: 'Cancel ' + x.staff + '\u2019s part?', text: 'The rest of the visit stays.' + (x.paid ? ' ' + M.money(x.paid) + ' is refunded the same way.' : ''), ok: 'Cancel this chair', danger: true }))) return; x.status = 'cancelled'; undoSeg(x); M.log('Chair cancelled · ' + x.staff, V[0].visit || V[0].ref, M.user().name); M.save(); U.toast(x.staff + '\u2019s part cancelled'); M.openBooking(V[0].ref); };

  // new booking / walk-in lives in v-newbooking.js (same rules as /book)
  const blockTime = async (day) => { const r = await U.prompt({ title: 'Block time', ok: 'Block', fields: [{ name: 'staff', label: 'Chair', type: 'select', options: [['*', 'Whole studio']].concat(M.db.staff.filter((s) => s.active).map((s) => s.name)) }, { name: 'date', label: 'Date', type: 'date', value: M.lkey(dayIso(day)), required: true }, { name: 'time', label: 'From', type: 'time', value: '13:00', required: true }, { name: 'mins', label: 'Minutes', type: 'number', value: 60, min: 15, step: 15 }, { name: 'label', label: 'Label', value: 'Break' }] }); if (!r) return; const [hh, mm] = r.time.split(':').map(Number); const d = new Date(r.date + 'T00:00:00'); d.setHours(hh, mm); (r.staff === '*' ? M.db.staff.filter((s) => s.active).map((s) => s.name) : [r.staff]).forEach((st, i) => M.db.blocks.push({ id: 'bl' + Date.now() + i, staff: st, start: d.toISOString(), mins: r.mins, label: r.label || 'Blocked' })); M.save(); U.toast('Time blocked'); };
  M.overlaps = overlaps; M.attention = attention;
})();
