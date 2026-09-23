/* End-to-end sync tests for Incenso Studio.
   Each test boots a fresh strict fake database, opens the REAL management app and the REAL
   website in Chromium, performs a flow the way staff/customers do, then checks (1) the exact
   rows in the database and (2) what the other side actually shows.
   Run:  cd tests/e2e && npm install && node run.js            (WEBSITE_DIR=/path/to/website-repo)
         node run.js products gift                             (only tests whose name matches) */
const path = require('path');
const { setup, people } = require('./harness');
const seed = require('./seed');

const FIX = (n) => path.join(__dirname, 'fixtures', n);
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ---------- helpers ----------
class Fail extends Error {}
const expect = (cond, msg, detail) => { if (!cond) { const e = new Fail(msg + (detail !== undefined ? '\n        got: ' + JSON.stringify(detail).slice(0, 600) : '')); throw e; } };
const rows = (H, t) => H.fake.tables[t];
const noSaveErrors = async (H, page, what) => {
  const t = await H.toasts(page); const bad = t.filter((m) => /Couldn’t save|Not saved yet|Upload failed|Upload error|Couldn’t load/.test(m));
  expect(!bad.length, (what || 'desk') + ' showed a save error', bad);
  const errs = H.fake.errors().filter((e) => e.desk); expect(!errs.length, 'database rejected a desk write', errs.map((e) => e.method + ' ' + e.path + ' ' + e.error.code + ' ' + e.error.message));
};
const M = (page, fn, arg) => page.evaluate(fn, arg);          // run code inside the management app
const shopCards = async (page) => {
  await page.evaluate(() => window.IncensoProducts && IncensoProducts.ready);
  await page.waitForTimeout(400);
  return page.evaluate(() => [...document.querySelectorAll('#shelf article.product')].map((a) => ({
    name: a.querySelector('.p-name').textContent, price: a.querySelector('.p-price').textContent, note: a.querySelector('.p-note').textContent,
    cat: a.dataset.cat, label: a.querySelector('.p-cat').textContent, imgs: [...a.querySelectorAll('.frame img')].map((i) => i.getAttribute('src')),
  })));
};
const shopEmptyText = (page) => page.evaluate(() => (document.querySelector('#shelf .shelf-empty') || {}).textContent || '');
const catalog = async (page) => { await page.evaluate(() => window.IncensoCatalog && IncensoCatalog.ready); return page.evaluate(() => ({ services: IncensoCatalog.SERVICES, staff: IncensoCatalog.STAFF, hours: IncensoCatalog.HOURS })); };
const openSheetProduct = async (page, name) => { await page.goto(page.url().replace(/#.*$/, '') + '#/products'); await page.waitForTimeout(400); await page.locator('#view').getByText(name, { exact: true }).first().click(); await page.waitForSelector('.sheet form'); };

// ================================================================
//  PRODUCTS — the real Stock screen → database → website shop
// ================================================================
test('products: add with 3 photos in the Stock screen → saved → shows in the shop', async (H, P) => {
  const d = await H.desk(P.owner, 'products');
  await d.click('[data-new]'); await d.waitForSelector('.sheet form');
  const inputs = d.locator('.sheet input[type=file]');
  for (const [i, f] of ['red.jpg', 'green.jpg', 'blue.jpg'].entries()) { await inputs.nth(i).setInputFiles(FIX(f)); await d.waitForFunction((n) => (window.__toasts || []).filter((m) => /Photo (uploaded|added)|Upload/.test(m)).length >= n, i + 1, { timeout: 8000 }); }
  const up = await H.toasts(d); expect(up.filter((m) => m === 'Photo uploaded').length === 3, 'all three photos upload to storage', up);
  await d.fill('.sheet [name=name]', 'Test Hair Oil'); await d.selectOption('.sheet [name=category]', 'Nails');
  await d.fill('.sheet [name=note]', 'Three drops, ends first.'); await d.fill('.sheet [name=price]', '28'); await d.fill('.sheet [name=stock]', '5');
  await d.fill('.sheet [name=desc]', 'Cold-pressed jojoba with bergamot.');
  await d.click('.sheet [data-o]'); await H.settle(d);
  await noSaveErrors(H, d);
  const r = rows(H, 'web_products'); expect(r.length === 1, 'exactly one product row', r.map((x) => x.name));
  const p = r[0];
  expect(p.name === 'Test Hair Oil' && p.price === 28 && p.stock === 5, 'name/price/stock saved', p);
  expect(p.cat === 'nails' && p.category === 'Nails', 'category saved in the website vocabulary (cat=nails)', { cat: p.cat, category: p.category });
  expect(p.note === 'Three drops, ends first.' && p.details === 'Cold-pressed jojoba with bergamot.', 'one-liner + description saved', { note: p.note, details: p.details });
  expect(Array.isArray(p.images) && p.images.length === 3 && p.images.every((u) => /^http/.test(u) && !/^data:/.test(u)), '3 photos stored as uploaded URLs (not inline data)', p.images);
  expect(p.image_url === p.images[0] && p.active === true, 'main photo + visible', { image_url: p.image_url, active: p.active });
  expect(Object.keys(H.fake.objects).length === 3, 'three files in the studio storage bucket', Object.keys(H.fake.objects));
  const w = await H.open('web', 'shop.html', null); const cards = await shopCards(w);
  expect(cards.length === 1 && cards[0].name === 'Test Hair Oil' && cards[0].price === '$28', 'customer sees the product and price', cards);
  expect(cards[0].note === 'Three drops, ends first.' && cards[0].cat === 'nails' && /nail/i.test(cards[0].label), 'customer sees note + category', cards[0]);
  expect(cards[0].imgs.length === 3 && cards[0].imgs.every((s, i) => s === p.images[i]), 'customer sees all 3 photos in order', cards[0].imgs);
});

test('products: edit price/description/photo and delete in the Stock screen → shop follows', async (H, P) => {
  H.fake.seed('web_products', [{ name: 'Studio Candle', price: 30, stock: 4, cat: 'home', category: 'Home', note: '40-hour pour.', details: 'Old copy.', images: ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg'], image_url: 'https://x/1.jpg', active: true },
    { name: 'Hand Cream', price: 16, stock: 9, cat: 'body', category: 'Body', note: 'Fast-sinking.', details: 'Shea.', images: ['https://x/a.jpg', 'https://x/b.jpg', 'https://x/c.jpg'], image_url: 'https://x/a.jpg', active: true }]);
  const d = await H.desk(P.owner, 'products');
  await openSheetProduct(d, 'Studio Candle');
  await d.fill('.sheet [name=price]', '35'); await d.fill('.sheet [name=desc]', 'New copy.');
  await d.locator('.sheet input[type=file]').nth(1).setInputFiles(FIX('red.jpg')); await d.waitForFunction(() => (window.__toasts || []).some((m) => /Photo uploaded/.test(m)), null, { timeout: 8000 });
  await d.click('.sheet [data-o]'); await H.settle(d); await noSaveErrors(H, d);
  const c = rows(H, 'web_products').find((x) => x.name === 'Studio Candle');
  expect(c.price === 35 && c.details === 'New copy.', 'edit saved', { price: c.price, details: c.details });
  expect(c.images.length === 3 && c.images[0] === 'https://x/1.jpg' && /^http/.test(c.images[1]) && c.images[1] !== 'https://x/2.jpg' && c.images[2] === 'https://x/3.jpg', 'only photo 2 replaced, all 3 kept', c.images);
  let w = await H.open('web', 'shop.html', null); let cards = await shopCards(w);
  const wc = cards.find((x) => x.name === 'Studio Candle'); expect(wc && wc.price === '$35' && wc.imgs[1] === c.images[1], 'shop shows the new price + photo', wc);
  // delete
  await openSheetProduct(d, 'Hand Cream'); await d.click('.sheet [data-d]'); await d.waitForTimeout(300);
  await d.locator('.scrim button', { hasText: 'Remove' }).last().click(); await H.settle(d); await noSaveErrors(H, d);
  expect(!rows(H, 'web_products').some((x) => x.name === 'Hand Cream'), 'deleted product removed from the database', rows(H, 'web_products').map((x) => x.name));
  await w.reload(); cards = await shopCards(w); expect(!cards.some((x) => x.name === 'Hand Cream') && cards.length === 1, 'deleted product gone from the shop', cards.map((x) => x.name));
  // delete the last one → honest empty shop, never demo products
  await openSheetProduct(d, 'Studio Candle'); await d.click('.sheet [data-d]'); await d.waitForTimeout(300);
  await d.locator('.scrim button', { hasText: 'Remove' }).last().click(); await H.settle(d);
  await w.reload(); cards = await shopCards(w);
  expect(cards.length === 0 && /coming soon/i.test(await shopEmptyText(w)), 'empty shop says "coming soon" (no demo products)', cards.map((x) => x.name));
});

test('products: a second phone with an old copy cannot bring back deleted products or old prices', async (H, P) => {
  H.fake.seed('web_products', [{ name: 'Studio Candle', price: 30, stock: 4, cat: 'home', category: 'Home', note: 'n', details: 'd', images: ['https://x/1.jpg'], image_url: 'https://x/1.jpg', active: true },
    { name: 'Hand Cream', price: 16, stock: 9, cat: 'body', category: 'Body', note: 'n', details: 'd', images: ['https://x/a.jpg'], image_url: 'https://x/a.jpg', active: true }]);
  const phoneB = await H.desk(P.owner2);                      // Sophia's phone loads everything and keeps a copy
  const ctxB = phoneB.__ctx; await phoneB.close();
  const a = await H.desk(P.owner);                             // Ali, on another device
  await M(a, () => { const M = window.IncensoMgmt; M.db.products.find((p) => p.name === 'Studio Candle').price = 99; M.db.products = M.db.products.filter((p) => p.name !== 'Hand Cream'); M.save(); });
  await H.settle(a); await noSaveErrors(H, a);
  expect(rows(H, 'web_products').length === 1 && rows(H, 'web_products')[0].price === 99, 'Ali’s edit + delete saved', rows(H, 'web_products').map((x) => [x.name, x.price]));
  const before = H.fake.writes().length;
  const b = await ctxB.newPage(); await b.goto(H.MG + '/index.html'); await b.waitForFunction(() => window.IncensoMgmt && document.querySelector('.shell')); await H.settle(b, 1500);
  const pw = H.fake.writes().slice(before).filter((w) => w.table === 'web_products');
  expect(!pw.length, 'the old phone wrote nothing to products', pw.map((w) => w.method + ' ' + JSON.stringify(w.body).slice(0, 200)));
  expect(rows(H, 'web_products').length === 1 && rows(H, 'web_products')[0].price === 99, 'deleted product stays deleted and the new price stays', rows(H, 'web_products').map((x) => [x.name, x.price]));
  const bp = await M(b, () => window.IncensoMgmt.db.products.map((p) => [p.name, p.price]));
  expect(bp.length === 1 && bp[0][1] === 99, 'the old phone now shows the current list', bp);
});

test('recovery: an edit made while the connection was down is saved when the app is reopened', async (H, P) => {
  H.fake.seed('web_products', [{ name: 'Studio Candle', price: 30, stock: 4, cat: 'home', category: 'Home', note: 'n', details: 'd', images: ['https://x/1.jpg'], image_url: 'https://x/1.jpg', active: true }]);
  const d = await H.desk(P.owner); const ctx = d.__ctx;
  H.fake.fail((m, p) => m === 'POST' && p === '/rest/v1/web_products', 503, { message: 'upstream timeout' }, 100);
  await M(d, () => { const M = window.IncensoMgmt; M.db.products[0].price = 42; M.save(); });
  await d.waitForTimeout(1500); await d.close();                // phone locked / tab closed before it could save
  expect(rows(H, 'web_products')[0].price === 30, '(setup) save really failed', rows(H, 'web_products')[0].price);
  H.fake.faults.length = 0;
  const d2 = await ctx.newPage(); await d2.goto(H.MG + '/index.html'); await d2.waitForFunction(() => window.IncensoMgmt && document.querySelector('.shell')); await H.settle(d2, 1500);
  expect(rows(H, 'web_products')[0].price === 42, 'the unsaved price is recovered and saved', rows(H, 'web_products')[0].price);
});

test('fresh device: signing in on a new phone with an empty database writes nothing (no demo data)', async (H, P) => {
  const d = await H.desk(P.owner); await H.settle(d, 1500);
  const w = H.fake.writes().filter((x) => !/audit/.test(x.path));
  expect(!w.length, 'no writes on first sign-in', w.map((x) => x.method + ' ' + x.path + ' ' + JSON.stringify(x.body).slice(0, 160)));
  const shop = await H.open('web', 'shop.html', null); const cards = await shopCards(shop);
  expect(cards.length === 0, 'the shop shows no demo products', cards.map((c) => c.name));
});

test('errors: a rejected save is shown once and does not block other saves; a network blip retries until saved', async (H, P) => {
  H.fake.seed('web_products', [{ name: 'Studio Candle', price: 30, stock: 4, cat: 'home', category: 'Home', note: 'n', details: 'd', images: [], active: true }]);
  const d = await H.desk(P.owner);
  // permanent: duplicate product name (unique index) — must be named to the user, not retried forever
  await M(d, () => { const M = window.IncensoMgmt; M.db.products.push({ id: crypto.randomUUID(), name: 'Studio Candle', price: 1, stock: 1, low: 0, category: 'Home', note: 'x', desc: 'x', images: [], active: true }); M.db.clients.push({ id: crypto.randomUUID(), name: 'Walk In', phone: '+96103000000', tags: [], notes: '' }); M.save(); });
  await H.settle(d, 1200); await d.waitForTimeout(6000);
  const t = await H.toasts(d);
  expect(t.some((m) => /Couldn’t save \(web_products\).*duplicate/i.test(m)), 'user is told exactly what failed', t);
  const posts = H.fake.log.filter((e) => e.method === 'POST' && e.path === '/rest/v1/web_products').length;
  expect(posts <= 2, 'a permanent error is not retried in a loop', posts);
  expect(rows(H, 'clients').some((c) => c.name === 'Walk In'), 'other changes still saved', rows(H, 'clients').map((c) => c.name));
  // transient: the database is briefly unreachable
  H.fake.fail((m, p) => m === 'POST' && p === '/rest/v1/web_config', 503, { message: 'timeout' }, 2);
  await M(d, () => { const M = window.IncensoMgmt; M.db.settings.hours.open = 11; M.save(); });
  await d.waitForTimeout(12000);
  const h = rows(H, 'web_config').find((r) => r.key === 'hours'); expect(h && h.value.open === 11, 'hours saved after the retry', h && h.value);
  expect((await H.toasts(d)).includes('Saved.'), 'user is told it saved after reconnecting', await H.toasts(d));
});

// ================================================================
//  SERVICES / HOURS / STAFF — desk settings → website
// ================================================================
test('services: a price change in management shows on the website', async (H, P) => {
  const d = await H.desk(P.owner);
  await M(d, () => { const M = window.IncensoMgmt; const s = M.db.services.find((x) => x.name === 'Blow-dry'); s.price = 27; s.mins = 50; M.save(); });
  await H.settle(d); await noSaveErrors(H, d);
  const r = rows(H, 'web_services').find((x) => x.name === 'Blow-dry'); expect(r.price === 27 && r.mins === 50, 'price + duration saved', r);
  expect(rows(H, 'web_services').length === 3, 'no duplicate service rows', rows(H, 'web_services').map((x) => x.name));
  const w = await H.open('web', 'book.html', null); const c = await catalog(w);
  const s = c.services.find((x) => x.name === 'Blow-dry'); expect(s && s.price === 27 && s.mins === 50, 'booking page uses the new price', s);
});

test('services: add and remove a service in management → website list follows', async (H, P) => {
  const d = await H.desk(P.owner);
  await M(d, () => { const M = window.IncensoMgmt; M.db.services.push({ id: 'new1', cat: 'Nails', group: 'Gel', name: 'Nail art (per nail)', mins: 10, price: 3, from: false, unit: '', desc: '', brands: '', active: true }); M.db.services = M.db.services.filter((x) => x.name !== 'Root colour'); M.save(); });
  await H.settle(d); await noSaveErrors(H, d);
  const names = rows(H, 'web_services').map((x) => x.name).sort();
  expect(JSON.stringify(names) === JSON.stringify(['Blow-dry', 'Gel manicure', 'Nail art (per nail)']), 'database has the added one and not the removed one', names);
  await M(d, () => window.IncensoMgmt.save()); await H.settle(d);
  expect(rows(H, 'web_services').length === 3, 'saving again does not insert a duplicate', rows(H, 'web_services').map((x) => x.name));
  const w = await H.open('web', 'book.html', null); const c = await catalog(w);
  expect(c.services.some((x) => x.name === 'Nail art (per nail)') && !c.services.some((x) => x.name === 'Root colour'), 'website shows the change', c.services.map((x) => x.name));
});

test('hours + staff: opening hours and a stylist bio edited in management reach the website', async (H, P) => {
  const d = await H.desk(P.owner);
  await M(d, () => { const M = window.IncensoMgmt; M.setHours(1, { open: 9, close: 18, closed: false }); M.db.staff.find((s) => s.name === 'Peru').bio = 'New bio for Peru.'; M.save(); });
  await H.settle(d); await noSaveErrors(H, d);
  const h = rows(H, 'web_config').find((r) => r.key === 'hours').value; expect(h.days && h.days[1].open === 9 && h.days[1].close === 18, 'hours saved', h);
  expect(rows(H, 'web_staff').find((s) => s.name === 'Peru').bio === 'New bio for Peru.', 'bio saved');
  expect(rows(H, 'web_staff').length === 2, 'no duplicate staff', rows(H, 'web_staff').map((s) => s.name));
  const w = await H.open('web', 'hair.html', null); const c = await catalog(w);
  expect(c.staff.find((s) => s.name === 'Peru').bio === 'New bio for Peru.', 'website shows the new bio', c.staff);
  const pub = await w.evaluate(async () => (await fetch(window.SB_URL + '/rest/v1/web_config?select=key', { headers: { apikey: window.SB_KEY } })).json());
  expect(!pub.some((r) => ['fixedCosts', 'openingBalance', 'payTo', 'transferHoursBy'].includes(r.key)), 'finances are not visible to the public', pub);
  const staffPub = await w.evaluate(async () => (await fetch(window.SB_URL + '/rest/v1/web_staff?select=*', { headers: { apikey: window.SB_KEY } })).json());
  expect(Array.isArray(staffPub) && staffPub.length === 0, 'staff phone numbers/commission are not visible to the public', staffPub);
});

// ================================================================
//  CLIENTS
// ================================================================
test('clients: add, edit and delete a client in management', async (H, P) => {
  const d = await H.desk(P.owner);
  const id = await M(d, () => { const M = window.IncensoMgmt; const c = M.upsertClient({ phone: '+961 3 123 456', name: 'Maya Test' }); M.save(); return c.id; });
  await H.settle(d); await noSaveErrors(H, d);
  let r = rows(H, 'clients').find((c) => c.id === id); expect(r && r.name === 'Maya Test' && r.phone === '+961 3 123 456', 'client saved', rows(H, 'clients'));
  await M(d, (id) => { const M = window.IncensoMgmt; const c = M.db.clients.find((x) => x.id === id); c.notes = 'Allergic to ammonia'; c.birthday = '1990-05-04'; M.save(); }, id);
  await H.settle(d); await noSaveErrors(H, d);
  r = rows(H, 'clients').find((c) => c.id === id); expect(r.notes === 'Allergic to ammonia' && r.birthday === '1990-05-04', 'client edit saved', r);
  await M(d, (id) => { const M = window.IncensoMgmt; M.db.clients = M.db.clients.filter((x) => x.id !== id); M.save(); }, id);
  await H.settle(d); await noSaveErrors(H, d);
  expect(!rows(H, 'clients').some((c) => c.id === id), 'client deleted', rows(H, 'clients').map((c) => c.name));
  const d2 = await H.desk(P.owner2); const has = await M(d2, (id) => !!window.IncensoMgmt.db.clients.find((c) => c.id === id), id);
  expect(!has, 'a second device does not see the deleted client');
});

// ================================================================
//  BOOKINGS
// ================================================================
const deskBooking = (d, opts) => M(d, (o) => {
  const M = window.IncensoMgmt; const c = M.upsertClient({ phone: o.phone, name: o.name });
  const start = new Date(); start.setDate(start.getDate() + 2); start.setHours(14, 0, 0, 0);
  const ref = M.nextRef('BK');
  M.db.bookings.push({ ref, visit: ref, cat: 'Hair', clientId: c.id, staff: 'Peru', services: [{ name: 'Blow-dry', mins: 45, price: 25, from: false }], start: start.toISOString(), mins: 45, price: 25, gross: 25, discount: 0, level: 'Member', pay: 'cash', paid: 0, due: 25, gift: 0, giftParts: [], extra: [], products: [], payStatus: 'unpaid', status: 'confirmed', deadline: null, final: null, notes: '', prefs: { mood: '', flags: [], smoke: '' }, quote: false, source: 'desk', placedAt: new Date().toISOString() });
  M.save(); return { ref, date: M.lkey(start.toISOString()), clientId: c.id };
}, opts);

test('bookings: a desk booking is saved, blocks that time on the website, and the client sees it', async (H, P) => {
  const d = await H.desk(P.owner);
  const bk = await deskBooking(d, { phone: '+' + P.guest.phone, name: P.guest.name });
  await H.settle(d); await noSaveErrors(H, d);
  const r = rows(H, 'bookings').find((b) => b.ref === bk.ref);
  expect(r, 'booking row saved', rows(H, 'bookings').map((b) => b.ref));
  expect(r.date === bk.date && r.start_min === 14 * 60 && r.mins === 45 && r.staff_name === 'Peru' && r.time === '14:00', 'date/time/chair saved', { date: r.date, start_min: r.start_min, time: r.time, staff: r.staff_name });
  expect(r.user_id === P.guest.id, 'linked to the client’s website account', { user_id: r.user_id, client_id: r.client_id });
  const w = await H.open('web', 'book.html', null);
  const busy = await w.evaluate(async (date) => (await window.SB.rpc('day_busy', { p_date: date })).data, bk.date);
  expect(busy.some((x) => x.staff_name === 'Peru' && x.start_min === 840 && x.mins === 45), 'the website sees Peru busy 14:00–14:45', busy);
  const g = await H.open('web', 'account.html', P.guest); await g.waitForTimeout(1500);
  const mine = await g.evaluate(() => (window.IncensoAuth.get().bookings || []).map((b) => [b.ref, b.status, b.date, b.time]));
  expect(mine.some((b) => b[0] === bk.ref && b[1] === 'Upcoming'), 'the client sees it in their account', mine);
});

test('bookings: a customer books on the website → the desk sees it; the desk cancels → the customer sees it cancelled', async (H, P) => {
  const g = await H.open('web', 'book.html', P.guest); await g.waitForTimeout(1200);
  const date = await g.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); });
  const ref = await g.evaluate(async (date) => {
    const A = window.IncensoAuth; const acc = A.get(); const ref = await A.nextRef('BK');
    const b = { ref, service: 'Gel manicure', services: ['Gel manicure'], staff: 'Lara', date, time: '11:00', start: 660, mins: 60, serviceMins: [60], price: 30, priceFrom: false, quote: false, quoteItems: [], pay: 'Pay at studio', gift: null, paid: 0, due: 30, status: 'Upcoming', payStatus: 'due', placedAt: Date.now(), payDeadline: null, notes: 'first visit', mood: '', flags: [], smoke: '', created: new Date().toISOString() };
    acc.bookings = [b].concat(acc.bookings || []); A.set(acc); await new Promise((r) => setTimeout(r, 1500)); return ref;
  }, date);
  const r = rows(H, 'bookings').find((b) => b.ref === ref);
  expect(r && r.user_id === P.guest.id && r.date === date && r.start_min === 660 && r.status === 'Upcoming', 'website booking saved', r);
  const d = await H.desk(P.owner);
  const seen = await M(d, (ref) => { const M = window.IncensoMgmt; const b = M.db.bookings.find((x) => x.ref === ref); return b && { staff: b.staff, client: M.client(b.clientId).name, time: M.fmtTime(b.start), status: b.status }; }, ref);
  expect(seen && seen.staff === 'Lara' && seen.client === P.guest.name && seen.time === '11:00', 'desk shows it on Lara’s column at 11:00 for the right client', seen);
  await M(d, (ref) => { const M = window.IncensoMgmt; const b = M.db.bookings.find((x) => x.ref === ref); b.status = 'cancelled'; b.cancelReason = 'Studio closed'; M.save(); }, ref);
  await H.settle(d); await noSaveErrors(H, d);
  expect(rows(H, 'bookings').find((b) => b.ref === ref).status === 'Cancelled', 'cancel saved in the website vocabulary');
  // the customer's page is still open with the OLD copy and they change something unrelated
  await g.evaluate(async () => { const A = window.IncensoAuth; const acc = A.get(); acc.name = acc.name + ' '; A.set(acc); await new Promise((r) => setTimeout(r, 1500)); });
  expect(rows(H, 'bookings').find((b) => b.ref === ref).status === 'Cancelled', 'a stale customer page does not undo the desk’s cancel', rows(H, 'bookings').find((b) => b.ref === ref).status);
  await g.reload(); await g.waitForTimeout(1500);
  const st = await g.evaluate((ref) => (window.IncensoAuth.get().bookings || []).find((b) => b.ref === ref).status, ref);
  expect(/cancel/i.test(st), 'the customer sees it cancelled', st);
});

// ================================================================
//  ORDERS
// ================================================================
test('orders: a website order reaches the desk; the desk marks it collected → the customer sees it', async (H, P) => {
  H.fake.seed('web_products', [{ name: 'Studio Candle', price: 30, stock: 4, cat: 'home', category: 'Home', note: 'n', details: 'd', images: [], active: true }]);
  const g = await H.open('web', 'checkout.html', P.guest); await g.waitForTimeout(1200);
  const ref = await g.evaluate(async () => {
    const A = window.IncensoAuth; const acc = A.get(); const ref = await A.nextRef('OR');
    const order = { ref, date: new Date().toISOString().slice(0, 10), time: '3:00 PM', items: [{ name: 'Studio Candle', qty: 1, price: 30 }], total: 30, status: 'Ready for pickup', payStatus: 'due', gift: null, toPay: 30, placedAt: Date.now(), payDeadline: null, method: 'Studio pickup', pay: 'Pay at studio', name: acc.name, phone: acc.phone, email: '', address: '', discount: 0, tier: 'Member' };
    acc.orders = [order].concat(acc.orders || []); A.set(acc); await new Promise((r) => setTimeout(r, 1500)); return ref;
  });
  const r = rows(H, 'orders').find((o) => o.ref === ref);
  expect(r && r.user_id === P.guest.id && r.total === 30 && r.status === 'Ready for pickup', 'website order saved', r);
  const d = await H.desk(P.owner);
  const seen = await M(d, (ref) => { const o = window.IncensoMgmt.db.orders.find((x) => x.ref === ref); return o && { total: o.total, items: o.items.length, name: o.name, status: o.status }; }, ref);
  expect(seen && seen.total === 30 && seen.items === 1 && seen.name === P.guest.name && seen.status === 'ready', 'desk sees the order as ready for pickup', seen);
  const untouched = rows(H, 'orders').find((o) => o.ref === ref); expect(untouched.status === 'Ready for pickup' && untouched.method === 'Studio pickup', 'desk loading it does not rewrite the order', untouched);
  await M(d, (ref) => { const M = window.IncensoMgmt; const o = M.db.orders.find((x) => x.ref === ref); o.status = 'collected'; o.payStatus = 'paid'; M.save(); }, ref);
  await H.settle(d); await noSaveErrors(H, d);
  const r2 = rows(H, 'orders').find((o) => o.ref === ref); expect(r2.status === 'Collected' && r2.pay_status === 'paid' && r2.method === 'Studio pickup' && r2.pay === 'Pay at studio', 'saved in the website’s words: Collected, paid, still a studio pickup', { status: r2.status, pay_status: r2.pay_status, method: r2.method, pay: r2.pay });
  await g.reload(); await g.waitForTimeout(1500);
  const st = await g.evaluate((ref) => (window.IncensoAuth.get().orders || []).find((o) => o.ref === ref), ref);
  expect(st && /collect/i.test(st.status), 'customer sees it collected', st && st.status);
});

// ================================================================
//  GIFT CARDS
// ================================================================
test('gift cards: sold at the desk (paid) → active in the database → the recipient can see and spend it', async (H, P) => {
  const d = await H.desk(P.owner);
  const code = await M(d, (o) => {
    const M = window.IncensoMgmt; const c = M.upsertClient({ phone: o.buyer, name: 'Buyer Test' }); const now = Date.now();
    const g = { code: M.nextRef('GF'), amount: 100, balance: 100, buyerId: c.id, fromPhone: c.phone, from: 'Buyer', to: o.toName, toPhone: o.to, message: 'Enjoy', status: 'Active', method: 'cash', hold: false, createdAt: new Date(now).toISOString(), expiry: new Date(now + 365 * 864e5).toISOString(), deadline: null, redemptions: [], soldBy: 'Test Owner' };
    M.db.gifts.unshift(g); M.save(); return g.code;
  }, { buyer: '+96103999999', to: '+' + P.friend.phone, toName: P.friend.name });
  await H.settle(d); await noSaveErrors(H, d);
  const r = rows(H, 'gift_cards').find((x) => x.code === code);
  expect(r, 'card saved', rows(H, 'gift_cards'));
  expect(r.status === 'Active' && r.confirmed === true && r.balance === 100, 'card is Active + confirmed with the full balance (not reset to Reserved)', { status: r.status, confirmed: r.confirmed, balance: r.balance, buyer_id: r.buyer_id });
  const f = await H.open('web', 'account.html', P.friend); await f.waitForTimeout(1200);
  const bal = await f.evaluate(async () => { await window.IncensoGift.refresh(); return window.IncensoGift.balanceFor(window.IncensoAuth.get()); });
  expect(bal === 100, 'the recipient sees $100 to spend', bal);
  const used = await f.evaluate(async (code) => { const { data, error } = await window.SB.rpc('gift_redeem', { p_code: code, p_amount: 30, p_ref: 'BK9999', p_what: 'Blow-dry' }); return error ? error.message : data; }, code);
  expect(used === 30 && rows(H, 'gift_cards').find((x) => x.code === code).balance === 70, 'the recipient can spend it', used);
  // desk touches the card again (e.g. resend) — must not reset the balance or history
  await d.reload(); await d.waitForFunction(() => window.IncensoMgmt && document.querySelector('.shell')); await H.settle(d);
  await M(d, (code) => { const M = window.IncensoMgmt; M.log('Gift resent', code, 'x'); const g = M.db.gifts.find((x) => x.code === code); g.message = 'Enjoy!'; M.save(); }, code);
  await H.settle(d); await noSaveErrors(H, d);
  const r2 = rows(H, 'gift_cards').find((x) => x.code === code);
  expect(r2.balance === 70 && r2.status === 'Active' && r2.redemptions.length === 1, 'a desk edit keeps balance + redemptions', { balance: r2.balance, status: r2.status, redemptions: r2.redemptions });
});

test('gift cards: bought on the website → desk confirms payment → active for the recipient', async (H, P) => {
  const g = await H.open('web', 'gift.html', P.guest); await g.waitForTimeout(1200);
  const code = await g.evaluate(async (o) => {
    const A = window.IncensoAuth; const acc = A.get(); const code = await A.nextRef('GF'); const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
    const v = { code, amount: 50, to: o.toName, from: acc.name, msg: 'Happy birthday', acc: 'pink', deliver: 'sms', toPhone: o.to, pay: 'Whish Money', status: 'Reserved', confirmed: '', created: new Date().toISOString(), expires: exp.toISOString().slice(0, 10) };
    v.buyerPhone = acc.phone; v.buyerName = acc.name; window.IncensoGift.issue(v); acc.vouchers = [v].concat(acc.vouchers || []); window.IncensoGift.attach(acc); A.set(acc);
    await new Promise((r) => setTimeout(r, 1500)); return code;
  }, { to: '+' + P.friend.phone, toName: P.friend.name });
  let r = rows(H, 'gift_cards').find((x) => x.code === code);
  expect(r && r.status === 'Reserved' && r.confirmed === false && r.buyer_id === P.guest.id && r.amount === 50, 'website card saved as an unpaid reservation for the buyer', r);
  const d = await H.desk(P.owner);
  const seen = await M(d, (code) => { const x = window.IncensoMgmt.db.gifts.find((g) => g.code === code); return x && { status: x.status, amount: x.amount, to: x.to }; }, code);
  expect(seen && seen.status === 'Reserved' && seen.amount === 50, 'desk sees it waiting for payment', seen);
  await M(d, (code) => { const M = window.IncensoMgmt; const x = M.db.gifts.find((g) => g.code === code); x.status = 'Active'; x.deadline = null; M.log('Gift activated', code, 'x'); M.save(); }, code);
  await H.settle(d); await noSaveErrors(H, d);
  r = rows(H, 'gift_cards').find((x) => x.code === code);
  expect(r.status === 'Active' && r.confirmed === true && r.balance === 50 && r.buyer_id === P.guest.id, 'confirmed card is Active, keeps its buyer', { status: r.status, confirmed: r.confirmed, balance: r.balance, buyer_id: r.buyer_id });
  const f = await H.open('web', 'account.html', P.friend); await f.waitForTimeout(1200);
  const bal = await f.evaluate(async () => { await window.IncensoGift.refresh(); return window.IncensoGift.balanceFor(window.IncensoAuth.get()); });
  expect(bal === 50, 'the recipient sees $50', bal);
  const buyerSees = await g.evaluate(async (code) => { await window.IncensoGift.refresh(); const c = window.IncensoGift.byCode(code); return c && c.status; }, code);
  expect(buyerSees === 'Active', 'the buyer sees it active', buyerSees);
});

test('gift cards: buying one through the real gift page form saves it before the page moves on', async (H, P) => {
  const g = await H.open('web', 'gift.html', P.guest); await g.waitForTimeout(1200);
  const who = g.locator('[data-who="them"], [data-who=them]'); if (await who.count()) await who.first().click();
  await g.fill('#toName', P.friend.name); await g.fill('#toPhone', P.friend.phone.slice(3));
  await g.click('#buyBtn');
  await g.waitForURL(/gift-card/, { timeout: 15000 });
  await g.waitForTimeout(800);
  const errs = g.__logs.filter((l) => /PAGEERROR/.test(l)); expect(!errs.length, 'no script errors on the gift page', errs);
  const r = rows(H, 'gift_cards'); expect(r.length === 1, 'the card reached the database', H.fake.log.filter((e) => /gift_cards|next_ref/.test(e.path)).map((e) => e.method + ' ' + e.path + ' ' + e.status));
  expect(r[0].buyer_id === P.guest.id && r[0].status === 'Reserved' && r[0].to_name === P.friend.name && /\d{6}/.test(r[0].to_phone || ''), 'saved as the guest’s reservation for the friend', r[0]);
  expect(rows(H, 'profiles').find((p) => p.id === P.guest.id), 'account saved too');
});

test('products on a phone: adding a product from a phone-sized screen works the same', async (H, P) => {
  const d = await H.desk(P.owner, 'products', { mobile: true });
  await d.click('[data-new]'); await d.waitForSelector('.sheet form');
  const inputs = d.locator('.sheet input[type=file]');
  for (const [i, f] of ['red.jpg', 'green.jpg', 'blue.jpg'].entries()) { await inputs.nth(i).setInputFiles(FIX(f)); await d.waitForFunction((n) => (window.__toasts || []).filter((m) => /Photo uploaded/.test(m)).length >= n, i + 1, { timeout: 8000 }); }
  await d.fill('.sheet [name=name]', 'Phone Product'); await d.fill('.sheet [name=note]', 'Added on a phone.'); await d.fill('.sheet [name=price]', '12'); await d.fill('.sheet [name=desc]', 'Long copy.');
  await d.locator('.sheet [data-o]').tap(); await H.settle(d); await noSaveErrors(H, d);
  const p = rows(H, 'web_products').find((x) => x.name === 'Phone Product'); expect(p && p.images.length === 3 && p.price === 12, 'saved with 3 photos', p);
  const w = await H.open('web', 'shop.html', null, { mobile: true }); const cards = await shopCards(w);
  expect(cards.some((c) => c.name === 'Phone Product' && c.imgs.length === 3), 'visible in the shop on a phone', cards);
});

test('shop filters: category tabs show only live categories and filter correctly', async (H, P) => {
  H.fake.seed('web_products', [
    { name: 'Oil A', price: 10, cat: 'hair', category: 'Hair', note: 'a', details: 'a', images: [], active: true, sort: 1 },
    { name: 'Oil B', price: 11, cat: 'hair', category: 'Hair', note: 'b', details: 'b', images: [], active: true, sort: 2 },
    { name: 'File C', price: 9, cat: 'nails', category: 'Nails', note: 'c', details: 'c', images: [], active: true, sort: 3 },
    { name: 'Hidden D', price: 9, cat: 'home', category: 'Home', note: 'd', details: 'd', images: [], active: false, sort: 4 }]);
  const w = await H.open('web', 'shop.html', null); const cards = await shopCards(w);
  expect(cards.map((c) => c.name).join() === 'Oil A,Oil B,File C', 'only active products, in order', cards.map((c) => c.name));
  const tabs = await w.evaluate(() => [...document.querySelectorAll('.filters .filter')].filter((b) => !b.hidden && getComputedStyle(b).display !== 'none').map((b) => b.dataset.cat + ':' + ((b.querySelector('.n') || {}).textContent || '')));
  expect(JSON.stringify(tabs) === JSON.stringify(['all:3', 'hair:2', 'nails:1']), 'tabs show live counts and hide empty categories', tabs);
  await w.click('.filters .filter[data-cat=nails]'); await w.waitForTimeout(300);
  const shown = await w.evaluate(() => [...document.querySelectorAll('#shelf article.product')].filter((a) => getComputedStyle(a).display !== 'none' && !a.hidden).map((a) => a.querySelector('.p-name').textContent));
  expect(JSON.stringify(shown) === JSON.stringify(['File C']), 'Nails tab shows only nails', shown);
});

test('stylist: a stylist (not an owner) books in her own column and it saves', async (H, P) => {
  const d = await H.desk(P.stylist);
  const bk = await deskBooking(d, { phone: '+96103777777', name: 'Walk-in Client' });
  await H.settle(d); await noSaveErrors(H, d, 'stylist');
  const r = rows(H, 'bookings').find((b) => b.ref === bk.ref);
  expect(r && r.staff_name === 'Peru' && r.client_id, 'stylist booking saved with its client', r);
  expect(rows(H, 'clients').some((c) => c.name === 'Walk-in Client'), 'the new client saved too', rows(H, 'clients').map((c) => c.name));
});

test('access: an owner turns off a stylist’s access — another owner’s older copy does not turn it back on', async (H, P) => {
  const b = await H.desk(P.owner2); const ctxB = b.__ctx; await b.close();       // Sophia's phone keeps a copy
  const a = await H.desk(P.owner);
  await M(a, (ph) => { const M = window.IncensoMgmt; const u = M.db.users.find((x) => M.digits(x.phone) === ph); u.active = false; M.save(); }, P.stylist.phone);
  await H.settle(a); await noSaveErrors(H, a);
  const st = () => rows(H, 'desk_users').find((u) => u.name === P.stylist.name);
  expect(st().active === false, 'access turned off in the database');
  const b2 = await ctxB.newPage(); await b2.goto(H.MG + '/index.html'); await b2.waitForFunction(() => window.IncensoMgmt && document.querySelector('.shell')); await H.settle(b2);
  await M(b2, () => { const M = window.IncensoMgmt; M.db.settings.hours.open = 10.5; M.save(); });   // Sophia saves something unrelated
  await H.settle(b2);
  expect(st().active === false, 'still off after the other phone saved', st());
  const n = H.fake.log.filter((e) => e.method === 'PATCH' && e.path === '/rest/v1/desk_users').length;
  expect(n === 1, 'only the one real change was sent', n);
});

test('shop → cart → checkout through the real pages: photo shows in cart, order saved, desk sees it', async (H, P) => {
  H.fake.seed('web_products', [{ name: 'THICK HAIR SHAMPOO', price: 65, stock: 5, cat: 'hair', category: 'Hair', note: 'For thick hair.', details: 'Long copy.', images: ['https://x/s1.jpg', 'https://x/s2.jpg', 'https://x/s3.jpg'], image_url: 'https://x/s1.jpg', active: true }]);
  const w = await H.open('web', 'shop.html', P.guest); await shopCards(w);
  await w.locator('#shelf article.product .add').first().click(); await w.waitForTimeout(500);
  await w.goto(H.WEB + '/cart.html'); await w.waitForTimeout(1200);
  const cartImg = await w.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter((s) => /x\/s1/.test(s || '')));
  expect(cartImg.length >= 1, 'the cart shows the product photo', await w.evaluate(() => (document.querySelector('.l-photo') || {}).outerHTML));
  await w.goto(H.WEB + '/checkout.html'); await w.waitForTimeout(1500);
  if (!(await w.inputValue('#fName'))) await w.fill('#fName', P.guest.name);
  if (!(await w.inputValue('#fPhone'))) await w.fill('#fPhone', P.guest.phone.slice(3));
  await w.click('#placeBtn'); await w.waitForTimeout(3000);
  const errs = w.__logs.filter((l) => /PAGEERROR|failed|error/i.test(l)); 
  const coImg = await w.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter((s) => /x\/s1/.test(s || '')));
  expect(coImg.length >= 1, 'the order confirmation shows the product photo', coImg);
  const r = rows(H, 'orders'); expect(r.length === 1, 'the order reached the database', { orders: r.length, logs: errs, calls: H.fake.log.filter((e) => /orders|next_ref|profiles/.test(e.path) && e.method !== 'GET').map((e) => e.method + ' ' + e.path + ' ' + e.status + ' ' + JSON.stringify(e.error)) });
  expect(r[0].total === 65 && r[0].user_id === P.guest.id && (r[0].items || []).some((i) => i.name === 'THICK HAIR SHAMPOO'), 'order has the right item, total and customer', r[0]);
  const d = await H.desk(P.owner, 'orders');
  const seen = await M(d, (ref) => !!window.IncensoMgmt.db.orders.find((o) => o.ref === ref), r[0].ref);
  expect(seen, 'the order shows in management');
  const txt = await d.evaluate(() => document.body.innerText);
  expect(/1 open/.test(txt) && txt.includes(P.guest.name) && /READY FOR PICKUP\s+1/i.test(txt), 'the order is listed as open / ready for pickup on the Orders screen', txt.slice(0, 900));
});

test('newsletter: a visitor signs up from the website footer (twice) and the number is saved once', async (H, P) => {
  const w = await H.open('web', 'shop.html', null); await w.waitForTimeout(800);
  const sign = async () => { await w.evaluate(() => { const f = document.getElementById('newsForm'); f.scrollIntoView(); }); await w.fill('#newsForm [name=email]', '70123123'); await w.evaluate(() => document.getElementById('newsForm').requestSubmit()); await w.waitForTimeout(900); };
  await sign();
  let r = rows(H, 'newsletter'); expect(r.length === 1 && /70123123$/.test(r[0].phone), 'the number is saved', H.fake.log.filter((e) => /newsletter/.test(e.path)).map((e) => e.method + ' ' + e.status + ' ' + JSON.stringify(e.error)));
  await w.reload(); await w.waitForTimeout(800); await sign();
  r = rows(H, 'newsletter'); expect(r.length === 1, 'signing up again does not duplicate', r);
});

// ---------- runner ----------
(async () => {
  const only = process.argv.slice(2).map((s) => s.toLowerCase());
  const list = tests.filter((t) => !only.length || only.some((o) => t.name.toLowerCase().includes(o)));
  const results = []; const captured = [];
  for (const t of list) {
    const H = await setup(); const P = people(H.fake); seed(H.fake, P);
    H.fake.giftSanitizeSkipsDesk = process.env.LIVE_GIFT_FIX !== '0';
    H.fake.storageSelectPolicy = true;
    const t0 = Date.now(); let err = null;
    try { await t.fn(H, P); } catch (e) { err = e; }
    const ms = Date.now() - t0;
    results.push({ name: t.name, ok: !err, ms, err });
    console.log((err ? '✗ FAIL ' : '✓ pass ') + t.name + '  (' + (ms / 1000).toFixed(1) + 's)' + (err ? '\n      ' + (err instanceof Fail ? err.message : (err.stack || err).toString().split('\n').slice(0, 4).join('\n      ')) : ''));
    if (err && process.env.VERBOSE) { H.fake.log.filter((e) => e.error || (e.method !== 'GET' && e.method !== 'OPTIONS')).slice(-25).forEach((e) => console.log('        ' + e.method + ' ' + e.path + ' ' + (e.status || '') + ' ' + (e.error ? JSON.stringify(e.error) : JSON.stringify(e.body || '').slice(0, 200)))); }
    if (process.env.CAPTURE) captured.push({ test: t.name, ok: !err, seed: H.fake.seeded, people: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, { id: v.id, phone: v.phone, name: v.name }])), writes: H.fake.log.filter((e) => /\/rest\/v1\//.test(e.path) && !['GET', 'HEAD', 'OPTIONS'].includes(e.method) && !e.faulted).map((e) => ({ method: e.method, path: e.path, query: e.query, prefer: e.prefer, body: e.body, role: e.role, uid: e.uid, desk: e.desk, status: e.status, error: e.error || null })) });
    await H.close();
  }
  if (process.env.CAPTURE) require('fs').writeFileSync(process.env.CAPTURE, JSON.stringify(captured));
  const bad = results.filter((r) => !r.ok);
  console.log('\n' + (results.length - bad.length) + '/' + results.length + ' passed');
  require('fs').writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results.map((r) => ({ name: r.name, ok: r.ok, ms: r.ms, error: r.err ? String(r.err.message || r.err) : null })), null, 2));
  process.exit(bad.length ? 1 : 0);
})();
