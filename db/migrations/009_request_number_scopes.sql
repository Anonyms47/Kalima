-- Une suite par type de demande : KAL-<année>-EV001 (événements), KAL-<année>-BF001 (box famille).
drop table request_counters;
create table request_counters (
  scope text not null check (scope in ('EV', 'BF')),
  year smallint not null,
  last_value integer not null,
  primary key (scope, year)
);
alter table request_counters enable row level security;
