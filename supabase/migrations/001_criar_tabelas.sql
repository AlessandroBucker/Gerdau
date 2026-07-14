begin;

create extension if not exists pgcrypto;

create table if not exists public.codigos_acesso (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  descricao text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),

  constraint codigos_acesso_codigo_6_digitos_check
    check (codigo ~ '^[0-9]{6}$'),

  constraint codigos_acesso_codigo_unique
    unique (codigo)
);

create table if not exists public.documentos_pdf (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  url_arquivo text not null,
  codigo_id uuid not null,
  criado_em timestamptz not null default now(),

  constraint documentos_pdf_codigo_id_fk
    foreign key (codigo_id)
    references public.codigos_acesso (id)
    on delete cascade
);

-- UNIQUE(codigo) já cria um índice para a busca exata pelo código.
create index if not exists idx_codigos_acesso_codigo_ativo
  on public.codigos_acesso (codigo)
  where ativo = true;

create index if not exists idx_documentos_pdf_codigo_id
  on public.documentos_pdf (codigo_id);

create index if not exists idx_documentos_pdf_codigo_criado_em
  on public.documentos_pdf (codigo_id, criado_em desc);

commit;
