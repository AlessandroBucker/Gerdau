import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => { const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")]; }));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function rows(table, query = "*") {
  const result = await supabase.from(table).select(query);
  if (result.error) throw result.error;
  return result.data;
}

const areas = await rows("areas", "id,nome");
const types = await rows("tipos_evento", "id,slug");
const areaId = name => areas.find(area => area.nome === name)?.id;
const typeId = slug => types.find(type => type.slug === slug)?.id;

const people = [
  ["Luis Ricardo", "LUIS RICARDO", null],
  ["Wisley Pereira de Alcantara", "WISLEY PEREIRA DE ALCANTARA", null],
  ["Wellington Ferreira Webber", "WELLINGTON FERREIRA WEBBER", null],
  ["Rafael Cavalheiro Espindola", "RAFAEL CAVALHEIRO ESPINDOLA", null],
  ["Daniel da Silva", "DANIEL DA SILVA", "37098907"],
];
for (const [nome, nomeCompleto, numero] of people) {
  const existing = await supabase.from("colaboradores").select("id").eq("nome_completo_sap", nomeCompleto).maybeSingle();
  if (existing.error) throw existing.error;
  if (!existing.data) {
    const result = await supabase.from("colaboradores").insert({ area_id: areaId("Laminação 1"), nome, nome_completo_sap: nomeCompleto, numero_pessoal: numero });
    if (result.error) throw result.error;
  }
}

const vacations = [
  ["Luis Ricardo", "2026-09-03", "2026-09-22"], ["Wisley Pereira de Alcantara", "2026-08-31", "2026-09-07"],
  ["Wellington Ferreira Webber", "2026-10-05", "2026-10-09"], ["Rafael Cavalheiro Espindola", "2026-08-17", "2026-08-31"],
  ["Daniel da Silva", "2026-08-31", "2026-09-07"],
];
const stops = [
  ["Preventiva da Laminação 2", "Parada preventiva de 8 horas", "Laminação 2", "2026-08-12", "08:00", "2026-08-12", "16:00", false],
  ["Preventiva do LPP", "Parada preventiva de 8 horas", "LPP", "2026-08-13", "08:00", "2026-08-13", "16:00", false],
  ["Elétrica geral da Usina", "Parada elétrica geral", "Usina", "2026-08-20", null, "2026-08-20", null, true],
  ["Parada da Laminação 1", "Parada programada", "Laminação 1", "2026-08-25", null, "2026-08-31", null, true],
];

async function ensureEvent(payload) {
  const existing = await supabase.from("eventos").select("id").eq("tipo_evento_id", payload.tipo_evento_id).eq("titulo", payload.titulo).eq("data_inicio", payload.data_inicio).eq("data_fim", payload.data_fim).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;
  const inserted = await supabase.from("eventos").insert(payload).select("id").single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

for (const [titulo, inicio, fim] of vacations) {
  const eventId = await ensureEvent({ tipo_evento_id: typeId("ferias"), area_id: areaId("Laminação 1"), titulo, data_inicio: inicio, data_fim: fim, dia_inteiro: true, status: "programado" });
  const person = await supabase.from("colaboradores").select("id").eq("nome", titulo).single();
  if (person.error) throw person.error;
  const link = await supabase.from("evento_colaboradores").upsert({ evento_id: eventId, colaborador_id: person.data.id, papel: "colaborador em férias", confirmado: true });
  if (link.error) throw link.error;
}

for (const [titulo, descricao, area, inicio, horaInicio, fim, horaFim, diaInteiro] of stops) {
  const eventId = await ensureEvent({ tipo_evento_id: typeId("parada"), area_id: areaId(area), titulo, descricao, data_inicio: inicio, hora_inicio: horaInicio, data_fim: fim, hora_fim: horaFim, dia_inteiro: diaInteiro, status: "programado" });
  const detail = await supabase.from("parada_detalhes").upsert({ evento_id: eventId, tipo_manutencao: titulo.includes("Preventiva") ? "Preventiva" : titulo.includes("Elétrica") ? "Elétrica" : "Programada", status_execucao: "programada" });
  if (detail.error) throw detail.error;
}

console.log(JSON.stringify({ colaboradores: people.length, ferias: vacations.length, paradas: stops.length }));
