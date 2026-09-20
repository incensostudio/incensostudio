/* Incenso Management — shell: sign-in gate (roles), navigation, router */
(() => {
  const M = window.IncensoMgmt, U = window.MgmtUI, { el, esc, icon } = U;
  const SKEY = 'incenso-mgmt-session';
  M.views = {};
  const NAV = [
    { grp: 'Front desk' }, { id: 'home', label: 'Dashboard' }, { id: 'today', label: 'Calendar' }, { id: 'bookings', label: 'Bookings' }, { id: 'clients', label: 'Clients' },
    { grp: 'Shop' }, { id: 'orders', label: 'Orders' }, { id: 'gifts', label: 'Gift cards' }, { id: 'products', label: 'Products & stock' }, { id: 'supply', label: 'Suppliers & orders' },
    { grp: 'Studio' }, { id: 'money', label: 'Finances' }, { id: 'reports', label: 'Reports' }, { id: 'staff', label: 'Staff' }, { id: 'services', label: 'Services & prices' }, { id: 'messages', label: 'Messages' }, { id: 'settings', label: 'Site settings' },
  ];
  M.NAV_LABEL = {}; NAV.forEach((n) => { if (n.id) M.NAV_LABEL[n.id] = n.label; });
  const DETAIL_PARENT = { booking: 'bookings', client: 'clients', order: 'orders', gift: 'gifts', product: 'products', member: 'staff', setting: 'settings', po: 'supply', supplier: 'supply', rota: 'staff' };
  const TAB_PREF = ['home', 'today', 'bookings', 'orders', 'money', 'gifts', 'clients', 'products', 'messages'];
  const TAB_LABEL = { home: 'Home', today: 'Calendar', bookings: 'Bookings', orders: 'Orders', money: 'Money', gifts: 'Gifts', clients: 'Clients', products: 'Stock', messages: 'Messages', more: 'More' };
  const perms = (u) => { const live = M.db.users.find((x) => x.phone === u.phone); return live || u; };
  const allowed = (user, id) => { if (id === 'more') return true; const u = perms(user); if (u.active === false) return false; return !M.NAV_LABEL[id] || (u.modules || []).includes(id); };
  const tabsFor = (user) => TAB_PREF.filter((t) => allowed(user, t)).slice(0, 4).concat(['more']);

  let user = null; try { user = JSON.parse(localStorage.getItem(SKEY)); } catch (e) {}
  const setUser = (u) => { user = u; if (u) localStorage.setItem(SKEY, JSON.stringify(u)); else localStorage.removeItem(SKEY); };
  M.user = () => user && perms(user);
  M.can = (id) => user && allowed(user, id);
  M.may = (flag) => { const u = M.user(); return !!(u && u.flags && u.flags[flag]); };
  M.myStaff = () => { const u = M.user(); return u && u.flags && u.flags.ownOnly ? u.staff : null; };

  // ---- gate ----
  const gate = () => {
    document.body.innerHTML = '';
    const g = el('<div class="gate"><div class="gate-card">' + window.INCENSO_WORDMARK + '<h1>Studio management</h1><p>Sign in with your WhatsApp number. Only studio numbers can enter.</p><form class="form" data-step="phone"><div class="field"><label>WhatsApp number</label><input name="phone" type="tel" inputmode="tel" placeholder="+961 71 930 290" required autocomplete="tel"></div><button class="btn wide" type="submit">Send code</button><div class="demo"><p class="eyebrow">Demo numbers · any 6-digit code works</p></div></form></div></div>');
    const demo = g.querySelector('.demo');
    M.db.users.filter((u) => u.phone && u.active !== false).slice(0, 4).forEach((u) => { const b = el('<button type="button">' + esc(u.name) + ' · ' + esc(roleLabel(u)) + '<span>' + esc(u.phone) + '</span></button>'); b.onclick = () => { g.querySelector('[name=phone]').value = u.phone; }; demo.appendChild(b); });
    const form = g.querySelector('form');
    form.onsubmit = (e) => {
      e.preventDefault();
      const phone = form.phone.value.replace(/\s+/g, '');
      const u = M.db.users.find((x) => x.phone.replace(/\s+/g, '') === phone);
      if (!u || u.active === false) { U.toast('This number is not on the studio list.'); return; }
      // Real: IncensoAuth phone OTP (WhatsApp) → then check desk_users for role
      form.innerHTML = '<p class="eyebrow">Code sent on WhatsApp to ' + esc(u.phone) + '</p><div class="otp">' + '<input inputmode="numeric" maxlength="1" pattern="[0-9]">'.repeat(6) + '</div><button class="btn wide" type="submit">Enter</button><button class="btn ghost wide" type="button" data-back>Different number</button>';
      const ins = [...form.querySelectorAll('.otp input')]; ins[0].focus();
      ins.forEach((i, k) => { i.oninput = () => { i.value = i.value.replace(/\D/g, '').slice(-1); if (i.value && ins[k + 1]) ins[k + 1].focus(); if (ins.every((x) => x.value)) form.requestSubmit(); }; i.onkeydown = (ev) => { if (ev.key === 'Backspace' && !i.value && ins[k - 1]) ins[k - 1].focus(); }; i.onpaste = (ev) => { const t = (ev.clipboardData.getData('text') || '').replace(/\D/g, ''); if (t.length === 6) { ev.preventDefault(); ins.forEach((x, j) => x.value = t[j]); form.requestSubmit(); } }; });
      form.querySelector('[data-back]').onclick = gate;
      form.onsubmit = (ev) => { ev.preventDefault(); if (!ins.every((x) => x.value)) return; setUser(u); M.log('sign-in', '', u.name); boot(); };
    };
    document.body.appendChild(g);
  };

  // ---- shell ----
  let root, titleEl, current = null;
  const boot = () => {
    document.body.innerHTML = '';
    const shell = el('<div class="shell"><nav class="rail" aria-label="Sections"></nav><div class="main"><header class="top"><button class="icon-btn wm" aria-label="Incenso" data-home>' + window.INCENSO_WORDMARK.replace('viewBox="8 76 1282 226"', 'viewBox="972 69 324 240"') + '</button><div class="ttl"></div><div class="tb-r"><button class="icon-btn" data-search aria-label="Search">' + icon('search') + '</button><button class="icon-btn" data-me aria-label="Account"><span class="avatar">' + esc(U.initials(user.name)) + '</span></button></div></header><main class="content" id="view"></main></div><nav class="tabs" aria-label="Main"></nav></div>');
    root = shell.querySelector('#view'); titleEl = shell.querySelector('.ttl');
    const rail = shell.querySelector('.rail');
    rail.insertAdjacentHTML('beforeend', window.INCENSO_WORDMARK);
    let pendingGrp = null;
    NAV.forEach((n) => { if (n.grp) { pendingGrp = n.grp; return; } if (!allowed(user, n.id)) return; if (pendingGrp) { rail.insertAdjacentHTML('beforeend', '<div class="grp">' + pendingGrp + '</div>'); pendingGrp = null; } rail.insertAdjacentHTML('beforeend', '<a href="#/' + n.id + '" data-nav="' + n.id + '">' + icon(n.id) + esc(n.label) + '<span class="dot hide" data-badge="' + n.id + '"></span></a>'); });
    rail.insertAdjacentHTML('beforeend', '<div class="me"><span class="avatar">' + esc(U.initials(user.name)) + '</span><div>' + esc(user.name) + '<small>' + esc(roleLabel(user)) + '</small></div><button type="button" data-out>Sign out</button></div>');
    rail.querySelector('[data-out]').onclick = signOut;
    const tabs = shell.querySelector('.tabs');
    const TABS = tabsFor(user);
    TABS.forEach((t) => tabs.insertAdjacentHTML('beforeend', '<a href="#/' + t + '" data-nav="' + t + '">' + icon(t === 'more' ? 'more' : t) + esc(TAB_LABEL[t]) + '<span class="dot hide" data-badge="' + t + '"></span></a>'));
    tabs.style.gridTemplateColumns = 'repeat(' + TABS.length + ',1fr)';
    shell.querySelector('[data-home]').onclick = () => { location.hash = '#/home'; };
    shell.querySelector('[data-me]').onclick = meSheet;
    shell.querySelector('[data-search]').onclick = globalSearch;
    document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); globalSearch(); } });
    document.body.appendChild(shell);
    render();
  };
  const roleLabel = (u) => (M.PRESETS[u.role] ? M.PRESETS[u.role].label : u.role || 'Custom');
  M.roleLabel = roleLabel;
  const signOut = () => { setUser(null); location.hash = ''; gate(); };
  const meSheet = () => {
    const b = el('<div class="stack"><div class="card pad"><div class="spread"><div><b>' + esc(user.name) + '</b><div class="note">' + esc(user.phone) + ' · ' + esc(roleLabel(user)) + '</div></div><span class="avatar">' + esc(U.initials(user.name)) + '</span></div></div><div class="card"><div class="list"></div></div><button class="btn ghost wide" data-reset>Reset demo data</button></div>');
    const l = b.querySelector('.list');
    M.db.users.filter((u) => u.phone && u.active !== false).forEach((u) => l.appendChild(U.row({ lead: esc(U.initials(u.name)), title: esc(u.name), sub: esc(roleLabel(u)) + ' · ' + esc(u.phone), end: u.phone === user.phone ? U.pill('paid', 'You') : icon('chev'), onClick: () => { setUser(u); s.close(true); location.hash = '#/home'; boot(); U.toast('Switched to ' + u.name); } })));
    b.querySelector('[data-reset]').onclick = async () => { if (await U.confirm({ title: 'Reset demo data?', text: 'All changes made in this preview are discarded and the sample data is regenerated for today.', ok: 'Reset', danger: true })) { M.reset(); location.reload(); } };
    const s = U.sheet({ title: 'Signed in', sub: 'Switch role to preview what each person sees', body: b, foot: '<button class="btn ghost wide" data-o>Sign out</button>' });
    s.el.querySelector('[data-o]').onclick = signOut;
  };
  const globalSearch = () => {
    const body = el('<div class="stack"></div>'); const inp = U.search('Name, phone, BK / OR / GF ref, product…', (q) => draw(q)); body.appendChild(inp); const host = el('<div></div>'); body.appendChild(host);
    const s = U.sheet({ title: 'Search', sub: 'Across clients, bookings, orders, gift cards and products', body });
    setTimeout(() => inp.querySelector('input').focus(), 250);
    const draw = (q) => { host.innerHTML = ''; if (q.length < 2) return; const has = (t) => String(t).toLowerCase().includes(q); const rows = [];
      M.db.clients.filter((c) => has(c.name + ' ' + c.phone)).slice(0, 5).forEach((c) => rows.push(U.row({ href: '#/client/' + c.id, lead: esc(U.initials(c.name)), title: esc(c.name), sub: esc(c.phone), end: '<span class="ref">client</span>' })));
      M.db.bookings.filter((b) => has(b.ref + ' ' + M.client(b.clientId).name)).slice(0, 5).forEach((b) => rows.push(U.row({ lead: '<span style="font-size:10px">BK</span>', title: esc(M.client(b.clientId).name) + ' <span class="ref">' + esc(b.ref) + '</span>', sub: M.fmtDT(b.start) + ' · ' + esc(b.staff), end: U.pill(b.status), onClick: () => { s.close(true); M.openBooking(b.ref); } })));
      if (M.can('orders')) M.db.orders.filter((o) => has(o.ref + ' ' + M.client(o.clientId).name + ' ' + o.items.map((i) => i.name).join(' '))).slice(0, 5).forEach((o) => rows.push(U.row({ href: '#/order/' + o.ref, lead: '<span style="font-size:10px">OR</span>', title: esc(M.client(o.clientId).name) + ' <span class="ref">' + esc(o.ref) + '</span>', sub: esc(o.items.map((i) => i.name).join(', ')), end: U.pill(o.status) })));
      if (M.can('gifts')) M.db.gifts.filter((g) => has(g.code + ' ' + g.to + ' ' + g.from + ' ' + g.toPhone)).slice(0, 5).forEach((g) => rows.push(U.row({ href: '#/gift/' + g.code, lead: '<span style="font-size:10px">GF</span>', title: esc(g.to) + ' <span class="ref">' + esc(g.code) + '</span>', sub: M.money(g.balance) + ' left', end: U.pill(g.status) })));
      if (M.can('products')) M.db.products.filter((p) => has(p.name + ' ' + p.brand + ' ' + p.sku)).slice(0, 5).forEach((p) => rows.push(U.row({ href: '#/products', lead: U.thumb(p.image), title: esc(p.name), sub: esc(p.brand) + ' · ' + p.stock + ' in stock', end: '<span class="amt">' + M.money(p.price) + '</span>' })));
      host.appendChild(U.card(null, rows.length ? rows : U.empty('No matches'))); host.querySelectorAll('a.row').forEach((r) => r.addEventListener('click', () => s.close(true))); };
  };
  const badges = () => {
    if (!document.querySelector('.tabs') && !document.querySelector('.rail')) return;
    const held = M.db.bookings.filter((b) => b.payStatus === 'pending' && b.status === 'held' && new Date(b.start) >= new Date(M.T0)).length + M.db.bookings.filter((b) => (b.extra || []).some((x) => x.status === 'pending' && x.pay !== 'cash')).length;
    const ord = M.db.orders.filter((o) => o.status === 'placed' || o.status === 'preparing').length;
    const gifts = M.db.gifts.filter((g) => g.status === 'Reserved').length;
    const pend = M.db.orders.filter((o) => o.payStatus === 'pending').length + gifts + held;
    const set = (k, n) => { document.querySelectorAll('[data-badge="' + k + '"]').forEach((b) => { b.textContent = n; b.classList.toggle('hide', !n); }); };
    set('bookings', held); set('orders', ord); set('gifts', gifts); set('money', pend);
  };

  // ---- router ----
  const parse = () => { const h = location.hash.replace(/^#\/?/, ''); const [name, ...rest] = h.split('/'); return { name: name || 'home', param: rest.join('/') || '' }; };
  const render = () => {
    if (!user) return gate();
    const { name, param } = parse();
    const v = M.views[name];
    const parent = DETAIL_PARENT[name] || name;
    if (!v || !allowed(user, parent)) { const first = NAV.find((n) => n.id && allowed(user, n.id)); if (first && first.id !== name) location.hash = '#/' + first.id; return; }
    current = { name, param };
    document.querySelectorAll('[data-nav]').forEach((a) => { const on = a.dataset.nav === parent || (a.dataset.nav === 'more' && !tabsFor(user).includes(parent) && !a.closest('.rail')); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    root.innerHTML = '';
    const ctx = { root, param, user, title: (t, s) => { titleEl.innerHTML = esc(t) + (s ? '<small>' + esc(s) + '</small>' : ''); document.title = t + ' — Incenso Studio management'; }, back: DETAIL_PARENT[name] ? '#/' + DETAIL_PARENT[name] : null };
    ctx.title(v.title || name);
    if (ctx.back) { const wm = document.querySelector('[data-home]'); wm.innerHTML = icon('back'); wm.onclick = () => { location.hash = ctx.back; }; } else { const wm = document.querySelector('[data-home]'); wm.innerHTML = window.INCENSO_WORDMARK.replace('viewBox="8 76 1282 226"', 'viewBox="972 69 324 240"'); wm.onclick = () => { location.hash = '#/home'; }; }
    v.render(ctx);
    window.scrollTo(0, 0);
    badges();
  };
  M.refresh = () => { if (current) { const y = window.scrollY; render(); window.scrollTo(0, y); } };
  M.on((what) => { if (what !== 'reset') M.refresh(); });
  window.addEventListener('hashchange', render);

  // ---- More ----
  M.views.more = { title: 'More', render(ctx) {
    const g = el('<div class="grid2"></div>');
    NAV.filter((n) => !n.grp && allowed(user, n.id)).forEach((n) => g.insertAdjacentHTML('beforeend', '<a class="tile" href="#/' + n.id + '">' + icon(n.id) + '<span><b>' + esc(n.label) + '</b><small>' + esc(MORE_SUB[n.id] || '') + '</small></span></a>'));
    ctx.root.appendChild(g);
    const a = M.db.audit.slice(0, 8);
    if (a.length) ctx.root.appendChild(U.card('Recent activity', a.map((x) => U.row({ title: esc(x.action) + (x.ref ? ' <span class="ref">' + esc(x.ref) + '</span>' : ''), sub: esc(x.by || '') + ' · ' + M.rel(x.at) }))));
    ctx.root.insertAdjacentHTML('beforeend', '<p class="note" style="text-align:center">Studio management · ' + esc(user.name) + ' · ' + esc(roleLabel(user)) + '</p>');
  } };
  const MORE_SUB = { home: 'Today at a glance', supply: 'Purchase orders & stock-in', reports: 'Top services, occupancy, retention', today: 'Day & week by chair', bookings: 'All appointments', clients: 'Members & history', orders: 'Shop orders & courier', gifts: 'Activate, cancel, resend', products: 'Stock & restock alerts', money: 'Takings, payouts, P&L', staff: 'Schedules & days off', services: 'Menus & pricing', messages: 'WhatsApp log', settings: 'Hours, ticker, tiers' };

  document.addEventListener('DOMContentLoaded', () => { if (user) boot(); else gate(); });
})();
