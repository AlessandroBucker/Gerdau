import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => {
  const i = line.indexOf("="); return [line.slice(0,i),line.slice(i+1).replace(/^"|"$/g,"")];
}));
const ref = new URL(env.SUPABASE_URL).hostname.split(".")[0];
const query = `begin;
do $$
declare r jsonb := jsonb_build_object('id','validation-'||gen_random_uuid(),'name','Validation','active',true,'color','#a3e635'); n integer;
begin
 perform public.salvar_escala_plantao(r,'{"start_date":"2026-07-01","kind":"config","phase":"work","work_days":4,"rest_days":2}');
 perform public.salvar_escala_plantao(r,'{"start_date":"2026-10-12","kind":"restart","phase":"work"}');
 perform public.salvar_escala_plantao(r,'{"start_date":"2026-10-06","kind":"restart","phase":"rest"}');
 perform public.salvar_escala_plantao(r,'{"start_date":"2026-10-09","kind":"config","phase":"work","work_days":5,"rest_days":2}');
 select count(*) into n from public.plantao_escala_eventos where schedule_id=r->>'id';
 if n<>4 then raise exception 'History was lost'; end if;
 perform public.salvar_escala_plantao(r,'{"start_date":"2026-07-01","kind":"restart","phase":"rest"}');
 if not exists(select 1 from public.plantao_escala_eventos where schedule_id=r->>'id' and start_date='2026-07-01' and kind='config' and work_days=4 and phase='rest') then raise exception 'Configuration lost on same-day restart'; end if;
 perform public.salvar_escala_plantao(jsonb_set(r,'{active}','false'),null);
 if not exists(select 1 from public.plantao_escalas where id=r->>'id' and not active) then raise exception 'Deactivation failed'; end if;
end $$;
rollback;`;
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {method:"POST",headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({query})});
if(!response.ok) {console.error(await response.text());process.exitCode=1;}
else console.log("OK: SQL creation, edits, restarts, history and deactivation; test transaction rolled back.");
