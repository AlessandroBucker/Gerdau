begin;

alter table public.parada_atividades
  add column if not exists percentual_conclusao integer not null default 0;

alter table public.parada_atividades
  drop constraint if exists parada_atividades_percentual_conclusao_check;

alter table public.parada_atividades
  add constraint parada_atividades_percentual_conclusao_check
  check (percentual_conclusao between 0 and 100);

create table if not exists public.parada_atividade_evolucoes (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references public.parada_atividades (id) on delete cascade,
  percentual_conclusao integer not null,
  criado_em timestamptz not null default now(),
  constraint parada_atividade_evolucoes_percentual_check
    check (percentual_conclusao between 0 and 100)
);

create index if not exists idx_parada_atividade_evolucoes_atividade
  on public.parada_atividade_evolucoes (atividade_id, criado_em desc);

alter table public.parada_atividade_evolucoes enable row level security;
revoke all on table public.parada_atividade_evolucoes from anon, authenticated;

comment on column public.parada_atividades.percentual_conclusao is
  'Percentual atual de execução da atividade, de 0 a 100.';
comment on table public.parada_atividade_evolucoes is
  'Histórico das atualizações de evolução das atividades de parada.';

commit;