/* Live Supabase schema (public), captured from project gcqkkruzgxpqpqxeymqx.
   Each column is name:FT —
     F  '!' NOT NULL, no default (must be sent)   '~' NOT NULL with a default   '?' nullable   '*' nullable with a default
        'A' identity ALWAYS (must NOT be sent)     'B' identity BY DEFAULT
     T  s text · u uuid · i integer/bigint · n numeric · b boolean · d date · t timestamptz · j jsonb · a array
   `unique` lists every unique index (primary key first). Re-capture with the queries in tests/e2e/schema.sql. */
const T = (cols, unique) => ({
  cols: Object.fromEntries(cols.split(/\s+/).filter(Boolean).map((c) => { const [n, ft] = c.split(':'); return [n, ft]; })),
  unique,
});
module.exports = {
  audit: T('id:Ai at:*t action:?s ref:?s by:?s', [['id']]),
  blocks: T('id:!s staff:?s start:?t mins:?i label:?s', [['id']]),
  bookings: T(`id:~u ref:!s user_id:?u services:~j service_mins:~j staff:*j date:?d time:?s start_min:?i mins:?i price:~i
    price_from:~b quote:~b quote_items:~j pay:?s paid:~i due:~i refund:~i gift:~j status:~s notes:?s mood:?s flags:~j drink:~j
    smoke:?s created_at:~t updated_at:~t cancelled_at:?t cancel_reason:?s pay_status:?s completed:~b extra:?j final:?j
    placed_at:?t pay_deadline:?t desk_status:?s staff_name:?s client_id:?u source:?s settled_at:?t settle_method:?s tip:?i
    discount:?i gross:?i level:?s refund_sent:?b arrived_at:?t visit:?s cat:?s products:?j order_plan:?j gift_parts:?j`, [['id'], ['ref']]),
  clients: T(`id:~u name:!s phone:*s instagram:*s tiktok:*s note:*s created_at:~t visits:~i spend:~i last_visit:?d email:?s
    birthday:?d tier:?s tags:?a newsletter:?b blocked:?b photo_url:?s no_shows:?i notes:?s prefs:?j`, [['id']]),
  desk_users: T(`id:~u auth_user_id:?u email:?s name:!s initials:?s role:!s role_label:*s colour:~s passcode_hash:?s
    auth_secret:?s sort:~i created_at:~t phone:?s staff:?s modules:~a flags:~j active:~b added:~t`, [['id'], ['email'], ['auth_user_id']]),
  expenses: T(`id:!s category:?s label:?s amount:?n date:?t method:?s created_at:*t planned:?b due:?t fixed_id:?s month:?s
    paid_at:?t by:?s`, [['id']]),
  gift_cards: T(`code:!s amount:!i balance:!i to_name:?s to_phone:?s from_name:?s msg:?s color:?s buyer_id:?u buyer_name:?s
    buyer_phone:?s pay:?s status:~s confirmed:~b redemptions:~j created_at:~t expires_at:~t sold_by:?s hold:?b
    cancel_reason:?s deadline:?t uses:?j`, [['code']]),
  income: T('id:!s label:?s amount:~n method:?s date:~t created_at:~t', [['id']]),
  newsletter: T('phone:!s created_at:~t', [['phone']]),
  orders: T(`id:~u ref:!s user_id:?u items:~j total:~i status:~s method:?s pay:?s name:?s phone:?s email:?s address:~j
    discount:~i tier:?s cancel_reason:?s created_at:~t updated_at:~t pay_status:?s gift:?j courier:?j to_pay:?i placed_at:?t
    pay_deadline:?t refund:?i refund_sent:?b partial:?b source:?s sold_by:?s fulfil:?s delivery:?i card_link:?s
    cancelled_at:?t deadline:?t notes:?s gift_parts:?j`, [['id'], ['ref']]),
  payouts: T('id:!s staff:?s amount:?n at:*t note:?s', [['id']]),
  profiles: T(`id:!u phone:?s name:?s email:?s photo_url:?s prefs:~j tier:~s spend_12mo:~i created_at:~t updated_at:~t
    birthday:?d`, [['id']]),
  purchase_orders: T(`id:!s supplier_id:?s status:*s created_at:*t expected:?t received_at:?t items:*j notes:?s by:?s
    unpaid:*b terms:?s part_amt:?i due_days:?i due_by:?t short_by:?j`, [['id']]),
  ref_counters: T('prefix:!s n:~i', [['prefix']]),
  restock_requests: T('id:~u user_id:?u product:!s phone:?s created_at:~t', [['id'], ['user_id', 'product']]),
  shifts: T('staff:!s date:!d off:*b start_hour:?n end_hour:?n label:?s', [['staff', 'date']]),
  suppliers: T(`id:!s name:!s contact:?s phone:?s email:?s brands:?s terms:?s lead_days:?i notes:?s created_at:*t`, [['id']]),
  supplies: T(`id:!s name:!s brand:?s cat:?s unit:?s qty:~i low:~i cost:~n supplier_id:?s last_in:?t log:~j created_at:~t`, [['id']]),
  wa_log: T('id:~u ref:?s kind:?s phone:?s template:?s created_at:~t', [['id'], ['ref', 'kind']]),
  web_categories: T('name:!s file:!s ar:?s h1:?s intro:?s chairs:?s sort:~i active:~b hero_url:?s', [['name']]),
  web_config: T('key:!s value:!j', [['key']]),
  web_gallery: T('id:!s image_url:?s caption:?s category:?s sort:*i active:*b', [['id']]),
  web_pages: T('key:!s title:?s body:?s updated_at:*t', [['key']]),
  web_products: T(`id:~u cat:?s name:!s note:?s details:?s price:~i stock:?i sort:~i active:~b updated_at:~t created_at:~t
    cost:?n sku:?s low:?i image_url:?s category:?s descr:?s images:~j`, [['id'], ['name']]),
  web_services: T(`id:Bi cat:?s grp:?s name:!s mins:~i price:?i is_from:~b unit:*s descr:*s brands:*s sort:~i active:~b`, [['id']]),
  web_space: T('id:!s image_url:?s caption:?s sort:*i', [['id']]),
  web_staff: T(`id:Ai name:!s cats:~a role:?s accent:?s bio:?s photo_url:?s sort:~i active:~b phone:?s days:?a start_hour:?n
    end_hour:?n commission:?n time_off:*j services:?a`, [['id'], ['name']]),
};
