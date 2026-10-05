begin;
create table if not exists public.oleos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null default '', local text not null, plano text not null, tipo_oleo text not null
);
alter table public.oleos enable row level security;
revoke all on public.oleos from anon, authenticated;
grant all on public.oleos to service_role;
alter table public.analises_oleo add column if not exists oleo_id uuid references public.oleos(id);
alter table public.analises_oleo add column if not exists data_coleta date;
insert into public.oleos(id, descricao, local, plano, tipo_oleo)
select id, descricao, local, plano, tipo_oleo from public.analises_oleo where oleo_id is null
on conflict (id) do nothing;
update public.analises_oleo set oleo_id = id where oleo_id is null;
alter table public.analises_oleo alter column oleo_id set not null;
create index if not exists analises_oleo_periodos_idx on public.analises_oleo(oleo_id, data_coleta desc);

create or replace function public.salvar_coleta_oleo(p_id uuid, p_oleo_id uuid, p_values jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare v_oleo uuid; v_row public.analises_oleo; v_input public.analises_oleo;
begin
  v_input := jsonb_populate_record(null::public.analises_oleo, p_values);
  if p_id is not null then
    select oleo_id into v_oleo from public.analises_oleo where id = p_id for update;
    if not found then raise exception 'Coleta não encontrada'; end if;
  elsif p_oleo_id is not null then
    select id into v_oleo from public.oleos where id = p_oleo_id for update;
    if not found then raise exception 'Óleo não encontrado'; end if;
  else
    insert into public.oleos(descricao,local,plano,tipo_oleo) values(v_input.descricao,v_input.local,v_input.plano,v_input.tipo_oleo) returning id into v_oleo;
  end if;
  update public.oleos set descricao=v_input.descricao,local=v_input.local,plano=v_input.plano,tipo_oleo=v_input.tipo_oleo where id=v_oleo;
  if p_id is null then
    insert into public.analises_oleo(oleo_id,descricao,local,plano,tipo_oleo,data_planejada,data_coleta,coletado,enviado,qualidade,acao,ordem,data_analise)
    values(v_oleo,v_input.descricao,v_input.local,v_input.plano,v_input.tipo_oleo,v_input.data_planejada,v_input.data_coleta,v_input.coletado,v_input.enviado,v_input.qualidade,v_input.acao,v_input.ordem,v_input.data_analise) returning * into v_row;
  else
    update public.analises_oleo set data_planejada=v_input.data_planejada,data_coleta=v_input.data_coleta,coletado=v_input.coletado,enviado=v_input.enviado,qualidade=v_input.qualidade,acao=v_input.acao,ordem=v_input.ordem,data_analise=v_input.data_analise where id=p_id returning * into v_row;
  end if;
  update public.analises_oleo set descricao=v_input.descricao,local=v_input.local,plano=v_input.plano,tipo_oleo=v_input.tipo_oleo where oleo_id=v_oleo;
  select * into v_row from public.analises_oleo where id=v_row.id;
  return to_jsonb(v_row);
end; $$;
revoke all on function public.salvar_coleta_oleo(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.salvar_coleta_oleo(uuid,uuid,jsonb) to service_role;
commit;
