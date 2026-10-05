import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")];
}));
const rows = [
  ["1402-LA1-TREA-BM001", "61940"],
  ["1402-LA1-SAI1-CBA01", "61941"],
  ["1402-LA1-TDES-CLU02", "64385"],
  ["1402-LA1-TREA-CLU01", "61939"],
  ["1402-LA1-SAI1-CES01", "65929"],
  ["1402-LA1-TDES", "67899"],
  ["1402-LA1-TDES-DGE01", "61935"],
  ["1402-LA1-LPPE-GLA01", "178356"],
  ["1402-LA1-LPPE-GLA02", "178357"],
  ["1402-LA1-LPPE-LRE01-LRE", "63850"],
  ["1402-LA1-SAI1-MPR01", "61934"],
  ["1402-LA1-SAI1-MPR02", "65927"],
  ["1402-LA1-LPPE-TRO01", "177085"],
  ["1402-LA1-TDES-TCO01", "65931"],
  ["1402-LA1-SAI1-TES01", "65930"],
];
const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: existing, error } = await client.from("analises_oleo").select("id,local,plano");
if (error) throw error;
const pending = rows.filter(([local, plano]) => !existing.some(item => item.local === local && item.plano === plano));
const ref = new URL(env.SUPABASE_URL).hostname.split(".")[0];
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: fs.readFileSync("supabase/migrations/015_oleo_data_a_definir.sql", "utf8") }),
});
if (!response.ok) throw new Error(`Falha na migração: HTTP ${response.status}`);
if (pending.length) {
  const { error } = await client.from("analises_oleo").insert(pending.map(([local, plano]) => ({ local, plano, tipo_oleo: "Não informado", data_planejada: null, coletado: false, enviado: false, qualidade: "Pendente", acao: "", ordem: "" })));
  if (error) throw error;
}
const { data: saved, error: verifyError } = await client.from("analises_oleo").select("local,plano,tipo_oleo,data_planejada");
if (verifyError) throw verifyError;
if (!rows.every(([local, plano]) => saved.some(item => item.local === local && item.plano === plano))) throw new Error("Verificação incompleta.");
console.log(`${pending.length} coletas inseridas; 15 locais e planos conferidos no banco.`);
