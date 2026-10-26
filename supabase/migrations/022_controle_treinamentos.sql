begin;

create table if not exists public.controle_treinamentos_colaboradores (
  id uuid primary key,
  np text not null default '',
  nome text not null,
  situacao text not null default 'Ativo' check (situacao in ('Ativo', 'Inativo')),
  obs text not null default '',
  atualizado_em timestamptz not null default now(),
  constraint controle_treinamentos_colaborador_nome_check check (btrim(nome) <> '')
);

create table if not exists public.controle_treinamentos_catalogo (
  id uuid primary key,
  nome text not null,
  validade text not null default '',
  situacao text not null default 'Ativo' check (situacao in ('Ativo', 'Inativo')),
  obs text not null default '',
  atualizado_em timestamptz not null default now(),
  constraint controle_treinamentos_catalogo_nome_check check (btrim(nome) <> '')
);

create table if not exists public.controle_treinamentos_registros (
  id uuid primary key,
  colaborador_id uuid not null references public.controle_treinamentos_colaboradores(id) on update cascade on delete restrict,
  treinamento_id uuid not null references public.controle_treinamentos_catalogo(id) on update cascade on delete restrict,
  formacao date,
  vencimento date,
  reciclagem date,
  obs text not null default '',
  atualizado_em timestamptz not null default now()
);

create table if not exists public.controle_treinamentos_movimentos (
  id uuid primary key,
  tipo text not null check (tipo in ('inclusao', 'alteracao', 'exclusao')),
  acao text not null,
  descricao text not null default '',
  quando text not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_controle_treinamentos_registros_colaborador
  on public.controle_treinamentos_registros (colaborador_id);
create index if not exists idx_controle_treinamentos_registros_treinamento
  on public.controle_treinamentos_registros (treinamento_id);
create index if not exists idx_controle_treinamentos_registros_vencimento
  on public.controle_treinamentos_registros (vencimento);
create index if not exists idx_controle_treinamentos_movimentos_quando
  on public.controle_treinamentos_movimentos (criado_em desc);

alter table public.controle_treinamentos_colaboradores enable row level security;
alter table public.controle_treinamentos_catalogo enable row level security;
alter table public.controle_treinamentos_registros enable row level security;
alter table public.controle_treinamentos_movimentos enable row level security;

revoke all on public.controle_treinamentos_colaboradores from public, anon, authenticated;
revoke all on public.controle_treinamentos_catalogo from public, anon, authenticated;
revoke all on public.controle_treinamentos_registros from public, anon, authenticated;
revoke all on public.controle_treinamentos_movimentos from public, anon, authenticated;
grant select, insert, update, delete on public.controle_treinamentos_colaboradores to service_role;
grant select, insert, update, delete on public.controle_treinamentos_catalogo to service_role;
grant select, insert, update, delete on public.controle_treinamentos_registros to service_role;
grant select, insert, update, delete on public.controle_treinamentos_movimentos to service_role;

create or replace function public.importar_controle_treinamentos(p_dados jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_colaboradores integer := 0;
  v_treinamentos integer := 0;
  v_registros integer := 0;
  v_movimentos integer := 0;
begin
  insert into public.controle_treinamentos_colaboradores (id, np, nome, situacao, obs)
  select x.id::uuid, coalesce(x.np, ''), btrim(x.nome), coalesce(x.situacao, 'Ativo'), coalesce(x.obs, '')
  from jsonb_to_recordset(coalesce(p_dados->'colaboradores', '[]'::jsonb)) as x(id text, np text, nome text, situacao text, obs text)
  on conflict (id) do update set np = excluded.np, nome = excluded.nome, situacao = excluded.situacao, obs = excluded.obs, atualizado_em = now();
  get diagnostics v_colaboradores = row_count;

  insert into public.controle_treinamentos_catalogo (id, nome, validade, situacao, obs)
  select x.id::uuid, btrim(x.nome), coalesce(x.validade, ''), coalesce(x.situacao, 'Ativo'), coalesce(x.obs, '')
  from jsonb_to_recordset(coalesce(p_dados->'treinamentos', '[]'::jsonb)) as x(id text, nome text, validade text, situacao text, obs text)
  on conflict (id) do update set nome = excluded.nome, validade = excluded.validade, situacao = excluded.situacao, obs = excluded.obs, atualizado_em = now();
  get diagnostics v_treinamentos = row_count;

  insert into public.controle_treinamentos_registros (id, colaborador_id, treinamento_id, formacao, vencimento, reciclagem, obs)
  select x.id::uuid, x."colaboradorId"::uuid, x."treinamentoId"::uuid, nullif(x.formacao, '')::date, nullif(x.vencimento, '')::date, nullif(x.reciclagem, '')::date, coalesce(x.obs, '')
  from jsonb_to_recordset(coalesce(p_dados->'registros', '[]'::jsonb)) as x(id text, "colaboradorId" text, "treinamentoId" text, formacao text, vencimento text, reciclagem text, obs text)
  on conflict (id) do update set colaborador_id = excluded.colaborador_id, treinamento_id = excluded.treinamento_id, formacao = excluded.formacao, vencimento = excluded.vencimento, reciclagem = excluded.reciclagem, obs = excluded.obs, atualizado_em = now();
  get diagnostics v_registros = row_count;

  delete from public.controle_treinamentos_registros r
  where not exists (
    select 1 from jsonb_array_elements(coalesce(p_dados->'registros', '[]'::jsonb)) as item
    where item->>'id' = r.id::text
  );

  insert into public.controle_treinamentos_movimentos (id, tipo, acao, descricao, quando)
  select x.id::uuid, x.tipo, x.acao, coalesce(x.descricao, ''), x.quando
  from jsonb_to_recordset(coalesce(p_dados->'movimentos', '[]'::jsonb)) as x(id text, tipo text, acao text, descricao text, quando text)
  on conflict (id) do update set tipo = excluded.tipo, acao = excluded.acao, descricao = excluded.descricao, quando = excluded.quando;
  get diagnostics v_movimentos = row_count;

  return jsonb_build_object('colaboradores', v_colaboradores, 'treinamentos', v_treinamentos, 'registros', v_registros, 'movimentos', v_movimentos);
end;
$$;

revoke all on function public.importar_controle_treinamentos(jsonb) from public, anon, authenticated;
grant execute on function public.importar_controle_treinamentos(jsonb) to service_role;

notify pgrst, 'reload schema';
commit;
