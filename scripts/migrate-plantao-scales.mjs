import fs from "node:fs";

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")];
}));
if (!env.SUPABASE_ACCESS_TOKEN || !env.SUPABASE_URL) throw new Error("Configuração de acesso ao Supabase ausente.");
const ref = new URL(env.SUPABASE_URL).hostname.split(".")[0];
const query = fs.readFileSync("supabase/migrations/020_plantao_escalas.sql", "utf8");
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
if (!response.ok) { console.error(await response.text()); throw new Error("Migration failed"); }
console.log("Migration 020 applied.");
