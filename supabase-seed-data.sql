-- ============================================================
-- Push subscriptions (agregar ANTES que los datos del viaje)
-- ============================================================
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  alarms jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table push_subscriptions enable row level security;
create policy "public_push_select" on push_subscriptions for select using (true);
create policy "public_push_insert" on push_subscriptions for insert with check (true);
create policy "public_push_update" on push_subscriptions for update using (true);
create policy "public_push_delete" on push_subscriptions for delete using (true);

-- ============================================================
-- USA 2026 · Datos reales del viaje
-- Correr en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- CÓDIGOS — Universal Orlando (Familia Moledo)
-- ============================================================
insert into codes (label, code, sub_info, people, family_id) values
  ('Universal · Confirmación', '210-837-896-2ALMUN', 'Válido 12–25 jun · 4 parques · 14 días', array['agustin','belen','felipe'], 'moledo'),
  ('Universal · Barcode Agustín', '84043112605050752163702085329', 'Adulto · 12–25 jun 2026', array['agustin'], 'moledo'),
  ('Universal · Barcode Belén', '84043112605050752163647534292', 'Adulto · 12–25 jun 2026', array['belen'], 'moledo'),
  ('Universal · Barcode Felipe', '84044112605050752163673581966', 'Niño · 12–25 jun 2026', array['felipe'], 'moledo');

-- ============================================================
-- EVENTOS — Universal Parks (inicio de acceso)
-- ============================================================
insert into events (stage_id, date, type, title, details, location, people, family_id) values
  ('orlando', '2026-06-12', 'park', 'Primer día Universal Parks 🎢',
   '{"confirmation": "210-837-896-2ALMUN", "notes": "Válido hasta el 25 jun. 4 parques: USF, IoA, Volcano Bay, Epic Universe."}',
   '{"name": "Universal Orlando Resort", "address": "6000 Universal Blvd, Orlando, FL 32819", "lat": 28.4749, "lng": -81.4674}',
   array['agustin','belen','felipe'], 'moledo');

-- ============================================================
-- PENDIENTE — agregar cuando lleguen los documentos:
-- - Vuelos (ALC → ? → MCO y vuelta)
-- - Hotel Orlando
-- - Crucero Royal Caribbean
-- - Hotel Miami
-- - Hotel Nueva York
-- - ESTA de cada persona
-- - Seguro de viaje (Assist Card)
-- ============================================================
