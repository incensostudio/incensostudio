/* Baseline studio data for tests (made-up names; mirrors the live table shapes). */
const OWNER_MODULES = ['home', 'today', 'bookings', 'clients', 'orders', 'gifts', 'products', 'supply', 'money', 'staff', 'services', 'messages', 'settings'];
const OWNER_FLAGS = { access: true, prices: true, settle: true, amounts: true, ownOnly: false, refunds: true, contacts: true, broadcast: true };
module.exports = (fake, P) => {
  fake.seed('desk_users', [
    // same permissions as the live owner rows (Ali, Sophia) and the live stylist preset
    { name: P.owner.name, role: 'owner', phone: '+' + P.owner.phone, active: true, modules: OWNER_MODULES, flags: OWNER_FLAGS },
    { name: P.stylist.name, role: 'stylist', staff: 'Peru', phone: '+' + P.stylist.phone, active: true, modules: ['home', 'today', 'bookings', 'clients'], flags: { access: false, prices: false, settle: false, amounts: false, ownOnly: true, refunds: false, broadcast: false } },
    { name: P.owner2.name, role: 'owner', phone: '+' + P.owner2.phone, active: true, modules: OWNER_MODULES, flags: OWNER_FLAGS },
  ]);
  fake.seed('web_staff', [
    { name: 'Peru', cats: ['Hair'], role: 'Hair', accent: '#F2C94C', bio: 'Colour and cuts.', sort: 1, active: true, phone: '+961 3 000 001', days: [0, 1, 2, 3, 4, 5, 6], start_hour: 10, end_hour: 19, commission: 40, time_off: [], services: [] },
    { name: 'Lara', cats: ['Nails'], role: 'Nails', accent: '#F4A7B9', bio: 'Gel and nail art.', sort: 2, active: true, phone: '+961 3 000 002', days: [0, 1, 2, 3, 4, 5, 6], start_hour: 10, end_hour: 19, commission: 40, time_off: [], services: [] },
  ]);
  fake.seed('web_categories', [
    { name: 'Hair', file: 'hair.html', ar: 'شعر', h1: 'Hair.', intro: 'Hair intro', chairs: 'Peru', sort: 1, active: true },
    { name: 'Nails', file: 'nails.html', ar: 'أظافر', h1: 'Nails.', intro: 'Nails intro', chairs: 'Lara', sort: 2, active: true },
  ]);
  fake.seed('web_services', [
    { cat: 'Hair', grp: 'Styling', name: 'Blow-dry', mins: 45, price: 25, is_from: false, sort: 1, active: true },
    { cat: 'Hair', grp: 'Colour', name: 'Root colour', mins: 90, price: 60, is_from: true, sort: 2, active: true },
    { cat: 'Nails', grp: 'Gel', name: 'Gel manicure', mins: 60, price: 30, is_from: false, sort: 3, active: true },
  ]);
  fake.seed('web_config', [
    { key: 'hours', value: { open: 10, closeWeek: 19, closeWeekend: 20, closedDays: [] } },
    { key: 'studio', value: { address: 'Test street', city: 'Tripoli', wa: '96170000009', email: 'hello@example.com', instagram: 'incenso', tiktok: '' } },
    { key: 'fixedCosts', value: [{ id: 'f1', label: 'Rent', amount: 1000 }] },
  ]);
  fake.seed('profiles', [
    { id: P.guest.id, phone: '+' + P.guest.phone, name: P.guest.name, prefs: {} },
    { id: P.friend.id, phone: '+' + P.friend.phone, name: P.friend.name, prefs: {} },
  ]);
  fake.seed('ref_counters', [{ prefix: 'BK', n: 1000 }, { prefix: 'OR', n: 1000 }, { prefix: 'GF', n: 1000 }]);
};
