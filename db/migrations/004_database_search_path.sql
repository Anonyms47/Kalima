-- Le chemin de recherche est fixé au niveau de la base plutôt qu'à la connexion :
-- le pooler Supabase (mode transaction) ne gère pas les paramètres de démarrage.
-- Sur Supabase, « extensions » est déjà dans le chemin par défaut ; l'instruction
-- est ignorée si les droits manquent.
do $$
begin
  execute format('alter database %I set search_path = "$user", public, extensions', current_database());
exception when insufficient_privilege then
  raise notice 'search_path non modifié (droits insuffisants) : chemin par défaut conservé.';
end $$;
