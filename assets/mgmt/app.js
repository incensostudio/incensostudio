/* Incenso Management — shell: sign-in gate (roles), navigation, router */
(() => {
  const M = window.IncensoMgmt, U = window.MgmtUI, { el, esc, icon } = U;
  const SKEY = 'incenso-mgmt-session';
  M.views = {};
  const NAV = [
    { grp: 'General' }, { id: 'home', label: 'Booking' }, { id: 'orders', label: 'Shop' }, { id: 'products', label: 'Stock' }, { id: 'gifts', label: 'Gift cards' }, { id: 'clients', label: 'Clients' }, { id: 'money', label: 'Finances' }, { id: 'settings', label: 'Settings', foot: true },
  ];
  M.NAV_LABEL = {}; NAV.forEach((n) => { if (n.id) M.NAV_LABEL[n.id] = n.label; });
  const DETAIL_PARENT = { booking: 'home', bookings: 'home', today: 'home', client: 'clients', order: 'orders', gift: 'gifts', product: 'products', po: 'products', supplier: 'products', member: 'settings', setting: 'settings', staff: 'settings', services: 'settings' };
  const TAB_PREF = ['home', 'orders', 'gifts', 'clients'];
  const TAB_LABEL = { home: 'Home', today: 'Calendar', bookings: 'Bookings', orders: 'Shop', products: 'Stock', money: 'Finances', gifts: 'Gifts', clients: 'Clients', products: 'Stock', messages: 'Messages', more: 'More' };
  const perms = (u) => { const live = M.db.users.find((x) => x.phone === u.phone); return live || u; };
  const allowed = (user, id) => { if (id === 'more') return true; if (id === 'today' || id === 'bookings') id = 'home'; if (id === 'staff' || id === 'services') id = 'settings'; const u = perms(user); if (u.active === false) return false; return !M.NAV_LABEL[id] || (u.modules || []).includes(id); };
  const tabsFor = (user) => TAB_PREF.filter((t) => allowed(user, t)).slice(0, 4).concat(['more']);

  let user = null; try { user = JSON.parse(localStorage.getItem(SKEY)); } catch (e) {}
  // The website account is the source of truth: drop any mgmt session whose number no longer matches / is no longer whitelisted.
  const syncSession = () => { const A = window.IncensoAuth; if (!A) return;
    // Handoff from account.html (Dashboard link): trust it for 5 minutes even if the auth session is still hydrating.
    let ho = null; try { ho = JSON.parse(localStorage.getItem('incenso-desk-handoff')); } catch (e) {} if (ho && Date.now() - ho.at < 3e5) { const d0 = (p) => String(p || '').replace(/\D/g, ''); const hu = M.db.users.find((x) => x.active !== false && d0(x.phone) === d0(ho.phone)); if (hu) { if (!A.signedIn()) { try { const cur = JSON.parse(localStorage.getItem('incenso-account')) || {}; localStorage.setItem('incenso-account', JSON.stringify(Object.assign(cur, { name: ho.name, phone: ho.phone }))); localStorage.setItem('incenso-signedin', '1'); localStorage.setItem('incenso-demo-account', '1'); } catch (e) {} } user = Object.assign({}, hu); return; } }
    if (!A.signedIn()) { user = null; return; } const acc = A.get(); const d = (p) => String(p || '').replace(/\D/g, ''); const u = M.db.users.find((x) => x.active !== false && d(x.phone) === d(acc.phone)); user = u ? Object.assign({}, u) : null; };
  const setUser = (u) => { user = u; if (u) localStorage.setItem(SKEY, JSON.stringify(u)); else localStorage.removeItem(SKEY); };
  M.user = () => user && perms(user);
  M.can = (id) => user && allowed(user, id);
  M.may = (flag) => { const u = M.user(); return !!(u && u.flags && u.flags[flag]); };
  M.myStaff = () => { const u = M.user(); return u && u.flags && u.flags.ownOnly ? u.staff : null; };

  // ---- gate ----
  // Same account as the website (IncensoAuth). Access is granted only if the signed-in number is whitelisted in desk_users (M.db.users) and active.
  const A = window.IncensoAuth;
  const digits = (p) => String(p || '').replace(/\D/g, '');
  const deskUser = () => { if (!A || !A.signedIn()) return null; const acc = A.get(); return M.db.users.find((u) => u.active !== false && digits(u.phone) === digits(acc.phone)) || null; };
  // Own WhatsApp-OTP sign-in on this subdomain: the site's browser session is not shared
  // cross-origin, so the desk signs in here with IncensoAuth (same account, same OTP), then
  // the number is checked against the whitelist (desk_users, loaded by hydrate under RLS).
  let hydrated = false;
  const enter = async () => {
    if (M.hydrate && M.online && !hydrated) { try { await M.hydrate(); } catch (e) {} hydrated = true; }
    syncSession();
    if (user) { setUser(user); boot(); } else gate('no');
  };
  const gate = (mode) => {
    document.body.innerHTML = '';
    const signedIn = A && A.signedIn();
    if (signedIn && mode !== 'no') { enter(); return; }
    const msg = (mode === 'no' && signedIn)
      ? 'This number isn’t on the studio list. Ask an owner to add you under Settings → Who can sign in.'
      : 'Sign in with your WhatsApp number. Only studio numbers can enter.';
    const g = el('<div class="gate"><div class="gate-card">' + window.INCENSO_WORDMARK + '<h1>Studio management</h1><p>' + esc(msg) + '</p><button class="btn wide" data-in>' + (signedIn && mode === 'no' ? 'Use another number' : 'Sign in with WhatsApp') + '</button></div></div>');
    g.querySelector('[data-in]').onclick = async () => {
      if (signedIn && mode === 'no') { try { if (A) await A.signOut(); } catch (e) {} if (M.clear) M.clear(); hydrated = false; }
      if (A) A.open(() => { hydrated = false; enter(); });
    };
    document.body.appendChild(g);
  };

  // ---- shell ----
  let root, titleEl, current = null;
  const boot = () => {
    M.syncFromAuth();
    document.body.innerHTML = '';
    const shell = el('<div class="shell"><nav class="rail" aria-label="Sections"></nav><div class="main"><header class="top"><button class="icon-btn wm" aria-label="Incenso" data-home>' + window.INCENSO_WORDMARK.replace('viewBox="8 76 1282 226"', 'viewBox="972 69 324 240"') + '</button><div class="ttl"></div><div class="tb-r"><button class="icon-btn" data-search aria-label="Search">' + icon('search') + '</button></div></header><main class="content" id="view"></main></div><nav class="tabs" aria-label="Main"></nav></div>');
    root = shell.querySelector('#view'); titleEl = shell.querySelector('.ttl');
    const rail = shell.querySelector('.rail');
    rail.insertAdjacentHTML('beforeend', window.INCENSO_WORDMARK);
    let pendingGrp = null;
    NAV.forEach((n) => { if (n.grp) { pendingGrp = n.grp; return; } if (!allowed(user, n.id) || n.foot) return; if (pendingGrp) { rail.insertAdjacentHTML('beforeend', '<div class="grp">' + pendingGrp + '</div>'); pendingGrp = null; } rail.insertAdjacentHTML('beforeend', '<a href="#/' + n.id + '" data-nav="' + n.id + '">' + icon(n.id) + esc(n.label) + '<span class="dot hide" data-badge="' + n.id + '"></span></a>'); });
    const prof = () => M.clientByPhone(user.phone);
    const accName = () => { const p = prof(); return (p && p.name) || user.name || ''; };
    const accAvatar = () => { const p = prof(); return p && p.photo ? '<span class="avatar"><img src="' + esc(p.photo) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></span>' : '<span class="avatar">' + esc(U.initials(accName())) + '</span>'; };
    rail.insertAdjacentHTML('beforeend', '<div class="rail-foot">' + NAV.filter((n) => n.foot && allowed(user, n.id)).map((n) => '<a href="#/' + n.id + '" data-nav="' + n.id + '">' + icon(n.id) + esc(n.label) + '<span class="dot hide" data-badge="' + n.id + '"></span></a>').join('') + '</div><div class="me"><div class="me-id">' + accAvatar() + '<div>' + esc(accName()) + '<small>' + esc(roleLabel(user)) + '</small></div></div><div class="me-acts"><a href="index.html">' + icon('globe') + 'Website</a><button type="button" data-out>Sign out</button></div></div>');
    rail.querySelector('[data-out]').onclick = signOut;
    const tabs = shell.querySelector('.tabs');
    const TABS = tabsFor(user);
    TABS.forEach((t) => tabs.insertAdjacentHTML('beforeend', '<a href="#/' + t + '" data-nav="' + t + '">' + icon(t === 'more' ? 'more' : t) + esc(TAB_LABEL[t]) + '<span class="dot hide" data-badge="' + t + '"></span></a>'));
    tabs.style.gridTemplateColumns = 'repeat(' + TABS.length + ',1fr)';
    shell.querySelector('[data-home]').onclick = () => { location.hash = '#/home'; };
    shell.querySelector('[data-search]').onclick = globalSearch;
    document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); globalSearch(); } });
    document.body.appendChild(shell);
    render();
  };
  const roleLabel = (u) => (M.PRESETS[u.role] ? M.PRESETS[u.role].label : u.role || 'Custom');
  // Display name comes from the website account (same sign-in); the access list only carries the permission
  M.roleLabel = roleLabel;
  const signOut = async () => { setUser(null); try { localStorage.removeItem('incenso-desk-handoff'); } catch (e) {} if (M.clear) M.clear(); if (window.IncensoAuth) { try { await window.IncensoAuth.signOut(); } catch (e) {} } hydrated = false; gate(); };
  const meSheet = () => {
    // Prototype-only demo tools (person switcher + sample data) are hidden on the live app.
    const demo = !M.online;
    const b = el('<div class="stack"><div class="card pad"><div class="spread"><div><b>' + esc(user.name) + '</b><div class="note">' + esc(user.phone) + ' · ' + esc(roleLabel(user)) + '</div></div><span class="avatar">' + esc(U.initials(user.name)) + '</span></div></div>' + (demo ? '<div class="card"><div class="list"></div></div><div class="two"><button class="btn ghost wide" data-blank>Start from zero</button><button class="btn ghost wide" data-reset>Load sample data</button></div>' : '') + '</div>');
    const l = b.querySelector('.list');
    if (demo) M.db.users.filter((u) => u.phone && u.active !== false).forEach((u) => l.appendChild(U.row({ lead: esc(U.initials(u.name)), title: esc(u.name), sub: esc(roleLabel(u)) + ' · ' + esc(u.phone), end: u.phone === user.phone ? U.pill('paid', 'You') : icon('chev'), onClick: () => { try { const cur = JSON.parse(localStorage.getItem('incenso-account')) || {}; localStorage.setItem('incenso-account', JSON.stringify(Object.assign(cur, { name: u.name, phone: u.phone }))); localStorage.setItem('incenso-signedin', '1'); localStorage.setItem('incenso-demo-account', '1'); } catch (e) {} s.close(true); location.hash = '#/home'; location.reload(); } })));
    if (demo) b.querySelector('[data-reset]').onclick = async () => { if (await U.confirm({ title: 'Load sample data?', text: 'Everything entered so far is discarded and sample bookings, clients and orders are generated for today.', ok: 'Load samples', danger: true })) { M.reset(); location.reload(); } };
    if (demo) b.querySelector('[data-blank]').onclick = async () => { if (await U.confirm({ title: 'Start from zero?', text: 'Removes every booking, client, order, gift card, expense and message. Staff, services, products and settings stay.', ok: 'Clear everything', danger: true })) { M.reset('blank'); location.reload(); } };
    const s = U.sheet({ title: 'Signed in', sub: 'Switch role to preview what each person sees', body: b, foot: '<div style="display:grid;gap:8px;width:100%"><a class="btn soft wide" href="account.html">' + icon('globe') + 'Website</a><button class="btn ghost wide" data-o>Sign out</button></div>' });
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
    const ord = M.db.orders.filter((o) => ['placed', 'preparing', 'ready', 'with-courier'].includes(o.status)).length;
    const gifts = M.db.gifts.filter((g) => g.status === 'Reserved').length;
    const pend = M.db.orders.filter((o) => o.payStatus === 'pending').length + gifts + held;
    const set = (k, n) => { document.querySelectorAll('[data-badge="' + k + '"]').forEach((b) => { b.textContent = n; b.classList.toggle('hide', !n); }); };
    set('bookings', held); set('orders', ord); set('gifts', gifts); set('money', pend);
  };

  // ---- router ----
  const parse = () => { const h = location.hash.replace(/^#\/?/, ''); const [name, ...rest] = h.split('/'); return { name: name || 'home', param: rest.join('/') || '' }; };
  document.addEventListener('account:updated', () => { if (!user) { syncSession(); if (user) { setUser(user); boot(); } } });
  const render = () => {
    syncSession();
    if (!user) return gate();
    const { name, param } = parse();
    const v = M.views[name];
    const parent = DETAIL_PARENT[name] || name;
    if (!v || !allowed(user, parent)) { const first = NAV.find((n) => n.id && allowed(user, n.id)); if (first && first.id !== name) location.hash = '#/' + first.id; return; }
    current = { name, param };
    document.querySelectorAll('[data-nav]').forEach((a) => { const on = a.dataset.nav === parent || (a.dataset.nav === 'more' && !tabsFor(user).includes(parent) && !a.closest('.rail')); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    root.innerHTML = ''; root.className = 'content'; document.querySelectorAll('.top [data-quick]').forEach((x) => x.remove());
    const viaMore = !DETAIL_PARENT[name] && name !== 'more' && !tabsFor(user).includes(name) && window.matchMedia('(max-width:899px)').matches;
    const ctx = { root, param, user, back: DETAIL_PARENT[name] ? '#/' + DETAIL_PARENT[name] : viaMore ? '#/more' : null, title: (t, s) => { document.title = t + ' — Incenso Studio management'; titleEl.innerHTML = esc(t) + (s ? '<small>' + esc(s) + '</small>' : ''); } };
    ctx.title(v.title || name);
    if (ctx.back && !viaMore) { const wm = document.querySelector('[data-home]'); wm.innerHTML = icon('back'); wm.onclick = () => { location.hash = ctx.back; }; } else { const wm = document.querySelector('[data-home]'); wm.innerHTML = window.INCENSO_WORDMARK.replace('viewBox="8 76 1282 226"', 'viewBox="972 69 324 240"'); wm.onclick = () => { location.hash = '#/home'; }; }
    v.render(ctx);
    if (ctx.back && !root.querySelector('.ed-back') && !root.querySelector('.pg-back')) { const lbl = viaMore ? 'More' : M.NAV_LABEL[DETAIL_PARENT[name]] || 'Back'; root.insertAdjacentHTML('afterbegin', '<a class="pg-back" href="' + ctx.back + '">' + icon('left') + esc(lbl) + '</a>'); }
    window.scrollTo(0, 0);
    badges();
  };
  M.refresh = () => { if (current) { const y = window.scrollY; render(); window.scrollTo(0, y); } };
  M.on((what) => { if (what !== 'reset') M.refresh(); });
  window.addEventListener('hashchange', render);
  window.matchMedia('(max-width:899px)').addEventListener('change', () => M.refresh());

  // ---- More ----
  M.views.more = { title: 'More', render(ctx) {
    const g = el('<div class="grid2"></div>');
    const tabs = tabsFor(user); NAV.filter((n) => !n.grp && !tabs.includes(n.id) && allowed(user, n.id)).forEach((n) => g.insertAdjacentHTML('beforeend', '<a class="tile" href="#/' + n.id + '">' + icon(n.id) + '<span><b>' + esc(n.label) + '</b><small>' + esc(MORE_SUB[n.id] || '') + '</small></span></a>'));
    ctx.root.appendChild(g);
    ctx.root.insertAdjacentHTML('beforeend', '<p class="note" style="text-align:center">Studio management · ' + esc(user.name) + ' · ' + esc(roleLabel(user)) + '</p>');
  } };
  const MORE_SUB = { home: 'Today at a glance', supply: 'Purchase orders & stock-in', reports: 'Top services, occupancy, retention', today: 'Day & week by chair', bookings: 'All appointments', clients: 'Members & history', orders: 'Shop orders & courier', gifts: 'Activate, cancel, resend', products: 'Stock & restock alerts', money: 'Takings, payouts, P&L', staff: 'Schedules & days off', services: 'Menus & pricing', messages: 'WhatsApp log', settings: 'Hours, ticker, tiers' };

  const start = () => { if (A && A.signedIn()) enter(); else gate(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
