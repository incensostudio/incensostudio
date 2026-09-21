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
  // Chair colour follows the discipline (Hair yellow · Nails coral · Make-up purple · Brows & Lashes green); second chair in a discipline gets a deeper shade.
  const DISC_ACCENT = { Hair: ['#F2C94C', '#E0B43A'], Nails: ['#F0917C', '#E8785F'], 'Make-up': ['#B78CE0', '#A374D6'], 'Brows & Lashes': ['#7FC59A', '#63B384'] };
  const PFP = { Peru: 'assets/staff/peru.png', Aya: 'assets/staff/aya.png', Hala: 'assets/staff/hala.png', Mia: 'assets/staff/mia.png', Jana: 'assets/staff/jana.png' };
  const accentFor = (cats, i) => { const k = DISC_ACCENT[(cats || [])[0]]; return k ? k[Math.min(i, k.length - 1)] : '#D9D9D9'; };
  const seen = {};
  const BASE_STAFF = (cat ? cat.STAFF : []).map((s) => { const k = (s.cats || [])[0]; const i = seen[k] || 0; seen[k] = i + 1; return { name: s.name, cats: s.cats, role: s.role, accent: accentFor(s.cats, i), bio: s.bio || '', photo: s.photo || PFP[s.name] || null, services: [] }; });
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
  ].map((c, i) => ({ id: 'c' + (i + 1), name: c[0], phone: c[1], email: c[2], birthday: c[3], tier: c[4], notes: c[5], since: at(-(400 - i * 23), 12), spend12: 0, newsletter: i % 3 !== 0, blocked: false, photo: null }));

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
  ].map((p, i) => ({ id: 'p' + (i + 1), name: p[0], brand: p[1], price: p[2], cost: Math.round(p[2] * 0.55), stock: p[3], low: p[4], restocks: p[3] === 0 ? 2 + i % 3 : 0, active: true, sold30: 3 + Math.floor(rnd() * 12), image: null, category: i < 8 ? 'Hair' : i === 8 || i === 10 || i === 11 ? 'Nails' : 'Home', desc: PDESC[i] || '', sku: 'INC-' + String(101 + i) }));
  const PCATS = ['Hair', 'Nails', 'Body', 'Home'];

  const mkOrder = (d, h, clientIdx, items, method, fulfil, status, extra) => {
    const its = items.map(([pi, q]) => ({ productId: PRODUCTS[pi].id, name: PRODUCTS[pi].name, qty: q, price: PRODUCTS[pi].price }));
    const total = its.reduce((a, i) => a + i.qty * i.price, 0) + (fulfil === 'delivery' ? 5 : 0);
    const o = { ref: 'OR' + pad(++orN + 118), clientId: 'c' + (clientIdx + 1), items: its, delivery: fulfil === 'delivery' ? 4 : 0, total, method, fulfil, status, payStatus: method === 'card' ? 'paid' : (status === 'delivered' || status === 'collected') ? 'paid' : (method === 'cash' || method === 'cod') ? 'unpaid' : 'pending', placedAt: at(d, h), deadline: ['delivered', 'collected'].includes(status) || (extra && extra.source === 'desk') ? null : method === 'whish' || method === 'omt' ? at(d + 1, h) : method === 'cash' && fulfil === 'pickup' ? at(d + 3, h) : null, courier: null, notes: '', source: 'web', address: fulfil === 'delivery' ? 'Mina, Tripoli — building Al Nour, 3rd floor' : '' };
    return Object.assign(o, extra || {});
  };
  // Scenarios (website lifecycle): pickup cash → ready · pickup transfer pending → awaiting · pickup card paid → ready · delivery cod → placed/preparing · delivery with courier (tracking) · delivered/collected · cancelled (unpaid transfer, not collected, by studio) · gift-balance split · desk sales · WhatsApp-placed orders
  const ORDERS = [
    // open — pickups
    mkOrder(0, 9, 1, [[0, 1], [4, 1]], 'whish', 'pickup', 'placed'),                                   // awaiting Whish · pickup once paid
    mkOrder(0, 10, 3, [[2, 1]], 'cash', 'pickup', 'ready'),                                             // cash at studio · ready · held 3 days
    mkOrder(0, 11, 5, [[6, 1], [11, 1]], 'card', 'pickup', 'ready', { source: 'whatsapp' }),            // paid by card link · ready · placed via WhatsApp
    mkOrder(-1, 16, 6, [[5, 1], [8, 2]], 'omt', 'pickup', 'placed', { source: 'whatsapp' }),            // awaiting OMT · via WhatsApp
    mkOrder(-2, 12, 7, [[3, 1]], 'cash', 'pickup', 'ready', { deadline: at(0, 20) }),                   // cash · last day to collect
    // open — deliveries
    mkOrder(0, 12, 3, [[2, 2]], 'card', 'delivery', 'preparing'),                                       // paid · preparing
    mkOrder(-1, 12, 8, [[9, 1]], 'card', 'delivery', 'with-courier', { courier: { company: 'Wakilni', eta: 'Today 5\u20137pm', tracking: 'WK-88213' } }),
    mkOrder(-1, 18, 10, [[0, 1], [7, 1]], 'cod', 'delivery', 'placed', { source: 'whatsapp' }),        // cash on delivery · placed via WhatsApp
    mkOrder(-2, 16, 13, [[8, 1]], 'whish', 'delivery', 'placed'),                                       // awaiting Whish · delivery once paid
    mkOrder(-3, 10, 2, [[1, 1], [10, 1]], 'cod', 'delivery', 'with-courier', { courier: { company: 'Toters', eta: 'Tomorrow 12\u20132pm', tracking: '' } }), // courier collects cash
    // completed
    mkOrder(-3, 15, 2, [[1, 1]], 'card', 'pickup', 'collected'),
    mkOrder(-5, 13, 12, [[0, 1], [2, 1], [8, 1]], 'cod', 'delivery', 'delivered'),
    mkOrder(-8, 17, 5, [[9, 2]], 'card', 'delivery', 'delivered', { courier: { company: 'Wakilni', eta: 'Delivered', tracking: 'WK-88102' } }),
    mkOrder(-12, 14, 11, [[4, 1], [6, 1]], 'card', 'pickup', 'collected'),
    mkOrder(-4, 12, 1, [[0, 1], [9, 1]], 'card', 'delivery', 'delivered'),
    mkOrder(-6, 11, 4, [[5, 1]], 'cash', 'pickup', 'collected', { gift: { amount: 30, parts: [] }, method: 'cash' }),   // $30 gift balance + cash
    // desk sales (taken now)
    mkOrder(0, 11, 4, [[3, 1]], 'cash', 'pickup', 'collected', { source: 'desk', payStatus: 'paid' }),
    mkOrder(0, 12, 7, [[10, 2], [7, 1]], 'card', 'pickup', 'collected', { source: 'desk', payStatus: 'paid' }),
    mkOrder(-1, 18, 9, [[1, 1]], 'whish', 'pickup', 'collected', { source: 'desk', payStatus: 'paid' }),
    mkOrder(-6, 10, 2, [[6, 2]], 'cash', 'pickup', 'collected', { source: 'desk', payStatus: 'paid' }),
    mkOrder(-2, 15, 0, [[11, 1]], 'gift', 'pickup', 'collected', { source: 'desk', payStatus: 'paid', gift: { amount: 24, parts: [] } }), // fully on gift balance
    // cancelled
    mkOrder(-9, 10, 0, [[5, 1]], 'whish', 'pickup', 'cancelled', { payStatus: 'unpaid', deadline: at(-8, 10), cancelReason: 'We didn\u2019t receive your Whish Money transfer by the deadline, so this order was cancelled and the items released. Nothing was charged.' }),
    mkOrder(-7, 13, 6, [[2, 1]], 'cash', 'pickup', 'cancelled', { payStatus: 'unpaid', cancelReason: 'Not collected within 3 days \u2014 the items went back on the shelf. Nothing was charged.' }),
    mkOrder(-10, 15, 9, [[4, 2]], 'card', 'delivery', 'cancelled', { payStatus: 'paid', refund: 61, refundSent: false, cancelReason: 'We couldn\u2019t fulfil this order \u2014 the product arrived damaged from the supplier.' }),
  ];
  const mkGift = (d, amount, buyerIdx, to, toPhone, status, method, extra) => Object.assign({ code: 'GF' + pad(++gfN + 30), amount, balance: status === 'Used' ? 0 : amount, buyerId: 'c' + (buyerIdx + 1), from: CLIENTS[buyerIdx].name.split(' ')[0], to, toPhone, message: '', status, method, createdAt: at(d, 12), expiry: at(d + 365, 12), deadline: status === 'Reserved' ? at(d + (method === 'cash' ? 3 : 1), 12) : null, redemptions: [] }, extra || {});
  const GIFTS = [
    mkGift(0, 100, 6, 'Karen Rizk', '+961 3 808 191', 'Reserved', 'whish', { message: 'Happy birthday, habibti.' }),          // awaiting Whish · 24h
    mkGift(0, 75, 11, 'Lina Daher', '+961 70 660 555', 'Reserved', 'cash', { hold: true, message: 'For your big day.' }),    // cash on hold · 3 days
    mkGift(-1, 50, 3, 'Maya Fares', '+961 76 331 774', 'Active', 'card'),
    mkGift(-6, 150, 2, 'Rima Saab', '+961 71 660 209', 'Active', 'card', { balance: 90, redemptions: [{ at: at(-3, 14), amount: 60, ref: 'BK0251' }] }),   // partly used
    mkGift(-20, 60, 0, 'Sara Itani', '+961 81 447 003', 'Used', 'omt', { redemptions: [{ at: at(-12, 15), amount: 60, ref: 'BK0233' }] }),
    mkGift(-30, 40, 9, 'Tala Hamdan', '+961 81 902 445', 'Active', 'card'),
    mkGift(-45, 100, 13, 'Nadia Karam', '+961 3 120 998', 'Cancelled', 'whish', { cancelReason: 'Transfer not received within 24 hours.' }),
    mkGift(-60, 200, 6, 'Zeina Mansour', '+961 3 210 876', 'Active', 'card', { balance: 200 }),
    mkGift(-335, 80, 4, 'Joelle Karam', '+961 70 316 570', 'Active', 'card', { balance: 80 }),                             // expiring in ~30 days
    mkGift(-400, 50, 8, 'Hala Nasr', '+961 3 555 001', 'Active', 'cash', { balance: 50 }),                                  // expired
  ];
  const EXPENSES = [
    ['Products', 'L\u2019Oréal Pro colour restock', 420, -16, 'card'], 
    ['Products', 'Gel-X tips & rubber base', 185, -9, 'cash'], ['Marketing', 'Instagram boosts', 90, -7, 'card'], ['Supplies', 'Towels, gloves, sterilisation pouches', 140, -4, 'cash'],
    ['Utilities', 'Internet — Ogero', 45, -3, 'transfer'], ['Maintenance', 'AC service', 120, -1, 'cash'],
  ].map((e, i) => ({ id: 'e' + (i + 1), category: e[0], label: e[1], amount: e[2], date: at(e[3], 10), method: e[4] }));
  const MSG_T = ['Booking confirmed', 'Payment reminder', 'Payment confirmed', 'Reminder · tomorrow', 'Order reserved', 'With courier', 'Gift card sent', 'Sign-in code', 'Visit settled', 'Released · unpaid'];
  const MESSAGES = Array.from({ length: 28 }, (_, i) => { const c = pick(CLIENTS); const d = -1 - Math.floor(i / 4); return { id: 'm' + (i + 1), at: at(d, 9 + (i * 3) % 11, (i * 17) % 60), to: c.phone, name: c.name, template: pick(MSG_T), ref: pick(['BK02' + pad(40 + i, 2), 'OR01' + pad(20 + i % 9, 2), 'GF00' + pad(31 + i % 8, 2)]), status: rnd() < 0.85 ? 'read' : rnd() < 0.7 ? 'delivered' : 'failed', from: i % 7 === 0 ? 'shared' : 'studio' }; }).sort((a, b) => a.at < b.at ? 1 : -1);

  const SETTINGS = {
    hours: { open: 10, closeWeek: 19, closeWeekend: 20, closedDays: [] }, closedDates: [{ date: lkey(at(19, 0)), label: 'Independence Day' }],
    ticker: 'Open today · walk-ins welcome after 3pm', tickerOn: true, reviewsOn: true, wa: '+961 71 930 290', address: '32, Dam & Farz', city: 'Tripoli, Lebanon', maps: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x1521f75831aec263:0x491dc69a84008be5?sa=X&ved=1t:8290&ictx=111', email: 'hi@incensostudio.com', instagram: 'incensostudio', tiktok: 'incensostudio', music: [], musicOn: true,
    // Same levels as the website (assets/auth.js TIERS): discount applies to services and the shelf
    tiers: [{ name: 'Member', min: 0, rate: 0, perk: 'Welcome — every dollar counts toward Insider' }, { name: 'Insider', min: 1000, rate: 0.1, perk: '10% off everything — services and the shelf' }, { name: 'Loyal', min: 2000, rate: 0.2, perk: '20% off everything — services and the shelf' }],
    holdDays: 3, transferHours: 24, theme: { home: '#f7f4eb', pages: '#e5dcc9' }, announcement: '',
    payments: { card: true, whish: true, omt: true, cash: true, cod: true }, qr: { whish: null, omt: null },
    // Monthly fixed costs — the baseline every month carries before a single client walks in
    fixedCosts: [{ id: 'fc1', label: 'Studio rent', category: 'Rent', amount: 1800, dueDay: 1 }, { id: 'fc2', label: 'Reception salary', category: 'Salaries', amount: 900, dueDay: 28 }, { id: 'fc7', label: 'Cleaner', category: 'Salaries', amount: 60, freq: 'weekly', weekday: 6 }, { id: 'fc3', label: 'Electricity + generator', category: 'Utilities', amount: 260, dueDay: 15 }, { id: 'fc4', label: 'Water + internet', category: 'Utilities', amount: 70, dueDay: 10 }, { id: 'fc5', label: 'Booking & website', category: 'Software', amount: 45, dueDay: 5 }, { id: 'fc6', label: 'Cleaning', category: 'Services', amount: 200, dueDay: 30 }],
    shop: { deliveryFee: 5, pickup: true, delivery: true, zones: 'Anywhere in Lebanon by courier · 1–3 working days' },
    home: { heroLine: 'Hair, nails, make-up — taken seriously.', reviewsOn: true, rating: 4.9, reviewCount: 212 },
    gallery: [{ id: 'g1', image: 'assets/hair/v1.jpg', caption: 'Lived-in blonde', cat: 'Hair' }, { id: 'g2', image: 'assets/hair/v2.jpg', caption: 'Glass hair', cat: 'Hair' }, { id: 'g3', image: 'assets/hair/v3.jpg', caption: 'Copper melt', cat: 'Hair' }, { id: 'g4', image: 'assets/hair/v4.jpg', caption: 'Soft waves', cat: 'Hair' }],
    space: [{ id: 's1', image: 'assets/hair/p1.jpg', caption: 'The front room' }, { id: 's2', image: 'assets/hair/p2.jpg', caption: 'Colour bar' }, { id: 's3', image: null, caption: 'Nail table' }],
    legal: {"terms":{"updated":"17 September 2026","sections":[{"h":"Appointments","p":["Bookings are made online, by WhatsApp or in person, and are confirmed when you receive your booking number by WhatsApp. A booking holds a specific chair with specific hands for the time shown. If you don’t make it to an appointment, it is simply cancelled — there is no no-show fee, and anything paid ahead is refunded the same way you paid.","You can change or cancel a booking any time from your account or on WhatsApp.","We hold your chair for 15 minutes past the booked time. After that we may need to shorten the service so the next guest starts on time, at the full price of what was booked. If we ever have to move your appointment — illness, an emergency — we call you first and agree a new time; if nothing suits, anything paid ahead is refunded in full. Durations shown are estimates. Prices marked “from” and custom quotes are confirmed with you in the chair before we start; the amount you are asked to pay is the amount agreed there."]},{"h":"Payments","p":["You can pay at the studio (cash or card), or ahead by card, Whish Money or OMT Pay. Prices are in US dollars and are the prices shown at the time of booking.","If you paid ahead and later change your booking, the payment stays as it is: any extra is settled at the studio or paid online; any difference in your favour is refunded the same way you paid, within a few business days. Cancelled prepaid bookings are refunded in full the same way. A booking paid by Whish Money or OMT Pay is held until the transfer arrives — within 24 hours of booking, or by the appointment time if that comes first; unpaid after that, the slot is released and nothing is charged. Once a payment has reached us it stays as your payment method; anything extra can be paid however you like. Refunds go back the same way they were paid, normally within 3–5 business days for cards and shortly for Whish or OMT; we cannot refund a card payment in cash. Card payments are processed by our payment provider; we never see or store your card number. Member levels are calculated on settled spend in the last 12 months and adjust automatically when a purchase is refunded or cancelled; discounts are personal, cannot be transferred, and cannot be combined with other offers unless we say so. All prices include any applicable taxes.","Members' discounts (Insider 10%, Loyal 20%) apply automatically to services and shelf purchases while your level is active. Levels are based on your spend in the last 12 months."]},{"h":"The shelf","p":["Products are sold as described, for studio pickup or courier delivery across Lebanon. Delivery terms are on the Shipping & Pickup page.","If something arrives damaged or wrong, message us within 7 days and we will replace or refund it. Opened cosmetics cannot be returned for change of mind — hygiene first.","If an item turns out to be out of stock after you order, we send the rest, refund the difference, and tell you. We never substitute without asking. Orders paid by Whish Money or OMT Pay are held for 24 hours for the transfer to arrive; orders to be paid at the studio are held for 3 days from ordering. Unpaid or uncollected after that, the order is released and nothing is charged. Products are for personal use and should be used as directed on the label; do a patch test with anything new, and stop if your skin reacts. Prices and stock can change until an order is placed; if we have made an obvious pricing mistake we will tell you before we prepare the order and you may cancel for a full refund."]},{"h":"Gift cards","p":["Gift cards are valid for 12 months from purchase, on any service or shelf purchase, and can be used across several visits until the balance is spent. They have no cash value and cannot be exchanged for cash.","A gift card is registered to the recipient’s phone number — nothing to type or lose. It appears in their account the moment they sign in with that number. Cards paid by Whish or OMT are held for 24 hours, and cards paid at the studio for 3 days; unpaid after that, the card is cancelled and nothing is charged.","Once paid, a gift card cannot be refunded or reloaded. Please check the recipient’s number before you pay — a card sent to a wrong number that has since been used cannot be recovered, though we will always try to help. Unused balance expires with the card."]},{"h":"In the studio","p":["The studio is IQOS-only — no cigarettes. Please tell us about allergies, sensitivities, pregnancy or recent chemical treatments when you book; it changes what we can safely do.","Colour, keratin, lash and brow treatments can cause reactions. We ask about allergies and recent treatments before we start and may ask for a patch test 48 hours ahead; if you choose to go ahead without one, or without telling us something that matters, the risk is yours. Guests who are pregnant or on medication that affects the skin or hair should tell us first.","Hair and skin respond differently to every treatment. We do everything we can to reach the result we agreed, but no specific result is guaranteed. If something is not right, tell us within 7 days and we will look at it in the chair and, where reasonable, correct it free of charge; refunds for services already carried out are at our discretion.","Guests under 18 are welcome with a parent or guardian’s consent, and under 16 accompanied. Please keep an eye on your belongings — we are not responsible for items left in the studio.","We photograph our work. If you would rather not appear, say so at booking or on the day and we won't. Photos we take with your yes may appear on our site and social channels; you can withdraw that yes at any time and we will take the photo down.","We may decline or end a service if a guest is unwell, under the influence, or unkind to our team. You'd expect nothing less for yourself."]},{"h":"Liability & the law","p":["Our responsibility to you for any booking, order or gift card is limited to the amount you paid for it. We are not liable for reactions or outcomes caused by information we were not given, for products used other than as directed, or for delays and failures outside our control — power cuts, courier problems, network or payment-provider outages, weather, unrest and the like.","These terms are governed by the laws of Lebanon; any dispute we cannot settle between us goes to the courts of Tripoli. If part of these terms turns out to be unenforceable, the rest still applies.","We may update these terms; the date at the top tells you when. Bookings and orders already placed follow the terms in force when they were made."]},{"h":"Questions","p":["Write to hi@incensostudio.com or message us on WhatsApp. Incenso Studio, 32 Dam & Farz, Tripoli, Lebanon."]}]},"shipping":{"updated":"17 September 2026","sections":[{"h":"Studio pickup","p":["Free. Choose pickup at checkout and we message you on WhatsApp the moment your order is ready. Orders paid at the studio are held for 3 days from placing, then cancelled and the items released; prepaid orders wait for you — usually the same day, within opening hours. Bring your order number.","Pay at pickup (cash or card), or ahead online. Prepaid orders are kept for 30 days; after that we message you, and if we still can’t reach you the order is refunded the same way you paid."]},{"h":"Courier delivery","p":["Flat $5 anywhere in Lebanon, added to your total at checkout. Orders go out the next working day and usually arrive within 1–3 days; Beirut and Tripoli are typically next-day.","Pay ahead by card, Whish Money or OMT Pay, or cash on delivery to the courier. Delivery times are estimates — the courier is a separate company and holidays, weather or road closures can add a day; we will keep you posted. Please make sure someone can receive the order at the address and number you give: if a delivery fails because of a wrong address or no answer, the courier tries once more, after which the order comes back to the studio and a second delivery is charged at the same flat rate. Responsibility for the goods passes to you when the courier hands them over. You'll get a status update at each step — placed, preparing, with the courier, delivered — in your account and by WhatsApp."]},{"h":"Tracking & changes","p":["Every order has a page: open it from your account to see where it is. Need to change the address or switch to pickup? Message us on WhatsApp before it leaves — after that, the courier's on the road."]},{"h":"Damaged or wrong","p":["Check your order when it arrives. Message us within 7 days with a photo of the item and the packaging and we'll replace or refund it — the same way you paid, within 3–5 business days. Opened or used cosmetics can't be returned for change of mind, for hygiene. Unopened items in their original packaging can be exchanged or refunded within 14 days; return delivery is at your cost unless the item was wrong or damaged."]},{"h":"Outside Lebanon","p":["Not yet. If you're abroad and want something from the shelf, a gift card travels anywhere."]}]},"privacy":{"updated":"17 September 2026","sections":[{"h":"What we collect","p":["Your phone number — that's how you sign in, with a one-time code, no password. Your name and, if you give it, an e-mail address and a profile photo. Your bookings, orders and gift cards. The preferences you tell us for the chair: quiet or chatty, allergies, sensitivities, smoking, photo consent."]},{"h":"Why","p":["To hold your chair, remind you the day before, tell you when an order is ready, and remember how you like things so you don't have to repeat yourself. Your visit and purchase history sets your member level and its discount."]},{"h":"Messages","p":["Every action on your account — a booking, a change or cancellation, an order and its progress, a gift card — is confirmed to you by WhatsApp. You also get a WhatsApp code to sign in and a reminder before each appointment. If you subscribed to studio news you can stop it any time by replying STOP or messaging us. We don't send marketing to numbers that only booked."]},{"h":"What we never do","p":["Sell or rent your details. Share your preferences, allergies or health notes with anyone outside the team who looks after you. Post a photo of you without a yes.","Payment details are handled by the card processor, Whish or OMT — we never see or store your card number."]},{"h":"Who else sees it","p":["A few services run parts of this for us and see only what they need: our booking and shop platform (hosting the site and your account), WhatsApp for messages, and the payment providers for payments. They act on our instructions and may not use your details for anything else. We share information with authorities only when the law requires it.","The site keeps a small amount of data on your device — your sign-in, your cart and a booking draft — so you can pick up where you left off. Nothing is used to track you across other sites."]},{"h":"How long we keep it","p":["Your account and history stay while your account is open. Booking and order records are kept for as long as accounting and tax rules require after each visit or purchase, then deleted. Health notes you give us for the chair are kept only while you have an account. Studio-news subscriptions end the moment you unsubscribe.","We keep your details safe with access limited to the team who look after you. No system is perfect; if something ever goes wrong with your data we will tell you and the relevant authority without delay."]},{"h":"Your control","p":["Everything we hold is visible in your account. Update your name, e-mail or photo there. To delete your account and history, message us on WhatsApp or write to hi@incensostudio.com — it's gone within 30 days, except records we must keep by law. You can also ask us for a copy of what we hold, or to correct it.","The studio is for guests 16 and over unless accompanied; we do not knowingly hold accounts for children under 16. We may update this notice; the date at the top tells you when."]}]}},
  };
  // ---- permissions: modules a person can open + actions they may take. Presets are starting points; each user carries their own copy. ----
  const MODULES = ['home', 'today', 'bookings', 'clients', 'orders', 'gifts', 'products', 'supply', 'money', 'staff', 'services', 'messages', 'settings'];
  const FLAGS = { ownOnly: 'Only their own chair', settle: 'Settle visits & take payments', refunds: 'Cancel, refund & release', prices: 'Change prices & stock', amounts: 'See money amounts', broadcast: 'Send messages to clients', access: 'Manage who can sign in' };
  const PRESETS = {
    owner: { label: 'Owner', desc: 'Everything — calendar, clients, sales, finances, reports, settings, and who can sign in.', modules: MODULES.slice(), flags: { ownOnly: false, settle: true, refunds: true, prices: true, amounts: true, broadcast: true, access: true } },
    desk: { label: 'Reception', desc: 'Runs the desk — all chairs on the calendar, book and settle visits, take payments, clients, shop orders, gift cards, stock and messages. No finances, reports, refunds or settings.', modules: ['home', 'today', 'bookings', 'clients', 'orders', 'gifts', 'products', 'supply', 'messages'], flags: { ownOnly: false, settle: true, refunds: false, prices: false, amounts: true, broadcast: false, access: false } },
    stylist: { label: 'Stylist', desc: 'Their own chair only — today\u2019s bookings, client notes and preferences. No prices, payments or settings.', modules: ['home', 'today', 'bookings', 'clients'], flags: { ownOnly: true, settle: false, refunds: false, prices: false, amounts: false, broadcast: false, access: false } },
  };
  const mkUser = (phone, name, preset, staff) => ({ phone, name, role: preset, staff: staff || null, modules: PRESETS[preset].modules.slice(), flags: Object.assign({}, PRESETS[preset].flags), active: true, added: at(-200, 12) });
  const USERS = [
    mkUser('+961 71 930 290', 'Rana Haddad', 'owner'),
    mkUser('+961 3 111 222', 'Maya Khoury', 'desk'),
    ...BASE_STAFF.map((s) => mkUser(STAFF_EXTRA[s.name] ? STAFF_EXTRA[s.name].phone : '', s.name, 'stylist', s.name)),
  ];

  const SUPPLIERS = [
    { id: 'su1', name: 'L\u2019Oréal Professionnel Lebanon', contact: 'Rami', phone: '+961 3 900 112', email: 'orders@lorealpro.lb', terms: 'Net 30', brands: 'L\u2019Oréal Professionnel, Kérastase', lead: 5, notes: '' },
    { id: 'su2', name: 'Beauty Line Distribution', contact: 'Nada', phone: '+961 70 442 890', email: 'nada@beautyline.lb', terms: 'On delivery', brands: 'Olaplex, K18, Color Wow, Amika', lead: 3, notes: 'Min order $300' },
    { id: 'su3', name: 'Nail Supply Co.', contact: 'Karim', phone: '+961 76 210 334', email: '', terms: 'On delivery', brands: 'Gel-X, rubber base, tips', lead: 2, notes: '' },
    { id: 'su4', name: 'Incenso own label', contact: 'Home', phone: '', email: '', terms: '—', brands: 'Cuticle oil, candles', lead: 10, notes: 'Made to order in Tripoli' },
  ];
  const PURCHASES = [
    { id: 'PO0021', supplierId: 'su2', status: 'ordered', createdAt: at(-4, 11), expected: at(1, 12), items: [{ productId: 'p4', name: 'K18 Leave-in Molecular Repair Mask', qty: 6, cost: 41, received: 0 }, { productId: 'p8', name: 'Fable & Mane HoliRoots Oil', qty: 6, cost: 20, received: 0 }], notes: 'Rush — K18 is out.', by: 'Owner' },
    { id: 'PO0020', supplierId: 'su3', status: 'received', createdAt: at(-12, 10), expected: at(-9, 12), receivedAt: at(-9, 15), items: [{ productId: null, name: 'Gel-X tips · medium coffin (box)', qty: 4, cost: 18, received: 4 }, { productId: null, name: 'Rubber base 15ml', qty: 12, cost: 6, received: 12 }], notes: '', by: 'Owner' },
    { id: 'PO0019', supplierId: 'su1', status: 'partial', createdAt: at(-16, 9), expected: at(-11, 12), items: [{ productId: null, name: 'Majirel colour tubes (assorted)', qty: 40, cost: 7.5, received: 30 }, { productId: 'p6', name: 'Kérastase Elixir Ultime Oil', qty: 4, cost: 29, received: 4 }], notes: '10 tubes back-ordered.', by: 'Owner' },
    { id: 'PO0018', supplierId: 'su4', status: 'draft', createdAt: at(-1, 17), expected: null, items: [{ productId: 'p10', name: 'Incenso Studio Candle', qty: 12, cost: 16, received: 0 }], notes: 'Holiday batch', by: 'Reception' },
  ];
  // Backbar — professional supplies used in services (not sold). qty in units; low = alert level; cost per unit
  const SUPPLIES = [
    ['Majirel colour tubes (assorted)', "L'Oréal Professionnel", 'Hair', 'tube', 38, 20, 7.5, 'su1'], ['Oxydant 20 vol · 1L', "L'Oréal Professionnel", 'Hair', 'bottle', 4, 3, 9, 'su1'], ['Blond Studio lightener · 500g', "L'Oréal Professionnel", 'Hair', 'tub', 2, 2, 28, 'su1'],
    ['Olaplex No.1 backbar · 525ml', 'Olaplex', 'Hair', 'bottle', 1, 1, 96, 'su2'], ['Foils · roll', 'Framar', 'Hair', 'roll', 6, 3, 11, 'su4'], ['Keratin treatment · 1L', 'Cocochoco', 'Hair', 'bottle', 1, 1, 120, 'su4'],
    ['Gel-X tips · medium coffin (box)', 'Aprés', 'Nails', 'box', 3, 2, 22, 'su3'], ['Builder gel · clear 30g', 'Aprés', 'Nails', 'jar', 2, 2, 24, 'su3'], ['Gel polish (assorted colours)', 'OPI', 'Nails', 'bottle', 41, 25, 9, 'su3'], ['Acetone · 1L', 'Generic', 'Nails', 'bottle', 5, 3, 4, 'su3'], ['Nail files 180/240 (pack of 50)', 'Generic', 'Nails', 'pack', 1, 1, 14, 'su3'],
    ['Lash extensions · 0.07 mixed tray', 'Borboleta', 'Brows & Lashes', 'tray', 4, 3, 26, 'su4'], ['Lash adhesive · 5ml', 'Borboleta', 'Brows & Lashes', 'bottle', 2, 2, 30, 'su4'], ['Brow tint · dark brown', 'RefectoCil', 'Brows & Lashes', 'tube', 0, 2, 12, 'su4'], ['Brow lamination kit', 'InLei', 'Brows & Lashes', 'kit', 3, 2, 45, 'su4'],
    ['Disposable towels (pack of 50)', 'Generic', 'General', 'pack', 2, 3, 9, 'su4'], ['Gloves · nitrile M (box of 100)', 'Generic', 'General', 'box', 3, 2, 8, 'su4'], ['Barbicide · 1.9L', 'Barbicide', 'General', 'bottle', 1, 1, 32, 'su4'],
    ['Foundation palette · pro', 'MAC Pro', 'Make-up', 'palette', 1, 1, 180, 'su4'], ['Disposable mascara wands (pack of 100)', 'Generic', 'Make-up', 'pack', 2, 2, 6, 'su4'], ['Setting spray · 200ml', 'Urban Decay', 'Make-up', 'bottle', 1, 2, 34, 'su4'], ['Lashes · strip (pair)', 'Ardell', 'Make-up', 'pair', 14, 10, 4, 'su4'],
  ].map((s, i) => ({ id: 'sp' + (i + 1), name: s[0], brand: s[1], cat: s[2], unit: s[3], qty: s[4], low: s[5], cost: s[6], supplierId: s[7], lastIn: at(-(7 + i * 3), 11), log: [] }));
  PURCHASES.forEach((po) => po.items.forEach((i) => { if (!i.productId && !i.supplyId) { const sp = SUPPLIES.find((s) => s.name === i.name); if (sp) i.supplyId = sp.id; } }));
  const seed = () => ({ v: 14, income: [], supplies: SUPPLIES, staff: BASE_STAFF.map((s) => Object.assign({ active: true, timeOff: [] }, s, STAFF_EXTRA[s.name] || {})), services: SERVICES, clients: CLIENTS, bookings: seedBookings(), orders: ORDERS, gifts: GIFTS, products: PRODUCTS, expenses: EXPENSES, messages: MESSAGES, settings: SETTINGS, users: USERS, blocks: [{ id: 'bl1', staff: 'Hala', start: at(0, 15), mins: 60, label: 'Lunch' }], payouts: [], closes: [], newsletter: CLIENTS.filter((c) => c.newsletter).map((c) => ({ phone: c.phone, name: c.name, at: c.since })).concat([{ phone: '+961 3 555 010', name: '', at: at(-3, 19) }, { phone: '+961 70 909 121', name: '', at: at(-1, 21) }]), pcats: PCATS, catMeta: {}, suppliers: SUPPLIERS, purchases: PURCHASES, shifts: {}, counters: { BK: bkN + 240, OR: orN + 118, GF: gfN + 30, PO: 21 }, audit: [] });

  // Blank mode: catalog (staff, services, products, settings, users) kept; every transaction (bookings, clients, orders, gifts, money, messages) empty — for real testing from zero
  const BLANK = 'incenso-mgmt-blank';
  const isBlank = () => { try { return localStorage.getItem(BLANK) === '1'; } catch (e) { return false; } };
  const blank = () => { const s = seed(); Object.assign(s, { clients: [], bookings: [], orders: [], gifts: [], expenses: [], messages: [], blocks: [], payouts: [], closes: [], newsletter: [], purchases: [], audit: [], counters: { BK: 1000, OR: 1000, GF: 1000, PO: 1 } }); s.products.forEach((p) => { p.sold30 = 0; p.restocks = 0; }); s.blank = true; return s; };
  // ============================================================
  //  STORE  — Supabase-backed when signed in; localStorage seed for the
  //  offline design preview. The public surface (IncensoMgmt.db + save() +
  //  helpers) is unchanged; only the source of truth swaps.
  //  The customer website is the source of truth: shared tables (bookings,
  //  orders, gift_cards, profiles) are read/written in the SITE's vocabulary
  //  (status labels, pay labels, staff-as-string, settled-via-final); the
  //  desk keeps its richer state in additive columns so the site is untouched.
  // ============================================================
  const SB = window.SB;
  const online = !!SB;
  const listeners = new Set();
  const notify = (what) => listeners.forEach((f) => f(what));
  const uuid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now() + Math.random().toString(16).slice(2));
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const digitsP = (p) => String(p || '').replace(/\D/g, '');

  let db;
  if (online) {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!db || db.online !== true) { db = blank(); db.online = true; db.blank = false; }
  } else {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (isBlank() && (!db || !db.blank)) db = blank();
    if (!db || db.v !== 14 || (db.staff && db.staff[0] && db.staff[0].accent !== BASE_STAFF[0].accent) || !db.bookings || (!db.blank && (!db.bookings.length || !db.bookings.some((b) => lkey(b.start) === lkey(at(0, 0)))))) db = isBlank() ? blank() : seed();
  }
  if (db && !db.income) db.income = [];

  const cache = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  const log = (action, ref, by) => { db.audit.unshift({ id: 'a' + Date.now() + Math.floor(Math.random() * 1e4), at: new Date().toISOString(), action, ref, by, _new: true }); if (db.audit.length > 200) db.audit.length = 200; };
  const nextRef = (kind) => kind + pad(++db.counters[kind]);

  // ---------------- field mapping (app <-> DB) ----------------
  const PAY_LBL = { card: 'Paid by card', whish: 'Whish Money', omt: 'OMT Pay', cash: 'Pay at studio', cod: 'Cash on delivery', gift: 'Gift balance' };
  const payCode = (l) => { const s = String(l == null ? '' : l).toLowerCase(); if (s.includes('card')) return 'card'; if (s.includes('whish')) return 'whish'; if (s.includes('omt')) return 'omt'; if (s.includes('on delivery') || s === 'cod') return 'cod'; if (s.includes('gift')) return 'gift'; if (s.includes('studio') || s.includes('cash') || s === 'later') return 'cash'; return s || 'cash'; };
  const startFrom = (date, sm) => date ? new Date(new Date(date + 'T00:00:00').getTime() + (sm || 0) * 6e4).toISOString() : null;
  const hmOf = (isoS) => { const t = new Date(isoS); return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0'); };
  let profileIds = new Set(), clientIds = new Set();

  const deriveDesk = (r) => { const st = String(r.status || ''); if (/cancel/i.test(st)) return 'cancelled'; if (r.final && typeof r.final.total === 'number') return 'settled'; if (r.pay_status === 'pending' || /await/i.test(st)) return 'held'; return 'confirmed'; };
  const fromBk = (r) => ({ ref: r.ref, clientId: r.client_id || r.user_id || null, staff: r.staff_name || (typeof r.staff === 'string' ? r.staff : (r.staff && r.staff.name) || ''), services: (r.services || []).map((n, i) => ({ name: n, mins: (r.service_mins || [])[i] || 0, price: null })), start: r.start_min != null ? startFrom(r.date, r.start_min) : (r.date ? new Date(r.date + 'T' + (r.time || '12:00')).toISOString() : null), mins: r.mins, price: r.price, pay: payCode(r.pay), paid: r.paid || 0, due: r.due || 0, gift: r.gift && r.gift.amount ? r.gift.amount : 0, giftParts: (r.gift && r.gift.parts) || r.gift_parts || [], extra: (r.extra || []).map((e) => ({ amount: e.amount, pay: payCode(e.pay), status: e.status, deadline: e.deadline, placedAt: e.placedAt })), payStatus: r.pay_status, status: r.desk_status || deriveDesk(r), deadline: r.pay_deadline, final: r.final && typeof r.final.total === 'number' ? r.final.total : null, settleMethod: r.settle_method, tip: r.tip, discount: r.discount, gross: r.gross, level: r.level, settledAt: r.settled_at, arrivedAt: r.arrived_at, refund: r.refund || 0, refundSent: r.refund_sent, source: r.source || 'web', notes: r.notes, mood: r.mood, flags: r.flags || [], visit: r.visit, cat: r.cat, products: r.products || [], order: r.order_plan || null, placedAt: r.placed_at ? new Date(r.placed_at).getTime() : undefined, cancelReason: r.cancel_reason, completed: !!r.completed, created: r.created_at });
  const toBk = (b) => { const isProf = b.clientId && profileIds.has(b.clientId); const isCli = b.clientId && clientIds.has(b.clientId); return { ref: b.ref, user_id: isProf ? b.clientId : null, client_id: isCli ? b.clientId : (UUID.test(b.clientId || '') && !isProf ? b.clientId : null), services: (b.services || []).map((s) => s.name), service_mins: (b.services || []).map((s) => s.mins || 0), staff: b.staff || null, staff_name: b.staff || null, date: b.start ? lkey(b.start) : null, start_min: b.start ? (new Date(b.start).getHours() * 60 + new Date(b.start).getMinutes()) : null, time: b.start ? hmOf(b.start) : null, mins: b.mins || null, price: b.price || 0, pay: PAY_LBL[b.pay] || b.pay || null, paid: b.paid || 0, due: b.due || 0, refund: b.refund || 0, gift: b.gift ? { amount: b.gift, parts: b.giftParts || [] } : {}, extra: (b.extra || []).map((e) => ({ amount: e.amount, pay: PAY_LBL[e.pay] || e.pay, status: e.status, deadline: e.deadline, placedAt: e.placedAt })), status: /cancel/i.test(b.status || '') ? 'Cancelled' : (b.payStatus === 'pending' || b.status === 'held') ? 'Awaiting payment' : 'Upcoming', pay_status: b.payStatus || null, completed: b.status === 'settled' || !!b.completed, final: (b.final != null) ? { total: b.final, method: b.settleMethod, tip: b.tip, discount: b.discount, at: b.settledAt } : null, desk_status: b.status || null, source: b.source || null, settled_at: b.settledAt || null, settle_method: b.settleMethod || null, tip: b.tip || null, discount: b.discount || null, gross: b.gross || null, level: b.level || null, refund_sent: !!b.refundSent, arrived_at: b.arrivedAt || null, visit: b.visit || null, cat: b.cat || null, products: b.products || [], order_plan: b.order || null, notes: b.notes || null, mood: b.mood || null, flags: b.flags || [], pay_deadline: b.deadline || null, placed_at: b.placedAt ? new Date(b.placedAt).toISOString() : null, cancel_reason: b.cancelReason || null }; };

  const fromOr = (r) => ({ ref: r.ref, clientId: r.user_id || null, name: r.name, phone: r.phone, email: r.email, items: r.items || [], total: r.total, method: payCode(r.method || r.pay), status: r.status, payStatus: r.pay_status, fulfil: r.fulfil || ((r.address && (r.address.text || r.address.line1)) ? 'delivery' : 'pickup'), delivery: r.delivery || 0, address: (r.address && (r.address.text || r.address)) || '', discount: r.discount || 0, tier: r.tier, gift: (r.gift && r.gift.amount) ? r.gift : null, giftParts: (r.gift && r.gift.parts) || r.gift_parts || [], courier: r.courier || null, source: r.source || 'web', soldBy: r.sold_by, refund: r.refund || 0, refundSent: r.refund_sent, partial: r.partial, cardLink: r.card_link, placedAt: r.placed_at ? new Date(r.placed_at).getTime() : undefined, deadline: r.deadline || r.pay_deadline, cancelReason: r.cancel_reason, cancelledAt: r.cancelled_at, notes: r.notes, toPay: r.to_pay });
  const toOr = (o) => ({ ref: o.ref, user_id: (o.clientId && profileIds.has(o.clientId)) ? o.clientId : null, items: o.items || [], total: o.total || 0, method: o.method || null, pay: PAY_LBL[o.method] || o.pay || null, name: o.name || null, phone: o.phone || null, email: o.email || null, address: typeof o.address === 'string' ? { text: o.address } : (o.address || {}), status: o.status || 'placed', pay_status: o.payStatus || null, discount: o.discount || 0, tier: o.tier || null, gift: o.gift || null, gift_parts: o.giftParts || [], courier: o.courier || null, source: o.source || null, sold_by: o.soldBy || null, refund: o.refund || 0, refund_sent: !!o.refundSent, partial: !!o.partial, fulfil: o.fulfil || null, delivery: o.delivery || 0, card_link: o.cardLink || null, deadline: o.deadline || null, cancelled_at: o.cancelledAt || null, cancel_reason: o.cancelReason || null, notes: o.notes || null, to_pay: (o.toPay != null ? o.toPay : null), placed_at: o.placedAt ? new Date(o.placedAt).toISOString() : null });

  const fromGf = (r) => ({ code: r.code, amount: r.amount, balance: r.balance, buyerId: r.buyer_id, buyerName: r.buyer_name, buyerPhone: r.buyer_phone, from: r.from_name, to: r.to_name, toPhone: r.to_phone, message: r.msg, method: payCode(r.pay), status: r.status, hold: r.hold, createdAt: r.created_at, expiry: r.expires_at, deadline: r.deadline, redemptions: r.redemptions || [], uses: r.uses || r.redemptions || [], cancelReason: r.cancel_reason, soldBy: r.sold_by, color: r.color });
  const toGf = (g) => ({ code: g.code, amount: g.amount, balance: g.balance, buyer_id: (g.buyerId && profileIds.has(g.buyerId)) ? g.buyerId : null, buyer_name: g.buyerName || (g.buyerId && (db.clients.find((c) => c.id === g.buyerId) || {}).name) || null, buyer_phone: g.buyerPhone || null, from_name: g.from || null, to_name: g.to || null, to_phone: g.toPhone || null, msg: g.message || null, pay: PAY_LBL[g.method] || g.method || null, status: g.status || 'Reserved', hold: !!g.hold, confirmed: g.status !== 'Reserved', created_at: g.createdAt || new Date().toISOString(), expires_at: g.expiry || null, deadline: g.deadline || null, redemptions: g.uses || g.redemptions || [], uses: g.uses || [], cancel_reason: g.cancelReason || null, sold_by: g.soldBy || null, color: g.color || null });

  const fromProd = (r) => ({ id: r.id, name: r.name, brand: r.brand || '', price: r.price, cost: r.cost != null ? Number(r.cost) : Math.round((r.price || 0) * 0.55), stock: r.stock || 0, low: r.low || 0, restocks: 0, sold30: 0, active: r.active !== false, image: r.image_url || null, category: r.category || r.cat || 'Home', desc: r.descr || r.details || r.note || '', sku: r.sku || '' });
  const toProd = (p) => { if (!UUID.test(p.id || '')) p.id = uuid(); return { id: p.id, name: p.name, price: p.price || 0, cost: p.cost || 0, stock: p.stock || 0, low: p.low || 0, image_url: p.image || null, category: p.category || null, cat: p.category || null, descr: p.desc || null, sku: p.sku || null, active: p.active !== false }; };

  const fromStaff = (r) => ({ name: r.name, cats: r.cats || [], role: r.role, accent: r.accent, bio: r.bio || '', photo: r.photo_url || null, phone: r.phone || '', commission: r.commission != null ? Number(r.commission) : 0, days: r.days || [], start: r.start_hour != null ? Number(r.start_hour) : 10, end: r.end_hour != null ? Number(r.end_hour) : 19, timeOff: r.time_off || [], services: r.services || [], active: r.active !== false });
  const toStaff = (s) => ({ name: s.name, cats: s.cats || [], role: s.role || null, accent: s.accent || null, bio: s.bio || null, photo_url: s.photo || null, phone: s.phone || null, commission: s.commission || 0, days: s.days || [], start_hour: s.start != null ? s.start : null, end_hour: s.end != null ? s.end : null, time_off: s.timeOff || [], services: s.services || [], active: s.active !== false });

  const fromProfile = (p) => ({ id: p.id, name: p.name || '', phone: p.phone || '', email: p.email || '', birthday: p.birthday || '', tier: p.tier || 'Member', photo: p.photo_url || null, spend12: p.spend_12mo || 0, since: p.created_at, notes: (p.prefs && p.prefs.notes) || '', tags: (p.prefs && p.prefs.tags) || [], newsletter: (p.prefs && p.prefs.newsletter) || false, blocked: (p.prefs && p.prefs.blocked) || false, no_shows: (p.prefs && p.prefs.no_shows) || 0, prefs: p.prefs || null, _src: 'profile' });
  const fromClientRow = (c) => ({ id: c.id, name: c.name || '', phone: c.phone || '', email: c.email || '', birthday: c.birthday || '', tier: c.tier || 'Member', photo: c.photo_url || null, spend12: c.spend || 0, since: c.created_at, notes: c.notes || c.note || '', tags: c.tags || [], newsletter: c.newsletter || false, blocked: c.blocked || false, no_shows: c.no_shows || 0, instagram: c.instagram, tiktok: c.tiktok, lastVisit: c.last_visit, prefs: c.prefs || null, _src: 'client' });

  const fromSupplier = (r) => ({ id: r.id, name: r.name, contact: r.contact, phone: r.phone, email: r.email, brands: r.brands, terms: r.terms, lead: r.lead_days, notes: r.notes });
  const toSupplier = (s) => ({ id: s.id, name: s.name || null, contact: s.contact || null, phone: s.phone || null, email: s.email || null, brands: s.brands || null, terms: s.terms || null, lead_days: s.lead != null ? s.lead : null, notes: s.notes || null });
  const fromPO = (r) => ({ id: r.id, supplierId: r.supplier_id, status: r.status, createdAt: r.created_at, expected: r.expected, receivedAt: r.received_at, items: r.items || [], notes: r.notes, by: r.by, unpaid: r.unpaid, terms: r.terms, partAmt: r.part_amt, dueDays: r.due_days, dueBy: r.due_by, shortBy: r.short_by });
  const toPO = (p) => ({ id: p.id, supplier_id: p.supplierId || null, status: p.status || 'draft', created_at: p.createdAt || new Date().toISOString(), expected: p.expected || null, received_at: p.receivedAt || null, items: p.items || [], notes: p.notes || null, by: p.by || null, unpaid: !!p.unpaid, terms: p.terms || null, part_amt: p.partAmt != null ? p.partAmt : null, due_days: p.dueDays != null ? p.dueDays : null, due_by: p.dueBy || null, short_by: p.shortBy || null });
  const fromSupply = (r) => ({ id: r.id, name: r.name, brand: r.brand, cat: r.cat, unit: r.unit, qty: r.qty, low: r.low, cost: r.cost != null ? Number(r.cost) : 0, supplierId: r.supplier_id, lastIn: r.last_in, log: r.log || [] });
  const toSupply = (s) => ({ id: s.id, name: s.name || null, brand: s.brand || null, cat: s.cat || null, unit: s.unit || null, qty: s.qty || 0, low: s.low || 0, cost: s.cost || 0, supplier_id: s.supplierId || null, last_in: s.lastIn || null, log: s.log || [] });
  const fromExpense = (r) => ({ id: r.id, category: r.category, label: r.label, amount: Number(r.amount), date: r.date, method: r.method, planned: r.planned, due: r.due, fixedId: r.fixed_id, month: r.month, paidAt: r.paid_at, by: r.by });
  const toExpense = (e) => ({ id: e.id, category: e.category || null, label: e.label || null, amount: e.amount || 0, date: e.date || new Date().toISOString(), method: e.method || null, planned: !!e.planned, due: e.due || null, fixed_id: e.fixedId || null, month: e.month || null, paid_at: e.paidAt || null, by: e.by || null });
  const fromIncome = (r) => ({ id: r.id, label: r.label, amount: Number(r.amount), method: r.method, date: r.date });
  const toIncome = (i) => ({ id: i.id, label: i.label || null, amount: i.amount || 0, method: i.method || null, date: i.date || new Date().toISOString() });
  const fromPayout = (r) => ({ id: r.id, staff: r.staff, amount: Number(r.amount), at: r.at, note: r.note });
  const toPayout = (p) => ({ id: p.id, staff: p.staff || null, amount: p.amount || 0, at: p.at || new Date().toISOString(), note: p.note || null });
  const fromBlock = (r) => ({ id: r.id, staff: r.staff, start: r.start, mins: r.mins, label: r.label });
  const toBlock = (b) => ({ id: b.id, staff: b.staff || null, start: b.start || null, mins: b.mins || 0, label: b.label || null });
  const fromUser = (r) => ({ phone: r.phone, name: r.name, role: r.role, staff: r.staff, modules: r.modules || [], flags: r.flags || {}, active: r.active !== false, added: r.added, _id: r.id });

  // services ↔ web_services (id is bigint identity → new rows insert without id)
  const fromSvc = (r) => ({ id: String(r.id), cat: r.cat, group: r.grp, name: r.name, mins: r.mins, price: r.price, from: !!r.is_from, unit: r.unit || '', desc: r.descr || '', brands: r.brands || '', active: r.active !== false, sort: r.sort, _id: r.id });
  const toSvcRow = (s, i) => { const row = { cat: s.cat || null, grp: s.group || null, name: s.name || null, mins: s.mins || 0, price: (s.price == null ? null : s.price), is_from: !!s.from, unit: s.unit || null, descr: s.desc || null, brands: s.brands || null, sort: (s.sort != null ? s.sort : i), active: s.active !== false }; if (s._id != null) row.id = s._id; return row; };
  const svcKey = (s) => JSON.stringify([s._id, s.cat, s.group, s.name, s.mins, s.price, s.from, s.unit, s.desc, s.brands, s.active]);
  // finances/settings web_config keys the desk owns (studio + hours reach the live site via catalog.js)
  const CFG_KEYS = ['hours', 'closedDates', 'ticker', 'tickerOn', 'reviewsOn', 'tiers', 'holdDays', 'transferHours', 'payments', 'qr', 'shop', 'home', 'announcement', 'fixedCosts', 'openingBalance', 'payTo', 'transferHoursBy', 'music', 'musicOn'];
  let rawStudio = {};
  const settingsKeys = () => { const o = {}; CFG_KEYS.forEach((k) => { if (db.settings[k] !== undefined) o[k] = db.settings[k]; }); o.studio = { address: db.settings.address, city: db.settings.city, maps: db.settings.maps, wa: db.settings.wa, email: db.settings.email, instagram: db.settings.instagram, tiktok: db.settings.tiktok }; return o; };
  let svcSnap = '', catSnap = '', setSnap = '', galSnap = '', spcSnap = '', pgSnap = '';

  const err = (label, e) => { if (e) console.warn('[mgmt] ' + label, e.message || e); };
  const sel = async (t, cols) => { try { const { data, error } = await SB.from(t).select(cols || '*'); if (error) { err(t, error); return []; } return data || []; } catch (e) { err(t, e); return []; } };

  // ---------------- hydrate: pull everything into the app shapes ----------------
  let snap = {};
  const clientKey = (c) => JSON.stringify({ name: c.name, email: c.email, birthday: c.birthday, photo: c.photo, notes: c.notes, tags: c.tags, newsletter: c.newsletter, blocked: c.blocked, no_shows: c.no_shows, tier: c.tier, phone: c.phone, src: c._src });
  const snapshot = () => { const s = {}; Object.keys(SYNC).forEach((k) => { s[k] = {}; (db[k] || []).forEach((row) => { const key = SYNC[k].pk(row); if (key != null) s[k][key] = JSON.stringify(SYNC[k].to(row)); }); }); s.clients = {}; (db.clients || []).forEach((c) => { if (c.id != null) s.clients[c.id] = clientKey(c); }); snap = s; };

  const hydrate = async () => {
    if (!online) return;
    const [bk, od, gf, wp, ws, prof, cli, sup, po, sp, ex, inc, po2, bl, du, wl, nl, au, cfg, gal, spc, pg, rc] = await Promise.all([
      sel('bookings'), sel('orders'), sel('gift_cards'), sel('web_products'), sel('web_staff'),
      sel('profiles'), sel('clients'), sel('suppliers'), sel('purchase_orders'), sel('supplies'),
      sel('expenses'), sel('income'), sel('payouts'), sel('blocks'), sel('desk_users'),
      sel('wa_log'), sel('newsletter'), sel('audit'), sel('web_config'), sel('web_gallery'),
      sel('web_space'), sel('web_pages'), sel('ref_counters'),
    ]);
    const [shf, wsv, wcat] = await Promise.all([sel('shifts'), sel('web_services'), sel('web_categories')]);
    if (wsv.length) db.services = wsv.map(fromSvc);
    if (wcat.length) { db.catMeta = {}; wcat.forEach((c) => { db.catMeta[c.name] = { h1: c.h1, intro: c.intro, chairs: c.chairs, hero: c.hero_url || null }; }); }
    // clients = profiles ∪ clients, deduped by phone (profile identity wins)
    profileIds = new Set(prof.map((p) => p.id)); clientIds = new Set(cli.map((c) => c.id));
    const byPhone = {}; const clients = [];
    prof.map(fromProfile).forEach((c) => { const k = digitsP(c.phone); if (k) byPhone[k] = c; clients.push(c); });
    cli.map(fromClientRow).forEach((c) => { const k = digitsP(c.phone); if (k && byPhone[k]) { const p = byPhone[k]; ['notes', 'tags', 'birthday', 'email'].forEach((f) => { if (!p[f] || (Array.isArray(p[f]) && !p[f].length)) p[f] = c[f]; }); if (c.no_shows > (p.no_shows || 0)) p.no_shows = c.no_shows; return; } clients.push(c); if (k) byPhone[k] = c; });
    db.clients = clients;
    db.bookings = bk.map(fromBk);
    db.orders = od.map(fromOr);
    db.gifts = gf.map(fromGf);
    db.products = wp.length ? wp.map(fromProd) : db.products;
    db.staff = ws.length ? ws.map(fromStaff) : db.staff;
    db.suppliers = sup.map(fromSupplier);
    db.purchases = po.map(fromPO);
    db.supplies = sp.map(fromSupply);
    db.expenses = ex.map(fromExpense);
    db.income = inc.map(fromIncome);
    db.payouts = po2.map(fromPayout);
    db.blocks = bl.map(fromBlock);
    db.users = du.filter((u) => u.phone).map(fromUser);
    db.messages = wl.map((r) => ({ id: r.id, at: r.created_at, ref: r.ref, template: r.template || r.kind, to: r.phone, name: (clients.find((c) => digitsP(c.phone) === digitsP(r.phone)) || {}).name || '', status: 'delivered', from: 'studio' }));
    db.newsletter = nl.map((r) => ({ phone: r.phone, name: (clients.find((c) => digitsP(c.phone) === digitsP(r.phone)) || {}).name || '', at: r.created_at }));
    db.audit = au.map((r) => ({ id: r.id, at: r.at, action: r.action, ref: r.ref, by: r.by })).sort((a, b) => a.at < b.at ? 1 : -1).slice(0, 200);
    // shifts nested
    const S = {}; shf.forEach((r) => { S[r.staff] = S[r.staff] || {}; S[r.staff][r.date] = r.off ? { off: true, label: r.label || 'Off' } : { off: false, start: r.start_hour != null ? Number(r.start_hour) : undefined, end: r.end_hour != null ? Number(r.end_hour) : undefined, label: r.label || 'Shift' }; }); db.shifts = S;
    // settings: merge known web_config keys over the seed defaults (read-only for now)
    const cmap = {}; cfg.forEach((r) => { cmap[r.key] = r.value; });
    rawStudio = cmap.studio || {};
    ['hours', 'closedDates', 'ticker', 'tickerOn', 'reviewsOn', 'tiers', 'holdDays', 'transferHours', 'payments', 'qr', 'shop', 'home', 'announcement', 'fixedCosts', 'openingBalance', 'payTo', 'transferHoursBy', 'music', 'musicOn'].forEach((k) => { if (cmap[k] !== undefined) db.settings[k] = cmap[k]; });
    if (cmap.studio) { const st = cmap.studio; ['address', 'city', 'maps', 'wa', 'email', 'instagram', 'tiktok'].forEach((k) => { if (st[k] !== undefined) db.settings[k] = st[k]; }); }
    if (gal.length) db.settings.gallery = gal.map((g) => ({ id: g.id, image: g.image_url, caption: g.caption, cat: g.category }));
    if (spc.length) db.settings.space = spc.map((s) => ({ id: s.id, image: s.image_url, caption: s.caption }));
    if (pg.length) { db.settings.legal = db.settings.legal || {}; pg.forEach((p) => { db.settings.legal[p.key] = p.body; }); }
    // counters from ref_counters (so desk refs continue the site series)
    const cc = {}; rc.forEach((r) => { cc[r.prefix] = Number(r.n) || 0; }); db.counters = Object.assign({ BK: 0, OR: 0, GF: 0, PO: 0 }, cc);
    db.blank = false; db.online = true;
    svcSnap = JSON.stringify((db.services || []).map(svcKey)); catSnap = JSON.stringify(db.catMeta || {}); setSnap = JSON.stringify(settingsKeys());
    svcIds = new Set((db.services || []).map((s) => s._id).filter((x) => x != null));
    galSnap = JSON.stringify(db.settings.gallery || []); spcSnap = JSON.stringify(db.settings.space || []); pgSnap = JSON.stringify(db.settings.legal || {});
    snapshot(); cache(); notify('hydrate');
  };

  // ---------------- write-back: snapshot-diff upsert (only rows the desk touched) ----------------
  const SYNC = {
    bookings:  { table: 'bookings',        pk: (r) => r.ref,  to: toBk,      keyCol: 'ref' },
    orders:    { table: 'orders',          pk: (r) => r.ref,  to: toOr,      keyCol: 'ref' },
    gifts:     { table: 'gift_cards',      pk: (r) => r.code, to: toGf,      keyCol: 'code' },
    products:  { table: 'web_products',    pk: (r) => r.id,   to: toProd,    keyCol: 'id' },
    suppliers: { table: 'suppliers',       pk: (r) => r.id,   to: toSupplier,keyCol: 'id' },
    purchases: { table: 'purchase_orders', pk: (r) => r.id,   to: toPO,      keyCol: 'id' },
    supplies:  { table: 'supplies',        pk: (r) => r.id,   to: toSupply,  keyCol: 'id' },
    expenses:  { table: 'expenses',        pk: (r) => r.id,   to: toExpense, keyCol: 'id' },
    income:    { table: 'income',          pk: (r) => r.id,   to: toIncome,  keyCol: 'id' },
    payouts:   { table: 'payouts',         pk: (r) => r.id,   to: toPayout,  keyCol: 'id' },
    blocks:    { table: 'blocks',          pk: (r) => r.id,   to: toBlock,   keyCol: 'id' },
    staff:     { table: 'web_staff',       pk: (r) => r.name, to: toStaff,   keyCol: 'name' },
  };

  let syncing = false, pending = false;
  const syncUp = async () => {
    if (!online) return;
    if (syncing) { pending = true; return; }
    syncing = true;
    try {
      for (const k of Object.keys(SYNC)) {
        const cfgv = SYNC[k]; const cur = {}; const ups = [];
        (db[k] || []).forEach((row) => { const id = cfgv.pk(row); if (id == null) return; const mapped = cfgv.to(row); const js = JSON.stringify(mapped); cur[cfgv.pk(row)] = js; if (snap[k] && snap[k][cfgv.pk(row)] === js) return; ups.push(mapped); });
        // deletions: keys present in snapshot, gone now
        const dels = Object.keys(snap[k] || {}).filter((id) => !(id in cur));
        if (ups.length) { const { error } = await SB.from(cfgv.table).upsert(ups, { onConflict: cfgv.keyCol }); err('upsert ' + cfgv.table, error); }
        if (dels.length) { const { error } = await SB.from(cfgv.table).delete().in(cfgv.keyCol, dels); err('delete ' + cfgv.table, error); }
      }
      // clients (routed by source), shifts, desk_users, audit, services, categories,
      // settings and site content — handled explicitly
      await syncClients(); await syncShifts(); await syncUsers(); await syncAudit();
      await syncServices(); await syncCategories(); await syncSettings(); await syncContent();
      snapshot();
      // keep the site ref series ahead of the desk counters (best-effort)
      for (const p of ['BK', 'OR', 'GF', 'PO']) { const n = db.counters[p]; if (n) { try { await SB.rpc('bump_ref', { p_prefix: p, p_to: n }); } catch (e) {} } }
    } catch (e) { err('syncUp', e); }
    syncing = false;
    if (pending) { pending = false; syncUp(); }
  };

  const syncClients = async () => {
    const profs = [], cliRows = [];
    const cs = (snap.clients || {});
    (db.clients || []).forEach((c) => {
      if (cs[c.id] !== undefined && cs[c.id] === clientKey(c)) return;   // unchanged since hydrate — never clobber a site-side edit
      if (c._src === 'profile' && profileIds.has(c.id)) {
        profs.push({ id: c.id, name: c.name || null, email: c.email || null, birthday: c.birthday || null, photo_url: c.photo || null, prefs: Object.assign({}, c.prefs || {}, { notes: c.notes || '', tags: c.tags || [], newsletter: !!c.newsletter, blocked: !!c.blocked, no_shows: c.no_shows || 0 }) });
      } else {
        if (!UUID.test(c.id || '')) c.id = uuid(); c._src = 'client'; clientIds.add(c.id);
        cliRows.push({ id: c.id, name: c.name || null, phone: c.phone || null, email: c.email || null, birthday: c.birthday || null, tier: c.tier || null, tags: c.tags || [], newsletter: !!c.newsletter, blocked: !!c.blocked, photo_url: c.photo || null, no_shows: c.no_shows || 0, notes: c.notes || null, note: c.notes || null, instagram: c.instagram || null, tiktok: c.tiktok || null, prefs: c.prefs || null });
      }
    });
    if (profs.length) { const { error } = await SB.from('profiles').upsert(profs, { onConflict: 'id' }); err('profiles', error); }
    if (cliRows.length) { const { error } = await SB.from('clients').upsert(cliRows, { onConflict: 'id' }); err('clients', error); }
  };
  const syncShifts = async () => {
    const rows = []; const S = db.shifts || {};
    Object.keys(S).forEach((staff) => Object.keys(S[staff]).forEach((date) => { const v = S[staff][date]; rows.push({ staff, date, off: !!v.off, start_hour: v.start != null ? v.start : null, end_hour: v.end != null ? v.end : null, label: v.label || null }); }));
    if (rows.length) { const { error } = await SB.from('shifts').upsert(rows, { onConflict: 'staff,date' }); err('shifts', error); }
  };
  const syncUsers = async () => {
    for (const u of (db.users || [])) {
      const row = { phone: u.phone, name: u.name || null, role: u.role || 'desk', staff: u.staff || null, modules: u.modules || [], flags: u.flags || {}, active: u.active !== false };
      if (u._id) { const { error } = await SB.from('desk_users').update(row).eq('id', u._id); err('desk_users upd', error); }
      else { const { data, error } = await SB.from('desk_users').insert(row).select('id').maybeSingle(); err('desk_users ins', error); if (data) u._id = data.id; }
    }
  };
  const syncAudit = async () => {
    const neu = (db.audit || []).filter((a) => a._new);
    if (!neu.length) return;
    const rows = neu.map((a) => ({ at: a.at, action: a.action, ref: a.ref || null, by: a.by || null }));
    const { error } = await SB.from('audit').insert(rows); err('audit', error);
    if (!error) neu.forEach((a) => { delete a._new; });
  };
  // services → web_services (bigint identity: existing rows upsert by id, new rows insert then adopt the id)
  let svcIds = new Set();
  const syncServices = async () => {
    const now = JSON.stringify((db.services || []).map(svcKey)); if (now === svcSnap) return;
    const withId = [], neu = [], ids = new Set();
    (db.services || []).forEach((s, i) => { if (s._id != null) { ids.add(s._id); withId.push(toSvcRow(s, i)); } else neu.push(s); });
    if (withId.length) { const { error } = await SB.from('web_services').upsert(withId, { onConflict: 'id' }); err('web_services', error); }
    for (const s of neu) { const { data, error } = await SB.from('web_services').insert(toSvcRow(s, 999)).select('id').maybeSingle(); err('web_services ins', error); if (data && data.id != null) { s._id = data.id; s.id = String(data.id); ids.add(data.id); } }
    const dels = [...svcIds].filter((id) => !ids.has(id)); if (dels.length) { const { error } = await SB.from('web_services').delete().in('id', dels); err('web_services del', error); }
    svcIds = ids; svcSnap = JSON.stringify((db.services || []).map(svcKey));
  };
  const slugify = (s) => '/' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const syncCategories = async () => {
    const now = JSON.stringify(db.catMeta || {}); if (now === catSnap) return;
    for (const name of Object.keys(db.catMeta || {})) { const m = db.catMeta[name];
      const patch = { h1: m.h1 || null, intro: m.intro || null, chairs: m.chairs || null, hero_url: m.hero || null };
      const { data, error } = await SB.from('web_categories').update(patch).eq('name', name).select('name'); err('web_categories upd', error);
      if (!error && (!data || !data.length)) { const { error: e2 } = await SB.from('web_categories').insert(Object.assign({ name, file: slugify(name), ar: '', sort: 99, active: true }, patch)); err('web_categories ins', e2); }
    }
    catSnap = now;
  };
  const syncSettings = async () => {
    const now = JSON.stringify(settingsKeys()); if (now === setSnap) return;
    const rows = []; CFG_KEYS.forEach((k) => { if (db.settings[k] !== undefined) rows.push({ key: k, value: db.settings[k] }); });
    // studio: merge over whatever the site already stores (e.g. reviews_uri) so nothing is lost
    const studio = Object.assign({}, rawStudio); ['address', 'city', 'maps', 'wa', 'email', 'instagram', 'tiktok'].forEach((k) => { if (db.settings[k] !== undefined) studio[k] = db.settings[k]; });
    rows.push({ key: 'studio', value: studio }); rawStudio = studio;
    const { error } = await SB.from('web_config').upsert(rows, { onConflict: 'key' }); err('web_config', error);
    if (!error) setSnap = now;
  };
  // Our Work / The Space / legal pages — persisted as records (the live site renders these
  // statically today, so this is the studio's own copy, not a site change).
  const syncContent = async () => {
    const g = JSON.stringify(db.settings.gallery || []); if (g !== galSnap) { const rows = (db.settings.gallery || []).map((x, i) => ({ id: x.id || uuid(), image_url: x.image || null, caption: x.caption || null, category: x.cat || null, sort: i, active: true })); if (rows.length) { const { error } = await SB.from('web_gallery').upsert(rows, { onConflict: 'id' }); err('web_gallery', error); if (!error) galSnap = g; } else galSnap = g; }
    const s = JSON.stringify(db.settings.space || []); if (s !== spcSnap) { const rows = (db.settings.space || []).map((x, i) => ({ id: x.id || uuid(), image_url: x.image || null, caption: x.caption || null, sort: i })); if (rows.length) { const { error } = await SB.from('web_space').upsert(rows, { onConflict: 'id' }); err('web_space', error); if (!error) spcSnap = s; } else spcSnap = s; }
    const p = JSON.stringify(db.settings.legal || {}); if (p !== pgSnap) { const L = db.settings.legal || {}; const rows = Object.keys(L).map((k) => ({ key: k, title: k, body: typeof L[k] === 'string' ? L[k] : JSON.stringify(L[k]), updated_at: new Date().toISOString() })); if (rows.length) { const { error } = await SB.from('web_pages').upsert(rows, { onConflict: 'key' }); err('web_pages', error); if (!error) pgSnap = p; } else pgSnap = p; }
  };

  let saveT = null;
  const save = (what) => { cache(); notify(what); if (online) { clearTimeout(saveT); saveT = setTimeout(syncUp, 500); } };
  const reset = (mode) => {
    if (online) { hydrate(); return; }   // never wipe the server from the desk; just re-pull
    try { if (mode === 'blank') localStorage.setItem(BLANK, '1'); else localStorage.removeItem(BLANK); } catch (e) {}
    db = mode === 'blank' ? blank() : seed(); cache(); notify('reset');
  };
  const clear = () => { db = online ? (function () { const b = blank(); b.online = true; b.blank = false; return b; })() : blank(); try { localStorage.removeItem(KEY); } catch (e) {} snap = {}; notify('reset'); };

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
  const tierObj = (amount) => { let t = db.settings.tiers[0]; db.settings.tiers.forEach((x) => { if (amount >= x.min) t = x; }); return t; };
  const tierFor = (amount) => tierObj(amount).name;
  // Level discount for a client (website rule: Insider 10%, Loyal 20%)
  const discountFor = (cid) => { const t = tierObj(spend12(cid)); return { rate: t.rate || 0, name: t.name }; };
  // One account per phone number — never create a second client with the same number
  const digits = (p) => String(p || '').replace(/\D/g, '');
  const clientByPhone = (phone) => { const p = digits(phone); return p ? db.clients.find((c) => digits(c.phone) === p) || null : null; };
  // ---- Website rules applied on load (same as checkout.html / account.html) ----
  // · pickup paid or paying cash → Ready for pickup at once
  // · Whish/OMT not received by the deadline (24h) → Cancelled, items released
  // · cash pickup not collected within 3 days → Cancelled
  // · held bookings (unpaid transfer) past deadline → released · reserved gift cards past deadline → Cancelled
  const sweep = () => { const now = Date.now(); let n = 0;
    db.orders.forEach((o) => { if (o.status === 'cancelled' || ['delivered', 'collected'].includes(o.status)) return; if (o.fulfil !== 'delivery' && o.status === 'placed' && o.payStatus !== 'pending') o.status = 'ready';
      if (o.payStatus === 'pending' && !o.cardLink && o.deadline && now > dt(o.deadline).getTime()) { o.status = 'cancelled'; o.cancelReason = 'We didn\u2019t receive your ' + (PAY_LABEL[o.method] || o.method) + ' transfer by the deadline, so this order was cancelled and the items released. Nothing was charged.'; o.cancelledAt = new Date(now).toISOString(); (o.items || []).forEach((i) => { const p = db.products.find((x) => x.id === i.productId); if (p) p.stock += i.qty; }); n++; return; }
      if (o.fulfil !== 'delivery' && o.payStatus === 'unpaid' && o.deadline && now > dt(o.deadline).getTime()) { o.status = 'cancelled'; o.cancelReason = 'Not collected within 3 days \u2014 the items went back on the shelf. Nothing was charged.'; o.cancelledAt = new Date(now).toISOString(); (o.items || []).forEach((i) => { const p = db.products.find((x) => x.id === i.productId); if (p) p.stock += i.qty; }); n++; } });
    db.bookings.forEach((b) => { if (b.status === 'held' && b.deadline && now > dt(b.deadline).getTime()) { b.status = 'cancelled'; b.cancelReason = 'Transfer not received in time \u2014 slot released.'; b.due = 0; n++; } });
    db.gifts.forEach((g) => { if (g.status === 'Reserved' && g.deadline && now > dt(g.deadline).getTime()) { g.status = 'Cancelled'; g.cancelReason = g.hold ? 'Not paid within 3 days.' : 'Transfer not received within 24 hours.'; n++; } });
    return n; };
  sweep();
  const upsertClient = (v) => { const ex = clientByPhone(v.phone); if (ex) { if (v.name && !ex.name) ex.name = v.name; if (v.email && !ex.email) ex.email = v.email; return ex; } const c = Object.assign({ id: 'c' + Date.now(), name: '', phone: '', email: '', birthday: '', tier: 'Member', notes: '', since: new Date().toISOString(), tags: ['New'], newsletter: false, blocked: false, photo: null, prefs: null }, v); db.clients.push(c); return c; };
  // One profile per number: client record = website account = dashboard person. setProfile writes name/email/birthday/photo everywhere that number appears (client, access entry, and the website account if it's the signed-in person).
  const setProfile = (phone, p, opts) => { const c = upsertClient({ phone, name: p.name || '' }); ['name', 'email', 'birthday', 'photo'].forEach((k) => { if (p[k] !== undefined) c[k] = p[k]; }); if (p.phone && digits(p.phone) !== digits(phone)) c.phone = p.phone; const np = c.phone; db.users.forEach((u) => { if (digits(u.phone) === digits(phone)) { u.phone = np; u.name = c.name; } }); const A = window.IncensoAuth; if (!(opts && opts.skipAuth) && A && A.signedIn && A.signedIn()) { const a = A.get(); if (a && digits(a.phone) === digits(phone)) A.set(Object.assign({}, a, { name: c.name, phone: np, email: c.email || '', birthday: c.birthday || '', photo: c.photo || a.photo || '' })); } return c; };
  // Pull the signed-in website account into its profile so edits made on the site show here
  const syncFromAuth = () => { const A = window.IncensoAuth; if (!(A && A.signedIn && A.signedIn())) return; const a = A.get(); if (!a || !a.phone) return; const c = clientByPhone(a.phone); if (!c && !db.users.some((u) => digits(u.phone) === digits(a.phone))) return; setProfile(a.phone, { name: a.name || (c && c.name) || '', email: a.email || (c && c.email) || '', birthday: a.birthday || (c && c.birthday) || '', photo: a.photo || (c && c.photo) || null }, { skipAuth: true }); };
  // Gift balance a client can spend (active cards bought by them or addressed to their number)
  const giftPool = (c) => db.gifts.filter((g) => g.status === 'Active' && g.balance > 0 && (g.buyerId === c.id || digits(g.toPhone) === digits(c.phone)));
  const giftBalance = (c) => giftPool(c).reduce((a, g) => a + g.balance, 0);
  const redeemGift = (c, amount, ref) => { let left = amount; const parts = []; giftPool(c).forEach((g) => { if (left <= 0) return; const r = Math.min(left, g.balance); g.balance -= r; left -= r; if (g.balance === 0) g.status = 'Used'; (g.uses = g.uses || []).push({ ref, amount: r, at: new Date().toISOString() }); parts.push({ code: g.code, amount: r }); }); return parts; };
  const refundGift = (parts, ref) => { (parts || []).forEach((p) => { const g = db.gifts.find((x) => x.code === p.code); if (!g) return; g.balance += p.amount; if (g.status === 'Used') g.status = 'Active'; (g.uses = g.uses || []).push({ ref, amount: -p.amount, at: new Date().toISOString() }); }); };
  // A visit = one client, one time, one or more chairs back to back (one booking row per chair segment, sharing 'visit')
  const visitOf = (b) => b.visit ? db.bookings.filter((x) => x.visit === b.visit).sort((a, c) => a.start < c.start ? -1 : 1) : [b];
  // Collapse segment rows into one visit each (first live chair leads): { lead, segs, live, ref, start, end, mins, staff[], services[], products[], total, status, payStatus }
  const visits = (list) => { const seen = new Set(); const out = []; (list || db.bookings).forEach((b) => { const k = b.visit || b.ref; if (seen.has(k)) return; seen.add(k); const segs = visitOf(b); const live = segs.filter((x) => !['cancelled', 'no-show'].includes(x.status)); const L = live.length ? live : segs; const lead = L[0]; const last = L[L.length - 1]; const st = !live.length ? (segs.some((x) => x.status === 'no-show') ? 'no-show' : 'cancelled') : L.every((x) => x.status === 'settled') ? 'settled' : L.some((x) => x.status === 'in-chair') ? 'in-chair' : L.some((x) => x.status === 'arrived') ? 'arrived' : L.some((x) => x.status === 'held') ? 'held' : 'confirmed'; const open = L.filter((x) => x.status !== 'settled'); const ps = !open.length ? 'paid' : open.every((x) => x.payStatus === 'paid' || x.payStatus === 'gift') ? 'paid' : open.some((x) => x.payStatus === 'pending') ? 'pending' : 'unpaid'; out.push({ lead, segs, live: L, ref: k, clientId: lead.clientId, source: lead.source, start: lead.start, end: new Date(dt(last.start).getTime() + last.mins * 6e4).toISOString(), mins: L.reduce((a, x) => a + x.mins, 0), staff: [...new Set(L.map((x) => x.staff))], services: L.flatMap((x) => x.services), products: L.flatMap((x) => x.products || []), total: L.reduce((a, x) => a + (x.final != null ? x.final : x.price + (x.extra || []).reduce((q, e) => q + e.amount, 0) + (x.products || []).reduce((q, p) => q + p.qty * p.price, 0)), 0), status: st, payStatus: ps, notes: lead.notes, arrivedAt: lead.arrivedAt, settledAt: lead.settledAt }); }); return out; };

  // Per-day studio hours. H.days[dow] = { open, close, closed } (hours as decimals); legacy open/closeWeek/closeWeekend/closedDays stay in sync for the site.
  const hoursOn = (dow) => { const H = db.settings.hours; const o = H.days && H.days[dow]; if (o) return { open: o.open, close: o.close, closed: !!o.closed }; return { open: H.open, close: (dow === 5 || dow === 6) ? H.closeWeekend : H.closeWeek, closed: H.closedDays.includes(dow) }; };
  const setHours = (dow, v) => { const H = db.settings.hours; H.days = H.days || {}; for (let i = 0; i < 7; i++) if (!H.days[i]) H.days[i] = hoursOn(i); H.days[dow] = { open: v.open, close: v.close, closed: !!v.closed }; const open = Object.values(H.days).filter((x) => !x.closed); H.open = open.length ? Math.min.apply(null, open.map((x) => x.open)) : H.open; H.closeWeek = H.days[1].closed ? H.closeWeek : H.days[1].close; H.closeWeekend = H.days[5].closed ? H.closeWeekend : H.days[5].close; H.closedDays = Object.keys(H.days).filter((k) => H.days[k].closed).map(Number); };
  // Special days: settings.closedDates = [{ date, label, closed (default true), open, close }] — a holiday closure or extra/shorter hours on one date
  const specialOn = (iso) => db.settings.closedDates.find((x) => x.date === lkey(iso)) || null;
  const hoursForDate = (iso) => { const sp = specialOn(iso); if (sp) { if (sp.closed !== false) return { open: 0, close: 0, closed: true, label: sp.label }; return { open: sp.open, close: sp.close, closed: false, label: sp.label }; } return hoursOn(new Date(iso).getDay()); };
  const isStudioClosed = (iso) => !!hoursForDate(iso).closed;
  const shiftFor = (staff, dateIso) => { const s = typeof staff === 'string' ? db.staff.find((x) => x.name === staff) : staff; if (!s) return null; const k = lkey(dateIso); const o = db.shifts && db.shifts[s.name] && db.shifts[s.name][k]; const dow = new Date(dateIso).getDay(); const tOff = (s.timeOff || []).some((t) => k >= t.from && k <= t.to); if (o) return o.off ? { off: true, label: o.label || 'Off' } : { off: false, start: o.start, end: o.end, label: o.label || 'Shift', override: true }; if (!s.active || tOff) return { off: true, label: tOff ? 'Time off' : 'Inactive' }; if (!s.days.includes(dow)) return { off: true, label: 'Day off' }; return { off: false, start: s.start, end: s.end, label: 'Regular' }; };
  // Backbar adjustments: delta<0 = used, >0 = received. Keeps a short log per item.
  const adjustSupply = (id, delta, note, who) => { const s = (db.supplies || []).find((x) => x.id === id); if (!s) return null; s.qty = Math.max(0, s.qty + delta); if (delta > 0) s.lastIn = new Date().toISOString(); s.log = (s.log || []); s.log.unshift({ at: new Date().toISOString(), delta, note: note || '', by: who || '' }); if (s.log.length > 30) s.log.length = 30; return s; };
  const setShift = (staff, dateIso, val) => { db.shifts = db.shifts || {}; db.shifts[staff] = db.shifts[staff] || {}; const k = lkey(dateIso); if (val == null) delete db.shifts[staff][k]; else db.shifts[staff][k] = val; };
  window.IncensoMgmt = { digits, hoursOn, isStudioClosed, setHours, specialOn, hoursForDate, accentFor, tierObj, discountFor, clientByPhone, upsertClient, setProfile, syncFromAuth, visits, sweep, adjustSupply, giftPool, giftBalance, redeemGift, refundGift, visitOf, shiftFor, setShift, get db() { return db; }, online, hydrate, clear, save, reset, log, nextRef, on: (f) => listeners.add(f), off: (f) => listeners.delete(f), money, fmtTime, fmtDay, fmtDate, fmtDT, isSameDay, dayKey, lkey, rel, until, at, T0, DAY, PAY_LABEL, client, staffOf, bookingPieces, spend12, tierFor, KEY, MODULES, FLAGS, PRESETS, mkUser, hm: (iso) => { const t = new Date(iso); return t.getHours() + t.getMinutes() / 60; } };
})();
