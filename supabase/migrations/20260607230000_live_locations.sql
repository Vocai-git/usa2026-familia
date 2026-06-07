-- Ubicación en vivo (opt-in): cada dispositivo comparte su posición y todas las familias se ven
create table if not exists live_locations (
  id          text primary key,           -- id de dispositivo (aleatorio, en localStorage)
  name        text not null,
  family_id   text,
  color       text default '#2563EB',
  emoji       text default '🙂',
  lat         double precision not null,
  lng         double precision not null,
  accuracy    double precision,
  updated_at  timestamptz default now()
);

alter table live_locations enable row level security;

-- RLS pública (consistente con el resto de la app: familias de confianza, app efímera)
drop policy if exists live_select on live_locations;
drop policy if exists live_insert on live_locations;
drop policy if exists live_update on live_locations;
drop policy if exists live_delete on live_locations;
create policy live_select on live_locations for select using (true);
create policy live_insert on live_locations for insert with check (true);
create policy live_update on live_locations for update using (true);
create policy live_delete on live_locations for delete using (true);
