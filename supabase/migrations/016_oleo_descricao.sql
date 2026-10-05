alter table public.analises_oleo add column if not exists descricao text not null default '' check (length(descricao) <= 200);
