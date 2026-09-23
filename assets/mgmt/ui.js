/* Incenso Management — UI helpers (icons, sheet, toast, small builders) */
(() => {
  const M = window.IncensoMgmt;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const I = (d, extra) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>';
  const ICONS = {
    today: I('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>'),
    bookings: I('<path d="M4 6h16M4 12h16M4 18h10"/>'),
    clients: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6 6 0 0 1 3.5 6.5"/>'),
    orders: I('<path d="M4 8h16l-1 12H5L4 8z"/><path d="M8 8a4 4 0 0 1 8 0"/>'),
    gifts: I('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18M12 8c-2-3-6-3-6-.5S10 8 12 8zm0 0c2-3 6-3 6-.5S14 8 12 8z"/>'),
    products: I('<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>'),
    staff: I('<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
    services: I('<path d="M4 6h16M4 12h16M4 18h10"/>'),
    money: I('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.8"/><path d="M6 12h.01M18 12h.01"/>'),
    messages: I('<path d="M4 5h16v11H9l-5 4z"/>'),
    globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    music: I('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'),
    play: I('<path d="M7 5v14l11-7z"/>'),
    up: I('<path d="M6 15l6-6 6 6"/>'),
    down: I('<path d="M6 9l6 6 6-6"/>'),
    link: I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    pin: I('<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>'),
    chevd: I('<path d="M6 9l6 6 6-6"/>'),
    bell: I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    more: I('<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    chev: I('<path d="m9 6 6 6-6 6"/>'),
    back: I('<path d="m15 6-6 6 6 6"/>'),
    left: I('<path d="m15 6-6 6 6 6"/>'),
    right: I('<path d="m9 6 6 6-6 6"/>'),
    close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
    search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
    check: I('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    wa: I('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z"/>'),
    edit: I('<path d="M4 20h4l11-11-4-4L4 16z"/>'),
    trash: I('<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>'),
    block: I('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>'),
    walk: I('<circle cx="13" cy="4.5" r="1.8"/><path d="m8 21 3-7 3 2v5M8 12l3-4 3 1 3 3"/>'),
    refresh: I('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>'),
    out: I('<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>'),
    dot: I('<circle cx="12" cy="12" r="4" fill="currentColor"/>'),
    image: I('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 16-5-5-9 8"/>'),
    upload: I('<path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"/>'),
    download: I('<path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16"/>'),
    send: I('<path d="m3 11 18-8-8 18-2-8z"/>'),
    reports: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    pos: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 20h10M12 16v4M7 8h6"/>'),
    week: I('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M9 10v11M15 10v11"/>'),
    tag: I('<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>'),
    late: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
    star: I('<path d="m12 3 2.8 5.9 6.2.8-4.6 4.4 1.2 6.3L12 17.4l-5.6 3 1.2-6.3L3 9.7l6.2-.8z"/>'),
    lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    shop: I('<path d="M3 9l1.5-5h15L21 9M3 9h18v11H3zM3 9c0 2 2 3 3 3s3-1 3-3c0 2 2 3 3 3s3-1 3-3c0 2 2 3 3 3s3-1 3-3"/>'),
    doc: I('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/>'),
    space: I('<path d="M3 21V8l9-5 9 5v13M9 21v-7h6v7"/>'),
    home: I('<path d="M3 11 12 3l9 8M5 10v11h14V10"/>'),
    supply: I('<path d="M3 7h11v10H3zM14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
    rota: I('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M7 13h3M14 13h3M7 17h3"/>'),
    grip: I('<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>'),
    sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    truck: I('<path d="M3 7h11v10H3zM14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
    scissors: I('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.5 15.5M8.5 8.5 20 20"/>'),
  };
  const icon = (n) => ICONS[n] || '';
  const STATUS = {
    confirmed: ['Confirmed', 'ok'], held: ['Held · unpaid', 'warn'], arrived: ['Arrived', 'info'], 'in-chair': ['In chair', 'info'], settled: ['Settled', 'dim'], cancelled: ['Cancelled', 'dim'], 'no-show': ['No-show', 'bad'],
    paid: ['Paid', 'ok'], pending: ['Pending', 'warn'], unpaid: ['Pays at studio', 'dim'], due: ['Due', 'dim'], sent: ['Sent', 'ok'], 'to send': ['To send', 'warn'], refunded: ['Refunded', 'dim'],
    placed: ['Placed', 'warn'], awaiting: ['Awaiting payment', 'warn'], preparing: ['Preparing', 'info'], ready: ['Ready for pickup', 'info'], 'with-courier': ['With courier', 'info'], delivered: ['Delivered', 'dim'], collected: ['Collected', 'dim'],
    Reserved: ['Reserved', 'warn'], Active: ['Active', 'ok'], Used: ['Used', 'dim'], Cancelled: ['Cancelled', 'dim'],
    draft: ['Draft', 'dim'], ordered: ['Ordered', 'info'], received: ['Received', 'ok'], partial: ['Partly received', 'warn'],
    read: ['Read', 'ok'], failed: ['Failed', 'bad'], low: ['Low stock', 'warn'], out: ['Out of stock', 'bad'], instock: ['In stock', 'ok'],
  };
  const pill = (s, label) => { const d = STATUS[s] || [s, 'dim']; return '<span class="pill ' + d[1] + '">' + esc(label || d[0]) + '</span>'; };
  const initials = (n) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  const staffSw = (name) => { const s = M.staffOf(name); return '<i class="sw" style="background:' + (s ? s.accent : '#ccc') + '"></i>'; };

  // ---- date popover (shared) ----
  const datePop = (anchor, value, onPick, opts) => {
    opts = opts || {}; document.querySelectorAll('.datepop').forEach((x) => x.remove());
    const sel = value ? new Date(value + 'T00:00:00') : new Date(); let view = new Date(sel.getFullYear(), sel.getMonth(), 1);
    const pop = el('<div class="datepop" role="dialog"></div>'); const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const today = key(new Date());
    const draw = () => {
      const first = (view.getDay() + 6) % 7; const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      const yNow = new Date().getFullYear(); const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      let ys = ''; for (let y = yNow + 2; y >= yNow - 100; y--) ys += '<option value="' + y + '"' + (y === view.getFullYear() ? ' selected' : '') + '>' + y + '</option>';
      let h = '<div class="dp-h"><button type="button" class="icon-btn sm" data-pm>' + icon('left') + '</button><span class="dp-sel"><select data-m aria-label="Month">' + MON.map((m, i) => '<option value="' + i + '"' + (i === view.getMonth() ? ' selected' : '') + '>' + m + '</option>').join('') + '</select><select data-y aria-label="Year">' + ys + '</select></span><button type="button" class="icon-btn sm" data-nm>' + icon('right') + '</button></div><div class="dp-g">' + ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((x) => '<small>' + x + '</small>').join('');
      for (let i = 0; i < first; i++) h += '<span></span>';
      for (let n = 1; n <= days; n++) { const k = key(new Date(view.getFullYear(), view.getMonth(), n)); h += '<button type="button" data-k="' + k + '" class="' + (k === today ? 'today ' : '') + (k === value ? 'sel ' : '') + (opts.mark && opts.mark(k) ? 'closed' : '') + '">' + n + '</button>'; }
      pop.innerHTML = h + '</div>';
      pop.querySelector('[data-pm]').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); draw(); };
      pop.querySelector('[data-nm]').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); draw(); };
      pop.querySelector('[data-m]').onchange = (e) => { view = new Date(view.getFullYear(), +e.target.value, 1); draw(); };
      pop.querySelector('[data-y]').onchange = (e) => { view = new Date(+e.target.value, view.getMonth(), 1); draw(); };
      pop.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { pop.remove(); onPick(b.dataset.k); });
    };
    draw();
    const r = anchor.getBoundingClientRect(); const H = 330; const below = r.bottom + 6 + H <= window.innerHeight || r.top < H; pop.style.top = (below ? r.bottom + 6 : r.top - 6 - H) + window.scrollY + 'px'; pop.style.left = Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - 300)) + 'px'; pop.style.zIndex = 200;
    const host = anchor.closest('.sheet') || document.body; if (host !== document.body) { const hr = host.getBoundingClientRect(); pop.style.position = 'absolute'; pop.style.top = (below ? r.bottom - hr.top + 6 + host.scrollTop : r.top - hr.top - 6 - H + host.scrollTop) + 'px'; pop.style.left = Math.max(8, Math.min(r.left - hr.left, hr.width - 300)) + 'px'; }
    host.appendChild(pop);
    const away = (e) => { if (!pop.contains(e.target) && !anchor.contains(e.target)) { pop.remove(); document.removeEventListener('pointerdown', away, true); } }; document.addEventListener('pointerdown', away, true);
  };
  // ---- client picker (same as the booking form): search an existing client, or add a new one; walk-in optional ----
  // opts: { clientId, allowWalkIn, onChange } → returns { el, get(): { clientId, newGuest, walkIn }, commit(): client|null }
  const clientPicker = (opts) => {
    const M = window.IncensoMgmt; opts = opts || {}; const st = { clientId: opts.clientId || '', newGuest: false, walkIn: false, cq: '' };
    const host = el('<div class="cp"></div>'); const fire = () => { if (opts.onChange) opts.onChange(st); };
    const draw = () => {
      host.innerHTML = ''; const c = st.clientId ? M.client(st.clientId) : null;
      if (c && !st.newGuest) { host.insertAdjacentHTML('beforeend', '<div class="bkf-chosen">' + clientAvatar(c, 'lg') + '<div class="b"><b>' + esc(c.name) + '</b><small>' + esc(M.maskPhone(c.phone)) + ' \u00b7 ' + esc(M.tierFor(M.spend12(c.id))) + (M.discountFor(c.id).rate ? ' \u00b7 ' + Math.round(M.discountFor(c.id).rate * 100) + '% off' : '') + (M.giftBalance(c) ? ' \u00b7 ' + M.money(M.giftBalance(c)) + ' gift balance' : '') + (c.blocked ? ' \u00b7 <span style="color:var(--bad)">blocked online</span>' : '') + '</small></div>' + (opts.locked ? '' : '<button type="button" class="bkf-link" data-change>Change</button>') + '</div>'); const ch = host.querySelector('[data-change]'); if (ch) ch.onclick = () => { st.clientId = ''; draw(); fire(); }; return; }
      if (st.walkIn) { host.insertAdjacentHTML('beforeend', '<div class="bkf-chosen"><span class="avatar lg" style="background:var(--surface-2);color:var(--muted)">' + icon('walk') + '</span><div class="b"><b>Walk-in guest</b><small>No account \u2014 nothing saved to a profile</small></div><button type="button" class="bkf-link" data-change>Change</button></div>'); host.querySelector('[data-change]').onclick = () => { st.walkIn = false; draw(); fire(); }; return; }
      if (st.newGuest) { host.insertAdjacentHTML('beforeend', '<div class="two"><div class="field"><label>Full name</label><input name="cp-name" autocomplete="off"></div><div class="field"><label>WhatsApp number</label><input name="cp-phone" type="tel" placeholder="+961 \u2026" autocomplete="off"></div></div><div class="two" style="margin-top:10px"><div class="field"><label>E-mail <span class="ref">optional</span></label><input name="cp-email" type="email" autocomplete="off"></div><div data-bday></div></div><p class="bkf-note" data-hint></p><button type="button" class="bkf-link" data-back>\u2190 Find an existing client instead</button>'); host.querySelector('[data-bday]').replaceWith(field({ name: 'cp-birthday', label: 'Birthday', type: 'date', value: '', opt: true })); host.querySelector('[data-back]').onclick = () => { st.newGuest = false; draw(); fire(); }; host.querySelector('[name=cp-phone]').oninput = (e) => { const ex = M.clientByPhone(e.target.value); host.querySelector('[data-hint]').innerHTML = ex ? 'This number is already <b>' + esc(ex.name) + '</b> \u2014 it goes on that account.' : ''; }; setTimeout(() => host.querySelector('[name=cp-name]').focus(), 50); return; }
      host.insertAdjacentHTML('beforeend', '<div class="bkf-search">' + icon('search') + '<input type="search" placeholder="Search by name or number\u2026" autocomplete="off" value="' + esc(st.cq) + '"></div><div class="bkf-results"></div><div class="inline" style="gap:16px"><button type="button" class="bkf-link" data-new>+ New client</button>' + (opts.allowWalkIn ? '<button type="button" class="bkf-link" data-walk style="color:var(--muted)">Walk-in, no account</button>' : '') + '</div>');
      const res = host.querySelector('.bkf-results'); const inp = host.querySelector('input');
      const list = () => { const q = st.cq.trim().toLowerCase(); res.innerHTML = ''; if (!q) return; const L = M.db.clients.filter((x) => (x.name + ' ' + x.phone).toLowerCase().includes(q)).sort((x, y) => x.name.localeCompare(y.name)).slice(0, 6); if (!L.length) { res.innerHTML = '<p class="bkf-note">No client with that name or number.</p>'; return; } L.forEach((x) => { const r = el('<button type="button" class="bkf-res">' + clientAvatar(x, 'lg') + '<span class="b"><b>' + esc(x.name) + '</b><small>' + esc(M.maskPhone(x.phone)) + '</small></span>' + icon('chev') + '</button>'); r.onclick = () => { st.clientId = x.id; st.cq = ''; draw(); fire(); }; res.appendChild(r); }); };
      inp.oninput = (e) => { st.cq = e.target.value; list(); }; list();
      host.querySelector('[data-new]').onclick = () => { st.newGuest = true; draw(); fire(); }; const w = host.querySelector('[data-walk]'); if (w) w.onclick = () => { st.walkIn = true; draw(); fire(); };
    };
    draw();
    // Resolve to a client record (creating one for a new guest); toasts and returns undefined when something's missing; null = walk-in
    const commit = () => { if (st.walkIn) return null; if (st.clientId && !st.newGuest) return M.client(st.clientId); const n = host.querySelector('[name=cp-name]'), p = host.querySelector('[name=cp-phone]'); const name = n ? n.value.trim() : '', phone = p ? p.value.trim() : ''; if (!phone) { toast(st.newGuest ? 'Add the WhatsApp number' : 'Pick a client or add a new one'); return undefined; } if (!name && !M.clientByPhone(phone)) { toast('Add the name'); return undefined; } const c = M.upsertClient({ name, phone }); const e = host.querySelector('[name=cp-email]'), b = host.querySelector('[name=cp-birthday]'); if (e && e.value.trim() && !c.email) c.email = e.value.trim(); if (b && b.value && !c.birthday) c.birthday = b.value; st.clientId = c.id; st.newGuest = false; return c; };
    return { el: host, get: () => st, commit };
  };

  // ---- sheet ----
  let openSheet = null;
  const sheet = ({ title, sub, body, foot, onClose, wide, back }) => {
    if (openSheet) openSheet.close(true);
    const scrim = el('<div class="scrim" role="dialog" aria-modal="true"><div class="sheet' + (wide ? ' wide' : '') + '"><div class="sheet-h"><div>' + (back ? '<button type="button" class="sheet-back" data-back>' + icon('left') + 'Back</button>' : '') + '<h2>' + esc(title) + '</h2>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><button class="icon-btn" data-x aria-label="Close">' + icon('close') + '</button></div><div class="sheet-b"></div></div></div>');
    const b = scrim.querySelector('.sheet-b');
    if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
    if (foot) { const f = el('<div class="sheet-f"></div>'); if (typeof foot === 'string') f.innerHTML = foot; else f.appendChild(foot); scrim.querySelector('.sheet').appendChild(f); }
    document.body.appendChild(scrim); document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => scrim.classList.add('in'));
    const api = { el: scrim, body: b, close(silent) { scrim.classList.remove('in'); setTimeout(() => scrim.remove(), 240); document.body.style.overflow = ''; if (openSheet === api) openSheet = null; if (!silent && onClose) onClose(); }, setTitle(t) { scrim.querySelector('h2').textContent = t; } };
    scrim.addEventListener('click', (e) => { if (e.target === scrim || e.target.closest('[data-x]')) api.close(); });
    const bk = scrim.querySelector('[data-back]'); if (bk) bk.onclick = () => { api.close(true); back(); };
    openSheet = api; return api;
  };
  const confirm = ({ title, text, ok, danger }) => new Promise((res) => {
    const f = el('<div style="display:flex;gap:8px;width:100%"><button class="btn ' + (danger ? 'danger' : '') + '" data-o>' + esc(ok || 'Confirm') + '</button></div>');
    const s = sheet({ title, body: '<p class="note" style="font-size:14px">' + text + '</p>', foot: f, onClose: () => res(false) });
    
    f.querySelector('[data-o]').onclick = () => { res(true); s.close(true); };
  });
  const prompt = ({ title, fields, ok, danger, back }) => new Promise((res) => {
    const form = el('<form class="form"></form>');
    fields.forEach((f) => { const w = field(f); w.dataset.f = f.name; form.appendChild(w); });
    // showIf: { field, values[] } — hide a field unless another field's value matches
    const applyShow = () => { fields.forEach((f) => { if (!f.showIf) return; const src = form.querySelector('[name="' + f.showIf.field + '"]'); const val = src ? (src.getAttribute && src.getAttribute('role') === 'switch' ? String(src.getAttribute('aria-checked') === 'true') : src.value) : ''; const on = f.showIf.values.map(String).includes(String(val)); const w = form.querySelector('[data-f="' + f.name + '"]'); if (w) { w.classList.toggle('hide', !on); w.querySelectorAll('[required]').forEach((i) => { if (on) { if (i.dataset.req) i.setAttribute('required', ''); } else { i.dataset.req = '1'; i.removeAttribute('required'); i.dataset.wasReq = '1'; } }); if (on) w.querySelectorAll('[data-was-req]').forEach((i) => i.setAttribute('required', '')); } }); }; applyShow(); form.addEventListener('change', applyShow); form.addEventListener('click', () => setTimeout(applyShow, 0));
    const foot = el('<div style="display:flex;gap:8px;width:100%"><button class="btn ' + (danger ? 'danger' : '') + '" data-o>' + esc(ok || 'Save') + '</button></div>');
    const s = sheet({ title, body: form, foot, onClose: () => res(null), back: back ? () => res(null) : null });
    
    foot.querySelector('[data-o]').onclick = (e) => { e.preventDefault(); if (!form.reportValidity()) return; const miss = [...form.querySelectorAll('input[type=hidden][required]')].find((x) => !x.value && !x.closest('.hide')); if (miss) { toast('Pick a date'); return; } const out = {}; fields.forEach((f) => { const i = form.querySelector('[name="' + f.name + '"]'); if (!i) return; out[f.name] = f.type === 'number' ? parseFloat(i.value || 0) : f.type === 'toggle' ? i.getAttribute('aria-checked') === 'true' : i.value; }); res(out); s.close(true); };
  });
  const field = (f) => {
    if (f.type === 'image') { const w = el('<div class="field"><label>' + esc(f.label) + (f.opt ? ' <span class="ref">optional</span>' : '') + '</label><div class="imgpick' + (f.value ? ' has' : '') + '"><img alt=""' + (f.value ? ' src="' + esc(f.value) + '"' : '') + '><div class="imgpick-a"><button type="button" class="btn sm soft" data-up>' + icon('image') + (f.value ? 'Replace' : 'Upload') + '</button><button type="button" class="btn sm ghost" data-rm' + (f.value ? '' : ' hidden') + '>Remove</button></div><input type="file" accept="image/*" hidden><input type="hidden" name="' + esc(f.name) + '" value="' + esc(f.value || '') + '"></div>' + (f.hint ? '<p class="note">' + esc(f.hint) + '</p>' : '') + '</div>'); const box = w.querySelector('.imgpick'), file = w.querySelector('input[type=file]'), hid = w.querySelector('input[type=hidden]'), img = w.querySelector('img'); w.querySelector('[data-up]').onclick = () => file.click(); w.querySelector('[data-rm]').onclick = () => { hid.value = ''; img.removeAttribute('src'); box.classList.remove('has'); w.querySelector('[data-rm]').hidden = true; w.querySelector('[data-up]').lastChild.textContent = 'Upload'; }; file.onchange = () => { const fl = file.files[0]; if (!fl) return; const rd = new FileReader(); rd.onload = () => { hid.value = rd.result; img.src = rd.result; box.classList.add('has'); w.querySelector('[data-rm]').hidden = false; w.querySelector('[data-up]').lastChild.textContent = 'Replace'; }; rd.readAsDataURL(fl); }; return w; }
    if (f.type === 'date') { const w = el('<div class="field"><label>' + esc(f.label) + (f.opt ? ' <span class="ref">optional</span>' : '') + '</label><button type="button" class="datebtn' + (f.value ? '' : ' empty') + '" data-name="' + esc(f.name) + '"><span class="dn">' + (f.value ? new Date(f.value + 'T00:00:00').getDate() : '') + '</span><span class="dt"><b>' + (f.value ? new Date(f.value + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' }) : 'Pick a date') + '</b><span class="full">' + (f.value ? new Date(f.value + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pick a date') + '</span><small>' + (f.value ? new Date(f.value + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tap to open the calendar') + '</small></span>' + icon('chevd') + '<input type="hidden" name="' + esc(f.name) + '" value="' + esc(f.value || '') + '"' + (f.required ? ' required' : '') + '></button></div>'); const btn = w.querySelector('.datebtn'), inp = w.querySelector('input'); btn.onclick = () => datePop(btn, inp.value, (k) => { inp.value = k; const dt = new Date(k + 'T00:00:00'); btn.classList.remove('empty'); btn.querySelector('.dn').textContent = dt.getDate(); btn.querySelector('.dt b').textContent = dt.toLocaleDateString('en-GB', { weekday: 'long' }); btn.querySelector('.dt .full').textContent = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); btn.querySelector('.dt small').textContent = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); inp.dispatchEvent(new Event('change', { bubbles: true })); }); return w; }
    if (f.type === 'toggle') { const w = el('<div class="field"><div class="spread" style="min-height:44px"><label>' + esc(f.label) + '</label><button type="button" class="toggle" role="switch" name="' + f.name + '" aria-checked="' + (f.value ? 'true' : 'false') + '"></button></div></div>'); w.querySelector('.toggle').onclick = (e) => { const b = e.currentTarget; b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); }; return w; }
    let ctl;
    if (f.type === 'select') ctl = '<select name="' + f.name + '">' + f.options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(v) + '"' + (v == f.value ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
    else if (f.type === 'textarea') ctl = '<textarea name="' + f.name + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(f.value || '') + '</textarea>';
    else ctl = '<input name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + esc(f.value == null ? '' : f.value) + '" placeholder="' + esc(f.placeholder || '') + '"' + (f.required ? ' required' : '') + (f.min != null ? ' min="' + f.min + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + (f.type === 'tel' ? ' inputmode="tel"' : '') + '>';
    if (f.money) ctl = '<div class="unit">' + ctl + '</div>';
    return el('<div class="field"><label>' + esc(f.label) + (f.opt ? ' <span style="color:var(--faint);font-weight:400">optional</span>' : '') + '</label>' + ctl + (f.hint ? '<p class="note" style="margin-top:4px;line-height:1.5">' + esc(f.hint) + '</p>' : '') + '</div>');
  };
  // ---- toast ----
  let tt; const toast = (msg) => { let t = document.querySelector('.toast'); if (!t) { t = el('<div class="toast" role="status"></div>'); document.body.appendChild(t); } t.textContent = msg; requestAnimationFrame(() => t.classList.add('in')); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('in'), 2400); };
  // ---- builders ----
  const row = ({ href, lead, leadClass, title, sub, end, onClick, cls }) => {
    const tag = href ? 'a' : 'div';
    const r = el('<' + tag + ' class="row ' + (lead == null ? 'nolead ' : '') + (cls || '') + '"' + (href ? ' href="' + href + '"' : '') + (onClick ? ' role="button" tabindex="0"' : '') + '>' + (lead == null ? '' : '<div class="lead ' + (leadClass || '') + '">' + lead + '</div>') + '<div class="body"><div class="t">' + title + '</div>' + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div><div class="end">' + (end && end.nodeType ? '' : (end || '')) + '</div></' + tag + '>');
    if (end && end.nodeType) r.querySelector('.end').appendChild(end);
    if (onClick) { r.onclick = onClick; r.onkeydown = (e) => { if (e.key === 'Enter' && e.target === r) onClick(e); }; } return r;
  };
  const kpi = (label, value, d, dark, ic) => '<div class="kpi' + (dark === true ? ' dark' : dark === 'alert' ? ' alert' : '') + '"><div class="k-h"><p class="eyebrow">' + esc(label) + '</p>' + (ic ? '<span class="k-ic">' + icon(ic) + '</span>' : '') + '</div><div class="v">' + value + '</div>' + (d ? '<div class="d">' + d + '</div>' : '') + '</div>';
  const delta = (cur, prev) => { if (!prev) return ''; const p = Math.round((cur - prev) / prev * 100); return '<span class="' + (p >= 0 ? 'up' : 'down') + '">' + (p >= 0 ? '↑' : '↓') + Math.abs(p) + '%</span> '; };
  const hexA = (hex, a) => { const h = (hex || '#999').replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const staffAvatar = (name, cls) => { const s = M.staffOf(name); if (!s) return '<span class="avatar ' + (cls || '') + '">' + esc(initials(name || '?')) + '</span>'; return s.photo ? '<span class="avatar ' + (cls || '') + '"><img src="' + esc(s.photo) + '" alt=""></span>' : '<span class="avatar tint ' + (cls || '') + '" style="background:' + s.accent + '">' + esc(s.name[0]) + '</span>'; };
  const clientAvatar = (c, cls) => c && c.photo ? '<span class="avatar ' + (cls || '') + '"><img src="' + esc(c.photo) + '" alt=""></span>' : '<span class="avatar ' + (cls || '') + '" style="background:' + pastel(c ? c.name : '?') + ';color:#111">' + esc(initials(c ? c.name : '?')) + '</span>';
  const PASTELS = ['#F5D0C5', '#F9E2AE', '#D5E8D4', '#CFE2F3', '#E1D5E7', '#FCE4EC', '#DCEDC8', '#FFE0B2'];
  const pastel = (str) => { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return PASTELS[h % PASTELS.length]; };
  const seg = (opts, val, on) => { const s = el('<div class="seg">' + opts.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return '<button type="button" data-v="' + esc(v) + '" aria-pressed="' + (v === val) + '">' + esc(l) + '</button>'; }).join('') + '</div>'); s.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; s.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); on(b.dataset.v); }; return s; };
  const chips = (opts, val, on) => { const s = el('<div class="chips">' + opts.map((o) => '<button type="button" class="chip" data-v="' + esc(o.v) + '" aria-pressed="' + (o.v === val) + '">' + esc(o.l) + (o.n != null ? ' <span class="n">' + o.n + '</span>' : '') + '</button>').join('') + '</div>'); s.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; s.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); on(b.dataset.v); }; return s; };
  const search = (ph, on) => { const s = el('<div class="search">' + icon('search') + '<input type="search" placeholder="' + esc(ph) + '" autocomplete="off"></div>'); s.querySelector('input').oninput = (e) => on(e.target.value.trim().toLowerCase()); return s; };
  const card = (title, inner, extra) => { const ic = title && typeof title === 'object' ? title.ic : null; const num = title && typeof title === 'object' ? title.n : null; const sub = title && typeof title === 'object' ? title.sub : null; if (title && typeof title === 'object') title = title.t; const c = el('<div class="card' + (ic ? ' iconed' : '') + (num ? ' numbered' : '') + '">' + (title ? '<div class="card-h"><h3>' + (ic ? '<span class="h-ic">' + icon(ic) + '</span>' : '') + (num ? '<span class="h-n">' + esc(num) + '</span>' : '') + esc(title) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</h3>' + (extra || '') + '</div>' : '') + '<div class="list"></div></div>'); const l = c.querySelector('.list'); (Array.isArray(inner) ? inner : [inner]).forEach((x) => { if (!x) return; if (typeof x === 'string') l.insertAdjacentHTML('beforeend', x); else l.appendChild(x); }); return c; };
  const empty = (t, s, ic) => '<div class="empty">' + icon(ic || 'check') + '<p class="eyebrow">' + esc(t) + '</p>' + (s ? esc(s) : '') + '</div>';
  const paylines = (rows, total) => '<div class="paylines">' + rows.map((r) => '<div class="payline"><div class="l">' + esc(r.label) + (r.deadline && r.status === 'pending' ? '<small>due ' + esc(M.fmtDT(r.deadline)) + ' · ' + esc(M.until(r.deadline)) + '</small>' : '') + '</div><div class="a">' + M.money(r.amount) + '</div>' + pill(r.status) + '</div>').join('') + (total != null ? '<div class="payline total"><div class="l">Total</div><div class="a">' + M.money(total) + '</div><span></span></div>' : '') + '</div>';
  const wa = (phone, text) => 'https://wa.me/' + String(phone).replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '');

  // ---- image picker (prototype: downscaled data URL in the store; real: Supabase Storage upload → photo_url) ----
  const downscale = (file, max) => new Promise((res, rej) => { const img = new Image(); const url = URL.createObjectURL(file); img.onload = () => { const r = Math.min(1, (max || 640) / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82)); }; img.onerror = rej; img.src = url; });
  // Real uploads: push the downscaled image to the public 'studio' Storage bucket and
  // keep the public URL (so rows store a small URL, not a fat data URL). Offline/failure
  // falls back to the data URL so the picker still works.
  const uploadStudio = async (dataUrl) => {
    const SB = window.SB; if (!SB || !SB.storage || !(window.IncensoMgmt && window.IncensoMgmt.online)) return dataUrl;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const path = 'uploads/' + Date.now() + '-' + Math.random().toString(16).slice(2) + '.jpg';
      const up = await SB.storage.from('studio').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (up.error) { console.warn('[mgmt] upload', up.error.message); toast('Upload failed: ' + (up.error.message || 'unknown')); return dataUrl; }
      const { data } = SB.storage.from('studio').getPublicUrl(path);
      return (data && data.publicUrl) || dataUrl;
    } catch (e) { console.warn('[mgmt] upload', e); toast('Upload error: ' + ((e && e.message) || e)); return dataUrl; }
  };
  const imagePicker = ({ value, label, shape, onChange, hint }) => {
    const w = el('<div class="field"><label>' + esc(label || 'Photo') + '</label><div class="imgpick ' + (shape || '') + '"><div class="imgpick-preview">' + (value ? '<img src="' + esc(value) + '" alt="">' : '<span>' + icon('image') + (hint || 'Tap to upload') + '</span>') + '</div><div class="imgpick-actions"><label class="btn sm soft">' + icon('upload') + (value ? 'Replace' : 'Upload') + '<input type="file" accept="image/*" hidden></label>' + (value ? '<button type="button" class="btn sm ghost" data-rm>Remove</button>' : '') + '</div></div></div>');
    let cur = value || null; w.value = () => cur;
    const set = (v) => { cur = v; const p = w.querySelector('.imgpick-preview'); p.innerHTML = v ? '<img src="' + v + '" alt="">' : '<span>' + icon('image') + (hint || 'Tap to upload') + '</span>'; let rm = w.querySelector('[data-rm]'); if (v && !rm) { rm = el('<button type="button" class="btn sm ghost" data-rm>Remove</button>'); w.querySelector('.imgpick-actions').appendChild(rm); rm.onclick = () => set(null); } if (!v && rm) rm.remove(); w.querySelector('.imgpick-actions .btn.soft').lastChild.previousSibling.textContent = v ? 'Replace' : 'Upload'; if (onChange) onChange(v); };
    w.querySelector('input[type=file]').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const d = await downscale(f, 720); set(d); const url = await uploadStudio(d); if (url && url !== d) { set(url); toast('Photo uploaded'); } else toast('Photo added'); } catch (err) { toast('Could not read that image'); } };
    w.querySelector('.imgpick-preview').onclick = () => w.querySelector('input[type=file]').click();
    const rm = w.querySelector('[data-rm]'); if (rm) rm.onclick = () => set(null);
    return w;
  };
  const csv = (name, rows) => { const s = rows.map((r) => r.map((v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\n'); const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(s); a.download = name + '.csv'; document.body.appendChild(a); a.click(); a.remove(); toast('Exported ' + name + '.csv'); };
  const thumb = (src, cls) => src ? '<img class="thumb ' + (cls || '') + '" src="' + esc(src) + '" alt="">' : '<span class="thumb ' + (cls || '') + ' ph">' + icon('image') + '</span>';
  window.MgmtUI = { clientPicker, datePop, imagePicker, downscale, csv, thumb, delta, hexA, staffAvatar, clientAvatar, pastel, esc, el, icon, pill, initials, staffSw, sheet, confirm, prompt, field, toast, row, kpi, seg, chips, search, card, empty, paylines, wa, STATUS };
})();
