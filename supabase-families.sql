-- ============================================================
-- USA 2026 · Migración: Sistema multi-familia
-- ============================================================

-- Tabla de familias
create table if not exists families (
  id text primary key,
  name text not null,
  access_code text not null,
  color text default '#2563EB',
  emoji text default '👨‍👩‍👧‍👦',
  created_at timestamptz default now()
);

-- Agregar family_id a las tablas de datos
alter table events       add column if not exists family_id text references families(id);
alter table documents    add column if not exists family_id text references families(id);
alter table codes        add column if not exists family_id text references families(id);
alter table alarms       add column if not exists family_id text references families(id);
alter table checklists   add column if not exists family_id text references families(id);
alter table map_pins     add column if not exists family_id text references families(id);

-- NULL = compartido con todos; family_id = solo esa familia

-- RLS para families
alter table families enable row level security;
create policy "public_read_families"  on families for select using (true);
create policy "public_insert_families" on families for insert with check (true);
create policy "public_update_families" on families for update using (true);
create policy "public_delete_families" on families for delete using (true);

-- Datos iniciales de familias
insert into families (id, name, access_code, color, emoji) values
  ('moledo',  'Familia Moledo',  'moledo2026',  '#2563EB', '🦋'),
  ('hermanos','Familia Lewin',   'lewin2026',   '#16A34A', '🌟'),
  ('papa',    'Luis y Andrea',   'papa2026',    '#D97706', '✈️'),
  ('amigos',  'Familia amiga',   'amigos2026',  '#7C3AED', '🎉')
on conflict (id) do nothing;

-- Marcar datos existentes como compartidos (family_id = NULL = todos ven)
-- Los eventos actuales quedan como compartidos hasta que cada familia los migre
