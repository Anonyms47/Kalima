-- KALIMA — schéma initial
-- Montants en FCFA (entiers). Horodatages en UTC.

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Comptes et sessions
-- ---------------------------------------------------------------------------

create table users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  first_name text,
  last_name text,
  phone text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Accès nominatifs de l'équipe KALIMA (gérante, associée).
create table staff (
  user_id uuid primary key references users(id) on delete cascade,
  display_name text not null,
  role text not null default 'manager' check (role in ('owner', 'manager')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Codes de connexion envoyés par e-mail (seul le hachage est conservé).
create table login_codes (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  ip text
);
create index login_codes_email_idx on login_codes (email, created_at desc);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index sessions_user_idx on sessions (user_id);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  tagline text not null default '',
  description text not null default '',
  included_note text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  -- Stock en nombre de boîtes. NULL = aucune limite définie ; 0 = épuisé.
  stock_quantity int check (stock_quantity is null or stock_quantity >= 0),
  -- Blocage manuel, prioritaire sur la quantité.
  manual_out_of_stock boolean not null default false,
  is_family_box boolean not null default false,
  reward_eligible boolean not null default false,
  sort_order int not null default 0,
  -- Note interne visible uniquement par l'équipe.
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  -- Une box famille n'est jamais éligible aux récompenses.
  constraint family_box_not_reward check (not (is_family_box and reward_eligible))
);

-- Formats d'une boîte. Prix fixe (ex. boîte de 10) ou prix à l'unité avec
-- minimum (ex. gaufres à 500 FCFA, minimum 2 par boîte).
create table product_formats (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  pricing text not null check (pricing in ('fixed', 'per_unit')),
  price int not null check (price >= 0),
  min_units int check (min_units is null or min_units >= 1),
  max_units int check (max_units is null or max_units >= 1),
  unit_label text not null default 'pièce',
  active boolean not null default true,
  sort_order int not null default 0,
  constraint per_unit_has_min check (pricing = 'fixed' or min_units is not null),
  constraint units_range check (max_units is null or min_units is null or max_units >= min_units)
);
create index product_formats_product_idx on product_formats (product_id, sort_order);

create table supplements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price int not null check (price >= 0),
  active boolean not null default true,
  sort_order int not null default 0
);

create table product_supplements (
  product_id uuid not null references products(id) on delete cascade,
  supplement_id uuid not null references supplements(id) on delete cascade,
  primary key (product_id, supplement_id)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  storage_path text,
  alt text not null default '',
  width int,
  height int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Ambassadeurs
-- ---------------------------------------------------------------------------

create table ambassadors (
  user_id uuid primary key references users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{4,12}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------------

create sequence order_number_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references users(id),
  kind text not null default 'standard' check (kind in ('standard', 'reward')),
  status text not null default 'awaiting_payment' check (status in (
    'awaiting_payment', 'expired', 'reward_requested', 'confirmed', 'in_production',
    'out_for_delivery', 'delivered', 'ready_for_pickup', 'picked_up',
    'cancelled', 'refunded'
  )),
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  customer_name text not null,
  customer_phone text not null,
  customer_email citext not null,
  delivery_area text,
  customer_note text,
  gift_message text,
  subtotal int not null check (subtotal >= 0),
  total int not null check (total >= 0),
  -- Parrainage figé au moment de la commande.
  ambassador_user_id uuid references users(id),
  referral_code text,
  -- Paiement
  payment_method text not null default 'manual_link',
  payment_declared_at timestamptz,
  paid_at timestamptz,
  paid_amount int,
  payment_reference text,
  payment_confirmed_by uuid references users(id),
  stock_reserved boolean not null default false,
  reservation_expires_at timestamptz,
  refunded_amount int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_referral check (ambassador_user_id is null or ambassador_user_id <> user_id),
  constraint reward_has_no_referral check (kind = 'standard' or ambassador_user_id is null)
);
create index orders_user_idx on orders (user_id, created_at desc);
create index orders_status_idx on orders (status, created_at desc);
create index orders_ambassador_idx on orders (ambassador_user_id) where ambassador_user_id is not null;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  format_label text not null,
  units int,
  unit_label text,
  box_base_price int not null,
  supplements jsonb not null default '[]',
  box_price int not null,
  boxes int not null check (boxes >= 1),
  line_total int not null,
  sort_order int not null default 0
);
create index order_items_order_idx on order_items (order_id);

create table order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid references users(id),
  actor_label text not null,
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id, created_at);

-- ---------------------------------------------------------------------------
-- Parrainages et récompenses
-- ---------------------------------------------------------------------------

-- Un filleul ne compte qu'une fois pour un ambassadeur (clé primaire).
create table referrals (
  ambassador_user_id uuid not null references users(id) on delete cascade,
  referred_user_id uuid not null references users(id) on delete cascade,
  qualifying_order_id uuid not null references orders(id),
  qualified_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  revoked_by uuid references users(id),
  primary key (ambassador_user_id, referred_user_id),
  constraint no_self check (ambassador_user_id <> referred_user_id)
);

create table rewards (
  id uuid primary key default gen_random_uuid(),
  ambassador_user_id uuid not null references users(id) on delete cascade,
  -- Rang de la récompense : 1 à 5 filleuls, 2 à 10, etc.
  tier int not null check (tier >= 1),
  status text not null default 'available' check (status in ('available', 'requested', 'delivered', 'cancelled')),
  product_id uuid references products(id),
  format_id uuid references product_formats(id),
  units int,
  order_id uuid unique references orders(id),
  requested_at timestamptz,
  delivered_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (ambassador_user_id, tier)
);

alter table orders add column reward_id uuid unique references rewards(id);

-- ---------------------------------------------------------------------------
-- Événements
-- ---------------------------------------------------------------------------

create table event_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references users(id) on delete set null,
  name text not null,
  phone text not null,
  email citext not null,
  occasion text not null,
  event_date date not null,
  location text not null,
  guests int check (guests is null or guests > 0),
  products_wanted text not null,
  details text,
  status text not null default 'new' check (status in (
    'new', 'in_discussion', 'quote_sent', 'deposit_received', 'confirmed', 'declined', 'completed'
  )),
  quote_amount int check (quote_amount is null or quote_amount >= 0),
  deposit_amount int check (deposit_amount is null or deposit_amount >= 0),
  deposit_paid_at timestamptz,
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index event_requests_status_idx on event_requests (status, event_date);

-- ---------------------------------------------------------------------------
-- Notifications e-mail (file d'envoi)
-- ---------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  event_request_id uuid references event_requests(id) on delete cascade,
  kind text not null,
  recipient citext not null,
  subject text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts int not null default 0,
  provider text,
  provider_message_id text,
  claimed_at timestamptz,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
-- Un événement de commande ne déclenche qu'un seul envoi initial.
create unique index notifications_order_kind_uniq on notifications (order_id, kind) where order_id is not null;
create index notifications_pending_idx on notifications (status, next_attempt_at);

-- ---------------------------------------------------------------------------
-- Paramètres et journal
-- ---------------------------------------------------------------------------

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id)
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references users(id),
  actor_label text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on audit_log (created_at desc);
create index audit_log_entity_idx on audit_log (entity_type, entity_id);

-- Limitation simple des demandes (codes de connexion, formulaires).
create table rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, window_start)
);
