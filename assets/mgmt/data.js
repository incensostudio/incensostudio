/* Incenso Management — prototype data store (localStorage). Claude Code: replace with Supabase reads/writes at the seams marked DB.* */
(() => {
  const KEY = 'incenso-mgmt-v1';
  const DAY = 864e5;
  const day0 = new Date(); day0.setHours(0, 0, 0, 0);
  const T0 = day0.getTime();
  const at = (d, h, m) => new Date(T0 + d * DAY + h * 36e5 + (m || 0) * 6e4).toISOString();
  let seedN = 7; const rnd = () => { seedN = (seedN * 9301 + 49297) % 233280; return seedN / 233280; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const pad = (n, w) => String(n).padStart(w || 4, '0');
  const lkey = (iso) => { const x = new Date(iso); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

  const cat = window.IncensoCatalog;
  const BASE_STAFF = (cat ? cat.STAFF : []).map((s) => ({ name: s.name, cats: s.cats, role: s.role, accent: s.accent, bio: s.bio || '', photo: s.photo || null, services: [] }));
  const STAFF_EXTRA = {
    Peru: { phone: '+961 3 512 908', commission: 40, days: [0, 1, 2, 3, 4, 6], start: 10, end: 19, since: '2023-03-01' },
    Aya: { phone: '+961 70 224 118', commission: 35, days: [0, 1, 3, 4, 5, 6], start: 10, end: 19, since: '2023-06-12' },
    Hala: { phone: '+961 76 890 331', commission: 35, days: [0, 2, 3, 5, 6], start: 12, end: 20, since: '2024-01-15' },
    Mia: { phone: '+961 3 771 402', commission: 45, days: [3, 4, 5, 6], start: 11, end: 19, since: '2024-05-02' },
    Jana: { phone: '+961 81 205 660', commission: 40, days: [0, 1, 2, 4, 6], start: 10, end: 18, since: '2024-09-09' },
  };
  const SERVICES = (cat ? cat.SERVICES : []).map((s, i) => ({ id: 'sv' + (i + 1), cat: s.cat, group: s.group, name: s.name, mins: s.mins, price: s.price, from: s.from, unit: s.unit, desc: s.desc, brands: s.brands, active: true }));
  const svc = (name) => SERVICES.find((s) => s.name === name) || { name, mins: 45, price: 30 };

  const CLIENTS = [
    ['Nour Haddad', '+961 3 402 118', 'nour.h@gmail.com', '1994-04-12', 'Gold', 'Sensitive scalp — no strong fragrance.'],
    ['Layal Khoury', '+961 70 118 442', 'layal.k@icloud.com', '1998-11-02', 'Silver', ''],
    ['Rima Saab', '+961 71 660 209', '', '1989-02-27', 'Gold', 'Prefers Peru. Likes to book same slot monthly.'],
    ['Maya Fares', '+961 76 331 774', 'maya.fares@hotmail.com', '2001-07-19', 'Member', ''],
    ['Dana Nasr', '+961 3 998 120', 'dana.nasr@gmail.com', '1996-09-30', 'Member', 'Allergic to acrylic monomer — Gel-X only.'],
    ['Sara Itani', '+961 81 447 003', '', '1992-12-05', 'Silver', ''],
    ['Zeina Mansour', '+961 3 210 876', 'zeina.m@gmail.com', '1987-05-21', 'Gold', 'Bridal party Oct 2026.'],
    ['Hiba Chami', '+961 70 505 331', '', '1999-03-14', 'Member', ''],
    ['Lama Abboud', '+961 71 320 990', 'lama.abboud@gmail.com', '1995-08-08', 'Member', ''],
    ['Yasmine Tabet', '+961 3 644 217', '', '1990-01-25', 'Silver', 'Always late 10 min — book buffer.'],
    ['Farah Sleiman', '+961 76 778 002', 'farah.s@gmail.com', '2002-06-11', 'Member', ''],
    ['Rana Daher', '+961 3 155 908', '', '1985-10-03', 'Gold', ''],
    ['Tala Hamdan', '+961 81 902 445', 'tala.h@gmail.com', '1997-02-17', 'Member', ''],
    ['Joelle Karam', '+961 70 316 570', '', '1993-07-29', 'Silver', ''],
  ].map((c, i) => ({ id: 'c' + (i + 1), name: c[0], phone: c[1], email: c[2], birthday: c[3], tier: c[4], notes: c[5], since: at(-(400 - i * 23), 12), spend12: 0, tags: i % 4 === 0 ? ['VIP'] : i % 5 === 0 ? ['Bridal'] : [], newsletter: i % 3 !== 0, blocked: false, photo: null }));

  const PAYS = ['card', 'card', 'cash', 'whish', 'omt', 'cash', 'card'];
  const SVC_BY_STAFF = {
    Peru: ['Haircut', 'Blow-dry', 'Root Color', 'Highlights', 'Full-Head Color', 'Keratin Smoothing Treatment', 'Hair Styling', 'Toner Refresh'],
    Aya: ['Gelish Manicure', 'Acrylic Full Set', 'Gel X', 'Classic Manicure', 'Rubber Base', 'Acrylic Refill'],
    Hala: ['Gelish Pedicure', 'Classic Pedicure', 'Medical Pedicure', 'Pose Manicure', 'Dip Powder'],
    Mia: ['Soft Glam Make-up', 'Full Glam Make-up', 'Bridal Make-up', 'Cat-Eye & Lashes'],
    Jana: ['Brow Lamination', 'Brow Threading', 'Lash Lift', 'Classic Lash Extension', 'Lash Refill'],
  };
  let bkN = 0, orN = 0, gfN = 0;
  const mkBooking = (d, h, m, staff, names, clientIdx, opts) => {
    const services = names.map((n) => { const s = svc(n); return { name: s.name, mins: s.mins, price: s.price == null ? null : s.price, from: !!s.from }; });
    const mins = services.reduce((a, s) => a + s.mins, 0);
    const price = services.reduce((a, s) => a + (s.price || 0), 0);
    const pay = (opts && opts.pay) || pick(PAYS);
    const o = Object.assign({ ref: 'BK' + pad(++bkN + 240), clientId: 'c' + (clientIdx + 1), staff, services, start: at(d, h, m), mins, price, pay, paid: 0, due: 0, gift: 0, extra: [], payStatus: 'unpaid', status: 'confirmed', deadline: null, final: null, notes: '', source: pick(['web', 'web', 'web', 'desk', 'walk-in']), placedAt: at(d - 1 - Math.floor(rnd() * 6), 11, 20) }, opts || {});
    if (pay === 'card') { o.paid = price; o.payStatus = 'paid'; }
    else if (pay === 'cash') { o.due = price; o.payStatus = 'unpaid'; }
    else { if (o.payStatus === 'unpaid' && (d <= 0 || rnd() < 0.3)) { o.payStatus = 'pending'; o.status = 'held'; o.deadline = at(d, h); } else { o.paid = price; o.payStatus = 'paid'; } }
    if (o.status === 'settled' && d >= 0) { o.paid = o.final || price; o.due = 0; o.payStatus = 'paid'; }
    if (d < 0 && o.status !== 'cancelled' && o.status !== 'no-show') { o.status = 'settled'; o.final = o.final || price; if (o.payStatus !== 'paid') { o.paid = o.final; o.due = 0; o.payStatus = 'paid'; } }
    return o;
  };
  const seedBookings = () => {
    const out = [];
    for (let d = -21; d <= 8; d++) {
      const dow = new Date(T0 + d * DAY).getDay();
      BASE_STAFF.forEach((st, si) => {
        const ex = STAFF_EXTRA[st.name]; if (!ex || !ex.days.includes(dow)) return;
        let h = ex.start + (rnd() < 0.5 ? 0 : 1);
        const n = 2 + Math.floor(rnd() * 3);
        for (let i = 0; i < n && h < ex.end - 1; i++) {
          const names = [pick(SVC_BY_STAFF[st.name] || ['Haircut'])];
          if (rnd() < 0.3) names.push(pick(SVC_BY_STAFF[st.name] || ['Blow-dry']));
          const b = mkBooking(d, h, pick([0, 0, 30]), st.name, names, Math.floor(rnd() * CLIENTS.length));
          if (d < 0 && rnd() < 0.08) { b.status = 'no-show'; b.final = null; b.paid = b.pay === 'card' ? b.price : 0; }
          if (d < 0 && rnd() < 0.05) { b.status = 'cancelled'; b.final = null; }
          out.push(b);
          h += Math.max(1, Math.ceil(b.mins / 60)) + (rnd() < 0.3 ? 1 : 0);
        }
      });
    }
    // hand-tuned today
    const td = [
      mkBooking(0, 10, 0, 'Peru', ['Highlights', 'Toner Refresh'], 2, { pay: 'card', status: 'in-chair', notes: 'Wants to go one shade lighter than last time.' }),
      mkBooking(0, 13, 30, 'Peru', ['Haircut'], 0, { pay: 'whish', payStatus: 'pending', status: 'held' }),
      mkBooking(0, 15, 0, 'Peru', ['Root Color'], 6, { pay: 'card', extra: [{ amount: 20, pay: 'whish', status: 'pending', placedAt: at(-1, 18), deadline: at(0, 15) }, { amount: 15, pay: 'cash', status: 'pending', placedAt: at(-1, 18) }], notes: 'Added Toner Refresh + gloss after booking.' }),
      mkBooking(0, 11, 0, 'Aya', ['Acrylic Full Set'], 4, { pay: 'cash', status: 'arrived' }),
      mkBooking(0, 14, 0, 'Aya', ['Gel X'], 9, { pay: 'omt', payStatus: 'pending', status: 'held' }),
      mkBooking(0, 16, 30, 'Aya', ['Gelish Manicure'], 12, { pay: 'card' }),
      mkBooking(0, 12, 30, 'Hala', ['Medical Pedicure'], 11, { pay: 'card' }),
      mkBooking(0, 17, 0, 'Hala', ['Gelish Pedicure', 'Pose Manicure'], 5, { pay: 'cash' }),
      mkBooking(0, 15, 0, 'Jana', ['Brow Lamination'], 7, { pay: 'card' }),
      mkBooking(0, 11, 0, 'Jana', ['Lash Lift'], 13, { pay: 'cash', source: 'walk-in' }),
      mkBooking(0, 10, 0, 'Jana', ['Brow Threading'], 8, { pay: 'cash', status: 'settled', final: 12, settledAt: at(0, 10, 40), settleMethod: 'cash', tip: 2 }),
      mkBooking(0, 10, 0, 'Aya', ['Classic Manicure'], 1, { pay: 'card', status: 'settled', final: 10, settledAt: at(0, 10, 50), settleMethod: 'card' }),
    ];
    td.forEach((b) => { if (b.pay === 'whish' || b.pay === 'omt') b.deadline = new Date(new Date(b.start).getTime() - 0).toISOString(); });
    const tk = lkey(at(0, 0)); return out.filter((b) => lkey(b.start) !== tk).concat(td).sort((a, b) => a.start < b.start ? -1 : 1);
  };

  const PDESC = ['Clarifying shampoo for build-up and hard water.', 'Lightweight honey oil for shine and frizz.', 'At-home bond builder, once a week.', 'Four-minute leave-in repair for damaged hair.', 'Anti-humidity gloss treatment spray.', 'Universal beautifying oil.', 'Talc-free dry shampoo, travel size.', 'Pre-wash root oil.', 'Our own jojoba cuticle oil, rollerball.', 'Hand-poured soy candle, the studio scent.', 'Nail strengthening base with rosy glow.', 'Longwear colour, studio shades.'];
  const PRODUCTS = [
    ['Ouai Detox Shampoo', 'Ouai', 32, 6, 3], ['Gisou Honey Infused Hair Oil', 'Gisou', 48, 2, 3], ['Olaplex No.3 Hair Perfector', 'Olaplex', 30, 9, 4], ['K18 Leave-in Molecular Repair Mask', 'K18', 75, 0, 2],
    ['Color Wow Dream Coat', 'Color Wow', 28, 4, 3], ['Kérastase Elixir Ultime Oil', 'Kérastase', 52, 3, 3], ['Amika Perk Up Dry Shampoo', 'Amika', 26, 11, 4], ['Fable & Mane HoliRoots Oil', 'Fable & Mane', 36, 1, 2],
    ['Incenso Cuticle Oil', 'Incenso', 14, 18, 6], ['Incenso Studio Candle', 'Incenso', 38, 5, 3], ['Dior Nail Glow', 'Dior', 34, 0, 2], ['Chanel Le Vernis', 'Chanel', 32, 4, 2],
  ].map((p, i) => ({ id: 'p' + (i + 1), name: p[0], brand: p[1], price: p[2], cost: Math.round(p[2] * 0.55), stock: p[3], low: p[4], restocks: p[3] === 0 ? 2 + i % 3 : 0, active: true, sold30: 3 + Math.floor(rnd() * 12), image: null, category: i < 8 ? 'Hair care' : i === 8 || i === 10 || i === 11 ? 'Nails' : 'Studio', desc: PDESC[i] || '', sku: 'INC-' + String(101 + i) }));
  const PCATS = ['Hair care', 'Nails', 'Studio'];

  const mkOrder = (d, h, clientIdx, items, method, fulfil, status, extra) => {
    const its = items.map(([pi, q]) => ({ productId: PRODUCTS[pi].id, name: PRODUCTS[pi].name, qty: q, price: PRODUCTS[pi].price }));
    const total = its.reduce((a, i) => a + i.qty * i.price, 0) + (fulfil === 'delivery' ? 4 : 0);
    const o = { ref: 'OR' + pad(++orN + 118), clientId: 'c' + (clientIdx + 1), items: its, delivery: fulfil === 'delivery' ? 4 : 0, total, method, fulfil, status, payStatus: method === 'card' ? 'paid' : (status === 'delivered' || status === 'collected') ? 'paid' : method === 'cash' ? 'unpaid' : 'pending', placedAt: at(d, h), deadline: method === 'whish' || method === 'omt' ? at(d + 1, h) : method === 'cash' && fulfil === 'pickup' ? at(d + 3, h) : null, courier: null, notes: '', source: 'web', address: fulfil === 'delivery' ? 'Mina, Tripoli — building Al Nour, 3rd floor' : '' };
    return Object.assign(o, extra || {});
  };
  const ORDERS = [
    mkOrder(0, 9, 1, [[0, 1], [4, 1]], 'whish', 'pickup', 'placed'),
    mkOrder(0, 10, 3, [[2, 2]], 'card', 'delivery', 'preparing'),
    mkOrder(-1, 16, 6, [[5, 1], [8, 2]], 'cash', 'pickup', 'placed'),
    mkOrder(-1, 12, 8, [[9, 1]], 'card', 'delivery', 'with-courier', { courier: { company: 'Wakilni', driver: 'Ahmad', phone: '+961 76 400 112', eta: 'Today 5–7pm', tracking: 'WK-88213' } }),
    mkOrder(-2, 11, 10, [[6, 1], [11, 1]], 'omt', 'pickup', 'placed', { payStatus: 'pending' }),
    mkOrder(-3, 15, 2, [[1, 1]], 'card', 'pickup', 'collected'),
    mkOrder(-5, 13, 12, [[0, 1], [2, 1], [8, 1]], 'cod', 'delivery', 'delivered'),
    mkOrder(-8, 17, 5, [[9, 2]], 'card', 'delivery', 'delivered'),
    mkOrder(-9, 10, 0, [[5, 1]], 'whish', 'pickup', 'cancelled', { payStatus: 'unpaid', notes: 'Transfer not received by deadline.' }),
    mkOrder(-12, 14, 11, [[4, 1], [6, 1]], 'card', 'pickup', 'collected'),
  ];
  const mkGift = (d, amount, buyerIdx, to, toPhone, status, method, extra) => Object.assign({ code: 'GF' + pad(++gfN + 30), amount, balance: status === 'Used' ? 0 : amount, buyerId: 'c' + (buyerIdx + 1), from: CLIENTS[buyerIdx].name.split(' ')[0], to, toPhone, message: '', status, method, createdAt: at(d, 12), expiry: at(d + 365, 12), deadline: status === 'Reserved' ? at(d + (method === 'cash' ? 3 : 1), 12) : null, redemptions: [] }, extra || {});
  const GIFTS = [
    mkGift(0, 100, 6, 'Karen Rizk', '+961 3 808 191', 'Reserved', 'whish', { message: 'Happy birthday, habibti.' }),
    mkGift(-1, 50, 3, 'Maya Fares', '+961 76 331 774', 'Active', 'card'),
    mkGift(-2, 75, 11, 'Lina Daher', '+961 70 660 555', 'Reserved', 'cash'),
    mkGift(-6, 150, 2, 'Rima Saab', '+961 71 660 209', 'Active', 'card', { balance: 90, redemptions: [{ at: at(-3, 14), amount: 60, ref: 'BK0251' }] }),
    mkGift(-20, 60, 0, 'Sara Itani', '+961 81 447 003', 'Used', 'omt', { redemptions: [{ at: at(-12, 15), amount: 60, ref: 'BK0233' }] }),
    mkGift(-30, 40, 9, 'Tala Hamdan', '+961 81 902 445', 'Active', 'card'),
    mkGift(-45, 100, 13, 'Nadia Karam', '+961 3 120 998', 'Cancelled', 'whish'),
    mkGift(-60, 200, 6, 'Zeina Mansour', '+961 3 210 876', 'Active', 'card', { balance: 200 }),
  ];
  const EXPENSES = [
    ['Rent', 'Studio rent — September', 1800, -19, 'transfer'], ['Products', 'L\u2019Oréal Pro colour restock', 420, -16, 'card'], ['Utilities', 'EDL + generator', 260, -12, 'cash'],
    ['Products', 'Gel-X tips & rubber base', 185, -9, 'cash'], ['Marketing', 'Instagram boosts', 90, -7, 'card'], ['Supplies', 'Towels, gloves, sterilisation pouches', 140, -4, 'cash'],
    ['Utilities', 'Internet — Ogero', 45, -3, 'transfer'], ['Maintenance', 'AC service', 120, -1, 'cash'],
  ].map((e, i) => ({ id: 'e' + (i + 1), category: e[0], label: e[1], amount: e[2], date: at(e[3], 10), method: e[4] }));
  const MSG_T = ['Booking confirmed', 'Payment reminder', 'Payment confirmed', 'Reminder · tomorrow', 'Order reserved', 'With courier', 'Gift card sent', 'Sign-in code', 'Visit settled', 'Released · unpaid'];
  const MESSAGES = Array.from({ length: 28 }, (_, i) => { const c = pick(CLIENTS); const d = -1 - Math.floor(i / 4); return { id: 'm' + (i + 1), at: at(d, 9 + (i * 3) % 11, (i * 17) % 60), to: c.phone, name: c.name, template: pick(MSG_T), ref: pick(['BK02' + pad(40 + i, 2), 'OR01' + pad(20 + i % 9, 2), 'GF00' + pad(31 + i % 8, 2)]), status: rnd() < 0.85 ? 'read' : rnd() < 0.7 ? 'delivered' : 'failed', from: i % 7 === 0 ? 'shared' : 'studio' }; }).sort((a, b) => a.at < b.at ? 1 : -1);

  const SETTINGS = {
    hours: { open: 10, closeWeek: 19, closeWeekend: 20, closedDays: [] }, closedDates: [{ date: lkey(at(19, 0)), label: 'Independence Day' }],
    ticker: 'Open today · walk-ins welcome after 3pm', tickerOn: true, reviewsOn: true, wa: '+961 71 930 290', address: '32, Dam & Farz, Tripoli',
    tiers: [{ name: 'Member', min: 0, perk: '' }, { name: 'Silver', min: 300, perk: '5% off products' }, { name: 'Gold', min: 800, perk: '10% off products · priority slots' }],
    holdDays: 3, transferHours: 24, theme: { home: '#f7f4eb', pages: '#e5dcc9' }, announcement: '',
    payments: { card: true, whish: true, omt: true, cash: true, cod: true }, qr: { whish: null, omt: null },
    shop: { deliveryFee: 4, freeOver: 80, pickup: true, delivery: true, zones: 'Tripoli & Mina · same day; rest of Lebanon 1–2 days' },
    home: { heroLine: 'Hair, nails, make-up — taken seriously.', reviewsOn: true, rating: 4.9, reviewCount: 212 },
    gallery: [{ id: 'g1', image: 'assets/hair/v1.jpg', caption: 'Lived-in blonde', cat: 'Hair' }, { id: 'g2', image: 'assets/hair/v2.jpg', caption: 'Glass hair', cat: 'Hair' }, { id: 'g3', image: 'assets/hair/v3.jpg', caption: 'Copper melt', cat: 'Hair' }, { id: 'g4', image: 'assets/hair/v4.jpg', caption: 'Soft waves', cat: 'Hair' }],
    space: [{ id: 's1', image: 'assets/hair/p1.jpg', caption: 'The front room' }, { id: 's2', image: 'assets/hair/p2.jpg', caption: 'Colour bar' }, { id: 's3', image: null, caption: 'Nail table' }],
    legal: { terms: 'Bookings can be moved or cancelled up to 24 hours before…', shipping: 'Orders ship within Lebanon…', privacy: 'We keep only what we need to run your bookings…' },
  };
  // ---- permissions: modules a person can open + actions they may take. Presets are starting points; each user carries their own copy. ----
  const MODULES = ['home', 'today', 'bookings', 'clients', 'orders', 'gifts', 'products', 'supply', 'money', 'reports', 'staff', 'services', 'messages', 'settings'];
  const FLAGS = { ownOnly: 'Only their own chair', settle: 'Settle visits & take payments', refunds: 'Cancel, refund & release', prices: 'Change prices & stock', amounts: 'See money amounts', broadcast: 'Send messages to clients', access: 'Manage who can sign in' };
  const PRESETS = {
    owner: { label: 'Owner', modules: MODULES.slice(), flags: { ownOnly: false, settle: true, refunds: true, prices: true, amounts: true, broadcast: true, access: true } },
    desk: { label: 'Reception', modules: ['home', 'today', 'bookings', 'clients', 'orders', 'gifts', 'products', 'supply', 'messages'], flags: { ownOnly: false, settle: true, refunds: false, prices: false, amounts: true, broadcast: false, access: false } },
    stylist: { label: 'Chair', modules: ['home', 'today', 'bookings', 'clients'], flags: { ownOnly: true, settle: false, refunds: false, prices: false, amounts: false, broadcast: false, access: false } },
  };
  const mkUser = (phone, name, preset, staff) => ({ phone, name, role: preset, staff: staff || null, modules: PRESETS[preset].modules.slice(), flags: Object.assign({}, PRESETS[preset].flags), active: true, added: at(-200, 12) });
  const USERS = [
    mkUser('+961 71 930 290', 'Owner', 'owner'),
    mkUser('+961 3 111 222', 'Reception', 'desk'),
    ...BASE_STAFF.map((s) => mkUser(STAFF_EXTRA[s.name] ? STAFF_EXTRA[s.name].phone : '', s.name, 'stylist', s.name)),
  ];

  const SUPPLIERS = [
    { id: 'su1', name: 'L\u2019Oréal Professionnel Lebanon', contact: 'Rami', phone: '+961 3 900 112', email: 'orders@lorealpro.lb', terms: 'Net 30', brands: 'L\u2019Oréal Professionnel, Kérastase', lead: 5, notes: '' },
    { id: 'su2', name: 'Beauty Line Distribution', contact: 'Nada', phone: '+961 70 442 890', email: 'nada@beautyline.lb', terms: 'On delivery', brands: 'Olaplex, K18, Color Wow, Amika', lead: 3, notes: 'Min order $300' },
    { id: 'su3', name: 'Nail Supply Co.', contact: 'Karim', phone: '+961 76 210 334', email: '', terms: 'On delivery', brands: 'Gel-X, rubber base, tips', lead: 2, notes: '' },
    { id: 'su4', name: 'Incenso own label', contact: 'Studio', phone: '', email: '', terms: '—', brands: 'Cuticle oil, candles', lead: 10, notes: 'Made to order in Tripoli' },
  ];
  const PURCHASES = [
    { id: 'PO0021', supplierId: 'su2', status: 'ordered', createdAt: at(-4, 11), expected: at(1, 12), items: [{ productId: 'p4', name: 'K18 Leave-in Molecular Repair Mask', qty: 6, cost: 41, received: 0 }, { productId: 'p8', name: 'Fable & Mane HoliRoots Oil', qty: 6, cost: 20, received: 0 }], notes: 'Rush — K18 is out.', by: 'Owner' },
    { id: 'PO0020', supplierId: 'su3', status: 'received', createdAt: at(-12, 10), expected: at(-9, 12), receivedAt: at(-9, 15), items: [{ productId: null, name: 'Gel-X tips · medium coffin (box)', qty: 4, cost: 18, received: 4 }, { productId: null, name: 'Rubber base 15ml', qty: 12, cost: 6, received: 12 }], notes: '', by: 'Owner' },
    { id: 'PO0019', supplierId: 'su1', status: 'partial', createdAt: at(-16, 9), expected: at(-11, 12), items: [{ productId: null, name: 'Majirel colour tubes (assorted)', qty: 40, cost: 7.5, received: 30 }, { productId: 'p6', name: 'Kérastase Elixir Ultime Oil', qty: 4, cost: 29, received: 4 }], notes: '10 tubes back-ordered.', by: 'Owner' },
    { id: 'PO0018', supplierId: 'su4', status: 'draft', createdAt: at(-1, 17), expected: null, items: [{ productId: 'p10', name: 'Incenso Studio Candle', qty: 12, cost: 16, received: 0 }], notes: 'Holiday batch', by: 'Reception' },
  ];
  const seed = () => ({ v: 8, staff: BASE_STAFF.map((s) => Object.assign({ active: true, timeOff: [] }, s, STAFF_EXTRA[s.name] || {})), services: SERVICES, clients: CLIENTS, bookings: seedBookings(), orders: ORDERS, gifts: GIFTS, products: PRODUCTS, expenses: EXPENSES, messages: MESSAGES, settings: SETTINGS, users: USERS, blocks: [{ id: 'bl1', staff: 'Hala', start: at(0, 15), mins: 60, label: 'Lunch' }], payouts: [], closes: [], newsletter: CLIENTS.filter((c) => c.newsletter).map((c) => ({ phone: c.phone, name: c.name, at: c.since })).concat([{ phone: '+961 3 555 010', name: '', at: at(-3, 19) }, { phone: '+961 70 909 121', name: '', at: at(-1, 21) }]), pcats: PCATS, catMeta: {}, suppliers: SUPPLIERS, purchases: PURCHASES, shifts: {}, counters: { BK: bkN + 240, OR: orN + 118, GF: gfN + 30, PO: 21 }, audit: [] });

  let db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!db || db.v !== 8 || !db.bookings || !db.bookings.length || !db.bookings.some((b) => lkey(b.start) === lkey(at(0, 0)))) db = seed();
  const listeners = new Set();
  const save = (what) => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} listeners.forEach((f) => f(what)); };
  const reset = () => { db = seed(); save('reset'); };
  const log = (action, ref, by) => { db.audit.unshift({ at: new Date().toISOString(), action, ref, by }); if (db.audit.length > 200) db.audit.length = 200; };
  const nextRef = (kind) => kind + pad(++db.counters[kind]);

  const money = (n) => { const v = Math.abs(Math.round(n * 100) / 100); return (n < 0 ? '−' : '') + '$' + v.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }); };
  const dt = (iso) => new Date(iso);
  const fmtTime = (iso) => dt(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (iso) => dt(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtDate = (iso) => dt(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDT = (iso) => fmtDay(iso) + ' · ' + fmtTime(iso);
  const isSameDay = (a, b) => lkey(a) === lkey(b);
  const dayKey = (d) => lkey(new Date(T0 + d * DAY).toISOString());
  const rel = (iso) => { const m = (Date.now() - dt(iso)) / 6e4; if (m < 1) return 'now'; if (m < 60) return Math.round(m) + 'm ago'; if (m < 1440) return Math.round(m / 60) + 'h ago'; return Math.round(m / 1440) + 'd ago'; };
  const until = (iso) => { const m = (dt(iso) - Date.now()) / 6e4; if (m <= 0) return 'overdue'; if (m < 60) return Math.round(m) + ' min left'; if (m < 1440) return Math.round(m / 60) + 'h left'; return Math.round(m / 1440) + 'd left'; };
  const PAY_LABEL = { card: 'Card', whish: 'Whish Money', omt: 'OMT Pay', cash: 'Cash', cod: 'Cash on delivery', gift: 'Gift balance' };
  const client = (id) => db.clients.find((c) => c.id === id) || { name: 'Guest', phone: '' };
  const staffOf = (name) => db.staff.find((s) => s.name === name);
  const bookingPieces = (b) => { const rows = []; if (b.paid) rows.push({ label: PAY_LABEL[b.pay] || 'Paid', amount: b.paid, status: 'paid' }); if (b.gift) rows.push({ label: 'Gift balance', amount: b.gift, status: 'paid' }); (b.extra || []).forEach((x) => rows.push({ label: PAY_LABEL[x.pay] + ' · top-up', amount: x.amount, status: x.status, deadline: x.deadline, extra: x })); if (b.payStatus === 'pending' && !b.paid) rows.push({ label: PAY_LABEL[b.pay], amount: b.price, status: 'pending', deadline: b.deadline }); if (b.due) rows.push({ label: 'Cash at studio', amount: b.due, status: b.status === 'settled' ? 'paid' : 'due' }); if (b.refund) rows.push({ label: 'Refund · ' + PAY_LABEL[b.pay], amount: -b.refund, status: b.refundSent ? 'sent' : 'to send' }); return rows; };
  const spend12 = (cid) => db.bookings.filter((b) => b.clientId === cid && b.status === 'settled' && dt(b.start) > new Date(Date.now() - 365 * DAY)).reduce((a, b) => a + (b.final || b.price), 0) + db.orders.filter((o) => o.clientId === cid && (o.status === 'delivered' || o.status === 'collected')).reduce((a, o) => a + o.total, 0);
  const tierFor = (amount) => { let t = db.settings.tiers[0]; db.settings.tiers.forEach((x) => { if (amount >= x.min) t = x; }); return t.name; };

  const shiftFor = (staff, dateIso) => { const s = typeof staff === 'string' ? db.staff.find((x) => x.name === staff) : staff; if (!s) return null; const k = lkey(dateIso); const o = db.shifts && db.shifts[s.name] && db.shifts[s.name][k]; const dow = new Date(dateIso).getDay(); const tOff = (s.timeOff || []).some((t) => k >= t.from && k <= t.to); if (o) return o.off ? { off: true, label: o.label || 'Off' } : { off: false, start: o.start, end: o.end, label: o.label || 'Shift', override: true }; if (!s.active || tOff) return { off: true, label: tOff ? 'Time off' : 'Inactive' }; if (!s.days.includes(dow)) return { off: true, label: 'Day off' }; return { off: false, start: s.start, end: s.end, label: 'Regular' }; };
  const setShift = (staff, dateIso, val) => { db.shifts = db.shifts || {}; db.shifts[staff] = db.shifts[staff] || {}; const k = lkey(dateIso); if (val == null) delete db.shifts[staff][k]; else db.shifts[staff][k] = val; };
  window.IncensoMgmt = { shiftFor, setShift, get db() { return db; }, save, reset, log, nextRef, on: (f) => listeners.add(f), off: (f) => listeners.delete(f), money, fmtTime, fmtDay, fmtDate, fmtDT, isSameDay, dayKey, lkey, rel, until, at, T0, DAY, PAY_LABEL, client, staffOf, bookingPieces, spend12, tierFor, KEY, MODULES, FLAGS, PRESETS, mkUser, hm: (iso) => { const t = new Date(iso); return t.getHours() + t.getMinutes() / 60; } };
})();
