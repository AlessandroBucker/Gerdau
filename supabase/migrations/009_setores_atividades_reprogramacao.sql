begin;

create table if not exists public.setores (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id) on delete cascade,
  nome text not null,
  descricao text null,
  ordem_exibicao integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint setores_nome_nao_vazio_check check (btrim(nome) <> ''),
  constraint setores_ordem_exibicao_check check (ordem_exibicao >= 0),
  constraint setores_area_nome_unique unique (area_id, nome)
);

alter table public.parada_atividades
  add column if not exists setor_id uuid null references public.setores (id) on delete set null,
  add column if not exists especialidade text null,
  add column if not exists responsavel_apr text null,
  add column if not exists equipe text null,
  add column if not exists reprogramada boolean not null default false,
  add column if not exists quantidade_reprogramacoes integer not null default 0;

alter table public.parada_atividades drop constraint if exists parada_atividades_status_check;
alter table public.parada_atividades add constraint parada_atividades_status_check check (
  status in ('programada', 'reprogramada', 'liberada', 'em_andamento', 'concluida', 'cancelada')
);

create table if not exists public.parada_atividade_reprogramacoes (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references public.parada_atividades (id) on delete cascade,
  data_inicio_anterior date null,
  hora_inicio_anterior time null,
  data_fim_anterior date null,
  hora_fim_anterior time null,
  nova_data_inicio date not null,
  nova_hora_inicio time null,
  nova_data_fim date not null,
  nova_hora_fim time null,
  motivo text not null,
  reprogramado_por text not null,
  criado_em timestamptz not null default now(),
  constraint parada_reprogramacoes_periodo_check check (nova_data_fim >= nova_data_inicio),
  constraint parada_reprogramacoes_motivo_check check (btrim(motivo) <> ''),
  constraint parada_reprogramacoes_autor_check check (btrim(reprogramado_por) <> '')
);

create index if not exists idx_setores_area on public.setores (area_id, ordem_exibicao, nome);
create index if not exists idx_parada_atividades_setor on public.parada_atividades (setor_id, sequencia);
create index if not exists idx_parada_reprogramacoes_atividade on public.parada_atividade_reprogramacoes (atividade_id, criado_em desc);

drop trigger if exists trg_setores_atualizado_em on public.setores;
create trigger trg_setores_atualizado_em before update on public.setores
for each row execute function public.definir_atualizado_em();

create or replace function public.reprogramar_parada_atividade(
  p_atividade_id uuid,
  p_nova_data_inicio date,
  p_nova_hora_inicio time,
  p_nova_data_fim date,
  p_nova_hora_fim time,
  p_motivo text,
  p_reprogramado_por text
) returns public.parada_atividades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atividade public.parada_atividades;
begin
  if p_nova_data_inicio is null or p_nova_data_fim is null or p_nova_data_fim < p_nova_data_inicio then
    raise exception 'Período da reprogramação inválido.';
  end if;
  if btrim(coalesce(p_motivo, '')) = '' or btrim(coalesce(p_reprogramado_por, '')) = '' then
    raise exception 'Motivo e responsável pela reprogramação são obrigatórios.';
  end if;

  select * into v_atividade from public.parada_atividades where id = p_atividade_id for update;
  if not found then raise exception 'Atividade não encontrada.'; end if;

  insert into public.parada_atividade_reprogramacoes (
    atividade_id, data_inicio_anterior, hora_inicio_anterior, data_fim_anterior, hora_fim_anterior,
    nova_data_inicio, nova_hora_inicio, nova_data_fim, nova_hora_fim, motivo, reprogramado_por
  ) values (
    v_atividade.id, v_atividade.data_inicio, v_atividade.hora_inicio, v_atividade.data_fim, v_atividade.hora_fim,
    p_nova_data_inicio, p_nova_hora_inicio, p_nova_data_fim, p_nova_hora_fim, btrim(p_motivo), btrim(p_reprogramado_por)
  );

  update public.parada_atividades set
    data_inicio = p_nova_data_inicio, hora_inicio = p_nova_hora_inicio,
    data_fim = p_nova_data_fim, hora_fim = p_nova_hora_fim,
    status = 'reprogramada', reprogramada = true,
    quantidade_reprogramacoes = quantidade_reprogramacoes + 1
  where id = p_atividade_id returning * into v_atividade;

  return v_atividade;
end;
$$;

insert into public.setores (area_id, nome, ordem_exibicao)
select a.id, v.nome, v.ordem
from public.areas a
cross join (values
  ('Central de solda', 10),
  ('Edireitadeira', 20),
  ('Laminador', 30),
  ('Leito de resfriamento', 40)
) as v(nome, ordem)
where a.nome = 'LPP'
on conflict (area_id, nome) do update set ordem_exibicao = excluded.ordem_exibicao, ativo = true;

insert into public.parada_atividades (
  evento_id, area_id, setor_id, sequencia, especialidade, ordem, atividade,
  responsavel_apr, equipe, data_inicio, hora_inicio, data_fim, hora_fim, status, observacao
)
select e.id, e.area_id, s.id, v.sequencia, v.especialidade, nullif(v.ordem, ''), v.atividade,
  v.responsavel, nullif(v.equipe, ''), e.data_inicio, e.hora_inicio, e.data_fim, e.hora_fim, 'programada', null
from public.eventos e
join public.tipos_evento t on t.id = e.tipo_evento_id and t.slug = 'parada'
join public.areas a on a.id = e.area_id and a.nome = 'LPP'
cross join (values
  (1, 'Central de solda', 'Mecânica', '', 'Revisão completa da STREKER', 'WISLEY', ''),
  (2, 'Central de solda', 'Elétrica', '', 'Revisão completa da STREKER', 'DANIEL', ''),
  (3, 'Edireitadeira', 'Elétrica', '81820109', 'P-E-2M MÁQUINA ENDIREIT. MALMEDIE LPP', 'WISLEY', 'WISLEY'),
  (4, 'Edireitadeira', 'Mecânica', '', 'Limpar base da endireitadeira', 'Ricardo', 'Ricardo'),
  (5, 'Edireitadeira', 'Lubrificação', '82197520', 'P-L-1S-ENDIREITADEIRA GSG', 'Ricardo', 'Ricardo'),
  (6, 'Laminador', 'Lubrificação', '64213208', 'TROCAR ÓLEO REDUTORES GAIOLA 1', 'LUCAS', 'LUCAS E JONES'),
  (7, 'Laminador', 'Lubrificação', '64213209', 'TROCAR ÓLEO REDUTORES GAIOLA 12', 'LUCAS', 'LUCAS E JONES'),
  (8, 'Laminador', 'Lubrificação', '', 'LUBRIFICAR ALONGAS E ACOPLAMENTOS', 'LUCAS', 'LUCAS E JONES'),
  (9, 'Laminador', 'Elétrica', '', 'CABEAMENTO E ELETRODUTO DO ENCODER DA GAIOLA 2', 'WISLEY', 'WISLEY'),
  (10, 'Leito de resfriamento', 'Mecânica', '', 'SUBSTITUIR ROLETES DO LEITO DO LPP', 'JEAN', 'JEAN'),
  (11, 'Leito de resfriamento', 'Mecânica', '', 'INSPEÇÃO DO LEITO DE RESFRIAMENTO', 'JOSÉ', 'JOSÉ')
) as v(sequencia, setor, especialidade, ordem, atividade, responsavel, equipe)
join public.setores s on s.area_id = a.id and s.nome = v.setor
where e.data_inicio = date '2026-08-13'
on conflict (evento_id, sequencia) do update set
  setor_id = excluded.setor_id, especialidade = excluded.especialidade, ordem = excluded.ordem,
  atividade = excluded.atividade, responsavel_apr = excluded.responsavel_apr, equipe = excluded.equipe;

alter table public.setores enable row level security;
alter table public.parada_atividade_reprogramacoes enable row level security;
revoke all on table public.setores from anon, authenticated;
revoke all on table public.parada_atividade_reprogramacoes from anon, authenticated;
revoke all on function public.reprogramar_parada_atividade(uuid, date, time, date, time, text, text) from public, anon, authenticated;

commit;
