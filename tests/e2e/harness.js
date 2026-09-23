/* Test harness: serves the real management app and the real website from disk, points
   their Supabase client at the strict fake (fakesb.js), and drives them in Chromium. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright-core');
const { createFake } = require('./fakesb');

const MGMT_DIR = path.resolve(__dirname, '../..');
const WEB_DIR = process.env.WEBSITE_DIR ? path.resolve(process.env.WEBSITE_DIR) : path.resolve(MGMT_DIR, '../incenso-website');
const SUPA_UMD = fs.readFileSync(require.resolve('@supabase/supabase-js/dist/umd/supabase.js'));
const CHROME = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p));

const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon' };
// Every file that names the live project is rewritten to point at the fake instead.
let REWRITE = null;
const staticServer = (root) => new Promise((resolve) => {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    if (!path.extname(p) && fs.existsSync(path.join(root, p + '.html'))) p += '.html';   // GitHub Pages clean URLs
    const f = path.join(root, p); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end('nf'); } const ext = path.extname(f); if (REWRITE && (ext === '.js' || ext === '.html')) d = Buffer.from(d.toString('utf8').replace(/https:\/\/gcqkkruzgxpqpqxeymqx\.supabase\.co/g, REWRITE)); res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(d); });
  });
  s.listen(0, '127.0.0.1', () => resolve({ server: s, url: 'http://127.0.0.1:' + s.address().port }));
});

async function setup() {
  const fake = createFake(); const port = await fake.listen(); const SBURL = 'http://127.0.0.1:' + port; REWRITE = SBURL;
  const mg = await staticServer(MGMT_DIR); const web = await staticServer(WEB_DIR);
  const browser = await chromium.launch({ executablePath: CHROME || undefined, args: ['--no-sandbox'] });
  const pages = [];

  // Open a page as `who` (null = anonymous visitor). `seed` pre-fills this device's localStorage.
  const open = async (site, route, who, opts) => {
    opts = opts || {};
    const ctx = opts.context || await browser.newContext({ timezoneId: 'Asia/Beirut', locale: 'en-GB', viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: !!opts.mobile });
    await ctx.route('**/*', (r) => {
      const u = r.request().url();
      if (u.startsWith('https://cdn.jsdelivr.net/npm/@supabase/supabase-js')) return r.fulfill({ status: 200, contentType: 'application/javascript', body: SUPA_UMD });
      if (u.startsWith(mg.url) || u.startsWith(web.url) || u.startsWith(SBURL) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
      return r.abort();
    });
    if (!opts.context) {
      const init = { session: who ? who.session : null, account: who ? who.account : null, extra: opts.storage || {} };
      await ctx.addInitScript((init) => {
        try {
          if (!localStorage.getItem('__seeded')) {
            localStorage.setItem('__seeded', '1');
            if (init.session) { localStorage.setItem('incenso-auth', JSON.stringify(init.session)); localStorage.setItem('incenso-signedin', '1'); }
            if (init.account) localStorage.setItem('incenso-account', JSON.stringify(init.account));
            Object.entries(init.extra).forEach(([k, v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
          }
        } catch (e) {}
        // capture every toast the management app shows
        window.__toasts = [];
        // read toasts off the screen (the app calls its own internal toast(), not only MgmtUI.toast)
        new MutationObserver((muts) => { muts.forEach((mu) => { const t = mu.target; if (mu.type === 'childList' && t.nodeType === 1 && t.classList.contains('toast')) { const m = (t.textContent || '').trim(); if (m) window.__toasts.push(m); } }); }).observe(document, { subtree: true, childList: true });
      }, init);
    }
    const page = await ctx.newPage();
    page.__logs = []; page.on('console', (m) => page.__logs.push(m.type() + ': ' + m.text())); page.on('pageerror', (e) => page.__logs.push('PAGEERROR: ' + e.message));
    await page.goto((site === 'mgmt' ? mg.url : web.url) + '/' + route, { waitUntil: 'load' });
    pages.push(page); page.__ctx = ctx;
    return page;
  };

  // Desk: open the management app signed in and wait for it to finish loading from the DB.
  const desk = async (who, route, opts) => {
    const page = await open('mgmt', 'index.html' + (route ? '#/' + route : ''), who, opts);
    await page.waitForFunction(() => window.IncensoMgmt && document.querySelector('.shell'), null, { timeout: 15000 });
    await settle(page);
    return page;
  };
  // Wait until the page's debounced sync has flushed (no in-flight requests to the fake for a bit).
  const settle = async (page, ms) => {
    ms = ms || 900; let last = -1, stable = 0;
    for (let i = 0; i < 60; i++) { await page.waitForTimeout(150); const n = fake.log.length; if (n === last) { stable += 150; if (stable >= ms) return; } else { stable = 0; last = n; } }
  };
  const toasts = (page) => page.evaluate(() => window.__toasts || []);
  const close = async () => { await browser.close(); await fake.close(); mg.server.close(); web.server.close(); };
  return { fake, open, desk, settle, toasts, close, SBURL, MG: mg.url, WEB: web.url, browser };
}

// People used across tests
const people = (fake) => {
  // fixed ids so captured writes are reproducible (and replayable) run to run
  const mk = (phone, name) => { const u = fake.addUser(phone, { id: '00000000-0000-4000-8000-' + phone.padStart(12, '0').slice(-12) }); return { id: u.id, phone, name, session: u.session, account: { phone: '+' + phone, name, email: '', bookings: [], orders: [], restocks: [] } }; };
  return { owner: mk('96170000001', 'Test Owner'), owner2: mk('96170000003', 'Second Owner'), stylist: mk('96170000002', 'Test Stylist'), guest: mk('96171111111', 'Test Guest'), friend: mk('96172222222', 'Test Friend') };
};

module.exports = { setup, people, MGMT_DIR, WEB_DIR };
