import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#")).map(l => { const i=l.indexOf("="); return [l.slice(0,i), l.slice(i+1).replace(/^"|"$/g, "")]; }));
const query = `begin;
do $$ declare first_row jsonb; next_row jsonb; values_json jsonb; total integer;
begin
values_json := '{"descricao":"Verificação temporária","local":"TEST","plano":"TEST","tipo_oleo":"TEST","coletado":true,"enviado":false,"qualidade":"Pendente","acao":"","ordem":"","data_coleta":"2026-09-01"}'::jsonb;
first_row := public.salvar_coleta_oleo(null,null,values_json);
next_row := public.salvar_coleta_oleo(null,(first_row->>'oleo_id')::uuid,values_json || '{"coletado":false,"data_coleta":null,"data_planejada":"2026-10-01"}'::jsonb);
select count(*) into total from public.analises_oleo where oleo_id=(first_row->>'oleo_id')::uuid;
if total <> 2 then raise exception 'Histórico não preservado'; end if;
perform public.salvar_coleta_oleo((next_row->>'id')::uuid,null,values_json || '{"descricao":"Atualizada","data_coleta":"2026-09-09"}'::jsonb);
select count(*) into total from public.analises_oleo where oleo_id=(first_row->>'oleo_id')::uuid and descricao='Atualizada';
if total <> 2 then raise exception 'Identificação não sincronizada'; end if;
end $$;
rollback;`;
const ref = new URL(env.SUPABASE_URL).hostname.split(".")[0];
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method:"POST",headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({query}) });
if (!response.ok) { console.error(await response.text()); process.exit(1); }
console.log("Criação, histórico e edição verificados em transação revertida; nenhum dado de teste mantido.");
