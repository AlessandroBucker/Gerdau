begin;

alter table public.parada_atividades
  add column if not exists comentario_evolucao text null;

alter table public.parada_atividades
  drop constraint if exists parada_atividades_comentario_evolucao_check;

alter table public.parada_atividades
  add constraint parada_atividades_comentario_evolucao_check
  check (comentario_evolucao is null or char_length(comentario_evolucao) <= 1000);

alter table public.parada_atividade_evolucoes
  add column if not exists comentario text null;

alter table public.parada_atividade_evolucoes
  drop constraint if exists parada_atividade_evolucoes_comentario_check;

alter table public.parada_atividade_evolucoes
  add constraint parada_atividade_evolucoes_comentario_check
  check (comentario is null or char_length(comentario) <= 1000);

comment on column public.parada_atividades.comentario_evolucao is
  'Comentário atual do acompanhamento da atividade.';
comment on column public.parada_atividade_evolucoes.comentario is
  'Comentário registrado junto à atualização de evolução.';

commit;