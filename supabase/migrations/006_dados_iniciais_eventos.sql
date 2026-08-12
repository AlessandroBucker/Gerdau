begin;

insert into public.colaboradores (area_id, numero_pessoal, nome_completo_sap, nome)
select a.id, v.numero_pessoal, v.nome_completo_sap, v.nome
from public.areas a
cross join (values
  (null::text, 'LUIS RICARDO', 'Luis Ricardo'),
  (null::text, 'WISLEY PEREIRA DE ALCANTARA', 'Wisley Pereira de Alcantara'),
  (null::text, 'WELLINGTON FERREIRA WEBBER', 'Wellington Ferreira Webber'),
  (null::text, 'RAFAEL CAVALHEIRO ESPINDOLA', 'Rafael Cavalheiro Espindola'),
  ('37098907', 'DANIEL DA SILVA', 'Daniel da Silva')
) as v(numero_pessoal, nome_completo_sap, nome)
where a.nome = 'Laminação 1'
  and not exists (
    select 1 from public.colaboradores c
    where c.nome_completo_sap = v.nome_completo_sap
  );

insert into public.eventos (tipo_evento_id, area_id, titulo, data_inicio, data_fim, dia_inteiro, status)
select t.id, a.id, v.titulo, v.inicio, v.fim, true, 'programado'
from public.tipos_evento t
join public.areas a on a.nome = 'Laminação 1'
cross join (values
  ('Luis Ricardo', date '2026-09-03', date '2026-09-22'),
  ('Wisley Pereira de Alcantara', date '2026-08-31', date '2026-09-07'),
  ('Wellington Ferreira Webber', date '2026-10-05', date '2026-10-09'),
  ('Rafael Cavalheiro Espindola', date '2026-08-17', date '2026-08-31'),
  ('Daniel da Silva', date '2026-08-31', date '2026-09-07')
) as v(titulo, inicio, fim)
where t.slug = 'ferias'
  and not exists (
    select 1 from public.eventos e
    where e.tipo_evento_id = t.id and e.titulo = v.titulo
      and e.data_inicio = v.inicio and e.data_fim = v.fim
  );

insert into public.evento_colaboradores (evento_id, colaborador_id, papel, confirmado)
select e.id, c.id, 'colaborador em férias', true
from public.eventos e
join public.tipos_evento t on t.id = e.tipo_evento_id and t.slug = 'ferias'
join public.colaboradores c on lower(c.nome) = lower(e.titulo)
on conflict (evento_id, colaborador_id) do nothing;

insert into public.eventos (
  tipo_evento_id, area_id, titulo, descricao, data_inicio, hora_inicio,
  data_fim, hora_fim, dia_inteiro, status
)
select t.id, a.id, v.titulo, v.descricao, v.inicio, v.hora_inicio,
  v.fim, v.hora_fim, v.dia_inteiro, 'programado'
from public.tipos_evento t
join (values
  ('Laminação 2', 'Preventiva da Laminação 2', 'Parada preventiva de 8 horas', date '2026-08-12', time '08:00', date '2026-08-12', time '16:00', false),
  ('LPP', 'Preventiva do LPP', 'Parada preventiva de 8 horas', date '2026-08-13', time '08:00', date '2026-08-13', time '16:00', false),
  ('Usina', 'Elétrica geral da Usina', 'Parada elétrica geral', date '2026-08-20', null::time, date '2026-08-20', null::time, true),
  ('Laminação 1', 'Parada da Laminação 1', 'Parada programada', date '2026-08-25', null::time, date '2026-08-31', null::time, true)
) as v(area, titulo, descricao, inicio, hora_inicio, fim, hora_fim, dia_inteiro) on true
join public.areas a on a.nome = v.area
where t.slug = 'parada'
  and not exists (
    select 1 from public.eventos e
    where e.tipo_evento_id = t.id and e.titulo = v.titulo
      and e.data_inicio = v.inicio and e.data_fim = v.fim
  );

insert into public.parada_detalhes (evento_id, tipo_manutencao, status_execucao)
select e.id,
  case when e.titulo ilike '%preventiva%' then 'Preventiva'
       when e.titulo ilike '%elétrica%' then 'Elétrica' else 'Programada' end,
  'programada'
from public.eventos e
join public.tipos_evento t on t.id = e.tipo_evento_id and t.slug = 'parada'
where not exists (select 1 from public.parada_detalhes p where p.evento_id = e.id);

commit;
