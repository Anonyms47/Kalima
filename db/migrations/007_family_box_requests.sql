-- Demandes de box famille : composées par le client sur le site, prix fixé ensuite
-- par KALIMA dans l'administration (échange sur WhatsApp).
create table family_box_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references users(id) on delete set null,
  name text not null,
  phone text not null,
  -- [{ side: 'sweet' | 'salty', item, quantity }]
  items jsonb not null default '[]',
  guests int check (guests is null or guests > 0),
  wanted_date date,
  note text,
  status text not null default 'new' check (status in ('new', 'quoted', 'confirmed', 'delivered', 'cancelled')),
  price int check (price is null or price >= 0),
  paid_at timestamptz,
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index family_box_requests_status_idx on family_box_requests (status, created_at desc);
alter table family_box_requests enable row level security;
