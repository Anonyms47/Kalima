-- Les extensions vivent dans le schéma « extensions » (recommandation Supabase),
-- pas dans « public ». Le site fixe search_path = public, extensions à la connexion.
create schema if not exists extensions;
alter extension citext set schema extensions;
