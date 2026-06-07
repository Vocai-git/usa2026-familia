-- Gastos por familia (cada familia anota lo suyo, no se reparte entre familias)
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  family_id  text not null,
  concept    text not null,
  amount_usd numeric not null,
  category   text default 'other',
  created_at timestamptz default now()
);
alter table expenses enable row level security;
drop policy if exists exp_all on expenses;
create policy exp_all on expenses for all using (true) with check (true);
