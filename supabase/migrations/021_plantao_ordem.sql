begin;
alter table public.plantao_equipe add column if not exists position integer;
with ranked as (
 select id, row_number() over(partition by team order by criado_em,id)-1 as position from public.plantao_equipe
) update public.plantao_equipe p set position=r.position from ranked r where p.id=r.id and p.position is null;
alter table public.plantao_equipe alter column position set default 1000000;
alter table public.plantao_equipe alter column position set not null;
alter table public.plantao_equipe add constraint plantao_equipe_position_check check(position between 0 and 1000000);
notify pgrst,'reload schema';
commit;
