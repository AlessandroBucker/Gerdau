import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const columns = "id, prioridade, ordem, equipamento, observacao_area, padrinho_laminacao, recebimento_manutencao_central, recebimento_servico_area, necessidade_area, comentario_manutencao_central, status";

function map(row: any) { return { id: row.id, prioridade: row.prioridade ?? "", ordem: row.ordem, equipamento: row.equipamento, observacao: row.observacao_area ?? "", padrinho: row.padrinho_laminacao ?? "", recebimentoCentral: row.recebimento_manutencao_central ?? "", recebimentoArea: row.recebimento_servico_area ?? "", necessidade: row.necessidade_area ?? "", comentarioCentral: row.comentario_manutencao_central ?? "", status: row.status ?? "" }; }
function payload(body: any) { return { prioridade: body.prioridade || null, ordem: body.ordem, equipamento: body.equipamento, observacao_area: body.observacao || null, padrinho_laminacao: body.padrinho || null, recebimento_manutencao_central: body.recebimentoCentral || null, recebimento_servico_area: body.recebimentoArea || null, necessidade_area: body.necessidade || null, comentario_manutencao_central: body.comentarioCentral || null, status: body.status || null }; }

export async function GET() {
  const { data, error } = await createSupabaseAdmin().from("conjuntos_reserva").select(columns).eq("ativo", true).order("criado_em");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sets: (data ?? []).map(map) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = await request.json();
  const { data, error } = await createSupabaseAdmin().from("conjuntos_reserva").insert(payload(body)).select(columns).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ set: map(data) });
}
