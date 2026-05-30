-- ============================================================
-- USA 2026 · Supabase Schema
-- Correr en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Personas del viaje
create table if not exists people (
  id text primary key,
  name text not null,
  emoji text default '👤',
  sort_order int default 0
);

-- Grupos lógicos
create table if not exists groups (
  id text primary key,
  name text not null,
  member_ids text[] not null default '{}'
);

-- Etapas del viaje
create table if not exists stages (
  id text primary key,
  name text not null,
  from_date date not null,
  to_date date not null,
  color text default '#C8602A',
  sort_order int default 0
);

-- Eventos (vuelos, hoteles, actividades, etc.)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  stage_id text references stages(id) on delete cascade,
  date date not null,
  time text,
  type text not null default 'other',
  title text not null,
  details jsonb default '{}',
  location jsonb default '{}',
  people text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Documentos (metadata; el archivo va a Storage)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'other',
  owner_id text,
  storage_path text,
  notes text,
  created_at timestamptz default now()
);

-- Códigos y reservas (búsqueda rápida)
create table if not exists codes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code text not null,
  sub_info text,
  people text[] default '{}',
  linked_event uuid references events(id) on delete set null,
  created_at timestamptz default now()
);

-- Alarmas
create table if not exists alarms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  trigger_at timestamptz not null,
  linked_event uuid references events(id) on delete set null,
  action jsonb default '{}',
  people text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Checklists
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  stage_id text references stages(id) on delete set null,
  people text[] default '{}'
);

-- Items de checklists
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid references checklists(id) on delete cascade,
  text text not null,
  sort_order int default 0
);

-- Contactos de emergencia
create table if not exists emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  phone text,
  notes text,
  sort_order int default 0
);

-- Pines del mapa
create table if not exists map_pins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'other',
  lat float not null,
  lng float not null,
  address text,
  people text[] default '{}',
  linked_event uuid references events(id) on delete set null
);

-- ============================================================
-- Row Level Security: acceso público de lectura
-- (la app no tiene auth, todos leen todo)
-- ============================================================
alter table people enable row level security;
alter table groups enable row level security;
alter table stages enable row level security;
alter table events enable row level security;
alter table documents enable row level security;
alter table codes enable row level security;
alter table alarms enable row level security;
alter table checklists enable row level security;
alter table checklist_items enable row level security;
alter table emergency_contacts enable row level security;
alter table map_pins enable row level security;

-- Políticas: anon puede leer y escribir todo (app familiar sin auth)
do $$
declare
  t text;
begin
  foreach t in array array['people','groups','stages','events','documents','codes','alarms','checklists','checklist_items','emergency_contacts','map_pins']
  loop
    execute format('create policy "public_read_%s" on %I for select using (true)', t, t);
    execute format('create policy "public_insert_%s" on %I for insert with check (true)', t, t);
    execute format('create policy "public_update_%s" on %I for update using (true)', t, t);
    execute format('create policy "public_delete_%s" on %I for delete using (true)', t, t);
  end loop;
end $$;

-- ============================================================
-- Storage bucket para documentos
-- ============================================================
insert into storage.buckets (id, name, public) values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "public_storage_read" on storage.objects for select using (bucket_id = 'documents');
create policy "public_storage_insert" on storage.objects for insert with check (bucket_id = 'documents');
create policy "public_storage_delete" on storage.objects for delete using (bucket_id = 'documents');

-- ============================================================
-- Datos iniciales del viaje
-- ============================================================

-- Personas
insert into people (id, name, emoji, sort_order) values
  ('agustin', 'Agustín', '👨', 1),
  ('belen',   'Belén',   '👩', 2),
  ('felipe',  'Felipe',  '👦', 3),
  ('luis',    'Luis',    '👴', 4),
  ('andrea',  'Andrea',  '👵', 5),
  ('daniela', 'Daniela', '👩', 6),
  ('hernan',  'Hernán',  '👨', 7),
  ('bautista','Bautista','🧒', 8),
  ('estefano','Estéfano','🧒', 9),
  ('amigo1',  'Familia amiga', '👨‍👩‍👦', 10)
on conflict (id) do nothing;

-- Grupos
insert into groups (id, name, member_ids) values
  ('todos',    'Todos',        array['agustin','belen','felipe','luis','andrea','daniela','hernan','bautista','estefano','amigo1']),
  ('nucleo',   'Núcleo',       array['agustin','belen','felipe']),
  ('crucero',  'Crucero',      array['agustin','belen','felipe','luis','andrea']),
  ('papa_andrea', 'Luis y Andrea', array['luis','andrea']),
  ('hermanos', 'Hermanos',     array['daniela','hernan','bautista','estefano'])
on conflict (id) do nothing;

-- Etapas
insert into stages (id, name, from_date, to_date, color, sort_order) values
  ('orlando', 'Orlando 🎡',      '2026-06-10', '2026-06-28', '#E8622A', 1),
  ('crucero', 'Crucero 🚢',      '2026-06-28', '2026-07-05', '#1A6FAB', 2),
  ('miami',   'Miami 🌴',        '2026-07-05', '2026-07-09', '#2EAA6E', 3),
  ('ny',      'Nueva York 🗽',   '2026-07-09', '2026-07-19', '#8B2FC9', 4)
on conflict (id) do nothing;

-- Contactos de emergencia
insert into emergency_contacts (label, phone, notes, sort_order) values
  ('Consulado argentino · Miami',    '+1 305 373 1889', 'Lunes a viernes 9-13h', 1),
  ('Consulado argentino · NY',       '+1 212 603 0400', 'Emergencias 24h', 2),
  ('Assist Card desde USA',          '+1 877 222 0220', 'Gratuito desde USA. Tener número de póliza a mano', 3),
  ('Emergencias USA',                '911',             'Policía, bomberos, ambulancia', 4),
  ('American Airlines',              '+1 800 433 7300', 'Para cambios de vuelo', 5),
  ('Royal Caribbean',                '+1 800 256 6649', 'Emergencias crucero', 6)
on conflict do nothing;
