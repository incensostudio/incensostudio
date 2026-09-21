/* Incenso Management — Home: dashboard + calendar in one page */
(() => {
  const M = window.IncensoMgmt, U = window.MgmtUI, { el, esc, icon, pill } = U;
  const todayIso = () => new Date().toISOString();
  M.views.home = { title: 'Dashboard', render(ctx) {
    const C = M.cal; const R = ctx.root; const me = M.myStaff(); if (me) C.state.staff = me; const u = M.user(); const now = new Date(); const h = now.getHours();
    const d = C.state.day; const list = C.bookingsOn(d).filter((b) => C.state.staff === 'all' || b.staff === C.state.staff); const live = list.filter(C.isOpen).sort((a, b) => a.start < b.start ? -1 : 1);
    const todays = M.db.bookings.filter((b) => M.isSameDay(b.start, todayIso()) && (!me || b.staff === me)); const liveToday = todays.filter(C.isOpen).sort((a, b) => a.start < b.start ? -1 : 1);
    const settledToday = M.db.bookings.filter((b) => b.status === 'settled' && M.isSameDay(b.settledAt || b.start, todayIso()) && (!me || b.staff === me));
    const ordersToday = M.db.orders.filter((o) => ['delivered', 'collected'].includes(o.status) && M.isSameDay(o.placedAt, todayIso()));
    const prodOf = (b) => (b.products || []).reduce((a, p) => a + (p.final != null ? p.final : p.qty * p.price), 0);
    const shelfToday = settledToday.reduce((a, b) => a + prodOf(b), 0);
    const takings = settledToday.reduce((a, b) => a + (b.final || b.price) - prodOf(b), 0);
    const expected = live.reduce((a, b) => a + (b.final || b.price) + (b.extra || []).reduce((x, y) => x + y.amount, 0), 0);
    const yest = M.db.bookings.filter((b) => b.status === 'settled' && M.isSameDay(b.settledAt || b.start, M.at(-1, 12))).reduce((a, b) => a + (b.final || b.price) - prodOf(b), 0);
    const here = todays.filter((b) => b.status === 'arrived' || b.status === 'in-chair').length; const late = todays.filter(C.isLate).length; const next = liveToday.find((b) => new Date(b.start) > now);
    const toConfirm = list.filter((b) => b.status === 'held' || (b.extra || []).some((x) => x.status === 'pending' && x.pay !== 'cash')).length;
    ctx.title(''); document.title = 'Incenso Studio management';
    R.insertAdjacentHTML('beforeend', '<div class="hero"><h1>' + (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + ', ' + esc(u.name.split(' ')[0]) + '.</h1><p>' + (liveToday.length ? liveToday.length + ' booking' + (liveToday.length > 1 ? 's' : '') + ' still to come' : 'Nothing more booked today.') + (here ? ' · ' + here + ' in the studio' : '') + (late ? ' · <span class="late">' + late + ' late</span>' : '') + '</p></div>');
    // Day at a glance — one visit = one count, all for the day shown on the calendar
    const VS = M.visits(list); const done = VS.filter((v) => v.status === 'settled'); const gone = VS.filter((v) => v.status === 'cancelled' || v.status === 'no-show'); const open = VS.filter((v) => !['settled', 'cancelled', 'no-show'].includes(v.status));
    const toCome = open.filter((v) => new Date(v.start) > now && v.status !== 'arrived'); const nextV = toCome.sort((x, y) => x.start < y.start ? -1 : 1)[0];
    const owed = open.reduce((s, v) => s + v.live.reduce((q, x) => q + Math.max(0, x.price + (x.extra || []).reduce((e, y) => e + y.amount, 0) + (x.products || []).reduce((e, p) => e + p.qty * p.price, 0) - x.paid - x.gift - (x.extra || []).filter((y) => y.status === 'paid').reduce((e, y) => e + y.amount, 0)), 0), 0);
    const dayLbl = d === 0 ? 'today' : M.fmtDay(C.dayIso(d));
    const earned = d === 0 ? takings : done.reduce((s, v) => s + v.total - v.live.reduce((q, x) => q + prodOf(x), 0), 0); const shelf = d === 0 ? shelfToday : done.reduce((s, v) => s + v.live.reduce((q, x) => q + prodOf(x), 0), 0);
    R.insertAdjacentHTML('beforeend', '<div class="kpis">' + U.kpi('Visits ' + dayLbl, VS.length - gone.length, done.length + ' done · ' + open.length + ' still open' + (gone.length ? ' · ' + gone.length + ' cancelled' : ''), false, 'bookings') + U.kpi('Still to come', toCome.length, (here ? here + ' in the studio now' : '') + (here && toCome.length ? ' · ' : '') + (toCome.length ? toCome.reduce((s, v) => s + v.mins, 0) >= 60 ? Math.round(toCome.reduce((s, v) => s + v.mins, 0) / 60) + ' h of work ahead' : toCome.reduce((s, v) => s + v.mins, 0) + ' min ahead' : (!here ? 'nothing more booked' : '')), false, 'late') + (M.may('amounts') ? U.kpi('Left to collect', M.money(owed), open.length ? 'from ' + open.length + ' open visit' + (open.length > 1 ? 's' : '') + ' ' + dayLbl : 'all settled', owed > 0 ? 'alert' : false, 'money') + U.kpi('Services ' + dayLbl, M.money(earned), done.length + ' visit' + (done.length === 1 ? '' : 's') + (shelf ? ' · + ' + M.money(shelf) + ' shelf → Shop' : '') + (d === 0 && yest ? ' · yesterday ' + M.money(yest) : ''), true, 'money') : '') + '</div>');
    const cols = el('<div class="cols wide"></div>'); const left = el('<div class="stack"></div>'), right = el('<div class="stack aside"></div>');
    C.controls(left, me);
    cols.appendChild(left); cols.classList.add('solo'); R.appendChild(cols);
  } };
})();
