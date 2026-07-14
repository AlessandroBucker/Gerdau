begin;

alter table public.documentos_pdf
  add column if not exists data_planejada date null;

alter table public.documentos_pdf
  add column if not exists dia_semana text
  generated always as (
    case extract(isodow from data_planejada)
      when 1 then 'Segunda-feira'
      when 2 then 'Terça-feira'
      when 3 then 'Quarta-feira'
      when 4 then 'Quinta-feira'
      when 5 then 'Sexta-feira'
      when 6 then 'Sábado'
      when 7 then 'Domingo'
      else null
    end
  ) stored;

comment on column public.documentos_pdf.data_planejada is
  'Data em que o documento está planejado para uso ou distribuição.';

comment on column public.documentos_pdf.dia_semana is
  'Dia da semana calculado automaticamente a partir de data_planejada.';

create index if not exists idx_documentos_pdf_codigo_data_planejada
  on public.documentos_pdf (codigo_id, data_planejada, criado_em desc);

commit;
