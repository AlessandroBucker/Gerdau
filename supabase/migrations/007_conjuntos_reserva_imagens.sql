begin;

create table if not exists public.conjuntos_reserva (
  id uuid primary key default gen_random_uuid(),
  prioridade text null,
  ordem text not null,
  equipamento text not null,
  observacao_area text null,
  padrinho_laminacao text null,
  recebimento_manutencao_central text null,
  recebimento_servico_area text null,
  necessidade_area text null,
  comentario_manutencao_central text null,
  status text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint conjuntos_reserva_prioridade_check check (
    prioridade is null or prioridade in (
      '24h', '1 semana', '2 semanas', '1 mês',
      '2 meses', '6 meses', '1 ano'
    )
  ),
  constraint conjuntos_reserva_ordem_nao_vazia_check check (btrim(ordem) <> ''),
  constraint conjuntos_reserva_equipamento_nao_vazio_check check (btrim(equipamento) <> '')
);

create table if not exists public.conjunto_imagens (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null references public.conjuntos_reserva (id) on delete cascade,
  caminho_arquivo text not null,
  nome_arquivo text not null,
  tipo_mime text not null,
  tamanho_bytes bigint not null,
  descricao text null,
  principal boolean not null default false,
  criado_em timestamptz not null default now(),

  constraint conjunto_imagens_caminho_nao_vazio_check check (btrim(caminho_arquivo) <> ''),
  constraint conjunto_imagens_nome_nao_vazio_check check (btrim(nome_arquivo) <> ''),
  constraint conjunto_imagens_tipo_check check (tipo_mime in ('image/jpeg', 'image/png', 'image/webp')),
  constraint conjunto_imagens_tamanho_check check (tamanho_bytes > 0 and tamanho_bytes <= 10485760),
  constraint conjunto_imagens_caminho_unique unique (caminho_arquivo)
);

create index if not exists idx_conjuntos_reserva_prioridade
  on public.conjuntos_reserva (prioridade, ativo);
create index if not exists idx_conjuntos_reserva_ordem
  on public.conjuntos_reserva (ordem);
create index if not exists idx_conjunto_imagens_conjunto
  on public.conjunto_imagens (conjunto_id, criado_em desc);
create unique index if not exists idx_conjunto_imagens_principal
  on public.conjunto_imagens (conjunto_id) where principal = true;

drop trigger if exists trg_conjuntos_reserva_atualizado_em on public.conjuntos_reserva;
create trigger trg_conjuntos_reserva_atualizado_em
before update on public.conjuntos_reserva
for each row execute function public.definir_atualizado_em();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'conjuntos-reserva-imagens',
  'conjuntos-reserva-imagens',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.conjuntos_reserva enable row level security;
alter table public.conjunto_imagens enable row level security;

revoke all on table public.conjuntos_reserva from anon, authenticated;
revoke all on table public.conjunto_imagens from anon, authenticated;

commit;
