// ---------------------------------------------------------------------------
// Seed + reference data, ported verbatim from the Incenso OS design prototype.
// Reference data (staff, menu, channels…) is static. The mutable slices
// (apts, notifs, msgs, ledgers) form the initial PersistedState.
// ---------------------------------------------------------------------------

import type {
  Staff,
  Stage,
  Station,
  Service,
  ProductCat,
  RetailCat,
  PayMethod,
  Client,
  Appointment,
  Notification,
  QueuedMessage,
  Decision,
  Perm,
  StockRaw,
  Variance,
  Thread,
  PersistedState,
} from './types'

export const staff: Staff[] = [
  { id: 'ra', name: 'Rania', init: 'RA', role: 'Senior Colorist', bg: '#7a3b5f', skills: ['Hair'], pfp: '' },
  { id: 'jo', name: 'Joud', init: 'JO', role: 'Nail Artist', bg: '#3b4a7a', skills: ['Nails'], pfp: '' },
  { id: 'ma', name: 'Maher', init: 'MA', role: 'Stylist', bg: '#6b7a4a', skills: ['Hair'], pfp: '' },
  { id: 'ly', name: 'Lynn', init: 'LY', role: 'Nail Tech Jr', bg: '#b07d1a', skills: ['Nails'], pfp: '' },
  { id: 'da', name: 'Dana', init: 'DA', role: 'Reception', bg: '#b4462f', skills: [], pfp: '' },
  { id: 'ka', name: 'Karma', init: 'KA', role: 'Makeup Artist', bg: '#8a5a20', skills: ['Makeup'], pfp: '' },
  { id: 'sa', name: 'Sabine', init: 'SA', role: 'Brow & Lash Artist', bg: '#3f5a42', skills: ['Brows & Lashes'], pfp: '' },
]

export const chan: Record<string, [string, string]> = {
  Website: ['#e6e2f2', '#3b4a7a'],
  App: ['#dfe9e0', '#3f5a42'],
  Instagram: ['#f6e2ea', '#7a3b5f'],
  WhatsApp: ['#dfeee3', '#2f6b45'],
  Phone: ['#f2e6d9', '#8a5a20'],
  Staff: ['#e8e4dc', '#000'],
  'Walk-in': ['#eae6de', '#4a4a4a'],
  Google: ['#e4ecf4', '#2f5a8a'],
  'Google search': ['#e4ecf4', '#2f5a8a'],
  ChatGPT: ['#e3ece8', '#2f5f52'],
  TikTok: ['#eae4ef', '#4a3b6b'],
  'Staff referral': ['#e8e4dc', '#000'],
}

export const stations: Station[] = [
  { name: 'Station 1', dept: 'Hair', x: '2%', y: '20px' },
  { name: 'Station 2', dept: 'Hair', x: '26%', y: '20px' },
  { name: 'Station 3', dept: 'Hair', x: '50%', y: '20px' },
  { name: 'Colour bar', dept: 'Hair', x: '74%', y: '20px' },
  { name: 'Nail bar 1', dept: 'Nails', x: '2%', y: '150px' },
  { name: 'Nail bar 2', dept: 'Nails', x: '26%', y: '150px' },
  { name: 'Makeup stand', dept: 'Makeup', x: '50%', y: '150px' },
  { name: 'Brow room', dept: 'Brows & Lashes', x: '74%', y: '150px' },
]

export const stages: Stage[] = [
  { key: 'booked', label: 'Reserved', dot: '#b07d1a', who: 'Arriving today — confirmed by reminder', colBg: '#efe8d8' },
  { key: 'reception', label: 'Checked in', dot: '#3b4a7a', who: 'Reception verified service + seated', colBg: '#ece6dc' },
  { key: 'service', label: 'In service', dot: '#6b7a4a', who: 'Staff accepted the client — timer running', colBg: '#e9e7da' },
  { key: 'review', label: 'To verify', dot: '#7a3b5f', who: 'Staff itemised it — reception checks, adds retail, then charges', colBg: '#ece2e0' },
  { key: 'paid', label: 'Complete', dot: '#000', who: 'Paid, receipt + thank-you sent', colBg: '#e6e2d6' },
]

export const svcCat: Service[] = [
  { name: 'Balayage', base: 150, from: true, cat: 'Hair', sub: 'Colour', min: 150 },
  { name: 'Full Highlights', base: 130, from: true, cat: 'Hair', sub: 'Colour', min: 135 },
  { name: 'Half Highlights', base: 95, from: true, cat: 'Hair', sub: 'Colour', min: 105 },
  { name: 'Root Touch-up', base: 85, cat: 'Hair', sub: 'Colour', min: 60 },
  { name: 'Global Colour', base: 90, from: true, cat: 'Hair', sub: 'Colour', min: 90 },
  { name: 'Gloss / Toner', base: 55, cat: 'Hair', sub: 'Colour', min: 30 },
  { name: 'Colour Correction', base: 280, from: true, cat: 'Hair', sub: 'Colour', min: 240 },
  { name: 'Grey Blending', base: 70, cat: 'Hair', sub: 'Colour', min: 60 },
  { name: 'Haircut', base: 45, cat: 'Hair', sub: 'Cut', min: 45 },
  { name: 'Cut + Blowdry', base: 65, cat: 'Hair', sub: 'Cut', min: 75 },
  { name: 'Blowdry', base: 35, cat: 'Hair', sub: 'Styling', min: 30 },
  { name: 'Curls / Waves Styling', base: 45, cat: 'Hair', sub: 'Styling', min: 45 },
  { name: 'Bridal Hair', base: 180, from: true, cat: 'Hair', sub: 'Bridal', min: 120 },
  { name: 'Fringe Trim', base: 15, cat: 'Hair', sub: 'Cut', min: 15 },
  { name: 'Keratin Treatment', base: 220, from: true, cat: 'Hair', sub: 'Treatment', min: 180 },
  { name: 'Olaplex Bond Repair', base: 40, cat: 'Hair', sub: 'Treatment', min: 20 },
  { name: 'Scalp Ritual', base: 50, cat: 'Hair', sub: 'Treatment', min: 45 },
  { name: 'Deep Conditioning', base: 35, cat: 'Hair', sub: 'Treatment', min: 30 },
  { name: 'Patch Test', base: 0, cat: 'Hair', sub: 'Treatment', min: 15 },
  { name: 'Gel Manicure', base: 45, cat: 'Nails', sub: 'Manicure', min: 60 },
  { name: 'Rubber Base Set', base: 60, cat: 'Nails', sub: 'Manicure', min: 75 },
  { name: 'Nail Art — 4 fingers', base: 15, cat: 'Nails', sub: 'Art', min: 20 },
  { name: 'Soak Off + Reshape', base: 20, cat: 'Nails', sub: 'Manicure', min: 30 },
  { name: 'Pedicure', base: 40, cat: 'Nails', sub: 'Pedicure', min: 50 },
  { name: 'Spa Pedicure', base: 60, cat: 'Nails', sub: 'Pedicure', min: 70 },
  { name: 'Day Makeup', base: 70, cat: 'Makeup', sub: 'Application', min: 60 },
  { name: 'Evening Makeup', base: 95, cat: 'Makeup', sub: 'Application', min: 75 },
  { name: 'Bridal Makeup', base: 220, from: true, cat: 'Makeup', sub: 'Bridal', min: 120 },
  { name: 'Makeup Lesson', base: 120, cat: 'Makeup', sub: 'Lesson', min: 90 },
  { name: 'Strip Lashes', base: 25, cat: 'Makeup', sub: 'Application', min: 15 },
  { name: 'Brow Shaping', base: 25, cat: 'Brows & Lashes', sub: 'Brows', min: 20 },
  { name: 'Brow Lamination', base: 70, cat: 'Brows & Lashes', sub: 'Brows', min: 60 },
  { name: 'Brow Tint', base: 20, cat: 'Brows & Lashes', sub: 'Brows', min: 20 },
  { name: 'Henna Brows', base: 45, cat: 'Brows & Lashes', sub: 'Brows', min: 45 },
  { name: 'Lash Lift', base: 80, cat: 'Brows & Lashes', sub: 'Lashes', min: 60 },
  { name: 'Classic Lash Set', base: 120, from: true, cat: 'Brows & Lashes', sub: 'Lashes', min: 120 },
  { name: 'Volume Lash Set', base: 150, from: true, cat: 'Brows & Lashes', sub: 'Lashes', min: 150 },
  { name: 'Lash Refill', base: 60, cat: 'Brows & Lashes', sub: 'Lashes', min: 60 },
  { name: 'Threading — Upper Lip', base: 10, cat: 'Brows & Lashes', sub: 'Brows', min: 10 },
]

export const prodCat: ProductCat[] = [
  { name: "L'Oréal Majirel 5.3", unit: 'tube · 50ml', ml: 50, cost: 9.4 },
  { name: 'Blond Studio Clay', unit: 'scoop · 30g', ml: 30, cost: 4.2 },
  { name: 'Oxydant 6%', unit: '60ml', ml: 60, cost: 1.8 },
  { name: 'Kérastase Bain Décalcifiant', unit: 'wash · 12ml', ml: 12, cost: 1.1 },
  { name: 'Olaplex No.2', unit: '20ml', ml: 20, cost: 6.0 },
  { name: 'Rubber Base Gel', unit: '1.4ml', ml: 1.4, cost: 2.1 },
  { name: 'CND Vinylux Red Baroness', unit: '1.1ml', ml: 1.1, cost: 1.4 },
  { name: 'Chanel Le Vernis 151', unit: '0.9ml', ml: 0.9, cost: 2.9 },
]

/** Maps a checkout product name → its Products & Stock ledger key. */
export const stockKey: Record<string, string> = {
  "L'Oréal Majirel 5.3": "L'Oréal Majirel 5.3",
  'Blond Studio Clay': 'Blond Studio Clay Lightener',
  'Oxydant 6%': 'Oxydant Crème 6%',
  'Kérastase Bain Décalcifiant': 'Bain Décalcifiant',
  'Olaplex No.2': 'Olaplex No.2 Bond Perfector',
  'Rubber Base Gel': 'Rubber Base Gel — clear',
  'CND Vinylux Red Baroness': 'Vinylux Red Baroness',
  'Chanel Le Vernis 151': 'Le Vernis 151 Pirate',
}

export const retailCat: RetailCat[] = [
  { name: 'Kérastase Elixir Ultime 100ml', price: 62 },
  { name: 'Olaplex No.3 100ml', price: 34 },
  { name: 'Chanel Le Vernis 151', price: 36 },
  { name: 'Incenso Silk Scrunchie', price: 14 },
  { name: 'Sensitive Cuticle Oil', price: 22 },
]

export const payMethods: PayMethod[] = [
  { name: 'Cash', sub: 'LBP / USD drawer' },
  { name: 'Card', sub: 'Visa · Mastercard' },
  { name: 'OMT', sub: 'Reference number' },
  { name: 'Whish Money', sub: 'Wallet transfer' },
  { name: 'Bank transfer', sub: 'Confirm before release' },
  { name: 'Paid online', sub: 'Already settled on app' },
]

export const msgTypes: Record<string, [string, string, string]> = {
  reminder: ['Reminder', '#3b4a7a', 'Sent the day before, every reservation'],
  rebook: ['Rebooking nudge', '#6b7a4a', 'Timed to how long her last service actually lasts'],
  thanks: ['Thank-you', '#000', 'Fires on payment with the itemised summary'],
  winback: ['Win-back', '#b4462f', 'She has drifted past her normal rhythm'],
  care: ['Aftercare', '#8a5a20', 'Follow-up on a technical service'],
  birthday: ['Birthday', '#7a3b5f', 'Personal, never a coupon dump'],
}

export const clients: Client[] = [
  {
    id: 'c1', name: 'Layal Haddad', phone: '+961 3 ••• 421', since: 'Mar 2022', visits: 41, ltv: 9840, tier: 'Gold', fav: 'Rania', channel: 'Instagram', state: 'Loyal', next: '4 Sep',
    formula: '7.3 + 9.31 · 6% oxidant · 35 min · ammonia-free base',
    sees: ['No ammonia — we keep a substitute formula for you', 'Espresso, double, no sugar', 'Quiet while your colour processes'],
    dossier: [
      { k: 'Hospitality', fg: '#3b4a7a', items: ['Espresso, double, no sugar — ready before she sits', 'Refused tea twice. Do not offer it again.'] },
      { k: 'Care flags', fg: '#b4462f', items: ['Ammonia sensitivity — substitute lightener only, never the standard', 'Left-hand cuticles very sensitive. No pushing, oil first.'] },
      { k: 'Wishlist', fg: '#6b7a4a', items: ['Asked about the copper she saw on our Instagram — for September', 'Curious about the silk pillowcase we carry'] },
      { k: 'Behaviour', fg: '#8a5a20', items: ['Arrives 8 minutes early, every time', 'Quiet during processing. Conversation at the basin only.'] },
      { k: 'Personal', fg: '#7a3b5f', items: ['Daughter Mia, 6 — books her fringe with Maher', 'Away every August'] },
    ],
  },
  {
    id: 'c2', name: 'Nour Khalil', phone: '+961 71 ••• 903', since: 'Jan 2024', visits: 19, ltv: 1620, tier: 'Silver', fav: 'Joud', channel: 'WhatsApp', state: 'Regular', next: '21 Aug',
    formula: 'Rubber base · almond shape · 1.4ml average set',
    sees: ['Sparkling water, no ice', 'Almond shape, rubber base', 'No e-file on your natural nail'],
    dossier: [
      { k: 'Hospitality', fg: '#3b4a7a', items: ['Sparkling water, no ice'] },
      { k: 'Care flags', fg: '#b4462f', items: ['Nail beds thin — no e-file on the natural nail'] },
      { k: 'Behaviour', fg: '#8a5a20', items: ['Books by WhatsApp voice note, never types', 'Rebooks 4.2 weeks like clockwork'] },
    ],
  },
  {
    id: 'c3', name: 'Tala Fares', phone: '+961 3 ••• 118', since: 'Sep 2023', visits: 27, ltv: 3410, tier: 'Gold', fav: 'Rania', channel: 'Website', state: 'Loyal', next: '12 Sep',
    formula: 'Root 5.3 · 20 vol · 30 min',
    sees: ['Green tea, one honey', 'No dryer heat at your root', 'You mentioned a curtain fringe before winter'],
    dossier: [
      { k: 'Care flags', fg: '#b4462f', items: ['Scalp reacts to heat — no dryer on the root'] },
      { k: 'Hospitality', fg: '#3b4a7a', items: ['Green tea, one honey'] },
      { k: 'Wishlist', fg: '#6b7a4a', items: ['Wants to try a curtain fringe before winter'] },
    ],
  },
  {
    id: 'c4', name: 'Rim Aoun', phone: '+961 76 ••• 550', since: 'Jun 2025', visits: 6, ltv: 940, tier: 'Bronze', fav: 'Maher', channel: 'Phone', state: 'At risk', next: '—',
    formula: 'Keratin · 220ml solution · mid porosity',
    sees: ['Turkish coffee, medium sweet', 'We call rather than message you', 'Keratin, mid porosity'],
    dossier: [
      { k: 'Behaviour', fg: '#8a5a20', items: ['Cancelled twice on a Monday. Take a deposit.', 'Answers calls, ignores WhatsApp'] },
      { k: 'Hospitality', fg: '#3b4a7a', items: ['Turkish coffee, medium sweet'] },
    ],
  },
  {
    id: 'c5', name: 'Yara Semaan', phone: '+961 3 ••• 277', since: 'Nov 2024', visits: 14, ltv: 1180, tier: 'Silver', fav: 'Lynn', channel: 'App', state: 'Regular', next: '19 Aug',
    formula: 'Gel manicure · short square · nude 04',
    sees: ['Iced americano', 'Short square, nude 04', 'You asked us to keep an eye on the Kérastase set'],
    dossier: [
      { k: 'Hospitality', fg: '#3b4a7a', items: ['Iced americano, brings her own straw'] },
      { k: 'Wishlist', fg: '#6b7a4a', items: ['Saving for the Kérastase set — offer at 3 visits'] },
    ],
  },
  {
    id: 'c6', name: 'Perla Mansour', phone: '+961 81 ••• 604', since: 'Feb 2021', visits: 58, ltv: 7220, tier: 'Gold', fav: 'Maher', channel: 'Staff', state: 'Loyal', next: '8 Aug',
    formula: 'Cut · long layers · blowdry round brush',
    sees: ['Chamomile instead of coffee after 16:00', 'Long layers, round-brush blowdry', 'We always hold a second chair for your friend'],
    dossier: [
      { k: 'Behaviour', fg: '#8a5a20', items: ['Always brings a friend. Two chairs, always.'] },
      { k: 'Hospitality', fg: '#3b4a7a', items: ['No caffeine after 16:00 — chamomile instead'] },
    ],
  },
  {
    id: 'c7', name: 'Maya Chidiac', phone: '+961 70 ••• 812', since: 'Today', visits: 0, ltv: 0, tier: 'New', fav: '—', channel: 'Google', state: 'First visit', next: 'today 14:00',
    formula: 'No history — patch test required',
    sees: ['A patch test 48 hours before any lightener', 'You told us about the box dye four months ago'],
    dossier: [
      { k: 'Intake', fg: '#000', items: ['Found us on Google Maps, read 3 reviews before booking', 'Wrote “box dye 4 months ago” in the booking form'] },
      { k: 'Care flags', fg: '#b4462f', items: ['Patch test required 48h before any lightener'] },
    ],
  },
]

export const perms: Perm[] = [
  { cap: 'See another client’s dossier', o: true, m: true, r: true, s: 'Only her own clients' },
  { cap: 'Raise a price above base', o: true, m: true, r: false, s: 'Yes, logged against her name' },
  { cap: 'Approve a checkout', o: true, m: true, r: true, s: false },
  { cap: 'Take payment', o: true, m: true, r: true, s: false },
  { cap: 'Send a client message', o: true, m: true, r: true, s: false },
  { cap: 'See margin and product cost', o: true, m: true, r: false, s: false },
  { cap: 'See payroll and commission', o: true, m: false, r: false, s: 'Her own only' },
  { cap: 'Act on a Mind decision', o: true, m: 'Propose only', r: false, s: false },
]

export const stockRaw: StockRaw[] = [
  { n: "L'Oréal Majirel 5.3", b: 'L’Oréal Professionnel', u: 'tube 50ml', ml: 50, on: 14, per: 75, cost: 9.4, use: 26, bench: '1.5 tubes' },
  { n: 'Blond Studio Clay Lightener', b: 'L’Oréal Professionnel', u: 'tub 500g', ml: 500, on: 0.9, per: 60, cost: 70, use: 22, bench: '60g' },
  { n: 'Oxydant Crème 6%', b: 'L’Oréal Professionnel', u: '1000ml', ml: 1000, on: 2.4, per: 90, cost: 12, use: 44, bench: '90ml' },
  { n: 'Bain Décalcifiant', b: 'Kérastase', u: '1000ml', ml: 1000, on: 1.8, per: 12, cost: 46, use: 96, bench: '12ml' },
  { n: 'Olaplex No.2 Bond Perfector', b: 'Olaplex', u: '2000ml', ml: 2000, on: 0.6, per: 20, cost: 190, use: 31, bench: '20ml' },
  { n: 'Rubber Base Gel — clear', b: 'Kodi', u: 'bottle 15ml', ml: 15, on: 1.2, per: 1.4, cost: 26, use: 34, bench: '1.4ml' },
  { n: 'Vinylux Red Baroness', b: 'CND', u: 'bottle 15ml', ml: 15, on: 3.1, per: 1.1, cost: 19, use: 12, bench: '1.1ml' },
  { n: 'Le Vernis 151 Pirate', b: 'Chanel', u: 'bottle 13ml', ml: 13, on: 1.4, per: 0.9, cost: 36, use: 9, bench: '0.9ml' },
  { n: 'Keratin Smoothing Solution', b: 'Cadiveu', u: '1000ml', ml: 1000, on: 0.34, per: 220, cost: 180, use: 6, bench: '220ml' },
  { n: 'Nail Prep Dehydrator', b: 'Kodi', u: 'bottle 15ml', ml: 15, on: 4, per: 0.4, cost: 11, use: 46, bench: '0.4ml' },
]

export const variance: Variance[] = [
  { s: 'ly', p: 'Rubber Base Gel', bench: 1.4, act: 2.1, mo: 41, note: 'Over-flooding the cuticle. Technique, not discipline — half an hour with Joud fixes it.' },
  { s: 'ma', p: 'Bain Décalcifiant', bench: 12, act: 16.5, mo: 34, note: 'Second shampoo on clients who do not need one. Habit from his last salon.' },
  { s: 'jo', p: 'Vinylux Red Baroness', bench: 1.1, act: 1.15, mo: 2, note: 'Within tolerance. Nothing to say.' },
  { s: 'ra', p: "L'Oréal Majirel 5.3", bench: 75, act: 70.5, mo: -38, note: 'Six percent under benchmark with no drop in results. Her weighing method should be the house standard.' },
]

export const decisions: Decision[] = [
  { tag: 'Macro · roster', fg: '#e5c07a', title: 'Move Rania to Wednesday before you discount Wednesday', body: 'Wednesday is not a demand problem, it is a capacity problem you created with the roster. Colour is 62% of revenue and Wednesday has one colour chair.', ev: ['41% chair utilisation, five consecutive weeks — 19 points under your other weekdays', 'Rania and Maher are both off Wednesday', 'Nine of eleven Wednesday enquiries this month asked for colour'], impact: '+$2,340 / month', conf: 'High confidence · 5 weeks of data' },
  { tag: 'Micro · technique', fg: '#9fc08a', title: 'Lynn draws 50% more rubber base than the benchmark', body: 'Same service, same result, 0.7ml more product every set. She is flooding the cuticle instead of floating it.', ev: ['2.1ml actual against a 1.4ml house benchmark', 'She is the only tech over benchmark', '$41 of product a month at current volume, rising with her bookings'], impact: '−$41 / month waste', conf: 'High confidence · 34 sets measured' },
  { tag: 'Micro · pricing', fg: '#9fc08a', title: 'Raise the balayage floor from $150 to $175', body: 'Nobody has paid your floor price in 90 days. It is not protecting you, it is anchoring your whole colour menu low.', ev: ['Average balayage actually charged: $268', 'Lowest ticket in 90 days: $170', "No client's current bill changes"], impact: 'Menu repositioning · no revenue risk', conf: 'High confidence · 61 tickets' },
  { tag: 'Macro · retail', fg: '#e5c07a', title: 'Your retail attach rate is eight points under where it should be', body: 'You sell to 18% of clients. Salons at your ticket size run 26%. The gap is not the shelf, it is that staff only recommend at checkout, after she has mentally closed her wallet.', ev: ['Retail is 9% of revenue at 41% margin', 'Rania attaches at 31%, everyone else under 14%', 'Highest-margin line you have'], impact: '+$1,180 / month at 26%', conf: 'Medium confidence · benchmark based' },
  { tag: 'Macro · training', fg: '#e5c07a', title: 'Train Lynn and Joud on the new rubber base before 12 August', body: 'You introduced a new base three weeks ago and consumption per set went up 22% across both techs. New product, old hands. Here is the session I would run — 90 minutes, on a Wednesday morning when the floor is quiet.', ev: ['Block 1 · 20 min — why this base is thinner: viscosity, and why the old flooding motion now over-applies', 'Block 2 · 40 min — float-and-cure on two hands each, weighing the bottle before and after against the 1.4ml benchmark', 'Block 3 · 30 min — the two lifting complaints, both at the free edge: cap the edge, cure 60s not 30s'], impact: 'Protects $340 / month', conf: 'High confidence · supplier runs it free' },
  { tag: 'Macro · new line', fg: '#e5c07a', title: 'Bring in a bond-repair leave-in. Your clients are already asking for it elsewhere.', body: 'Three signals landed in the same fortnight. This is the clearest new-line opportunity you have had this year and it sits next to a service you already sell 31 times a month.', ev: ['Nine clients asked about heat protection or bond aftercare in the Inbox this month — none of it is on your shelf', 'Olaplex No.3 is your fastest-moving retail line at 31 units; the leave-in is its natural second purchase', 'Two of your Gold clients mentioned buying it from a pharmacy — that margin is leaving the building'], impact: '+$620 / month at your attach rate', conf: 'Medium confidence · start with 12 units' },
  { tag: 'Macro · expansion', fg: '#e5c07a', title: 'Do not hire yet. Fix Wednesday and retail first.', body: 'You asked me last month about a fourth colourist. Your busy days are at 88% but your week is at 71% — a hire would sit idle two days and cost you $1,900 a month in fixed payroll.', ev: ['Weekly chair utilisation 71%', 'Two of six days under 50%', 'A hire breaks even at 79% weekly utilisation'], impact: 'Avoids −$1,900 / month', conf: 'High confidence · revisit October' },
]

export const threads: Thread[] = [
  { id: 't1', ch: 'Instagram', who: 'Rita Kassab', handle: '@rita.kassab', t: '4m', unread: true, intent: 'booking', msgs: [{ f: 'them', t: 'hiii do you have anything saturday for balayage? 🙏', at: '11:02' }, { f: 'them', t: 'my roots are bad 😭', at: '11:02' }], ai: 'Regular of Rania — nine weeks since her last balayage, and Saturday 13:00 is the slot she has taken four times in a row. It is open.', draft: 'Rita! Saturday 13:00 with Rania is free — your usual. Shall I hold it? Nine weeks is right on your regrowth, so we will need the full balayage rather than a root touch-up.' },
  { id: 't2', ch: 'WhatsApp', who: '+961 3 ••• 662', handle: 'Not in the book', t: '22m', unread: true, intent: 'booking', msgs: [{ f: 'them', t: 'Voice note · 0:14', at: '10:44' }, { f: 'them', t: '“Hi, good morning — is it possible to do two gel manicures Friday evening? For me and my sister.”', at: '10:44' }], ai: 'Transcribed automatically. Joud and Lynn are both free at 18:00 Friday. This number has appeared twice in Nour Khalil’s bookings — likely her sister.', draft: 'Good morning! Friday 18:00 works — Joud and Lynn can take you both side by side. Can I have both names so I can open your files?' },
  { id: 't3', ch: 'Phone', who: '+961 71 ••• 210', handle: 'Missed call · no voicemail', t: '51m', unread: true, intent: 'callback', msgs: [{ f: 'them', t: 'Missed call at 10:15. Rang for 22 seconds. Number not in the book.', at: '10:15' }], ai: 'Unknown number, mid-morning. Eight of ten unknown calls at this hour are price questions and half of them book when someone calls back within the hour.', draft: 'Call back script: “Hi, this is Dana from Incenso — I saw a missed call from this number.” Do not quote a price cold; ask what she is thinking of and offer a consult.' },
  { id: 't4', ch: 'Website', who: 'Live chat — visitor', handle: 'On the keratin page, 3 min', t: '1h', unread: false, intent: 'question', msgs: [{ f: 'them', t: 'do you do keratin on fine hair? mine breaks easily', at: '09:58' }, { f: 'us', t: 'Yes — we use a lower-protein formula for fine hair. Would you like Maher to look at it first?', at: '10:01' }, { f: 'them', t: 'ok how much', at: '10:03' }], ai: 'She asked price second, which means she is close. Keratin starts at $220 and fine hair uses less solution, so quote the floor and offer the consult free.', draft: 'It starts at $220 and fine hair usually sits at the lower end. The consult is free — Maher has Tuesday 17:00 or Thursday 11:00 if you want him to check the breakage first.' },
  { id: 't5', ch: 'App', who: 'Yara Semaan', handle: 'In the book · 14 visits', t: '2h', unread: false, intent: 'reschedule', msgs: [{ f: 'them', t: 'Can I move Tuesday to Wednesday? Same time if possible', at: '08:40' }], ai: 'Lynn is off Wednesday. Joud is free at 17:30 and has done Yara twice before. Moving her also fills a Wednesday gap, which is the day I want filled.', draft: 'Of course — Wednesday 17:30 with Joud, who did your nails in May. Tuesday is released. Want me to confirm?' },
  { id: 't6', ch: 'Instagram', who: 'Nadine Haddad', handle: '@nadine.h', t: '3h', unread: false, intent: 'order', msgs: [{ f: 'them', t: 'how much is the olaplex no.3? can you deliver to achrafieh', at: '07:55' }], ai: 'Retail enquiry, not a booking. $34, six on the shelf. Courier to Achrafieh is $4 and she has bought twice before through DM.', draft: '$34, and we have it in stock. Courier to Achrafieh is $4, or collect it free next time you are in. Shall I put one aside?' },
  { id: 't7', ch: 'WhatsApp', who: 'Layal Haddad', handle: 'In the book · Gold', t: '5h', unread: false, intent: 'question', msgs: [{ f: 'us', t: 'Layal — Rania asked me to check in. Two days after a bond treatment, skip the heat if you can.', at: '06:10' }, { f: 'them', t: 'ends feel fine, thank you 🤍 see you in september', at: '06:32' }], ai: 'Nothing to do. I logged “no dryness reported” against her bond treatment so the third one can be justified.', draft: '🤍 Rania will be glad. September is in her book already.' },
  { id: 't8', ch: 'Google', who: 'New review — 3 stars', handle: 'First visit · unsigned', t: '1d', unread: true, intent: 'review', msgs: [{ f: 'them', t: '“Colour was beautiful but I waited 25 minutes past my appointment and nobody told me anything.”', at: 'Yesterday' }], ai: 'The complaint is not the colour, it is the silence. This was Thursday 14:00 — Rania was 25 minutes behind and nobody at reception told the client. Reply publicly, then fix the process.', draft: 'Thank you for saying it plainly — you are right, and the waiting is not the part we can excuse. You should have been told the moment we were behind. We have changed how reception handles a delay. If you will let us, your next blowdry is on us.' },
]

// Retail shelf base (mutated by retailSold ledger at read time).
export const retailShelf = [
  { n: 'Kérastase Elixir Ultime 100ml', p: 62, c: 34, stock: 11, sold: 19, split: 'Salon 12 · Web 4 · IG 3' },
  { n: 'Olaplex No.3 100ml', p: 34, c: 19, stock: 24, sold: 31, split: 'Salon 22 · App 6 · Web 3' },
  { n: 'Chanel Le Vernis 151', p: 36, c: 21, stock: 3, sold: 9, split: 'Salon 5 · IG 4' },
  { n: 'Incenso Silk Scrunchie', p: 14, c: 4, stock: 48, sold: 26, split: 'Salon 9 · Web 11 · IG 6' },
  { n: 'Sensitive Cuticle Oil', p: 22, c: 7, stock: 16, sold: 14, split: 'Salon 11 · WhatsApp 3' },
  { n: 'Incenso Silk Pillowcase', p: 78, c: 41, stock: 6, sold: 4, split: 'Web 3 · IG 1' },
]

export const orderSteps: Record<string, string[]> = {
  '#4471': ['Pack it', 'Packed · courier called', 'Out for delivery', 'Delivered'],
  '#4470': ['Paid · courier booked', 'Handed to courier', 'Delivered'],
  '#4469': ['Awaiting OMT reference', 'Reference received · packing', 'Out for delivery', 'Delivered'],
  '#4468': ['Collect in salon Tuesday', 'Set aside at reception', 'Collected'],
}

export const outsideOrders = [
  { id: '#4471', who: 'Rita Kassab', ch: 'Instagram', what: 'Olaplex No.3 + Silk Scrunchie', amt: '$48', bg: '#f6e2ea', fg: '#7a3b5f' },
  { id: '#4470', who: 'Carla Sfeir', ch: 'Website', what: 'Kérastase Elixir Ultime', amt: '$62', bg: '#e6e2f2', fg: '#3b4a7a' },
  { id: '#4469', who: '+961 3 ••• 662', ch: 'WhatsApp', what: 'Chanel Le Vernis 151 ×2', amt: '$72', bg: '#dfeee3', fg: '#2f6b45' },
  { id: '#4468', who: 'Yara Semaan', ch: 'App', what: 'Sensitive Cuticle Oil', amt: '$22', bg: '#dfe9e0', fg: '#3f5a42' },
]

export const teamPerf = [
  { id: 'ra', rev: 14820, util: 88, eff: 106, attach: 31, rebook: 82, note: 'Sets the house standard on product use.' },
  { id: 'jo', rev: 8140, util: 79, eff: 99, attach: 12, rebook: 74, note: 'Fastest nail turnaround, weakest retail.' },
  { id: 'ma', rev: 9260, util: 71, eff: 88, attach: 14, rebook: 61, note: 'Second shampoo habit costs $34 a month.' },
  { id: 'ly', rev: 4190, util: 64, eff: 71, attach: 9, rebook: 52, note: 'Over-draws base by 50%. Coachable, not a problem.' },
]

/** Fresh copy of the mutable state — used to seed a store and to reset demo data. */
export function seedPersisted(): PersistedState {
  return {
    apts: [
      { id: 'a1', client: 'Layal Haddad', cid: 'c1', service: 'Balayage + Gloss', staff: 'ra', time: '09:30', channel: 'Instagram', stage: 'paid', total: 434, method: 'OMT', lines: [
        { t: 'service', name: 'Balayage', base: 150, price: 305, qty: 1, from: true },
        { t: 'service', name: 'Gloss / Toner', base: 55, price: 55, qty: 1 },
        { t: 'service', name: 'Olaplex Bond Repair', base: 40, price: 40, qty: 1 },
        { t: 'retail', name: 'Olaplex No.3 100ml', base: 34, price: 34, qty: 1 },
        { t: 'product', name: "L'Oréal Majirel 5.3", ml: 50, cost: 9.4, qty: 2 },
        { t: 'product', name: 'Blond Studio Clay', ml: 30, cost: 4.2, qty: 2 },
        { t: 'product', name: 'Olaplex No.2', ml: 20, cost: 6.0, qty: 1 },
      ] },
      { id: 'a2', client: 'Nour Khalil', cid: 'c2', service: 'Rubber Base Set', staff: 'jo', time: '10:00', channel: 'WhatsApp', stage: 'review', total: 0, lines: [
        { t: 'service', name: 'Rubber Base Set', base: 60, price: 60, qty: 1 },
        { t: 'service', name: 'Nail Art — 4 fingers', base: 15, price: 20, qty: 1 },
        { t: 'product', name: 'Rubber Base Gel', ml: 1.4, cost: 2.1, qty: 1 },
        { t: 'product', name: 'CND Vinylux Red Baroness', ml: 1.1, cost: 1.4, qty: 1 },
      ] },
      { id: 'a3', client: 'Tala Fares', cid: 'c3', service: 'Root Touch-up', staff: 'ra', time: '10:30', channel: 'Website', stage: 'service', total: 0, lines: [] },
      { id: 'a4', client: 'Rim Aoun', cid: 'c4', service: 'Keratin Treatment', staff: 'ma', time: '11:00', channel: 'Phone', stage: 'reception', total: 0, lines: [] },
      { id: 'a5', client: 'Yara Semaan', cid: 'c5', service: 'Gel Manicure', staff: 'ly', time: '11:30', channel: 'App', stage: 'booked', total: 0, lines: [] },
      { id: 'a6', client: 'Perla Mansour', cid: 'c6', service: 'Cut + Blowdry', staff: 'ma', time: '12:15', channel: 'Staff', stage: 'booked', total: 0, lines: [] },
      { id: 'a7', client: 'Maya Chidiac', cid: 'c7', service: 'Balayage (consult first)', staff: 'ra', time: '14:00', channel: 'Google', stage: 'booked', total: 0, lines: [] },
    ],
    notifs: [
      { id: 'n1', kind: 'Checkout to approve', to: 'Reception', text: 'Joud closed Nour Khalil — $80 service, 2 products logged. Collect payment.', t: 'now', read: false, dot: '#7a3b5f', roles: ['owner', 'manager', 'reception'] },
      { id: 'n2', kind: 'Client incoming', to: 'Rania', text: 'Tala Fares checked in at reception — Root Touch-up, station 2. Ammonia-free formula on file.', t: '2m', read: false, dot: '#6b7a4a', roles: ['owner', 'manager', 'staff'] },
      { id: 'n3', kind: 'Stock', to: 'Manager', text: 'Blond Studio Clay at 18% — 4 balayages of headroom. Reorder lead time 5 days.', t: '11m', read: false, dot: '#b4462f', roles: ['owner', 'manager'] },
      { id: 'n4', kind: 'Booking', to: 'Reception', text: 'New Instagram DM booking — Maya Chidiac, 14:00, first visit. Consult flagged.', t: '26m', read: true, dot: '#3b4a7a', roles: ['owner', 'manager', 'reception'] },
      { id: 'n5', kind: 'Mind', to: 'Owner', text: 'Wednesday utilisation held at 41% for 5 weeks. Discount test drafted and ready.', t: '1h', read: false, dot: '#b07d1a', roles: ['owner'] },
      { id: 'n6', kind: 'Payment', to: 'Owner', text: 'Layal Haddad settled $434 — OMT. Thank-you + portal link delivered.', t: '1h', read: true, dot: '#000', roles: ['owner', 'manager', 'reception'] },
    ],
    msgs: [
      { id: 'm1', type: 'reminder', client: 'Maya Chidiac', ch: 'WhatsApp', when: 'Now — 4h before', status: 'pending', why: 'First visit, 14:00 today. No-show risk for new Google bookings is 3.1× your average.', body: 'Hi Maya — Incenso here. We have you at 14:00 today with Rania for your balayage consult. Because it is your first colour with us we will do a quick patch test first, it takes 5 minutes. Reply CHANGE if today no longer works.' },
      { id: 'm2', type: 'rebook', client: 'Nour Khalil', ch: 'WhatsApp', status: 'pending', when: '21 Aug — 3 weeks after today', why: 'Her rubber base measurably holds 4.2 weeks. Nudging at week 3 is where she historically says yes.', body: 'Nour, your rubber base is about three weeks in — right around when you usually start seeing regrowth at the cuticle. Joud has Thursday 18:00 and Saturday 11:00. Want either?' },
      { id: 'm3', type: 'winback', client: 'Rim Aoun', ch: 'Phone call', status: 'pending', when: 'Today — task for reception', why: '6 visits, then 41 days quiet. Two Monday cancellations. A message will not recover her — a call might.', body: 'Call, do not text. Ask about the keratin holding up. Offer Wednesday, she has never cancelled a Wednesday. Do not lead with a discount.' },
      { id: 'm4', type: 'care', client: 'Layal Haddad', ch: 'WhatsApp', status: 'pending', when: 'Tomorrow 11:00', why: 'Second Olaplex of three. Compliance between visits is what makes the third one worth charging for.', body: 'Layal — Rania asked me to check in. Two days after a bond treatment, skip the heat if you can, and use the No.3 you took home on Sunday night before washing. Any dryness at the ends?' },
      { id: 'm5', type: 'reminder', client: 'Perla Mansour', ch: 'WhatsApp', status: 'pending', when: 'Tonight 18:00', why: 'Standard day-before. She brings a friend, so the reply also tells us whether to hold two chairs.', body: 'Perla — tomorrow 12:15 with Maher, cut and blowdry. Is Rita coming with you? Reply 2 and we will hold both chairs.' },
      { id: 'm6', type: 'birthday', client: 'Tala Fares', ch: 'WhatsApp', status: 'pending', when: '3 Aug 09:00', why: 'Birthday in three days. She has never used a discount code — she responds to being remembered.', body: 'Happy birthday Tala. No coupon, no catch — just come in whenever suits you this month and the scalp ritual is on us. Rania already knows.' },
      { id: 'm7', type: 'thanks', client: 'Layal Haddad', ch: 'WhatsApp', status: 'sent', when: 'Sent 10:05', why: 'Fired automatically on payment.', body: 'Thank you Layal. Balayage, gloss and your second bond treatment, $434 settled by OMT. Your summary and formula are in your portal — sign in with this number. See you around 4 September.' },
      { id: 'm8', type: 'rebook', client: 'Yara Semaan', ch: 'App push', status: 'pending', when: '19 Aug', why: 'Gel manicure averages 3.1 weeks on her. She books from the app, so push outperforms WhatsApp 2:1.', body: 'Yara — three weeks since your gels. Lynn has Tuesday 17:30. Tap to take it.' },
      { id: 'm9', type: 'reminder', client: 'Sara Bitar', ch: 'Instagram DM', status: 'pending', when: 'Tonight 18:00', why: 'Booked through a DM thread — the reminder continues that same conversation instead of starting a new one.', body: 'Hey Sara! Tomorrow 15:30 with Joud for the almond set we talked about. Bring the reference you sent if you found a better one.' },
    ],
    newClients: [],
    stockUsed: {},
    retailSold: {},
    ordered: [],
    orderStep: {},
  }
}
