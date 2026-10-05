begin;
create table if not exists public.plantao_equipe (
  id text primary key check (length(id) between 1 and 100),
  name text not null check (length(btrim(name)) between 1 and 100),
  shift text not null check (shift in ('P', 'Q', '5X2')),
  team integer not null check (team between 0 and 3),
  active boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.plantao_equipe enable row level security;
revoke all on public.plantao_equipe from anon, authenticated;
grant all on public.plantao_equipe to service_role;
insert into public.plantao_equipe(id, name, shift, team) values
  ('mauricio', 'Mauricio', 'P', 0), ('marcos', 'Marcos', 'Q', 0), ('everton', 'Everton', '5X2', 0),
  ('nelson', 'Nelson', 'P', 1), ('luciano', 'Luciano', 'Q', 1),
  ('charles', 'Charles', 'P', 2), ('cleber', 'Cleber', 'Q', 2),
  ('lucas', 'Lucas', 'P', 3), ('wagner', 'Wagner', 'Q', 3)
on conflict (id) do nothing;
notify pgrst, 'reload schema';
commit;
