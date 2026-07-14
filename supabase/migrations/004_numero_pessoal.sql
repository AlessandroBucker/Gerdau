begin;

-- Renomeia a coluna em bancos que já executaram as migrations anteriores.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'codigos_acesso' and column_name = 'codigo'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'codigos_acesso' and column_name = 'numero_pessoal'
  ) then
    alter table public.codigos_acesso rename column codigo to numero_pessoal;
  end if;
end $$;

alter table public.codigos_acesso
  drop constraint if exists codigos_acesso_codigo_6_digitos_check;

-- NOT VALID preserva eventuais registros antigos de 6 dígitos, mas exige
-- exatamente 8 dígitos em toda inclusão ou alteração feita daqui em diante.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.codigos_acesso'::regclass
      and conname = 'codigos_acesso_numero_pessoal_8_digitos_check'
  ) then
    alter table public.codigos_acesso
      add constraint codigos_acesso_numero_pessoal_8_digitos_check
      check (numero_pessoal ~ '^[0-9]{8}$') not valid;
  end if;
end $$;

comment on column public.codigos_acesso.numero_pessoal is
  'Número pessoal único contendo exatamente oito dígitos.';

drop index if exists public.idx_codigos_acesso_codigo_ativo;

create index if not exists idx_codigos_acesso_numero_pessoal_ativo
  on public.codigos_acesso (numero_pessoal)
  where ativo = true;

insert into public.codigos_acesso (numero_pessoal, descricao, ativo)
values
  ('37104510', 'JEAN RODRIGUES GOMES', true),
  ('37051133', 'MARCIO FERRAZ LOPES', true),
  ('37098907', 'DANIEL DA SILVA', true),
  ('37125369', 'JOSE CARLOS DE SOUZA', true),
  ('37121996', 'CRISTIANO PEREIRA SOARES', true),
  ('37121564', 'LUIS RICARDO DA SILVA BUENO', true),
  ('37139473', 'LUCAS RAMOS DOMBROSKI', true),
  ('37105695', 'MAURICIO SANTOS CASTRO', true),
  ('37087238', 'NELSON DA SILVA SANTOS', true),
  ('37064091', 'MARCOS DA COSTA CORREA', true),
  ('37060979', 'LUCIANO DO NASCIMENTO SILVA', true)
on conflict (numero_pessoal) do update set
  descricao = excluded.descricao,
  ativo = true;

commit;
