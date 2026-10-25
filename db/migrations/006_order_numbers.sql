-- Numéros de commande lisibles : KA-<année sur 2 chiffres>-<numéro>, remis à zéro chaque année.
create table order_counters (
  year smallint primary key,
  last_value integer not null
);
alter table order_counters enable row level security;
