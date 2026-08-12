import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = await request.json(); const { id } = await params;
  const values = { prioridade: body.prioridade || null, ordem: body.ordem, equipamento: body.equipamento, observacao_area: body.observacao || null, padrinho_laminacao: body.padrinho || null, recebimento_manutencao_central: body.recebimentoCentral || null, recebimento_servico_area: body.recebimentoArea || null, necessidade_area: body.necessidade || null, comentario_manutencao_central: body.comentarioCentral || null, status: body.status || null };
  const { error } = await createSupabaseAdmin().from("conjuntos_reserva").update(values).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
