/* Incenso Studio — single source of truth for services, categories and staff.
   /book, the service pages (Hair, Nails, Make-up, Brows & Lashes), Our Work, The Space, Gift and /booking all read from here.
   Menu as supplied by the studio (70 services). price null = quoted in studio; from = starting price. */
(() => {
  const CATS = [
    { name: 'Hair', file: '/hair', ar: 'الشعر', h1: 'Hair, taken seriously.', intro: 'Cuts that grow out well, color that suits the light you actually live in, and blow-drys worth sitting down for. Every appointment starts with a proper consultation and uses products chosen for your hair, so you leave with hair that behaves at home the way it did in the chair.', chairs: 'One stylist. Every strand accounted for.' },
    { name: 'Nails', file: '/nails', ar: 'الأظافر', h1: 'Nails, done properly.', intro: 'Clean shapes, healthy cuticles and colour that lasts as long as it promises. Nothing is rushed here \u2014 every tool is sterilised between guests, every cuticle is treated, not cut. From a classic manicure to a full acrylic set \u2014 and our Designer Experience: a manicure or pedicure spa done entirely with Chanel or Dior products, from the soak to the final coat.', chairs: 'Two technicians, one table each — and one standard.' },
    { name: 'Make-up', file: '/makeup', ar: 'المكياج', h1: 'Make-up that reads as you.', intro: 'Skin first, then the rest. Make-up that looks like you on a very good day — never a mask, never a trend you\u2019ll regret in the photos. From a quick cat-eye to a bridal look that holds from the first mirror to the last dance.', chairs: 'One artist, by appointment only.' },
    { name: 'Brows & Lashes', file: '/brows-lashes', ar: 'الحواجب والرموش', h1: 'Brows and lashes, mapped to your face.', intro: 'Shaping and threading that follow your bone structure, not a trend. Lamination and lifts for the low-maintenance weeks, extensions and refills when you want more.', chairs: 'Same hands as make-up — they know your face.' },
  ];
  const S = (cat, group, name, mins, price, from, unit, desc, brands) => ({ cat, group, name, mins, price, from: !!from, unit: unit || '', desc: desc || '', brands: brands || '', note: '' });
  const SERVICES = [
    S('Hair', 'Cuts & Styling', 'Haircut', 45, 40, 1, '', 'Consultation, shampoo, precision cut & blow-dry.'),
    S('Hair', 'Cuts & Styling', 'Ends Trim', 30, 20, 0, '', 'Shampoo, a light ends trim without reshaping & blow-dry.'),
    S('Hair', 'Cuts & Styling', 'Blow-dry', 30, 10, 0, '', 'Shampoo & blow-dry.'),
    S('Hair', 'Cuts & Styling', 'Hair Styling', 30, 15, 0, '', 'Shampoo, blow-dry & waves, curls or sleek styling.'),
    S('Hair', 'Cuts & Styling', 'Half-up Style', 45, 25, 1, '', 'Shampoo, blow-dry & half-up styling.'),
    S('Hair', 'Cuts & Styling', 'Full Updo', 60, 45, 1, '', 'Shampoo, blow-dry & full updo styling.'),
    S('Hair', 'Color', 'Full-Head Color', 120, 60, 1, '', 'Color, shampoo & blow-dry.'),
    S('Hair', 'Color', 'Root Color', 90, 30, 1, '', 'Root color, shampoo & blow-dry.'),
    S('Hair', 'Color', 'Highlights', 150, 130, 1, '', 'Highlights, shampoo & blow-dry.'),
    S('Hair', 'Color', 'Lowlights', 150, 120, 1, '', 'Lowlights, shampoo & blow-dry.'),
    S('Hair', 'Color', 'Ombré', 150, 130, 1, '', 'Ombré, shampoo & blow-dry.'),
    S('Hair', 'Color', 'Toner Refresh', 45, 30, 1, '', 'Toner, shampoo & blow-dry.'),
    S('Hair', 'Treatments', 'Hydration & Nourishment Treatment', 30, 20, 1, '', 'Deep-conditioning treatment & blow-dry for dry, dull or dehydrated hair.', 'Ouai, Gisou, Color Wow, Fable & Mane, Amika, Olaplex, L\u2019Oréal Professionnel & Kérastase'),
    S('Hair', 'Treatments', 'Curl Definition & Care Treatment', 30, 20, 1, '', 'Cleansing, curl treatment & diffuser finish for definition, bounce & frizz control.', 'Ouai, Gisou, Color Wow, Fable & Mane, Amika, Olaplex, L\u2019Oréal Professionnel & Kérastase'),
    S('Hair', 'Treatments', 'Scalp Reset Treatment', 30, 20, 1, '', 'Purifying or soothing scalp treatment, massage & blow-dry.', 'Ouai, Gisou, Color Wow, Fable & Mane, Amika, Olaplex, L\u2019Oréal Professionnel & Kérastase'),
    S('Hair', 'Treatments', 'Keratin Smoothing Treatment', 150, 60, 1, '', 'Cleansing, keratin application, blow-dry & heat sealing for long-lasting smoothness.'),
    S('Hair', 'Treatments', 'Anti-Frizz Smoothing Treatment', 90, 35, 1, '', 'Heat-activated smoothing treatment & blow-dry for frizz and humidity control.', 'L\u2019Oréal Professionnel Keratin Alpha Sleek, Kérastase & Color Wow'),
    S('Hair', 'Treatments', 'Kérastase Fusio-Dose Custom Treatment', 30, 30, 1, '', 'Custom-blended treatment & blow-dry, personalised to two hair concerns.'),
    S('Hair', 'Treatments', 'Intensive Damage Repair Treatment', 45, 35, 1, '', 'Molecular or bond-repair treatment & blow-dry for damaged or overprocessed hair.', 'K18, Olaplex, L\u2019Oréal Professionnel, Kérastase & Amika'),
    S('Hair', 'Extensions', 'Tape-in Extension', 120, null, 0, '', 'Custom placement, professional application & seamless blending.'),
    S('Hair', 'Extensions', 'Clip-in Extension', 60, null, 0, '', 'Custom placement, professional application & seamless blending.'),
    S('Hair', 'Extensions', 'Keratin Bond Extension', 180, null, 0, '', 'Custom individual strand placement, bonded with keratin using heat, & seamless blending.'),
    S('Hair', 'Extensions', 'Nano Ring Extension', 180, null, 0, '', 'Extension attached with tiny nano beads & seamless blending.'),
    S('Hair', 'Extensions', 'Extension Application', 90, 20, 1, '', 'Cleansing, conditioning, blow-dry, refitting & seamless blending.'),
    S('Hair', 'Extensions', 'Extension Removal & Maintenance', 90, 30, 1, '', 'Removal, cleansing, conditioning, adhesive replacement, blow-dry, refitting & seamless blending.'),
    S('Nails', 'Manicure', 'Classic Manicure', 45, 10, 0, '', 'Shaping, cuticle care, buffing, scrub & cream.'),
    S('Nails', 'Manicure', 'Pose', 15, 5, 0, '', 'Regular polish application only.'),
    S('Nails', 'Manicure', 'Pose Manicure', 45, 12, 0, '', 'Manicure with a regular polish finish.'),
    S('Nails', 'Manicure', 'Gelish Manicure', 60, 20, 0, '', 'Manicure with a long-wear gel polish.'),
    S('Nails', 'Manicure', 'Fake Nails & Pose', 60, 15, 0, '', 'Press-on application with regular polish.'),
    S('Nails', 'Manicure', 'Fake Nails & Gelish', 75, 20, 0, '', 'Press-on application with gel polish.'),
    S('Nails', 'Pedicure', 'Classic Pedicure', 45, 15, 0, '', 'Soak, salt, bath bomb, shaping, cuticle care, buffing, scrub & cream.'),
    S('Nails', 'Pedicure', 'Pose Pedicure', 45, 17, 0, '', 'Pedicure with a regular polish finish.'),
    S('Nails', 'Pedicure', 'Gelish Pedicure', 60, 25, 0, '', 'Pedicure with a long-wear gel polish.'),
    S('Nails', 'Pedicure', 'Medical Pedicure', 60, 50, 0, '', 'Soak, salt, bath bomb, shaping, cuticle care, buffing, clinical care for callus, cracks & ingrown nails, medical scrub & medical cream.'),
    S('Nails', 'Enhancements', 'Rubber Base', 60, 25, 0, '', 'Reinforcing base layer on the nail.'),
    S('Nails', 'Enhancements', 'Extension Rubber Base', 90, 30, 0, '', 'Added length built with rubber base.'),
    S('Nails', 'Enhancements', 'Dip Powder', 60, 20, 0, '', 'Powder-dipped colour & strength overlay.'),
    S('Nails', 'Enhancements', 'Extension Dip Powder', 90, 30, 0, '', 'Added length built with dip powder.'),
    S('Nails', 'Enhancements', 'Refill Dip Powder', 60, 20, 0, '', 'Regrowth filled & resealed.'),
    S('Nails', 'Enhancements', 'Fiber Gel Overlay', 90, 35, 0, '', 'Fibreglass-reinforced gel overlay.'),
    S('Nails', 'Enhancements', 'Refill Fiber Gel Overlay', 60, 25, 0, '', 'Regrowth filled & resealed.'),
    S('Nails', 'Enhancements', 'Acrylic Full Set', 90, 45, 0, '', 'Sculpted acrylic set with full shaping.'),
    S('Nails', 'Enhancements', 'Acrylic Refill', 60, 20, 0, '', 'Regrowth filled & reshaped.'),
    S('Nails', 'Enhancements', 'Hard Gel Paper Full Set', 90, 40, 0, '', 'Sculpted hard gel built on paper forms.'),
    S('Nails', 'Enhancements', 'Aprés Gel-X Extension', 90, 35, 0, '', 'Soft gel tip application, full coverage.'),
    S('Nails', 'Enhancements', 'Gel X', 90, 35, 0, '', 'Soft gel tip application.'),
    S('Nails', 'Enhancements', 'Acrylic Remover', 30, 10, 0, '', 'Safe soak-off & natural nail prep.'),
    S('Nails', 'Enhancements', 'Gel X Extension Remover', 20, 5, 0, '', 'Safe soak-off & natural nail prep.'),
    S('Nails', 'Enhancements', 'Hard Gel Remover', 20, 5, 0, '', 'Safe file-off & natural nail prep.'),
    S('Nails', 'Enhancements', 'Nail Art Simple', 10, 1, 0, 'nail', 'Lines, dots & simple hand-painted detail.'),
    S('Nails', 'Enhancements', 'French, Ombre, Cat Eyes, Chrome', 15, 3, 0, '', 'Full-set finish, hand-applied.'),
    S('Nails', 'Enhancements', 'Blooming, Solid Gel, 3D Gel', 20, 5, 0, '', 'Full-set design, hand-sculpted.'),
    S('Nails', 'Designer Experience', 'Chanel Manicure', 60, 20, 0, '', 'Shaping, cuticle care, buffing, scrub, cream, massage, oils & Chanel vernis.'),
    S('Nails', 'Designer Experience', 'Chanel Pedicure Spa', 60, 25, 0, '', 'Soak, salt, bath bomb, shaping, cuticle care, buffing, scrub, cream, massage, oils & Chanel vernis.'),
    S('Nails', 'Designer Experience', 'Dior Manicure', 60, 20, 0, '', 'Shaping, cuticle care, buffing, scrub, cream, massage, oils & Dior vernis.'),
    S('Nails', 'Designer Experience', 'Dior Pedicure Spa', 60, 25, 0, '', 'Soak, salt, bath bomb, shaping, cuticle care, buffing, scrub, cream, massage, oils & Dior vernis.'),
    S('Make-up', 'Make-up', 'Cat-Eye Makeup', 30, 25, 0, '', 'Eye make-up only \u2014 the full eye area, no face base.'),
    S('Make-up', 'Make-up', 'Natural Makeup', 45, 50, 0, '', 'A soft, everyday full-face look.'),
    S('Make-up', 'Make-up', 'Full Glam Makeup', 60, 70, 0, '', 'The complete full-face glam, everything included.'),
    S('Make-up', 'Make-up', 'Engagement Makeup', 75, 100, 0, '', 'Full glam built to last the event, with touch-ups.'),
    S('Make-up', 'Make-up', 'Bridal Makeup', 120, 200, 0, '', 'Trial plus wedding-day full glam & on-site touch-ups.'),
    S('Brows & Lashes', 'Brows & Lashes', 'Brow Shaping', 20, 10, 0, '', 'Precision threading to define & refine the natural brows.'),
    S('Brows & Lashes', 'Brows & Lashes', 'Brow Lamination', 45, 20, 0, '', 'Lifts, sets & conditions the natural brows.'),
    S('Brows & Lashes', 'Brows & Lashes', 'Upper Lip Threading', 10, 5, 0, '', 'Precise threading of the upper lip area.'),
    S('Brows & Lashes', 'Brows & Lashes', 'Full Face Threading', 30, 20, 0, '', 'Complete face threading.'),
    S('Brows & Lashes', 'Brows & Lashes', 'Lash Lift & Tint', 60, 30, 0, '', 'Lifts & deepens the natural lashes.'),
    S('Brows & Lashes', 'Brows & Lashes', 'Lash Extension', 90, 30, 1, '', 'Custom silk extension application for length & fullness.'),
    S('Brows & Lashes', 'Brows & Lashes', 'Lash Refill', 60, 15, 1, '', 'Refreshes & restores the existing lash set.'),
  ];
  const STAFF = [
    { name: 'Peru', cats: ['Hair'], role: 'Hair', accent: '#7DD3FC', bio: 'Colour that reads as light, cuts that fall into place on their own. Peru has spent years learning what hair wants to do — and how to make it look intended.' },
    { name: 'Aya', cats: ['Nails'], role: 'Nails', accent: '#86EFAC', bio: 'Structure first, then colour. Aya builds sets that look like they grew that way — sharp edges, soft cuticles, nothing overdone.' },
    { name: 'Hala', cats: ['Nails'], role: 'Nails', accent: '#FDE047', bio: 'The steadiest hand in the room. Hala’s art is fine-lined and quiet, and her pedicures are the reason people book an hour early.' },
    { name: 'Mia', cats: ['Make-up'], role: 'Make-up', accent: '#FCC67E', bio: 'Skin first, always. Mia builds a face in layers so thin you forget they are there — and it still reads in every photo at 2 AM.' },
    { name: 'Jana', cats: ['Brows & Lashes'], role: 'Brows · Lashes', accent: '#D8B4FE', bio: 'Jana reads a face in a glance and works with it, never against it. Brows that frame, lashes that lift, threading so quick you forget to flinch.' },
  ];
  // ---- Hours + helpers ----
  let hours = { open: 10, closeWeek: 19, closeWeekend: 20 };
  const mkHours = (h) => ({ open: h.open, close: (dow) => (dow === 5 || dow === 6) ? h.closeWeekend : h.closeWeek });
  const priceLabel = (s) => s.price == null ? 'Custom quote' : (s.from ? 'from ' : '') + '$' + s.price + (s.unit ? ' / ' + s.unit : '');

  // ---- Live data ----
  // Starts from the built-in menu (instant, works offline) and any cached copy,
  // then refreshes from Supabase so the studio edits everything in the dashboard.
  let live = { CATS: CATS, SERVICES: SERVICES, STAFF: STAFF };
  let studioWA = '96171930290';
  try {
    const cached = JSON.parse(localStorage.getItem('incenso-catalog'));
    if (cached && cached.SERVICES && cached.SERVICES.length) {
      live = { CATS: cached.CATS, SERVICES: cached.SERVICES, STAFF: cached.STAFF };
      if (cached.hours) hours = cached.hours;
      if (cached.wa) studioWA = cached.wa;
    }
  } catch (e) {}

  const groupsOf = (cat) => [...new Set(live.SERVICES.filter((s) => s.cat === cat).map((s) => s.group))];

  window.IncensoCatalog = {
    get CATS() { return live.CATS; },
    get SERVICES() { return live.SERVICES; },
    get STAFF() { return live.STAFF; },
    get HOURS() { return mkHours(hours); },
    priceLabel, groupsOf,
    get STUDIO_WA() { return studioWA; },
    ready: null,
  };

  // ---- Refresh from Supabase (public read via RLS) ----
  const SB = 'https://gcqkkruzgxpqpqxeymqx.supabase.co';
  const KEY = 'sb_publishable_cRcQdQ7ZPXQMUoBOGm71DA_2d22DyLu';
  const HDR = { apikey: KEY, Authorization: 'Bearer ' + KEY };
  const q = (path) => fetch(SB + '/rest/v1/' + path, { headers: HDR }).then((r) => r.ok ? r.json() : Promise.reject(r.status));
  window.IncensoCatalog.ready = Promise.all([
    q('web_categories?select=*&active=eq.true&order=sort'),
    q('web_services?select=*&active=eq.true&order=sort'),
    q('web_staff?select=*&active=eq.true&order=sort'),
    q('web_config?select=*'),
  ]).then(([cats, svcs, staff, cfg]) => {
    if (!cats || !cats.length || !svcs || !svcs.length) return;
    const CATS2 = cats.map((c) => ({ name: c.name, file: c.file, ar: c.ar, h1: c.h1, intro: c.intro, chairs: c.chairs }));
    const SERVICES2 = svcs.map((s) => ({ cat: s.cat, group: s.grp, name: s.name, mins: s.mins, price: s.price, from: !!s.is_from, unit: s.unit || '', desc: s.descr || '', brands: s.brands || '', note: '' }));
    const STAFF2 = staff.map((st) => ({ name: st.name, cats: st.cats || [], role: st.role, accent: st.accent, bio: st.bio, photo: st.photo_url || '' }));
    const cfgMap = {}; (cfg || []).forEach((r) => { cfgMap[r.key] = r.value; });
    if (cfgMap.hours) hours = cfgMap.hours;
    if (cfgMap.studio && cfgMap.studio.wa) studioWA = cfgMap.studio.wa;
    live = { CATS: CATS2, SERVICES: SERVICES2, STAFF: STAFF2 };
    try { localStorage.setItem('incenso-catalog', JSON.stringify({ CATS: CATS2, SERVICES: SERVICES2, STAFF: STAFF2, hours, wa: studioWA })); } catch (e) {}
    try { document.dispatchEvent(new Event('catalog:updated')); } catch (e) {}
    return window.IncensoCatalog;
  }).catch(() => window.IncensoCatalog);
})();
