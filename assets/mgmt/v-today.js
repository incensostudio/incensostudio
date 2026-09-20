/* Incenso Management — Today (day calendar by chair + week view) + booking detail + new booking / walk-in / block */
(() => {
  const M = window.IncensoMgmt, U = window.MgmtUI, { el, esc, icon, pill } = U;
  const HOUR_H = 64;
  const state = { day: 0, staff: 'all', mode: 'day' };
  const dayIso = (d) => new Date(M.T0 + d * M.DAY).toISOString();
  const dow = (d) => new Date(M.T0 + d * M.DAY).getDay();
  const closeAt = (d) => { const h = M.db.settings.hours; return (dow(d) === 5 || dow(d) === 6) ? h.closeWeekend : h.closeWeek; };
  const isClosedDay = (d) => M.db.settings.hours.closedDays.includes(dow(d)) || M.db.settings.closedDates.some((x) => x.date === M.lkey(dayIso(d)));
  const shift = (s, d) => M.shiftFor(s, dayIso(d)); const worksOn = (s, d) => { const sh = shift(s, d); return !!sh && !sh.off; };
  const bookingsOn = (d) => M.db.bookings.filter((b) => M.isSameDay(b.start, dayIso(d)));
  const hm = M.hm;
  const clientName = (b) => M.client(b.clientId).name;
  const svcNames = (b) => b.services.map((s) => s.name).join(' + ');
  const upcoming = (b) => new Date(b.start) > new Date() && !['settled', 'cancelled', 'no-show'].includes(b.status);
  const isOpen = (b) => !['settled', 'cancelled', 'no-show'].includes(b.status);
  const isLate = (b) => (b.status === 'confirmed' || b.status === 'held') && Date.now() - new Date(b.start) > 10 * 6e4 && M.isSameDay(b.start, new Date().toISOString());
  const money = (n) => M.may('amounts') ? M.money(n) : '';
  const overlaps = (staff, start, mins, exceptRef) => M.db.bookings.filter((x) => x.staff === staff && x.ref !== exceptRef && isOpen(x) && new Date(x.start) < new Date(start.getTime() + mins * 6e4) && new Date(new Date(x.start).getTime() + x.mins * 6e4) > start).concat(M.db.blocks.filter((x) => x.staff === staff && new Date(x.start) < new Date(start.getTime() + mins * 6e4) && new Date(new Date(x.start).getTime() + x.mins * 6e4) > start));
  const STATUS_ICON = { confirmed: icon('check'), held: icon('late'), arrived: icon('walk'), 'in-chair': icon('scissors'), settled: icon('check'), cancelled: icon('close'), 'no-show': icon('close') };
  // ---- drag & drop: move an appointment in time (15-min snap) or to another chair; confirm with conflict check ----
  const dragify = (elm, b, staff, d) => {
    let sx, sy, moved = false, startTop, cols, open = M.db.settings.hours.open;
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

  M.views.today = { title: 'Calendar', render(ctx) {
    const me = M.myStaff(); if (me) state.staff = me;
    const d = state.day; const list = bookingsOn(d).filter((b) => state.staff === 'all' || b.staff === state.staff);
    const live = list.filter(isOpen);
    ctx.title(state.mode === 'week' ? 'This week' : d === 0 ? 'Today' : M.fmtDay(dayIso(d)), state.mode === 'week' ? M.fmtDay(dayIso(-((dow(0) + 6) % 7))) + ' → ' + M.fmtDay(dayIso(6 - (dow(0) + 6) % 7)) : d === 0 ? M.fmtDay(dayIso(0)) : (d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : ''));
    const R = ctx.root;
    const head = el('<div class="spread"><div></div><div class="seg" style="width:auto"><button type="button" aria-pressed="' + (state.mode === 'day') + '" data-m="day">Day</button><button type="button" aria-pressed="' + (state.mode === 'week') + '" data-m="week">Week</button></div></div>');
    head.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { state.mode = b.dataset.m; M.refresh(); });
    if (!me && M.may('amounts')) {
      const expected = live.reduce((a, b) => a + (b.final || b.price) + (b.extra || []).reduce((x, y) => x + y.amount, 0), 0);
      const toConfirm = list.filter((b) => b.status === 'held' || (b.extra || []).some((x) => x.status === 'pending' && x.pay !== 'cash')).length;
      const here = list.filter((b) => b.status === 'arrived' || b.status === 'in-chair').length; const late = list.filter(isLate).length;
      R.insertAdjacentHTML('beforeend', '<div class="kpis">' + U.kpi('Bookings', live.length, list.filter((b) => b.status === 'settled').length + ' settled · ' + list.filter((b) => b.status === 'no-show').length + ' no-show', false, 'bookings') + U.kpi('Expected', M.money(expected), live.filter((b) => b.payStatus === 'paid').length + ' prepaid', true, 'money') + U.kpi('To confirm', toConfirm, 'Whish / OMT transfers', toConfirm > 0 ? 'alert' : false, 'late') + U.kpi(late ? 'Late' : 'In studio', late || here, late ? 'not arrived yet' : M.db.staff.filter((s) => worksOn(s, d)).length + ' chairs working', late > 0 ? 'alert' : false, late ? 'late' : 'walk') + '</div>');
    }
    R.appendChild(head);
    if (state.mode === 'week') { R.appendChild(weekView()); R.appendChild(attention(d, me)); return; }
    // week strip
    const ws = el('<div class="card pad" style="padding:10px 8px"><div class="weekstrip"></div></div>'); const w = ws.querySelector('.weekstrip');
    for (let i = -1; i <= 5; i++) { const dt = new Date(M.T0 + i * M.DAY); const n = bookingsOn(i).filter((b) => isOpen(b) && (state.staff === 'all' || b.staff === state.staff)).length; const b = el('<button type="button" class="' + (i === 0 ? 'today ' : '') + (isClosedDay(i) ? 'closed' : '') + '" aria-pressed="' + (i === d) + '"><small>' + dt.toLocaleDateString('en-GB', { weekday: 'short' }) + '</small><span class="n">' + dt.getDate() + '</span><span class="dots">' + M.db.staff.filter((s) => s.active && worksOn(s, i) && bookingsOn(i).some((b) => b.staff === s.name && isOpen(b))).slice(0, 5).map((s) => '<i style="background:' + s.accent + '"></i>').join('') + '</span></button>'); b.onclick = () => { state.day = i; M.refresh(); }; w.appendChild(b); }
    const jump = el('<div class="spread" style="padding:0 8px 4px"><button class="btn sm soft" data-prev>' + icon('left') + '</button><label class="btn sm ghost" style="gap:6px">' + icon('today') + 'Go to date<input type="date" hidden></label><button class="btn sm soft" data-next>' + icon('right') + '</button></div>');
    jump.querySelector('[data-prev]').onclick = () => { state.day--; M.refresh(); }; jump.querySelector('[data-next]').onclick = () => { state.day++; M.refresh(); };
    jump.querySelector('input').onchange = (e) => { const t = new Date(e.target.value + 'T00:00:00'); state.day = Math.round((t - M.T0) / M.DAY); M.refresh(); };
    if (d < -1 || d > 5) w.insertAdjacentHTML('afterbegin', '<p class="note" style="grid-column:1/-1;text-align:center;margin:0 0 6px">Showing ' + esc(M.fmtDay(dayIso(d))) + '</p>');
    ws.appendChild(jump); R.appendChild(ws);
    // stylist filter
    if (!me) { const strip = el('<div class="stylist-strip"></div>'); [{ name: 'all', label: 'All chairs' }].concat(M.db.staff.filter((s) => s.active)).forEach((s) => { const b = el('<button type="button" aria-pressed="' + (state.staff === s.name) + '">' + (s.accent ? U.staffAvatar(s.name) : '<span class="avatar" style="width:26px;height:26px;font-size:10px">' + M.db.staff.filter((x) => x.active).length + '</span>') + esc(s.label || s.name) + (s.name !== 'all' && !worksOn(s, d) ? ' <span class="ref">off</span>' : '') + '</button>'); b.onclick = () => { state.staff = s.name; M.refresh(); }; strip.appendChild(b); }); R.appendChild(strip); }
    if (!me) { const a = el('<div class="actions"><button class="btn sm" data-new>' + icon('plus') + 'New booking</button><button class="btn sm soft" data-walk>' + icon('walk') + 'Walk-in</button>' + (M.can('orders') ? '<button class="btn sm soft" data-sale>' + icon('pos') + 'Sell products</button>' : '') + '<button class="btn sm soft" data-block>' + icon('block') + 'Block time</button></div>'); a.querySelector('[data-new]').onclick = () => newBooking({ day: d }); a.querySelector('[data-walk]').onclick = () => newBooking({ day: 0, walkIn: true }); a.querySelector('[data-block]').onclick = () => blockTime(d); const sb = a.querySelector('[data-sale]'); if (sb) sb.onclick = () => M.deskSale(); R.appendChild(a); }
    if (isClosedDay(d)) R.insertAdjacentHTML('beforeend', '<div class="card">' + U.empty('Closed', 'The studio is closed this day. Bookings can still be added by the desk.') + '</div>');
    R.appendChild(calendar(d));
    if (!me) R.insertAdjacentHTML('beforeend', '<p class="note" style="text-align:center;font-size:12px">Drag a booking to move it in time or to another chair · tap an empty slot to book</p>');
    R.appendChild(attention(d, me));
    const seq = list.filter(isOpen).sort((a, b) => a.start < b.start ? -1 : 1);
    R.appendChild(U.card(me ? 'Your day' : 'Schedule', seq.length ? seq.map((b) => bookingRow(b)) : U.empty('Nothing booked', 'A free day on this chair.')));
  } };

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
      if (M.can('messages')) { const f = M.db.messages.filter((m) => m.status === 'failed'); if (f.length) items.push({ p: 6, row: U.row({ href: '#/messages', lead: icon('messages'), title: f.length + ' WhatsApp message' + (f.length > 1 ? 's' : '') + ' failed', sub: 'Tap to retry', end: pill('failed') }) }); }
      const soon = M.db.clients.filter((c) => { if (!c.birthday) return false; const t = new Date(); const b = new Date(c.birthday); b.setFullYear(t.getFullYear()); const dd = Math.round((b - M.T0) / M.DAY); return dd >= 0 && dd <= 3; });
      soon.forEach((c) => items.push({ p: 7, row: U.row({ href: '#/client/' + c.id, lead: esc(U.initials(c.name)), title: esc(c.name) + ' · birthday ' + (M.lkey(new Date(new Date(c.birthday).setFullYear(new Date().getFullYear())).toISOString()) === M.lkey(new Date().toISOString()) ? 'today' : 'soon'), sub: 'Send a wish · ' + esc(c.phone), end: icon('chev') }) }));
    }
    if (!items.length) return el('<div></div>');
    items.sort((a, b) => a.p - b.p);
    return U.card('Needs attention', items.map((i) => i.row), '<span class="pill warn">' + items.length + '</span>');
  };

  const weekView = () => {
    const mon = -((dow(0) + 6) % 7); const staff = M.db.staff.filter((s) => s.active && (state.staff === 'all' || s.name === state.staff));
    const w = el('<div class="week"></div>'); w.insertAdjacentHTML('beforeend', '<div></div>');
    for (let i = 0; i < 7; i++) { const dt = new Date(M.T0 + (mon + i) * M.DAY); w.insertAdjacentHTML('beforeend', '<div>' + dt.toLocaleDateString('en-GB', { weekday: 'short' }) + '<br><span style="font-size:14px;letter-spacing:0;color:var(--fg)">' + dt.getDate() + '</span></div>'); }
    staff.forEach((s) => {
      w.insertAdjacentHTML('beforeend', '<div>' + U.staffAvatar(s.name, 'sm') + esc(s.name) + '</div>');
      for (let i = 0; i < 7; i++) { const d = mon + i; const bs = bookingsOn(d).filter((b) => b.staff === s.name && b.status !== 'cancelled' && b.status !== 'no-show'); const mins = bs.reduce((a, b) => a + b.mins, 0); const sh = shift(s, d); const cap = Math.max(1, ((sh && !sh.off ? sh.end - sh.start : 0)) * 60); const cell = el('<div class="cell' + (worksOn(s, d) ? '' : ' off') + (d === 0 ? ' today' : '') + '">' + (worksOn(s, d) ? '<span class="cnt"><b>' + bs.length + '</b> · ' + Math.round(mins / cap * 100) + '%</span><div class="load"><i style="width:' + Math.min(100, mins / cap * 100) + '%"></i></div>' + (bs.filter((b) => b.status === 'held').length ? '<span class="ref" style="color:var(--warn)">' + bs.filter((b) => b.status === 'held').length + ' unpaid</span>' : '') : '<span class="cnt">off</span>') + '</div>'); cell.onclick = () => { state.day = d; state.mode = 'day'; state.staff = s.name; M.refresh(); }; w.appendChild(cell); }
    });
    const tot = el('<div style="grid-column:1/-1;padding:10px 12px;display:flex;justify-content:space-between;font-size:12.5px;color:var(--muted)"><span>Week: <b style="color:var(--fg)">' + M.db.bookings.filter((b) => isOpen(b) && M.lkey(b.start) >= M.lkey(dayIso(mon)) && M.lkey(b.start) <= M.lkey(dayIso(mon + 6))).length + '</b> bookings</span><span>Tap a cell to open that day</span></div>'); w.appendChild(tot);
    return w;
  };

  const calendar = (d) => {
    const open = M.db.settings.hours.open, close = closeAt(d); const hours = close - open;
    const staff = M.db.staff.filter((s) => s.active && (state.staff === 'all' || s.name === state.staff));
    const wrap = el('<div class="cal" style="--hour-h:' + HOUR_H + 'px"><div class="cal-times"></div><div class="cal-cols"></div></div>');
    const times = wrap.querySelector('.cal-times'); times.style.height = (hours * HOUR_H + 40) + 'px';
    for (let h = open; h <= close; h++) times.insertAdjacentHTML('beforeend', '<div style="top:' + ((h - open) * HOUR_H + 40) + 'px">' + String(h).padStart(2, '0') + ':00</div>');
    const cols = wrap.querySelector('.cal-cols'); cols.style.gridTemplateColumns = 'repeat(' + staff.length + ',minmax(' + (staff.length > 2 ? 132 : 160) + 'px,1fr))';
    const head = el('<div class="cal-head"></div>'); head.style.gridTemplateColumns = cols.style.gridTemplateColumns; head.style.gridColumn = '1 / -1'; head.style.display = 'grid';
    cols.style.gridTemplateRows = '40px ' + (hours * HOUR_H) + 'px';
    staff.forEach((s) => { const n = bookingsOn(d).filter((b) => b.staff === s.name && isOpen(b)).length; const sh = shift(s, d); head.insertAdjacentHTML('beforeend', '<div>' + U.staffAvatar(s.name) + '<span>' + esc(s.name) + '</span><span class="cnt">' + (worksOn(s, d) ? n + ' · ' + sh.start + '–' + sh.end : esc(sh ? sh.label.toLowerCase() : 'off')) + '</span></div>'); });
    cols.appendChild(head);
    staff.forEach((s) => {
      const col = el('<div class="cal-col' + (worksOn(s, d) ? '' : ' off') + '"></div>');
      const sh = shift(s, d); if (worksOn(s, d) && (sh.start > open || sh.end < close)) { if (sh.start > open) col.insertAdjacentHTML('beforeend', '<div class="appt block" style="top:0;height:' + ((sh.start - open) * HOUR_H - 2) + 'px;pointer-events:none;box-shadow:none;border-radius:0"></div>'); if (sh.end < close) col.insertAdjacentHTML('beforeend', '<div class="appt block" style="top:' + ((sh.end - open) * HOUR_H) + 'px;height:' + ((close - sh.end) * HOUR_H) + 'px;pointer-events:none;box-shadow:none;border-radius:0"></div>'); }
      col.dataset.staff = s.name;
      col.onclick = (e) => { if (e.target !== col || M.myStaff()) return; const y = e.offsetY; const t = open + Math.floor(y / (HOUR_H / 2)) / 2; newBooking({ day: d, staff: s.name, time: t }); };
      bookingsOn(d).filter((b) => b.staff === s.name && b.status !== 'cancelled').forEach((b) => {
        const top = (hm(b.start) - open) * HOUR_H, h = Math.max(28, b.mins / 60 * HOUR_H - 3); const late = isLate(b);
        const a = el('<button type="button" class="appt ' + (b.status === 'held' ? 'held' : '') + (b.status === 'settled' ? ' done' : '') + (b.status === 'no-show' ? ' no-show' : '') + (b.status === 'in-chair' ? ' inchair' : '') + '" data-ref="' + b.ref + '" style="top:' + top + 'px;height:' + h + 'px;--acc:' + s.accent + ';--acc-bg:' + U.hexA(s.accent, 0.38) + '"><div class="n' + (late ? ' late' : '') + '">' + (late ? icon('late').replace('<svg', '<svg style="width:12px;height:12px;flex:0 0 auto"') : '') + esc(clientName(b)) + '</div>' + (h > 40 ? '<div class="sv">' + esc(svcNames(b)) + '</div>' : '') + (h > 58 ? '<div class="sv">' + M.fmtTime(b.start) + (M.may('amounts') ? ' · ' + M.money(b.final != null ? b.final : b.price) : '') + (b.payStatus === 'paid' ? ' · paid' : b.status === 'held' ? ' · unpaid' : '') + '</div>' : '') + (h > 44 ? '<span class="dur">' + b.mins + 'm</span>' : '') + '<i class="st" style="color:' + STATUS_DOT[b.status] + '">' + STATUS_ICON[b.status] + '</i></button>');
        a.onclick = () => { if (a.dataset.dragged) { delete a.dataset.dragged; return; } M.openBooking(b.ref); }; if (!M.myStaff() && isOpen(b)) dragify(a, b, s.name, d); col.appendChild(a);
      });
      M.db.blocks.filter((x) => x.staff === s.name && M.isSameDay(x.start, dayIso(d))).forEach((x) => { const a = el('<button type="button" class="appt block" style="top:' + ((hm(x.start) - open) * HOUR_H) + 'px;height:' + (x.mins / 60 * HOUR_H - 3) + 'px"><div class="n">' + esc(x.label) + '</div><div class="sv">' + x.mins + ' min</div></button>'); a.onclick = async () => { if (M.myStaff()) return; if (await U.confirm({ title: 'Remove block?', text: esc(x.label) + ' · ' + esc(s.name) + ' · ' + M.fmtTime(x.start), ok: 'Remove', danger: true })) { M.db.blocks = M.db.blocks.filter((y) => y.id !== x.id); M.save('blocks'); } }; col.appendChild(a); });
      if (d === 0) { const now = hm(new Date().toISOString()); if (now > open && now < close) col.insertAdjacentHTML('beforeend', '<div class="nowline" style="top:' + ((now - open) * HOUR_H) + 'px"></div>'); }
      cols.appendChild(col);
    });
    if (d === 0) { const now = hm(new Date().toISOString()); if (now > open && now < close) times.insertAdjacentHTML('beforeend', '<div class="nowtag" style="top:' + ((now - open) * HOUR_H + 40) + 'px;left:4px">' + M.fmtTime(new Date().toISOString()) + '</div>'); }
    return wrap;
  };

  const bookingRow = (b, att) => { const pend = (b.extra || []).filter((x) => x.status === 'pending' && x.pay !== 'cash'); const sub = U.staffAvatar(b.staff, 'sm') + '<b>' + esc(b.staff) + '</b> · ' + esc(svcNames(b)) + (att === 'late' ? ' · <span class="late">' + Math.round((Date.now() - new Date(b.start)) / 6e4) + ' min late</span>' : att === 'waiting' ? ' · waiting ' + (b.arrivedAt ? M.rel(b.arrivedAt).replace(' ago', '') : '') : '') + (att === true && b.status === 'held' ? ' · ' + esc(M.PAY_LABEL[b.pay]) + ' due ' + M.until(b.deadline) : '') + (att === true && pend.length ? ' · top-up ' + money(pend.reduce((a, x) => a + x.amount, 0)) + ' pending' : ''); return U.row({ lead: U.clientAvatar(M.client(b.clientId)), title: '<span class="mono" style="font-size:12px;color:var(--muted);font-weight:500">' + M.fmtTime(b.start) + '</span>' + esc(clientName(b)) + (b.source === 'walk-in' ? ' <span class="ref">walk-in</span>' : '') + (M.client(b.clientId).tags || []).map((t) => ' <span class="pill dim plain" style="height:16px;font-size:8.5px">' + esc(t) + '</span>').join(''), sub, end: '<span class="amt">' + money(b.final != null ? b.final : b.price) + '</span>' + (att === 'late' ? '<span class="pill bad">Late</span>' : pill(b.status)), onClick: () => M.openBooking(b.ref) }); };
  M.bookingRow = bookingRow;

  // ---- booking detail ----
  M.openBooking = (ref) => {
    const b = M.db.bookings.find((x) => x.ref === ref); if (!b) return;
    const c = M.client(b.clientId); const me = M.myStaff(); const canPay = M.may('settle'); const canRefund = M.may('refunds');
    const body = el('<div class="stack"></div>');
    const st = M.staffOf(b.staff); const late = isLate(b);
    body.innerHTML = '<div class="inline">' + (late ? '<span class="pill bad">Late</span>' : pill(b.status)) + pill(b.payStatus === 'paid' ? 'paid' : b.payStatus === 'pending' ? 'pending' : 'unpaid') + '<span class="ref">' + esc(b.ref) + ' · ' + esc(b.source) + '</span></div>' +
      '<div class="card pad"><div class="spread"><div><b>' + esc(M.fmtDay(b.start)) + '</b> · ' + M.fmtTime(b.start) + ' – ' + M.fmtTime(new Date(new Date(b.start).getTime() + b.mins * 6e4).toISOString()) + '<div class="note">' + esc(b.staff) + ' · ' + b.mins + ' min</div></div><span class="sw" style="width:14px;height:14px;border-radius:99px;background:' + (st ? st.accent : '#ccc') + '"></span></div><div class="hr" style="margin:12px 0"></div>' + b.services.map((s) => '<div class="spread" style="font-size:14px;padding:4px 0"><span>' + esc(s.name) + '</span><span class="mono" style="font-size:13px">' + (s.price == null ? 'quote' : (s.from ? 'from ' : '') + money(s.price)) + '</span></div>').join('') + (b.products || []).map((p) => '<div class="spread" style="font-size:14px;padding:4px 0;color:var(--muted)"><span>' + (p.qty > 1 ? p.qty + '× ' : '') + esc(p.name) + ' <span class="ref">product</span></span><span class="mono" style="font-size:13px">' + money(p.qty * p.price) + '</span></div>').join('') + ((upcoming(b) || b.status === 'arrived' || b.status === 'in-chair') && !me ? '<div class="inline" style="margin-top:8px"><button class="btn sm soft" data-add>' + icon('plus') + 'Add service</button>' + (M.can('products') ? '<button class="btn sm soft" data-prod>' + icon('pos') + 'Add product</button>' : '') + '</div>' : '') + '</div>' +
      '<div class="card pad"><div class="spread"><div><b>' + esc(c.name) + '</b> <span class="pill dim plain">' + esc(c.tier || 'Member') + '</span>' + (c.tags || []).map((t) => ' <span class="pill dim plain">' + esc(t) + '</span>').join('') + '<div class="note">' + esc(c.phone) + '</div></div><div class="inline"><a class="icon-btn" href="' + U.wa(c.phone, late ? 'Hi ' + c.name.split(' ')[0] + ', it\u2019s Incenso — we have your ' + M.fmtTime(b.start) + ' with ' + b.staff + ' ready. Are you on your way?' : '') + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon('wa') + '</a><a class="icon-btn" href="#/client/' + c.id + '" data-x aria-label="Profile">' + icon('chev') + '</a></div></div>' + (c.notes ? '<p class="note" style="margin-top:8px;color:var(--fg)">' + esc(c.notes) + '</p>' : '') + (c.blocked ? '<p class="note" style="margin-top:8px;color:var(--bad)">Client is blocked from online booking.</p>' : '') + '</div>' +
      (M.may('amounts') ? '<div class="card pad"><div class="spread"><h3>Payment</h3><span class="mono" style="font-size:13px">' + money(b.final != null ? b.final : b.price + (b.extra || []).reduce((a, x) => a + x.amount, 0) + (b.products || []).reduce((a, p) => a + p.qty * p.price, 0)) + '</span></div><div data-pay></div></div>' : '') +
      '<div class="card pad"><div class="spread"><h3>Notes</h3><button class="btn sm soft" data-note>' + icon('edit') + 'Edit</button></div><p class="note" style="margin-top:6px' + (b.notes ? ';color:var(--fg)' : '') + '">' + (esc(b.notes) || 'No notes yet.') + '</p></div>';
    const pay = body.querySelector('[data-pay]');
    if (pay) { const pieces = M.bookingPieces(b); pay.innerHTML = U.paylines(pieces);
      if (canPay) pay.querySelectorAll('.payline').forEach((line, i) => { const p = pieces[i]; if (!p) return; if (p.status === 'pending' && p.extra) { const btn = el('<button class="btn sm soft" style="grid-column:1/-1;justify-self:start">' + icon('check') + 'Confirm ' + esc(M.PAY_LABEL[p.extra.pay]) + ' received</button>'); btn.onclick = () => { p.extra.status = 'paid'; p.extra.paidAt = new Date().toISOString(); M.log('Top-up confirmed', b.ref, M.user().name); M.save(); U.toast('Top-up confirmed — client messaged'); M.openBooking(ref); }; line.appendChild(btn); } else if (p.status === 'pending' && !p.extra) { const btn = el('<button class="btn sm" style="grid-column:1/-1;justify-self:start">' + icon('check') + 'Confirm ' + esc(M.PAY_LABEL[b.pay]) + ' received</button>'); btn.onclick = () => { b.paid = b.price; b.payStatus = 'paid'; b.status = 'confirmed'; b.deadline = null; M.log('Transfer confirmed', b.ref, M.user().name); M.save(); U.toast('Payment confirmed — booking confirmed on WhatsApp'); M.openBooking(ref); }; line.appendChild(btn); } });
      if (b.status === 'held') pay.insertAdjacentHTML('beforeend', '<p class="note" style="margin-top:10px">Held until <b>' + esc(M.fmtDT(b.deadline)) + '</b> (' + esc(M.until(b.deadline)) + '). Auto-released if unpaid.</p>');
      if (b.cardLink && b.payStatus === 'pending') pay.insertAdjacentHTML('beforeend', '<p class="note" style="margin-top:10px">Stripe link sent on WhatsApp — confirms itself when paid.</p>'); }
    const foot = el('<div style="display:flex;gap:8px;width:100%;flex-wrap:wrap"></div>');
    const act = (label, cls, fn) => { const x = el('<button class="btn ' + cls + '">' + label + '</button>'); x.onclick = fn; foot.appendChild(x); };
    if (b.status === 'confirmed' || b.status === 'held') act('Arrived', '', () => setStatus(b, 'arrived'));
    if (b.status === 'arrived') act('In chair', '', () => setStatus(b, 'in-chair'));
    if ((b.status === 'in-chair' || b.status === 'arrived') && canPay) act('Settle visit', '', () => settle(b));
    if (isOpen(b) && !me) act('More', 'ghost', () => moreActions(b));
    if (b.status === 'settled') foot.insertAdjacentHTML('beforeend', '<p class="note" style="flex:1;text-align:center">Settled ' + (b.settledAt ? M.rel(b.settledAt) : '') + ' · ' + money(b.final) + (b.tip ? ' · tip ' + money(b.tip) : '') + '</p>');
    if (b.status === 'no-show' || b.status === 'cancelled') { foot.insertAdjacentHTML('beforeend', '<p class="note" style="flex:1;text-align:center">' + esc(U.STATUS[b.status][0]) + (b.refund ? ' · refund ' + money(b.refund) + (b.refundSent ? ' sent' : ' to send') : '') + '</p>'); if (b.refund && !b.refundSent && canRefund) act('Mark refund sent', 'ghost', () => { b.refundSent = true; M.log('Refund sent', b.ref, M.user().name); M.save(); U.toast('Refund marked sent — client messaged'); M.openBooking(ref); }); }
    U.sheet({ title: c.name, sub: esc(svcNames(b)), body, foot: foot.children.length ? foot : null });
    const addBtn = body.querySelector('[data-add]'); if (addBtn) addBtn.onclick = () => addService(b);
    const prodBtn = body.querySelector('[data-prod]'); if (prodBtn) prodBtn.onclick = () => M.deskSale({ booking: b });
    body.querySelector('[data-note]').onclick = async () => { const r = await U.prompt({ title: 'Booking notes', fields: [{ name: 'notes', label: 'Notes for the chair', type: 'textarea', value: b.notes }] }); if (r) { b.notes = r.notes; M.save(); M.openBooking(ref); } };
  };
  const setStatus = (b, st) => { b.status = st; if (st === 'arrived') b.arrivedAt = new Date().toISOString(); M.log(U.STATUS[st][0], b.ref, M.user().name); M.save(); U.toast(M.client(b.clientId).name + ' · ' + U.STATUS[st][0]); M.openBooking(b.ref); };
  const moreActions = (b) => {
    const body = el('<div class="card"><div class="list"></div></div>'); const l = body.querySelector('.list');
    const item = (t, s, fn, danger) => l.appendChild(U.row({ title: (danger ? '<span style="color:var(--bad)">' : '<span>') + t + '</span>', sub: s, end: icon('chev'), onClick: fn }));
    item('Reschedule', 'Move to another time or chair', () => reschedule(b));
    item('Add service / top-up', 'Adds a separate line with its own pay method', () => addService(b));
    item('Message client', 'Opens WhatsApp with a ready line', () => { window.open(U.wa(M.client(b.clientId).phone, 'Hi ' + M.client(b.clientId).name.split(' ')[0] + ', it\u2019s Incenso about your booking ' + b.ref + ' on ' + M.fmtDay(b.start) + ' at ' + M.fmtTime(b.start) + ' — '), '_blank'); });
    if (b.payStatus === 'unpaid' && b.pay === 'cash' && M.may('settle')) item('Record a prepayment', 'Whish / OMT / card taken now', () => switchPay(b));
    if (M.may('refunds')) { if (new Date(b.start) < new Date()) item('Mark no-show', 'Cancels · prepaid amounts are refunded', () => noShow(b), true); item('Cancel booking', b.paid ? 'Refund ' + money(b.paid) + ' the same way' : 'Nothing was charged', () => cancel(b), true); if (b.status === 'held') item('Release slot now', 'Unpaid transfer · frees the time', () => cancel(b, true), true); }
    else l.insertAdjacentHTML('beforeend', '<p class="note" style="padding:12px 16px">Cancelling and refunds need the owner.</p>');
    U.sheet({ title: 'Booking ' + b.ref, sub: esc(M.client(b.clientId).name) + ' · ' + M.fmtDT(b.start), body });
  };
  const settle = async (b) => {
    const prod = (b.products || []).reduce((a, p) => a + p.qty * p.price, 0);
    const est = b.price + (b.extra || []).reduce((a, x) => a + x.amount, 0) + prod; const paidSoFar = b.paid + b.gift + (b.extra || []).filter((x) => x.status === 'paid').reduce((a, x) => a + x.amount, 0);
    const P = M.db.settings.payments; const opts = [['cash', 'Cash at studio'], ['card', 'Card (terminal)'], ['whish', 'Whish Money'], ['omt', 'OMT Pay'], ['gift', 'Gift balance']].filter((o) => o[0] === 'gift' || P[o[0]] !== false);
    const r = await U.prompt({ title: 'Settle visit', ok: 'Close visit', fields: [{ name: 'final', label: 'Final price (as agreed in the chair)' + (prod ? ' · incl. ' + M.money(prod) + ' products' : ''), type: 'number', money: true, value: est, min: 0, step: 1, required: true }, { name: 'discount', label: 'Discount', type: 'number', money: true, value: 0, min: 0, opt: true }, { name: 'method', label: 'Balance of ' + M.money(Math.max(0, est - paidSoFar)) + ' settled by', type: 'select', value: 'cash', options: opts }, { name: 'tip', label: 'Tip for ' + b.staff, type: 'number', money: true, value: 0, min: 0, opt: true }] });
    if (!r) return;
    const final = Math.max(0, r.final - (r.discount || 0));
    b.final = final; b.discount = r.discount || 0; b.status = 'settled'; b.settledAt = new Date().toISOString(); b.settleMethod = r.method; b.tip = r.tip || 0;
    const bal = final - paidSoFar; if (bal > 0) { b.due = 0; b.paid = paidSoFar + bal; b.settledBalance = bal; } else if (bal < 0) { b.refund = -bal; b.refundSent = false; b.due = 0; }
    (b.extra || []).forEach((x) => { if (x.status !== 'paid') x.status = 'paid'; }); b.payStatus = 'paid';
    (b.products || []).forEach((p) => { const pr = M.db.products.find((x) => x.id === p.productId); if (pr) { pr.stock = Math.max(0, pr.stock - p.qty); pr.sold30 += p.qty; } });
    M.log('Visit settled · ' + M.money(final), b.ref, M.user().name); M.save(); U.toast('Visit settled — receipt sent on WhatsApp'); M.openBooking(b.ref);
  };
  const addService = async (b) => {
    const opts = M.db.services.filter((s) => s.active && (!M.staffOf(b.staff) || M.staffOf(b.staff).cats.includes(s.cat))).map((s) => [s.id, s.name + ' · ' + (s.price == null ? 'quote' : M.money(s.price)) + ' · ' + s.mins + 'm']);
    const r = await U.prompt({ title: 'Add service', ok: 'Add', fields: [{ name: 'svc', label: 'Service', type: 'select', options: opts }, { name: 'pay', label: 'Top-up paid by', type: 'select', value: 'cash', options: [['cash', 'Cash at studio (no timer)'], ['card', 'Card — send Stripe link'], ['whish', 'Whish Money (24h)'], ['omt', 'OMT Pay (24h)']] }] });
    if (!r) return; const s = M.db.services.find((x) => x.id === r.svc);
    const clash = overlaps(b.staff, new Date(new Date(b.start).getTime() + b.mins * 6e4), s.mins, b.ref);
    if (clash.length && !(await U.confirm({ title: 'Runs into the next booking', text: 'Adding ' + s.mins + ' min overlaps ' + esc(clash[0].label || M.client(clash[0].clientId).name) + ' at ' + M.fmtTime(clash[0].start) + '. Add anyway?', ok: 'Add anyway' }))) return;
    b.services.push({ name: s.name, mins: s.mins, price: s.price, from: s.from }); b.mins += s.mins;
    const amt = s.price || 0; const x = { amount: amt, pay: r.pay, status: 'pending', placedAt: new Date().toISOString(), deadline: (r.pay === 'whish' || r.pay === 'omt') ? new Date(Math.min(Date.now() + 24 * 36e5, new Date(b.start).getTime())).toISOString() : null };
    if (amt) b.extra.push(x);
    M.log('Service added · ' + s.name, b.ref, M.user().name); M.save(); U.toast(s.name + ' added' + (amt ? ' · ' + M.money(amt) + ' ' + M.PAY_LABEL[r.pay] : '')); M.openBooking(b.ref);
  };
  const switchPay = async (b) => { const r = await U.prompt({ title: 'Record payment', ok: 'Record', fields: [{ name: 'pay', label: 'Paid by', type: 'select', value: 'whish', options: [['whish', 'Whish Money'], ['omt', 'OMT Pay'], ['card', 'Card (terminal)']] }] }); if (!r) return; b.pay = r.pay; b.paid = b.price; b.due = 0; b.payStatus = 'paid'; M.log('Prepaid recorded', b.ref, M.user().name); M.save(); M.openBooking(b.ref); };
  const reschedule = async (b) => {
    const r = await U.prompt({ title: 'Reschedule', ok: 'Move booking', fields: [{ name: 'date', label: 'Date', type: 'date', value: M.lkey(b.start), required: true }, { name: 'time', label: 'Time', type: 'time', value: M.fmtTime(b.start), required: true }, { name: 'staff', label: 'Chair', type: 'select', value: b.staff, options: M.db.staff.filter((s) => s.active).map((s) => s.name) }] });
    if (!r) return; const [hh, mm] = r.time.split(':').map(Number); const d = new Date(r.date + 'T00:00:00'); d.setHours(hh, mm, 0, 0);
    const clash = overlaps(r.staff, d, b.mins, b.ref);
    if (clash.length && !(await U.confirm({ title: 'Overlaps another booking', text: esc(clash[0].label || M.client(clash[0].clientId).name) + ' at ' + M.fmtTime(clash[0].start) + ' on ' + esc(r.staff) + '. Move anyway?', ok: 'Move anyway' }))) return;
    b.start = d.toISOString(); b.staff = r.staff; M.log('Rescheduled → ' + M.fmtDT(b.start), b.ref, M.user().name); M.save(); U.toast('Moved — client messaged the new time'); M.openBooking(b.ref);
  };
  const noShow = async (b) => { if (!(await U.confirm({ title: 'Mark as no-show?', text: esc(M.client(b.clientId).name) + ' didn\u2019t arrive. The booking is cancelled, nothing is charged' + (b.paid ? ', and ' + M.money(b.paid) + ' is refunded the same way.' : '.'), ok: 'No-show', danger: true }))) return; b.status = 'no-show'; if (b.paid) { b.refund = b.paid; b.refundSent = false; } b.due = 0; const c = M.client(b.clientId); c.noShows = (c.noShows || 0) + 1; M.log('No-show', b.ref, M.user().name); M.save(); U.toast('Marked no-show' + (c.noShows >= 2 ? ' · ' + c.noShows + ' no-shows — consider blocking' : '')); M.openBooking(b.ref); };
  const cancel = async (b, release) => { if (!(await U.confirm({ title: release ? 'Release slot?' : 'Cancel booking?', text: (release ? 'The transfer wasn\u2019t received. ' : '') + esc(M.client(b.clientId).name) + ' is told on WhatsApp' + (b.paid ? ' and ' + M.money(b.paid) + ' is refunded the same way.' : '. Nothing was charged.'), ok: release ? 'Release' : 'Cancel booking', danger: true }))) return; b.status = 'cancelled'; if (b.paid) { b.refund = b.paid; b.refundSent = false; } b.due = 0; M.log(release ? 'Released · unpaid' : 'Cancelled by studio', b.ref, M.user().name); M.save(); U.toast(release ? 'Slot released' : 'Booking cancelled'); M.openBooking(b.ref); };

  // ---- new booking / walk-in ----
  const newBooking = (o) => {
    const day = o.day || 0; const staff0 = o.staff || (M.db.staff.find((s) => worksOn(s, day) && s.active) || M.db.staff[0]).name;
    const form = el('<form class="form"></form>');
    const t0 = o.time != null ? o.time : o.walkIn ? Math.ceil(hm(new Date().toISOString()) * 4) / 4 : M.db.settings.hours.open;
    const timeStr = String(Math.floor(t0)).padStart(2, '0') + ':' + String(Math.round((t0 % 1) * 60)).padStart(2, '0');
    const cl = M.db.clients.slice().sort((a, b) => a.name.localeCompare(b.name));
    form.appendChild(U.field({ name: 'client', label: 'Client', type: 'select', value: o.clientId || '', options: [['', 'New guest…']].concat(cl.map((c) => [c.id, c.name + ' · ' + c.phone + (c.blocked ? ' · BLOCKED' : '')])) }));
    const nw = el('<div class="two"></div>'); nw.appendChild(U.field({ name: 'name', label: 'Name', placeholder: 'Guest name' })); nw.appendChild(U.field({ name: 'phone', label: 'WhatsApp', type: 'tel', placeholder: '+961 …' })); form.appendChild(nw);
    form.client.onchange = () => { nw.classList.toggle('hide', !!form.client.value); }; nw.classList.toggle('hide', !!form.client.value);
    form.appendChild(U.field({ name: 'staff', label: 'Chair', type: 'select', value: staff0, options: M.db.staff.filter((s) => s.active).map((s) => s.name) }));
    const svcWrap = el('<div class="field"><label>Services</label><div class="stack" data-svcs></div><button type="button" class="btn sm soft" data-more-svc>' + icon('plus') + 'Another service</button></div>'); form.appendChild(svcWrap);
    const svcSel = () => { const st = M.staffOf(form.staff.value); const opts = M.db.services.filter((s) => s.active && (!st || st.cats.includes(s.cat)) && (!st || !st.services || !st.services.length || st.services.includes(s.id))); return el('<select name="svc">' + opts.map((s) => '<option value="' + s.id + '">' + esc(s.name) + ' · ' + (s.price == null ? 'quote' : M.money(s.price)) + ' · ' + s.mins + 'm</option>').join('') + '</select>'); };
    const svcs = svcWrap.querySelector('[data-svcs]'); svcs.appendChild(svcSel());
    svcWrap.querySelector('[data-more-svc]').onclick = () => svcs.appendChild(svcSel());
    form.staff.onchange = () => { svcs.innerHTML = ''; svcs.appendChild(svcSel()); };
    if (!o.walkIn) { const dtw = el('<div class="two"></div>'); dtw.appendChild(U.field({ name: 'date', label: 'Date', type: 'date', value: M.lkey(dayIso(day)), required: true })); dtw.appendChild(U.field({ name: 'time', label: 'Time', type: 'time', value: timeStr, required: true })); form.appendChild(dtw); }
    const P = M.db.settings.payments;
    form.appendChild(U.field({ name: 'pay', label: 'Payment', type: 'select', value: 'cash', options: [['cash', 'Pay at the studio'], ['card', 'Card — send Stripe link on WhatsApp'], ['whish', 'Whish Money (held 24h)'], ['omt', 'OMT Pay (held 24h)']].filter((x) => P[x[0]] !== false) }));
    form.appendChild(U.field({ name: 'notes', label: 'Notes', type: 'textarea', opt: true }));
    const foot = el('<div style="display:flex;gap:8px;width:100%"><button class="btn ghost" type="button" data-c>Cancel</button><button class="btn" data-o>' + (o.walkIn ? 'Seat walk-in' : 'Book') + '</button></div>');
    const s = U.sheet({ title: o.walkIn ? 'Walk-in' : 'New booking', sub: o.walkIn ? 'Starts now · ' + M.fmtTime(new Date().toISOString()) : M.fmtDay(dayIso(day)), body: form, foot });
    foot.querySelector('[data-c]').onclick = () => s.close();
    foot.querySelector('[data-o]').onclick = async (e) => {
      e.preventDefault();
      let cid = form.client.value; if (!cid) { if (!form.name.value.trim()) { U.toast('Add the guest\u2019s name'); return; } const c = { id: 'c' + Date.now(), name: form.name.value.trim(), phone: form.phone.value.trim(), email: '', birthday: '', tier: 'Member', notes: '', since: new Date().toISOString(), tags: [], newsletter: false, blocked: false }; M.db.clients.push(c); cid = c.id; }
      const services = [...form.querySelectorAll('[name=svc]')].map((x) => M.db.services.find((y) => y.id === x.value)).map((x) => ({ name: x.name, mins: x.mins, price: x.price, from: x.from }));
      let start; if (o.walkIn) start = new Date(); else { const [hh, mm] = form.time.value.split(':').map(Number); start = new Date(form.date.value + 'T00:00:00'); start.setHours(hh, mm, 0, 0); }
      const mins = services.reduce((a, x) => a + x.mins, 0), price = services.reduce((a, x) => a + (x.price || 0), 0), pay = form.pay.value;
      const clash = overlaps(form.staff.value, start, mins); if (clash.length && !(await U.confirm({ title: 'Chair is busy then', text: esc(form.staff.value) + ' has ' + esc(clash[0].label || M.client(clash[0].clientId).name) + ' at ' + M.fmtTime(clash[0].start) + '. Book anyway (double-book)?', ok: 'Book anyway' }))) return;
      const stf = M.staffOf(form.staff.value); const dd = Math.round((new Date(start).setHours(0, 0, 0, 0) - M.T0) / M.DAY); if (stf && !worksOn(stf, dd) && !(await U.confirm({ title: stf.name + ' is off that day', text: 'Book anyway? The chair will see it on their day.', ok: 'Book anyway' }))) return;
      const b = { ref: M.nextRef('BK'), clientId: cid, staff: form.staff.value, services, start: start.toISOString(), mins, price, pay, paid: 0, due: 0, gift: 0, extra: [], products: [], payStatus: 'unpaid', status: o.walkIn ? 'in-chair' : 'confirmed', deadline: null, final: null, notes: form.notes.value, source: o.walkIn ? 'walk-in' : 'desk', placedAt: new Date().toISOString() };
      if (pay === 'cash') b.due = price; else if (pay === 'card') { b.payStatus = 'pending'; b.cardLink = true; } else { b.payStatus = 'pending'; if (!o.walkIn) b.status = 'held'; b.deadline = new Date(Math.min(Date.now() + 24 * 36e5, start.getTime())).toISOString(); }
      M.db.bookings.push(b); M.db.bookings.sort((x, y) => x.start < y.start ? -1 : 1);
      M.log(o.walkIn ? 'Walk-in seated' : 'Booked at desk', b.ref, M.user().name); M.save(); s.close(true); U.toast(b.ref + ' · ' + (o.walkIn ? 'seated' : 'booked — confirmation sent')); M.openBooking(b.ref);
    };
  };
  const blockTime = async (day) => { const r = await U.prompt({ title: 'Block time', ok: 'Block', fields: [{ name: 'staff', label: 'Chair', type: 'select', options: [['*', 'Whole studio']].concat(M.db.staff.filter((s) => s.active).map((s) => s.name)) }, { name: 'date', label: 'Date', type: 'date', value: M.lkey(dayIso(day)), required: true }, { name: 'time', label: 'From', type: 'time', value: '13:00', required: true }, { name: 'mins', label: 'Minutes', type: 'number', value: 60, min: 15, step: 15 }, { name: 'label', label: 'Label', value: 'Break' }] }); if (!r) return; const [hh, mm] = r.time.split(':').map(Number); const d = new Date(r.date + 'T00:00:00'); d.setHours(hh, mm); (r.staff === '*' ? M.db.staff.filter((s) => s.active).map((s) => s.name) : [r.staff]).forEach((st, i) => M.db.blocks.push({ id: 'bl' + Date.now() + i, staff: st, start: d.toISOString(), mins: r.mins, label: r.label || 'Blocked' })); M.save(); U.toast('Time blocked'); };
  M.newBooking = newBooking; M.overlaps = overlaps; M.attention = attention;
})();
