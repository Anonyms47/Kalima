-- Numéros des demandes (événements et box famille) : KAL-<année>-DM001, remis à zéro chaque année.
create table request_counters (
  year smallint primary key,
  last_value integer not null
);
alter table request_counters enable row level security;
