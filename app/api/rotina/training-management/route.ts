import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  try {
    const db = createSupabaseAdmin();
    const [people, courses, records, movements] = await Promise.all([
      db.from("controle_treinamentos_colaboradores").select("id,np,nome,situacao,obs").order("nome"),
      db.from("controle_treinamentos_catalogo").select("id,nome,validade,situacao,obs").order("nome"),
      db.from("controle_treinamentos_registros").select("id,colaborador_id,treinamento_id,formacao,vencimento,reciclagem,obs").order("formacao", { ascending: false }),
      db.from("controle_treinamentos_movimentos").select("id,tipo,acao,descricao,quando").order("criado_em", { ascending: false }),
    ]);
    for (const result of [people, courses, records, movements]) if (result.error) throw result.error;
    return NextResponse.json({ data: {
      colaboradores: people.data ?? [],
      treinamentos: courses.data ?? [],
      registros: (records.data ?? []).map((item: any) => ({ id: item.id, colaboradorId: item.colaborador_id, treinamentoId: item.treinamento_id, formacao: item.formacao ?? "", vencimento: item.vencimento ?? "", reciclagem: item.reciclagem ?? "", obs: item.obs ?? "" })),
      movimentos: movements.data ?? [],
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao carregar base de treinamentos:", error);
    return NextResponse.json({ error: "Não foi possível carregar a base do Supabase." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const data = body?.data;
  if (!data || !Array.isArray(data.colaboradores) || !Array.isArray(data.treinamentos) || !Array.isArray(data.registros) || !Array.isArray(data.movimentos)) {
    return NextResponse.json({ error: "A base enviada está incompleta." }, { status: 400 });
  }
  try {
    const { data: result, error } = await createSupabaseAdmin().rpc("importar_controle_treinamentos", { p_dados: data });
    if (error) throw error;
    return NextResponse.json({ ok: true, totals: result });
  } catch (error) {
    console.error("Erro ao salvar base de treinamentos:", error);
    return NextResponse.json({ error: "Não foi possível salvar a base no Supabase." }, { status: 500 });
  }
}
