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
    services: I('<path d="M6 3v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M9 3v5M12 11v10"/>'),
    money: I('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.8"/><path d="M6 12h.01M18 12h.01"/>'),
    messages: I('<path d="M4 5h16v11H9l-5 4z"/>'),
    settings: I('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
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
    paid: ['Paid', 'ok'], pending: ['Pending', 'warn'], unpaid: ['At studio', 'dim'], due: ['Due', 'dim'], sent: ['Sent', 'ok'], 'to send': ['To send', 'warn'], refunded: ['Refunded', 'dim'],
    placed: ['Placed', 'warn'], preparing: ['Preparing', 'info'], 'with-courier': ['With courier', 'info'], delivered: ['Delivered', 'dim'], collected: ['Collected', 'dim'],
    Reserved: ['Reserved', 'warn'], Active: ['Active', 'ok'], Used: ['Used', 'dim'], Cancelled: ['Cancelled', 'dim'],
    draft: ['Draft', 'dim'], ordered: ['Ordered', 'info'], received: ['Received', 'ok'], partial: ['Partly received', 'warn'],
    read: ['Read', 'ok'], failed: ['Failed', 'bad'], low: ['Low stock', 'warn'], out: ['Out of stock', 'bad'], instock: ['In stock', 'ok'],
  };
  const pill = (s, label) => { const d = STATUS[s] || [s, 'dim']; return '<span class="pill ' + d[1] + '">' + esc(label || d[0]) + '</span>'; };
  const initials = (n) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  const staffSw = (name) => { const s = M.staffOf(name); return '<i class="sw" style="background:' + (s ? s.accent : '#ccc') + '"></i>'; };

  // ---- sheet ----
  let openSheet = null;
  const sheet = ({ title, sub, body, foot, onClose }) => {
    if (openSheet) openSheet.close(true);
    const scrim = el('<div class="scrim" role="dialog" aria-modal="true"><div class="sheet"><div class="sheet-h"><div><h2>' + esc(title) + '</h2>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><button class="icon-btn" data-x aria-label="Close">' + icon('close') + '</button></div><div class="sheet-b"></div></div></div>');
    const b = scrim.querySelector('.sheet-b');
    if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
    if (foot) { const f = el('<div class="sheet-f"></div>'); if (typeof foot === 'string') f.innerHTML = foot; else f.appendChild(foot); scrim.querySelector('.sheet').appendChild(f); }
    document.body.appendChild(scrim); document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => scrim.classList.add('in'));
    const api = { el: scrim, body: b, close(silent) { scrim.classList.remove('in'); setTimeout(() => scrim.remove(), 240); document.body.style.overflow = ''; if (openSheet === api) openSheet = null; if (!silent && onClose) onClose(); }, setTitle(t) { scrim.querySelector('h2').textContent = t; } };
    scrim.addEventListener('click', (e) => { if (e.target === scrim || e.target.closest('[data-x]')) api.close(); });
    openSheet = api; return api;
  };
  const confirm = ({ title, text, ok, danger }) => new Promise((res) => {
    const f = el('<div style="display:flex;gap:8px;width:100%"><button class="btn ghost" data-c>Cancel</button><button class="btn ' + (danger ? 'danger' : '') + '" data-o>' + esc(ok || 'Confirm') + '</button></div>');
    const s = sheet({ title, body: '<p class="note" style="font-size:14px">' + text + '</p>', foot: f, onClose: () => res(false) });
    f.querySelector('[data-c]').onclick = () => s.close();
    f.querySelector('[data-o]').onclick = () => { res(true); s.close(true); };
  });
  const prompt = ({ title, fields, ok, danger }) => new Promise((res) => {
    const form = el('<form class="form"></form>');
    fields.forEach((f) => { form.appendChild(field(f)); });
    const foot = el('<div style="display:flex;gap:8px;width:100%"><button class="btn ghost" type="button" data-c>Cancel</button><button class="btn ' + (danger ? 'danger' : '') + '" data-o>' + esc(ok || 'Save') + '</button></div>');
    const s = sheet({ title, body: form, foot, onClose: () => res(null) });
    foot.querySelector('[data-c]').onclick = () => s.close();
    foot.querySelector('[data-o]').onclick = (e) => { e.preventDefault(); if (!form.reportValidity()) return; const out = {}; fields.forEach((f) => { const i = form.querySelector('[name="' + f.name + '"]'); out[f.name] = f.type === 'number' ? parseFloat(i.value || 0) : f.type === 'toggle' ? i.getAttribute('aria-checked') === 'true' : i.value; }); res(out); s.close(true); };
  });
  const field = (f) => {
    if (f.type === 'toggle') { const w = el('<div class="field"><div class="spread" style="min-height:44px"><label>' + esc(f.label) + '</label><button type="button" class="toggle" role="switch" name="' + f.name + '" aria-checked="' + (f.value ? 'true' : 'false') + '"></button></div></div>'); w.querySelector('.toggle').onclick = (e) => { const b = e.currentTarget; b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); }; return w; }
    let ctl;
    if (f.type === 'select') ctl = '<select name="' + f.name + '">' + f.options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(v) + '"' + (v == f.value ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
    else if (f.type === 'textarea') ctl = '<textarea name="' + f.name + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(f.value || '') + '</textarea>';
    else ctl = '<input name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + esc(f.value == null ? '' : f.value) + '" placeholder="' + esc(f.placeholder || '') + '"' + (f.required ? ' required' : '') + (f.min != null ? ' min="' + f.min + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + (f.type === 'tel' ? ' inputmode="tel"' : '') + '>';
    if (f.money) ctl = '<div class="unit">' + ctl + '</div>';
    return el('<div class="field"><label>' + esc(f.label) + (f.opt ? ' <span style="color:var(--faint);font-weight:400">optional</span>' : '') + '</label>' + ctl + '</div>');
  };
  // ---- toast ----
  let tt; const toast = (msg) => { let t = document.querySelector('.toast'); if (!t) { t = el('<div class="toast" role="status"></div>'); document.body.appendChild(t); } t.textContent = msg; requestAnimationFrame(() => t.classList.add('in')); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('in'), 2400); };
  // ---- builders ----
  const row = ({ href, lead, leadClass, title, sub, end, onClick, cls }) => {
    const tag = href ? 'a' : 'div';
    const r = el('<' + tag + ' class="row ' + (lead == null ? 'nolead ' : '') + (cls || '') + '"' + (href ? ' href="' + href + '"' : '') + (onClick ? ' role="button" tabindex="0"' : '') + '>' + (lead == null ? '' : '<div class="lead ' + (leadClass || '') + '">' + lead + '</div>') + '<div class="body"><div class="t">' + title + '</div>' + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div><div class="end">' + (end || '') + '</div></' + tag + '>');
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
  const card = (title, inner, extra) => { const c = el('<div class="card">' + (title ? '<div class="card-h"><h3>' + esc(title) + '</h3>' + (extra || '') + '</div>' : '') + '<div class="list"></div></div>'); const l = c.querySelector('.list'); (Array.isArray(inner) ? inner : [inner]).forEach((x) => { if (!x) return; if (typeof x === 'string') l.insertAdjacentHTML('beforeend', x); else l.appendChild(x); }); return c; };
  const empty = (t, s, ic) => '<div class="empty">' + icon(ic || 'check') + '<p class="eyebrow">' + esc(t) + '</p>' + (s ? esc(s) : '') + '</div>';
  const paylines = (rows, total) => '<div class="paylines">' + rows.map((r) => '<div class="payline"><div class="l">' + esc(r.label) + (r.deadline && r.status === 'pending' ? '<small>due ' + esc(M.fmtDT(r.deadline)) + ' · ' + esc(M.until(r.deadline)) + '</small>' : '') + '</div><div class="a">' + M.money(r.amount) + '</div>' + pill(r.status) + '</div>').join('') + (total != null ? '<div class="payline total"><div class="l">Total</div><div class="a">' + M.money(total) + '</div><span></span></div>' : '') + '</div>';
  const wa = (phone, text) => 'https://wa.me/' + String(phone).replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '');

  // ---- image picker (prototype: downscaled data URL in the store; real: Supabase Storage upload → photo_url) ----
  const downscale = (file, max) => new Promise((res, rej) => { const img = new Image(); const url = URL.createObjectURL(file); img.onload = () => { const r = Math.min(1, (max || 640) / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82)); }; img.onerror = rej; img.src = url; });
  const imagePicker = ({ value, label, shape, onChange, hint }) => {
    const w = el('<div class="field"><label>' + esc(label || 'Photo') + '</label><div class="imgpick ' + (shape || '') + '"><div class="imgpick-preview">' + (value ? '<img src="' + esc(value) + '" alt="">' : '<span>' + icon('image') + (hint || 'Tap to upload') + '</span>') + '</div><div class="imgpick-actions"><label class="btn sm soft">' + icon('upload') + (value ? 'Replace' : 'Upload') + '<input type="file" accept="image/*" hidden></label>' + (value ? '<button type="button" class="btn sm ghost" data-rm>Remove</button>' : '') + '</div></div></div>');
    let cur = value || null; w.value = () => cur;
    const set = (v) => { cur = v; const p = w.querySelector('.imgpick-preview'); p.innerHTML = v ? '<img src="' + v + '" alt="">' : '<span>' + icon('image') + (hint || 'Tap to upload') + '</span>'; let rm = w.querySelector('[data-rm]'); if (v && !rm) { rm = el('<button type="button" class="btn sm ghost" data-rm>Remove</button>'); w.querySelector('.imgpick-actions').appendChild(rm); rm.onclick = () => set(null); } if (!v && rm) rm.remove(); w.querySelector('.imgpick-actions .btn.soft').lastChild.previousSibling.textContent = v ? 'Replace' : 'Upload'; if (onChange) onChange(v); };
    w.querySelector('input[type=file]').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { set(await downscale(f, 720)); toast('Photo added'); } catch (err) { toast('Could not read that image'); } };
    w.querySelector('.imgpick-preview').onclick = () => w.querySelector('input[type=file]').click();
    const rm = w.querySelector('[data-rm]'); if (rm) rm.onclick = () => set(null);
    return w;
  };
  const csv = (name, rows) => { const s = rows.map((r) => r.map((v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\n'); const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(s); a.download = name + '.csv'; document.body.appendChild(a); a.click(); a.remove(); toast('Exported ' + name + '.csv'); };
  const thumb = (src, cls) => src ? '<img class="thumb ' + (cls || '') + '" src="' + esc(src) + '" alt="">' : '<span class="thumb ' + (cls || '') + ' ph">' + icon('image') + '</span>';
  window.MgmtUI = { imagePicker, downscale, csv, thumb, delta, hexA, staffAvatar, clientAvatar, pastel, esc, el, icon, pill, initials, staffSw, sheet, confirm, prompt, field, toast, row, kpi, seg, chips, search, card, empty, paylines, wa, STATUS };
})();
