/* Incenso Studio — gift-card ledger, backed by Supabase.
   Cards live in the gift_cards table (admin confirms payment there). The site
   keeps a synchronous local cache of the signed-in guest's cards so the pages
   are unchanged; spending/refunding go through security-definer RPCs so
   balances can't be tampered with client-side. */
(() => {
  const SB = window.SB;
  const CKEY = 'incenso-gift-cards';
  const digits = (p) => String(p || '').replace(/\D/g, '');
  const same = (a, b) => { a = digits(a); b = digits(b); if (a.length < 6 || b.length < 6) return false; return a === b || a.endsWith(b) || b.endsWith(a); };
  const today = () => new Date().toISOString().slice(0, 10);

  let cards = [];
  try { cards = JSON.parse(localStorage.getItem(CKEY) || '[]') || []; } catch (e) { cards = []; }
  const saveCache = () => { try { localStorage.setItem(CKEY, JSON.stringify(cards)); } catch (e) {} };

  const fromRow = (r) => ({
    code: r.code, amount: r.amount, balance: r.balance, to: r.to_name, toPhone: r.to_phone,
    from: r.from_name, msg: r.msg, color: r.color, buyerName: r.buyer_name, buyerPhone: r.buyer_phone,
    pay: r.pay, status: r.status, confirmed: !!r.confirmed, created: r.created_at,
    expires: (r.expires_at || '').slice(0, 10), redemptions: r.redemptions || [],
  });

  const load = () => cards;
  const byCode = (c) => cards.find((x) => x.code.toUpperCase() === String(c || '').trim().toUpperCase().replace(/\s+/g, '')) || null;
  const active = (x) => !!x && x.status === 'Active' && x.balance > 0 && (!x.expires || x.expires >= today());
  // Payment window for a reserved card: 24 h for Whish / OMT, 3 days for pay-at-studio
  const deadlineOf = (x) => new Date(x.created).getTime() + (/whish|omt/i.test(x.pay || '') ? 86400000 : 3 * 86400000);
  const cancelled = (x) => !!x && (x.status === 'Cancelled' || (x.status === 'Expired' && !!x.expiredReason)); // never paid — invisible to the recipient
  const confirmed = (x) => !!x && x.status !== 'Reserved' && !cancelled(x);
  const forPhone = (p) => cards.filter((x) => same(x.toPhone, p) && confirmed(x));
  const boughtBy = (p) => cards.filter((x) => same(x.buyerPhone, p));
  const totalFor = (p) => forPhone(p).filter(active).reduce((a, x) => a + x.balance, 0);
  const cardsFor = (acc) => { if (!acc) return []; const seen = new Set(); const out = []; forPhone(acc.phone).forEach((x) => { if (!seen.has(x.code)) { seen.add(x.code); out.push(x); } }); return out; };
  const spendable = (acc) => cardsFor(acc).filter(active).sort((a, b) => (a.expires || '').localeCompare(b.expires || ''));
  const balanceFor = (acc) => spendable(acc).reduce((a, x) => a + x.balance, 0);

  // ---- Fetch this guest's cards from Supabase into the cache ----
  const refresh = async () => {
    if (!SB) return cards;
    try {
      const { data: { user } } = await SB.auth.getUser();
      if (!user) return cards;
      // RLS returns only cards the guest may see (bought by them, or sent to their number & confirmed)
      const { data } = await SB.from('gift_cards').select('*').order('created_at', { ascending: false });
      if (data) { cards = data.map(fromRow); saveCache(); }
    } catch (e) { console.warn('[Incenso] gift refresh', e); }
    return cards;
  };
  const attach = async (acc) => {
    await refresh();
    if (acc && acc.phone) acc.giftCards = forPhone(acc.phone).map((x) => x.code);
    return acc;
  };

  // ---- Issue (buy) a card. Server forces Reserved/unconfirmed. ----
  const issue = (v) => {
    const card = Object.assign({ balance: v.amount, redemptions: [], status: 'Reserved', confirmed: false, created: new Date().toISOString(), expires: '' }, v);
    cards = cards.filter((x) => x.code !== v.code); cards.unshift(card); saveCache();
    if (SB) {
      SB.from('gift_cards').insert({
        code: v.code, amount: v.amount, to_name: v.to || null, to_phone: v.toPhone || null,
        from_name: v.from || null, msg: v.msg || null, color: v.color || null,
        buyer_name: v.buyerName || null, buyer_phone: v.buyerPhone || null, pay: v.pay || null,
      }).then(({ error }) => { if (error) console.warn('[Incenso] gift issue', error); refresh(); }, () => {});
    }
    return v;
  };

  // ---- Spend / restore (server-authoritative via RPC; cache updated optimistically) ----
  const redeem = (code, amount, ref, what) => {
    const x = byCode(code); if (!x) return 0;
    const used = Math.min(amount, x.balance);
    if (used <= 0) return 0;
    x.balance -= used; x.redemptions.push({ date: new Date().toISOString(), amount: used, ref, what }); if (x.balance <= 0) x.status = 'Used'; saveCache();
    if (SB) SB.rpc('gift_redeem', { p_code: code, p_amount: used, p_ref: ref || null, p_what: what || null }).then(() => {}, (e) => console.warn('[Incenso] gift_redeem', e));
    return used;
  };
  const refund = (code, amount, ref) => {
    const x = byCode(code); if (!x) return;
    x.balance += amount; if (x.status === 'Used') x.status = 'Active'; x.redemptions.push({ date: new Date().toISOString(), amount: -amount, ref, what: 'Refund' }); saveCache();
    if (SB) SB.rpc('gift_refund', { p_code: code, p_amount: amount, p_ref: ref || null }).then(() => {}, (e) => console.warn('[Incenso] gift_refund', e));
  };
  const redeemFrom = (acc, amount, ref, what) => { const parts = []; let left = amount; for (const c of spendable(acc)) { if (left <= 0) break; const used = redeem(c.code, left, ref, what); if (used > 0) { parts.push({ code: c.code, amount: used }); left -= used; } } return parts; };
  const refundParts = (parts, ref) => (parts || []).forEach((p) => refund(p.code, p.amount, ref));

  // Admin action (confirm payment) happens in Supabase; kept as a shim client-side.
  const confirm = () => null;
  const pending = () => cards.filter((x) => !confirmed(x));
  const update = (code, fn) => { const x = byCode(code); if (x) { fn(x); saveCache(); } return x; };

  window.IncensoGift = { deadlineOf, cancelled, load, issue, update, byCode, forPhone, boughtBy, active, redeem, refund, confirm, confirmed, pending, attach, refresh, totalFor, same, cardsFor, spendable, balanceFor, redeemFrom, refundParts };
})();
