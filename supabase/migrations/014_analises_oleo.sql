create table if not exists public.analises_oleo (
  id uuid primary key default gen_random_uuid(),
  local text not null check (length(trim(local)) between 1 and 200),
  plano text not null check (length(trim(plano)) between 1 and 200),
  tipo_oleo text not null check (length(trim(tipo_oleo)) between 1 and 200),
  data_planejada date not null,
  coletado boolean not null default false,
  enviado boolean not null default false,
  qualidade text not null default 'Pendente' check (qualidade in ('Pendente', 'Normal', 'Atenção', 'Crítico')),
  acao text not null default '' check (length(acao) <= 4000),
  ordem text not null default '' check (length(ordem) <= 200),
  data_analise date,
  created_at timestamptz not null default now(),
  check (not enviado or coletado),
  check ((qualidade = 'Pendente' and data_analise is null) or (qualidade <> 'Pendente' and enviado and length(trim(ordem)) > 0 and data_analise is not null))
);
create index if not exists analises_oleo_data_planejada_idx on public.analises_oleo (data_planejada);
alter table public.analises_oleo enable row level security;
revoke all on public.analises_oleo from anon, authenticated;
grant all on public.analises_oleo to service_role;
