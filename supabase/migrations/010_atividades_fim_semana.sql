alter table public.parada_atividades
  add column if not exists permite_sabado boolean not null default false,
  add column if not exists permite_domingo boolean not null default false;

comment on column public.parada_atividades.permite_sabado is
  'Permite alocar a atividade aos sábados.';

comment on column public.parada_atividades.permite_domingo is
  'Permite alocar a atividade aos domingos.';
