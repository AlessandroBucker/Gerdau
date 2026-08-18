import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const area = clean(body.area);
    const tipo = clean(body.tipo);
    const inicio = clean(body.inicio);
    const fim = clean(body.fim);
    const horaInicio = clean(body.horaInicio);
    const horaFim = clean(body.horaFim);

    if (!area || !tipo || !inicio || !fim) {
      return NextResponse.json({ error: "Área, tipo e datas são obrigatórios." }, { status: 400 });
    }
    const inicioCompleto = new Date(`${inicio}T${horaInicio || "00:00"}:00`);
    const fimCompleto = new Date(`${fim}T${horaFim || "23:59"}:00`);
    if (Number.isNaN(inicioCompleto.getTime()) || Number.isNaN(fimCompleto.getTime()) || fimCompleto < inicioCompleto) {
      return NextResponse.json({ error: "O fim da parada deve ser posterior ao início." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: current, error: currentError } = await supabase.from("eventos").select("id, area_id").eq("id", id).single();
    if (currentError || !current) throw currentError ?? new Error("Parada não encontrada.");

    const { data: targetArea, error: areaError } = await supabase.from("areas")
      .upsert({ nome: area, ativo: true }, { onConflict: "nome" }).select("id").single();
    if (areaError) throw areaError;

    if (current.area_id !== targetArea.id) {
      const { data: activities, error: activitiesError } = await supabase.from("parada_atividades")
        .select("id, setores(nome, ordem_exibicao)").eq("evento_id", id);
      if (activitiesError) throw activitiesError;
      for (const activity of activities ?? []) {
        const related = Array.isArray(activity.setores) ? activity.setores[0] : activity.setores;
        if (!related?.nome) continue;
        const { data: sector, error: sectorError } = await supabase.from("setores")
          .upsert({ area_id: targetArea.id, nome: related.nome, ordem_exibicao: related.ordem_exibicao ?? 0, ativo: true }, { onConflict: "area_id,nome" })
          .select("id").single();
        if (sectorError) throw sectorError;
        const { error: activityAreaError } = await supabase.from("parada_atividades").update({ area_id: targetArea.id, setor_id: sector.id }).eq("id", activity.id);
        if (activityAreaError) throw activityAreaError;
      }
    }

    const eventValues = {
      area_id: targetArea.id, titulo: tipo, data_inicio: inicio, data_fim: fim,
      hora_inicio: horaInicio || null, hora_fim: horaFim || null, dia_inteiro: !horaInicio && !horaFim,
    };
    const { error: eventError } = await supabase.from("eventos").update(eventValues).eq("id", id);
    if (eventError) throw eventError;
    const { error: detailError } = await supabase.from("parada_detalhes").update({ tipo_manutencao: tipo }).eq("evento_id", id);
    if (detailError) throw detailError;
    const { error: activityError } = await supabase.from("parada_atividades").update({
      area_id: targetArea.id, data_inicio: inicio, data_fim: fim,
      hora_inicio: horaInicio || null, hora_fim: horaFim || null,
    }).eq("evento_id", id);
    if (activityError) throw activityError;

    return NextResponse.json({ stop: { id, area, tipo, inicio, fim, horaInicio, horaFim } });
  } catch (error) {
    console.error("Erro ao editar parada:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível editar a parada." }, { status: 400 });
  }
}
