begin;

alter table public.conjuntos_reserva
  drop constraint if exists conjuntos_reserva_status_check;

alter table public.conjuntos_reserva
  add constraint conjuntos_reserva_status_check check (
    status is null or status in (
      'Nova solicitação',
      'Programar',
      'Programado',
      'Em andamento',
      'Concluído'
    )
  );

alter table public.conjuntos_reserva
  alter column status set default 'Nova solicitação';

commit;
