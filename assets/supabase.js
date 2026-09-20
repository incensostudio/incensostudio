/* Incenso Studio — shared Supabase client (public/anon key; RLS enforces access). */
(() => {
  const URL = 'https://gcqkkruzgxpqpqxeymqx.supabase.co';
  const KEY = 'sb_publishable_cRcQdQ7ZPXQMUoBOGm71DA_2d22DyLu';
  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[Incenso] supabase-js not loaded — running in offline/local mode.');
    window.SB = null;
    return;
  }
  window.SB = window.supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'incenso-auth' },
  });
  window.SB_URL = URL;
  window.SB_KEY = KEY;
})();
