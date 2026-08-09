// Supabase connection details.
//
// These are PUBLIC keys, safe to ship in the browser bundle: the publishable
// key can only do what Row Level Security policies allow, and all sign-in /
// passcode verification happens server-side in the `desk-auth` Edge Function.
// Nothing secret lives here.
//
// Project region: eu-central-1 (Frankfurt) — chosen for low latency to Lebanon.
export const SUPABASE_URL = 'https://gcqkkruzgxpqpqxeymqx.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cRcQdQ7ZPXQMUoBOGm71DA_2d22DyLu'
