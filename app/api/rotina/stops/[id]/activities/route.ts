import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { data, error } = await createSupabaseAdmin().from("parada_atividades")
      .select("id, sequencia, especialidade, ordem, atividade, responsavel_apr, equipe, observacao, data_inicio, hora_inicio, data_fim, hora_fim, status, reprogramada, quantidade_reprogramacoes, setores(nome, ordem_exibicao)")
      .eq("evento_id", id).order("sequencia");
    if (error) throw error;
    const activities = (data ?? []).map((row: any) => ({
      id: row.id, sequencia: row.sequencia,
      setor: (Array.isArray(row.setores) ? row.setores[0] : row.setores)?.nome ?? "Sem setor",
      especialidade: row.especialidade ?? "", ordem: row.ordem ?? "", descricao: row.atividade,
      responsavel: row.responsavel_apr ?? "", equipe: row.equipe ?? "", observacoes: row.observacao ?? "",
      dataInicio: row.data_inicio, horaInicio: row.hora_inicio?.slice(0, 5) ?? "",
      dataFim: row.data_fim, horaFim: row.hora_fim?.slice(0, 5) ?? "",
      status: row.status, reprogramada: row.reprogramada, quantidadeReprogramacoes: row.quantidade_reprogramacoes,
    }));
    return NextResponse.json({ activities }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao listar atividades da parada:", error);
    return NextResponse.json({ error: "Não foi possível carregar as atividades da parada." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { data: belongs, error: belongsError } = await createSupabaseAdmin().from("parada_atividades").select("id").eq("id", body.atividadeId).eq("evento_id", id).maybeSingle();
    if (belongsError) throw belongsError;
    if (!belongs) return NextResponse.json({ error: "Atividade não encontrada nesta parada." }, { status: 404 });
    const { data, error } = await createSupabaseAdmin().rpc("reprogramar_parada_atividade", {
      p_atividade_id: body.atividadeId,
      p_nova_data_inicio: body.dataInicio,
      p_nova_hora_inicio: body.horaInicio || null,
      p_nova_data_fim: body.dataFim,
      p_nova_hora_fim: body.horaFim || null,
      p_motivo: body.motivo,
      p_reprogramado_por: body.reprogramadoPor,
    });
    if (error) throw error;
    return NextResponse.json({ activity: data });
  } catch (error) {
    console.error("Erro ao reprogramar atividade:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível reprogramar a atividade." }, { status: 500 });
  }
}
