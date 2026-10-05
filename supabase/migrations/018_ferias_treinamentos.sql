begin;

alter table public.eventos add column if not exists tipo_registro text;
update public.eventos e set tipo_registro = t.slug from public.tipos_evento t where t.id = e.tipo_evento_id;

create or replace function public.identificar_tipo_evento() returns trigger
language plpgsql set search_path = public as $$
begin
  select slug into new.tipo_registro from public.tipos_evento where id = new.tipo_evento_id;
  return new;
end;
$$;
drop trigger if exists trg_eventos_tipo_registro on public.eventos;
create trigger trg_eventos_tipo_registro before insert or update on public.eventos
for each row execute function public.identificar_tipo_evento();
alter table public.eventos alter column tipo_registro set not null;
comment on column public.eventos.tipo_registro is 'Identifica o registro: ferias, treinamento ou outro slug de tipos_evento. Preenchido automaticamente.';

create or replace function public.salvar_periodo_colaborador(
  p_id uuid, p_tipo text, p_area text, p_nome text, p_np text, p_inicio date, p_fim date
) returns uuid language plpgsql set search_path = public as $$
declare
  v_tipo uuid;
  v_area uuid;
  v_colaborador uuid;
  v_id uuid;
begin
  if p_tipo not in ('ferias', 'treinamento') or p_tipo is null
    or nullif(btrim(p_area), '') is null or nullif(btrim(p_nome), '') is null
    or p_inicio is null or p_fim is null or p_fim < p_inicio
    or (coalesce(p_np, '') <> '' and p_np !~ '^[0-9]{8}$') then
    raise exception 'Dados do período inválidos' using errcode = '22023';
  end if;
  select id into strict v_tipo from public.tipos_evento where slug = p_tipo;
  if p_id is not null then
    select id into v_id from public.eventos where id = p_id and tipo_evento_id = v_tipo and status <> 'cancelado' for update;
    if v_id is null then raise exception 'Registro não encontrado' using errcode = 'P0002'; end if;
  end if;
  insert into public.areas(nome) values (btrim(p_area))
    on conflict(nome) do update set nome = excluded.nome returning id into v_area;
  if coalesce(p_np, '') <> '' then
    insert into public.colaboradores(numero_pessoal, nome, nome_completo_sap, area_id)
      values (p_np, btrim(p_nome), btrim(p_nome), v_area)
      on conflict(numero_pessoal) do update set numero_pessoal = excluded.numero_pessoal
      returning id into v_colaborador;
  end if;
  if p_id is null then
    insert into public.eventos(tipo_evento_id, area_id, titulo, data_inicio, data_fim)
      values (v_tipo, v_area, btrim(p_nome), p_inicio, p_fim) returning id into v_id;
  else
    update public.eventos set area_id = v_area, titulo = btrim(p_nome), data_inicio = p_inicio, data_fim = p_fim where id = v_id;
  end if;
  delete from public.evento_colaboradores where evento_id = v_id;
  if v_colaborador is not null then
    insert into public.evento_colaboradores(evento_id, colaborador_id) values (v_id, v_colaborador);
  end if;
  return v_id;
end;
$$;
revoke all on function public.salvar_periodo_colaborador(uuid,text,text,text,text,date,date) from public, anon, authenticated;
grant execute on function public.salvar_periodo_colaborador(uuid,text,text,text,text,date,date) to service_role;
notify pgrst, 'reload schema';
commit;
