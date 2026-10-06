begin;
create table if not exists public.plantao_escalas (
 id text primary key, name text not null check(length(btrim(name)) between 1 and 60),
 active boolean not null default true, color text not null default '#a3e635' check(color ~ '^#[0-9a-fA-F]{6}$')
);
create table if not exists public.plantao_escala_eventos (
 id uuid primary key default gen_random_uuid(), schedule_id text not null references public.plantao_escalas(id),
 start_date date not null, kind text not null check(kind in ('config','restart')),
 work_days integer, rest_days integer, phase text not null check(phase in ('work','rest')),
 cycle_offset integer not null default 0 check(cycle_offset >= 0),
 unique(schedule_id,start_date),
 check ((kind='config' and work_days is not null and rest_days is not null and work_days between 1 and 365 and rest_days between 1 and 365) or (kind='restart' and work_days is null and rest_days is null))
);
insert into public.plantao_escalas(id,name,color) values ('P','P','#a3e635'),('Q','Q','#93c5fd'),('5X2','5X2','#f97316') on conflict do nothing;
insert into public.plantao_escala_eventos(schedule_id,start_date,kind,work_days,rest_days,phase,cycle_offset) values
 ('P','2026-07-01','config',4,2,'work',4),('Q','2026-07-01','config',4,2,'work',0),('5X2','2026-07-01','config',5,2,'work',2)
 on conflict do nothing;
alter table public.plantao_equipe drop constraint if exists plantao_equipe_shift_check;
alter table public.plantao_equipe add constraint plantao_equipe_shift_fkey foreign key(shift) references public.plantao_escalas(id);
alter table public.plantao_escalas enable row level security;
alter table public.plantao_escala_eventos enable row level security;
revoke all on public.plantao_escalas, public.plantao_escala_eventos from anon, authenticated;
grant all on public.plantao_escalas, public.plantao_escala_eventos to service_role;

create or replace function public.salvar_escala_plantao(p_row jsonb, p_event jsonb) returns void
language plpgsql set search_path = public as $$
declare v_id text; v_date date;
begin
 v_id := p_row->>'id';
 -- Serialize changes to the same schedule, including concurrent creation.
 perform pg_advisory_xact_lock(hashtext(v_id));
 insert into plantao_escalas(id,name,active,color) values(v_id,p_row->>'name',(p_row->>'active')::boolean,p_row->>'color')
 on conflict(id) do update set name=excluded.name,active=excluded.active,color=excluded.color;
 if p_event is not null and p_event <> 'null'::jsonb then
  v_date := (p_event->>'start_date')::date;
  if p_event->>'kind' = 'restart' then
   if not exists(select 1 from plantao_escala_eventos where schedule_id=v_id and kind='config' and start_date <= v_date) then
    raise exception 'Defina uma configuração antes de reiniciar a escala';
   end if;
   -- A restart on the configuration date keeps that configuration and only changes its phase.
   if exists(select 1 from plantao_escala_eventos where schedule_id=v_id and start_date=v_date and kind='config') then
    update plantao_escala_eventos set phase=p_event->>'phase',cycle_offset=0 where schedule_id=v_id and start_date=v_date;
    return;
   end if;
  end if;
  insert into plantao_escala_eventos(schedule_id,start_date,kind,work_days,rest_days,phase,cycle_offset)
  values(v_id,v_date,p_event->>'kind',(p_event->>'work_days')::integer,(p_event->>'rest_days')::integer,p_event->>'phase',0)
  on conflict(schedule_id,start_date) do update set kind=excluded.kind,work_days=excluded.work_days,rest_days=excluded.rest_days,phase=excluded.phase,cycle_offset=0;
 end if;
end;
$$;
revoke all on function public.salvar_escala_plantao(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.salvar_escala_plantao(jsonb,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
