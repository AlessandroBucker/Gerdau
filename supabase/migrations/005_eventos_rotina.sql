begin;

create extension if not exists pgcrypto;

create or replace function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sigla text null,
  descricao text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint areas_nome_nao_vazio_check check (btrim(nome) <> ''),
  constraint areas_nome_unique unique (nome),
  constraint areas_sigla_unique unique (sigla)
);

create table if not exists public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  area_id uuid null references public.areas (id) on delete set null,
  turno text null,
  escala text null,
  numero_pessoal text null,
  nome_completo_sap text not null,
  nome text not null,
  horario text null,
  funcao text null,
  especialidade text null,
  percentual_programacao numeric(5,2) null,
  email text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint colaboradores_numero_pessoal_check
    check (numero_pessoal is null or numero_pessoal ~ '^[0-9]{8}$'),
  constraint colaboradores_numero_pessoal_unique unique (numero_pessoal),
  constraint colaboradores_nome_completo_sap_nao_vazio_check
    check (btrim(nome_completo_sap) <> ''),
  constraint colaboradores_nome_nao_vazio_check check (btrim(nome) <> ''),
  constraint colaboradores_percentual_programacao_check
    check (percentual_programacao is null or percentual_programacao between 0 and 100),
  constraint colaboradores_email_check
    check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

comment on column public.colaboradores.numero_pessoal is
  'Número pessoal de oito dígitos; pode permanecer NULL enquanto não informado.';
comment on column public.colaboradores.nome_completo_sap is
  'Nome completo conforme cadastro do SAP.';
comment on column public.colaboradores.nome is
  'Nome usual ou nome curto exibido nas telas.';
comment on column public.colaboradores.horario is
  'Descrição do horário de trabalho, por exemplo 13:42 AS 23:00.';
comment on column public.colaboradores.percentual_programacao is
  'Percentual de programação do colaborador, entre 0 e 100.';

create table if not exists public.tipos_evento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  cor text not null,
  icone text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint tipos_evento_nome_nao_vazio_check check (btrim(nome) <> ''),
  constraint tipos_evento_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tipos_evento_cor_check check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  constraint tipos_evento_nome_unique unique (nome),
  constraint tipos_evento_slug_unique unique (slug)
);

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  tipo_evento_id uuid not null references public.tipos_evento (id) on delete restrict,
  area_id uuid null references public.areas (id) on delete set null,
  titulo text not null,
  descricao text null,
  data_inicio date not null,
  hora_inicio time null,
  data_fim date not null,
  hora_fim time null,
  dia_inteiro boolean not null default true,
  status text not null default 'programado',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint eventos_titulo_nao_vazio_check check (btrim(titulo) <> ''),
  constraint eventos_periodo_check check (
    data_fim > data_inicio
    or (
      data_fim = data_inicio
      and (hora_inicio is null or hora_fim is null or hora_fim >= hora_inicio)
    )
  ),
  constraint eventos_dia_inteiro_horas_check check (
    not dia_inteiro or (hora_inicio is null and hora_fim is null)
  ),
  constraint eventos_status_check check (
    status in ('rascunho', 'programado', 'em_andamento', 'concluido', 'cancelado')
  )
);

create table if not exists public.evento_colaboradores (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  papel text not null default 'participante',
  observacao text null,
  confirmado boolean not null default false,
  criado_em timestamptz not null default now(),

  primary key (evento_id, colaborador_id),
  constraint evento_colaboradores_papel_nao_vazio_check check (btrim(papel) <> '')
);

create table if not exists public.parada_detalhes (
  evento_id uuid primary key references public.eventos (id) on delete cascade,
  ordem_principal text null,
  setor_responsavel text null,
  tipo_manutencao text null,
  impacto text null,
  observacao text null,
  status_execucao text not null default 'programada',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint parada_detalhes_status_check check (
    status_execucao in ('programada', 'liberada', 'em_andamento', 'concluida', 'cancelada')
  )
);

create table if not exists public.parada_atividades (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.parada_detalhes (evento_id) on delete cascade,
  area_id uuid null references public.areas (id) on delete set null,
  sequencia integer not null,
  atividade text not null,
  ordem text null,
  setor_responsavel text null,
  data_inicio date null,
  hora_inicio time null,
  data_fim date null,
  hora_fim time null,
  duracao_prevista_minutos integer null,
  duracao_real_minutos integer null,
  status text not null default 'programada',
  observacao text null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint parada_atividades_sequencia_check check (sequencia > 0),
  constraint parada_atividades_atividade_nao_vazia_check check (btrim(atividade) <> ''),
  constraint parada_atividades_duracao_prevista_check
    check (duracao_prevista_minutos is null or duracao_prevista_minutos >= 0),
  constraint parada_atividades_duracao_real_check
    check (duracao_real_minutos is null or duracao_real_minutos >= 0),
  constraint parada_atividades_datas_check
    check (data_inicio is null or data_fim is null or data_fim >= data_inicio),
  constraint parada_atividades_status_check check (
    status in ('programada', 'liberada', 'em_andamento', 'concluida', 'cancelada')
  ),
  constraint parada_atividades_evento_sequencia_unique unique (evento_id, sequencia)
);

create table if not exists public.parada_atividade_colaboradores (
  atividade_id uuid not null references public.parada_atividades (id) on delete cascade,
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  papel text not null default 'executante',
  horas_previstas numeric(8,2) null,
  horas_realizadas numeric(8,2) null,
  criado_em timestamptz not null default now(),

  primary key (atividade_id, colaborador_id),
  constraint parada_atividade_colaboradores_papel_nao_vazio_check check (btrim(papel) <> ''),
  constraint parada_atividade_colaboradores_horas_previstas_check
    check (horas_previstas is null or horas_previstas >= 0),
  constraint parada_atividade_colaboradores_horas_realizadas_check
    check (horas_realizadas is null or horas_realizadas >= 0)
);

create index if not exists idx_colaboradores_area_id on public.colaboradores (area_id);
create index if not exists idx_colaboradores_nome_completo_sap on public.colaboradores (nome_completo_sap);
create index if not exists idx_colaboradores_ativos on public.colaboradores (ativo) where ativo = true;
create index if not exists idx_eventos_periodo on public.eventos (data_inicio, data_fim);
create index if not exists idx_eventos_tipo_periodo on public.eventos (tipo_evento_id, data_inicio, data_fim);
create index if not exists idx_eventos_area_periodo on public.eventos (area_id, data_inicio, data_fim);
create index if not exists idx_evento_colaboradores_colaborador on public.evento_colaboradores (colaborador_id);
create index if not exists idx_parada_atividades_evento on public.parada_atividades (evento_id, sequencia);
create index if not exists idx_parada_atividades_ordem on public.parada_atividades (ordem);
create index if not exists idx_parada_atividade_colaboradores_colaborador
  on public.parada_atividade_colaboradores (colaborador_id);

drop trigger if exists trg_areas_atualizado_em on public.areas;
create trigger trg_areas_atualizado_em before update on public.areas
for each row execute function public.definir_atualizado_em();

drop trigger if exists trg_colaboradores_atualizado_em on public.colaboradores;
create trigger trg_colaboradores_atualizado_em before update on public.colaboradores
for each row execute function public.definir_atualizado_em();

drop trigger if exists trg_tipos_evento_atualizado_em on public.tipos_evento;
create trigger trg_tipos_evento_atualizado_em before update on public.tipos_evento
for each row execute function public.definir_atualizado_em();

drop trigger if exists trg_eventos_atualizado_em on public.eventos;
create trigger trg_eventos_atualizado_em before update on public.eventos
for each row execute function public.definir_atualizado_em();

drop trigger if exists trg_parada_detalhes_atualizado_em on public.parada_detalhes;
create trigger trg_parada_detalhes_atualizado_em before update on public.parada_detalhes
for each row execute function public.definir_atualizado_em();

drop trigger if exists trg_parada_atividades_atualizado_em on public.parada_atividades;
create trigger trg_parada_atividades_atualizado_em before update on public.parada_atividades
for each row execute function public.definir_atualizado_em();

insert into public.areas (nome, sigla)
values
  ('Laminação 1', 'L1'),
  ('Laminação 2', 'L2'),
  ('LPP', 'LPP'),
  ('Manutenção Central', 'MC'),
  ('Usina', 'USINA')
on conflict (nome) do update set
  sigla = excluded.sigla,
  ativo = true;

insert into public.tipos_evento (nome, slug, cor, icone)
values
  ('Férias', 'ferias', '#10B981', 'palmtree'),
  ('Parada', 'parada', '#F43F5E', 'factory'),
  ('Treinamento', 'treinamento', '#8B5CF6', 'graduation-cap'),
  ('Plantão', 'plantao', '#1683D8', 'calendar-days')
on conflict (slug) do update set
  nome = excluded.nome,
  cor = excluded.cor,
  icone = excluded.icone,
  ativo = true;

insert into public.colaboradores (
  turno,
  escala,
  numero_pessoal,
  nome_completo_sap,
  nome,
  horario,
  funcao,
  especialidade,
  percentual_programacao,
  email,
  ativo
)
values (
  'SAÍDA',
  '13:42 AS 23:00',
  '37104510',
  'JEAN RODRIGUES GOMES',
  'JEAN',
  null,
  'OPERADOR MANTENEDOR III',
  'L-MEC',
  80,
  null,
  true
)
on conflict (numero_pessoal) do update set
  turno = excluded.turno,
  escala = excluded.escala,
  nome_completo_sap = excluded.nome_completo_sap,
  nome = excluded.nome,
  horario = excluded.horario,
  funcao = excluded.funcao,
  especialidade = excluded.especialidade,
  percentual_programacao = excluded.percentual_programacao,
  email = excluded.email,
  ativo = true;

alter table public.areas enable row level security;
alter table public.colaboradores enable row level security;
alter table public.tipos_evento enable row level security;
alter table public.eventos enable row level security;
alter table public.evento_colaboradores enable row level security;
alter table public.parada_detalhes enable row level security;
alter table public.parada_atividades enable row level security;
alter table public.parada_atividade_colaboradores enable row level security;

revoke all on table public.areas from anon, authenticated;
revoke all on table public.colaboradores from anon, authenticated;
revoke all on table public.tipos_evento from anon, authenticated;
revoke all on table public.eventos from anon, authenticated;
revoke all on table public.evento_colaboradores from anon, authenticated;
revoke all on table public.parada_detalhes from anon, authenticated;
revoke all on table public.parada_atividades from anon, authenticated;
revoke all on table public.parada_atividade_colaboradores from anon, authenticated;

commit;
