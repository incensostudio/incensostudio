// DESIGN-PREVIEW ONLY. Off the live domain, maps clean URLs (/gift) to files (gift.html) so the
// pages navigate as plain files. No-op on incensostudio.com. Keep this file + its <script> tag when syncing to the repo.
(() => {
  const live = /incensostudio\.com$/.test(location.hostname);
  const map = (h) => { if (live || !h || !/^\/(?![\/#?])/.test(h) || /\.[a-z0-9]+(\?|#|$)/i.test(h)) return h; const m = h.match(/^\/([a-z0-9-]*)(.*)$/i); return m ? (m[1] || 'index') + '.html' + m[2] : h; };
  window.IncensoNav = (h) => { location.href = map(h); };
  if (live) return;
  const fix = (root) => root.querySelectorAll('a[href^="/"]').forEach((a) => { const h = a.getAttribute('href'); const n = map(h); if (n !== h) a.setAttribute('href', n); });
  const start = () => { fix(document); new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) fix(n); }))).observe(document.documentElement, { childList: true, subtree: true }); };
  document.body ? start() : document.addEventListener('DOMContentLoaded', start);
})();
