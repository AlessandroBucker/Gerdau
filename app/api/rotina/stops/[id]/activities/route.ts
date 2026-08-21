import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ActivityInput = {
  setor?: string; especialidade?: string; ordem?: string; descricao?: string;
  responsavel?: string; equipe?: string; observacoes?: string;
  dataInicio?: string; horaInicio?: string; duracaoPrevistaMinutos?: number;
  permiteSabado?: boolean; permiteDomingo?: boolean;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function activityValues(eventoId: string, body: ActivityInput) {
  const descricao = clean(body.descricao);
  const setor = clean(body.setor);
  const dataInicio = clean(body.dataInicio);
  const horaInicio = clean(body.horaInicio);
  if (!descricao || !setor) throw new Error("Setor e descrição da atividade são obrigatórios.");
  const duracaoPrevistaMinutos = Number(body.duracaoPrevistaMinutos);
  if (!dataInicio || !horaInicio) throw new Error("Informe a data e a hora de início da atividade.");
  if (!Number.isInteger(duracaoPrevistaMinutos) || duracaoPrevistaMinutos <= 0) throw new Error("Informe um tempo de execução válido em minutos.");
  const inicio = new Date(`${dataInicio}T${horaInicio}:00Z`);
  if (Number.isNaN(inicio.getTime())) throw new Error("Data ou hora de início inválida.");
  const fim = new Date(inicio.getTime() + duracaoPrevistaMinutos * 60_000);
  const dataFim = fim.toISOString().slice(0, 10);
  const horaFim = fim.toISOString().slice(11, 16);

  const supabase = createSupabaseAdmin();
  const { data: event, error: eventError } = await supabase.from("eventos").select("area_id").eq("id", eventoId).single();
  if (eventError || !event?.area_id) throw eventError ?? new Error("Parada sem área vinculada.");

  const { data: sector, error: sectorError } = await supabase.from("setores")
    .upsert({ area_id: event.area_id, nome: setor, ativo: true }, { onConflict: "area_id,nome" })
    .select("id").single();
  if (sectorError) throw sectorError;

  return {
    area_id: event.area_id, setor_id: sector.id, especialidade: clean(body.especialidade) || null,
    ordem: clean(body.ordem) || null, atividade: descricao, responsavel_apr: clean(body.responsavel) || null,
    equipe: clean(body.equipe) || null, observacao: clean(body.observacoes) || null,
    data_inicio: dataInicio, hora_inicio: horaInicio, data_fim: dataFim, hora_fim: horaFim,
    duracao_prevista_minutos: duracaoPrevistaMinutos,
    permite_sabado: body.permiteSabado === true,
    permite_domingo: body.permiteDomingo === true,
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = createSupabaseAdmin();
    const { data: event, error: eventError } = await supabase.from("eventos").select("area_id").eq("id", id).single();
    if (eventError) throw eventError;
    const [{ data, error }, { data: sectorRows, error: sectorsError }] = await Promise.all([
      supabase.from("parada_atividades")
      .select("id, sequencia, especialidade, ordem, atividade, responsavel_apr, equipe, observacao, data_inicio, hora_inicio, data_fim, hora_fim, duracao_prevista_minutos, permite_sabado, permite_domingo, status, reprogramada, quantidade_reprogramacoes, setores(nome, ordem_exibicao)")
      .eq("evento_id", id).order("sequencia"),
      supabase.from("setores").select("nome").eq("area_id", event.area_id).eq("ativo", true).order("ordem_exibicao").order("nome"),
    ]);
    if (error) throw error;
    if (sectorsError) throw sectorsError;
    const activities = (data ?? []).map((row: any) => ({
      id: row.id, sequencia: row.sequencia,
      setor: (Array.isArray(row.setores) ? row.setores[0] : row.setores)?.nome ?? "Sem setor",
      especialidade: row.especialidade ?? "", ordem: row.ordem ?? "", descricao: row.atividade,
      responsavel: row.responsavel_apr ?? "", equipe: row.equipe ?? "", observacoes: row.observacao ?? "",
      dataInicio: row.data_inicio, horaInicio: row.hora_inicio?.slice(0, 5) ?? "",
      dataFim: row.data_fim, horaFim: row.hora_fim?.slice(0, 5) ?? "",
      duracaoPrevistaMinutos: row.duracao_prevista_minutos,
      permiteSabado: row.permite_sabado ?? false, permiteDomingo: row.permite_domingo ?? false,
      status: row.status, reprogramada: row.reprogramada, quantidadeReprogramacoes: row.quantidade_reprogramacoes,
    }));
    return NextResponse.json({ activities, sectors: (sectorRows ?? []).map(row => row.nome) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao listar atividades da parada:", error);
    return NextResponse.json({ error: "Não foi possível carregar as atividades da parada." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const supabase = createSupabaseAdmin();
    const inputs: ActivityInput[] = Array.isArray(body.activities) ? body.activities : [body];
    if (!inputs.length) return NextResponse.json({ error: "Informe ao menos uma atividade." }, { status: 400 });
    const values = await Promise.all(inputs.map(input => activityValues(id, input)));
    const { data: last, error: sequenceError } = await supabase.from("parada_atividades")
      .select("sequencia").eq("evento_id", id).order("sequencia", { ascending: false }).limit(1).maybeSingle();
    if (sequenceError) throw sequenceError;
    const { error } = await supabase.from("parada_atividades").insert(values.map((value, index) => ({
      ...value, evento_id: id, sequencia: (last?.sequencia ?? 0) + index + 1, status: "programada",
    })));
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Erro ao incluir atividade:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível incluir a atividade." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const supabase = createSupabaseAdmin();
    const { data: belongs, error: belongsError } = await supabase.from("parada_atividades").select("id").eq("id", body.atividadeId).eq("evento_id", id).maybeSingle();
    if (belongsError) throw belongsError;
    if (!belongs) return NextResponse.json({ error: "Atividade não encontrada nesta parada." }, { status: 404 });
    if (body.action === "edit") {
      const values = await activityValues(id, body);
      const { error } = await supabase.from("parada_atividades").update(values).eq("id", body.atividadeId).eq("evento_id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    const { data, error } = await supabase.rpc("reprogramar_parada_atividade", {
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


export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    if (!clean(body.atividadeId)) return NextResponse.json({ error: "Atividade inválida." }, { status: 400 });
    const { data, error } = await createSupabaseAdmin().from("parada_atividades")
      .delete().eq("id", body.atividadeId).eq("evento_id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Atividade não encontrada nesta parada." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir atividade:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível excluir a atividade." }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const sectors = Array.isArray(body.sectors) ? body.sectors.map(clean).filter(Boolean) : [];
    if (!sectors.length) return NextResponse.json({ error: "Informe a ordem dos setores." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: event, error: eventError } = await supabase.from("eventos").select("area_id").eq("id", id).single();
    if (eventError || !event?.area_id) throw eventError ?? new Error("Parada sem área vinculada.");
    for (let index = 0; index < sectors.length; index++) {
      const { error } = await supabase.from("setores").update({ ordem_exibicao: index }).eq("area_id", event.area_id).eq("nome", sectors[index]);
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao ordenar setores:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível ordenar os setores." }, { status: 400 });
  }
}
