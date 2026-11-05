-- Sur Supabase, le schéma public est exposé par l'API REST (rôles anon et
-- authenticated). Le site n'utilise pas cette API : il se connecte côté serveur
-- avec le rôle propriétaire des tables, qui n'est pas soumis à RLS.
-- Activer RLS sans aucune politique ferme donc l'API publique sur toutes les tables.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
