-- Liens de connexion à usage unique, créés depuis un poste ayant accès à la base
-- (scripts/login-link.mts). Secours quand l'envoi des codes par e-mail est indisponible.
create table login_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index login_links_user_idx on login_links (user_id);
alter table login_links enable row level security;
