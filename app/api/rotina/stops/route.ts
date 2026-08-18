import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await createSupabaseAdmin().from("eventos")
      .select("id, titulo, data_inicio, data_fim, hora_inicio, hora_fim, areas(nome), tipos_evento!inner(slug), parada_detalhes(tipo_manutencao)")
      .eq("tipos_evento.slug", "parada").neq("status", "cancelado").order("data_inicio");
    if (error) throw error;
    const stops = (data ?? []).map((row: any) => ({
      id: row.id, area: (Array.isArray(row.areas) ? row.areas[0] : row.areas)?.nome ?? "",
      tipo: row.parada_detalhes?.[0]?.tipo_manutencao || row.titulo,
      inicio: row.data_inicio, fim: row.data_fim,
      horaInicio: row.hora_inicio?.slice(0, 5) ?? "", horaFim: row.hora_fim?.slice(0, 5) ?? "",
    }));
    return NextResponse.json({ stops }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao listar paradas:", error);
    return NextResponse.json({ error: "Não foi possível carregar as paradas." }, { status: 500 });
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  let createdEventId: string | null = null;
  try {
    const body = await request.json();
    const area = clean(body.area);
    const tipo = clean(body.tipo);
    const inicio = clean(body.inicio);
    const fim = clean(body.fim);
    const horaInicio = clean(body.horaInicio);
    const horaFim = clean(body.horaFim);
    if (!area || !tipo || !inicio || !fim) return NextResponse.json({ error: "Área, tipo e datas são obrigatórios." }, { status: 400 });

    const inicioCompleto = new Date(`${inicio}T${horaInicio || "00:00"}:00`);
    const fimCompleto = new Date(`${fim}T${horaFim || "23:59"}:00`);
    if (Number.isNaN(inicioCompleto.getTime()) || Number.isNaN(fimCompleto.getTime()) || fimCompleto < inicioCompleto) {
      return NextResponse.json({ error: "O fim da parada deve ser posterior ao início." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: eventType, error: typeError } = await supabase.from("tipos_evento").select("id").eq("slug", "parada").single();
    if (typeError || !eventType) throw typeError ?? new Error("Tipo de evento 'parada' não encontrado.");
    const { data: targetArea, error: areaError } = await supabase.from("areas").upsert({ nome: area, ativo: true }, { onConflict: "nome" }).select("id").single();
    if (areaError || !targetArea) throw areaError ?? new Error("Não foi possível cadastrar a área.");
    const { data: event, error: eventError } = await supabase.from("eventos").insert({
      tipo_evento_id: eventType.id, area_id: targetArea.id, titulo: tipo, data_inicio: inicio, data_fim: fim,
      hora_inicio: horaInicio || null, hora_fim: horaFim || null, dia_inteiro: !horaInicio && !horaFim, status: "programado",
    }).select("id").single();
    if (eventError || !event) throw eventError ?? new Error("Não foi possível criar o evento.");
    createdEventId = event.id;
    const { error: detailError } = await supabase.from("parada_detalhes").insert({ evento_id: event.id, tipo_manutencao: tipo });
    if (detailError) throw detailError;
    return NextResponse.json({ stop: { id: event.id, area, tipo, inicio, fim, horaInicio, horaFim } }, { status: 201 });
  } catch (error) {
    if (createdEventId) await createSupabaseAdmin().from("eventos").delete().eq("id", createdEventId);
    console.error("Erro ao criar parada:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível criar a parada." }, { status: 400 });
  }
}
