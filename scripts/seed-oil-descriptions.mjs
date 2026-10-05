import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#")).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }));
// Reticências preservam os textos cortados na imagem de origem.
const descriptions = [
  ["61940", "D-AO-3M-AO-COLETA-TANQ2-C.LUB-B.MORG..."],
  ["61941", "D-AO-3M-COLETA-RED.CAD. BASCULANTE-L-1"],
  ["64385", "D-AO-3M-COLETA C. LUB.-TRIO-DESB1"],
  ["61939", "D-AO-3M-AO-COLETA-TANQ1-C.LUB-B.MORG..."],
  ["65929", "D-AO-3M-COLETA ÓLEO- RED.SAÍDA DE ROLO"],
  ["67899", "D-AO-3M-COLET. C.HID.- MESA BASC.(DESB)"],
  ["61935", "D-AO-3M-COLETA-TANQ-C.LUBRIF-DESB2"],
  ["178356", "D-AO-3M-LPP GAIOLA 1-REDUT.(COLET.OIL)"],
  ["178357", "D-AO-3M-LPP GAIOLA 2-REDUT.(COLET.OIL)"],
  ["63850", "D-AO-3M-LPP-REDUT.ACION.LEITO-COLETA"],
  ["61934", "D-AO-3M-COLETA- PRENSA 1-ROLOS-C.HID."],
  ["65927", "D-AO-3M-COLETA- PRENSA 2-ROLOS-C. HID."],
  ["177085", "D-AO-3M-TESOURA LPP-COLETA ÓLEO"],
  ["65931", "D-AO-3M-REDUTOR TRANSP.CORRENTES-CO..."],
  ["65930", "D-AO-3M-REDUTOR TRANSP.ESPIRAIS-COLETA"],
];
const ref = new URL(env.SUPABASE_URL).hostname.split(".")[0];
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: fs.readFileSync("supabase/migrations/016_oleo_descricao.sql", "utf8") }) });
if (!response.ok) throw new Error(`Migração: HTTP ${response.status}`);
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
for (const [plano, descricao] of descriptions) {
  const { error } = await db.from("analises_oleo").update({ descricao }).eq("plano", plano);
  if (error) throw error;
}
const { data, error } = await db.from("analises_oleo").select("plano,descricao").in("plano", descriptions.map(([plano]) => plano));
if (error) throw error;
if (!descriptions.every(([plano, descricao]) => data.some(row => row.plano === plano && row.descricao === descricao))) throw new Error("Descrição ausente.");
console.log("15 descrições preenchidas e verificadas.");
