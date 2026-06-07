-- Destinos por familia: qué etapas ve cada familia (null/empty = todas)
alter table stages add column if not exists families text[];

update stages set families = '{moledo,hermanos,papa}' where id = 'ida';
update stages set families = null                       where id = 'orlando';
update stages set families = '{moledo,papa}'            where id = 'crucero';
update stages set families = '{moledo}'                 where id = 'miami';
update stages set families = '{moledo,hermanos}'        where id = 'ny';
update stages set families = '{moledo,hermanos}'        where id = 'vuelta';

-- Etapa Mundial (Lewin + Castro)
insert into stages (id, name, from_date, to_date, color, sort_order, families)
values ('mundial', 'Mundial ⚽', '2026-06-11', '2026-07-19', '#16A34A', 7, '{hermanos,amigos}')
on conflict (id) do update set name = excluded.name, families = excluded.families,
  from_date = excluded.from_date, to_date = excluded.to_date, color = excluded.color, sort_order = excluded.sort_order;
