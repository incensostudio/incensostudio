-- Re-capture the live schema used by schema.js (run in the Supabase SQL editor):
select c.table_name, c.column_name, c.is_nullable, c.column_default is not null as has_default, c.identity_generation, c.data_type
from information_schema.columns c where c.table_schema = 'public' order by c.table_name, c.ordinal_position;
select t.relname, i.indisprimary, (select array_agg(a.attname order by k.ord) from unnest(i.indkey) with ordinality k(attnum, ord) join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum) cols
from pg_index i join pg_class t on t.oid = i.indrelid join pg_namespace n on n.oid = t.relnamespace where n.nspname = 'public' and i.indisunique;
select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname in ('public', 'storage');
