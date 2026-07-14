begin;

-- Permite expiração opcional. NULL significa que o código não expira.
alter table public.codigos_acesso
  add column if not exists expira_em timestamptz null;

comment on column public.codigos_acesso.expira_em is
  'Data opcional de expiração do código; NULL significa sem expiração.';

-- Bucket privado. O Python deve gravar em url_arquivo apenas o caminho
-- do objeto dentro deste bucket, por exemplo: codigo-uuid/arquivo.pdf.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-pdf',
  'documentos-pdf',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- A API e o app desktop usam service_role, que ignora RLS.
-- Nenhum acesso direto via anon/authenticated deve ser permitido.
alter table public.codigos_acesso enable row level security;
alter table public.documentos_pdf enable row level security;

revoke all on table public.codigos_acesso from anon, authenticated;
revoke all on table public.documentos_pdf from anon, authenticated;

commit;
