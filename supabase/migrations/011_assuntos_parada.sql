create table if not exists public.parada_assuntos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.parada_detalhes (evento_id) on delete cascade,
  etapa text not null,
  conteudo text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint parada_assuntos_etapa_check check (etapa in ('pre_parada', 'pos_parada')),
  constraint parada_assuntos_evento_etapa_unique unique (evento_id, etapa)
);

create index if not exists idx_parada_assuntos_evento on public.parada_assuntos (evento_id);

drop trigger if exists trg_parada_assuntos_atualizado_em on public.parada_assuntos;
create trigger trg_parada_assuntos_atualizado_em before update on public.parada_assuntos
for each row execute function public.definir_atualizado_em();

alter table public.parada_assuntos enable row level security;
revoke all on table public.parada_assuntos from anon, authenticated;

comment on table public.parada_assuntos is
  'Assuntos e comentários de pré-parada e pós-parada vinculados ao evento de parada.';
