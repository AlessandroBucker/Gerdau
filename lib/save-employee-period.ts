import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function saveEmployeePeriod(request: NextRequest, tipo: "ferias" | "treinamento") {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const area = clean(body.area), nome = clean(body.nome), np = clean(body.np);
  const inicio = clean(body.inicio), fim = clean(body.fim), id = clean(body.id);
  if (!area || !nome || area.length > 200 || nome.length > 300 || (np && !/^\d{8}$/.test(np)) ||
      !validDate(inicio) || !validDate(fim) || fim < inicio ||
      (request.method === "PATCH" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    return NextResponse.json({ error: "Informe área, nome, datas válidas e NP de oito dígitos (ou vazio). O fim deve ser igual ou posterior ao início." }, { status: 400 });
  }
  try {
    const { data, error } = await createSupabaseAdmin().rpc("salvar_periodo_colaborador", {
      p_id: request.method === "PATCH" ? id : null, p_tipo: tipo, p_area: area, p_nome: nome, p_np: np, p_inicio: inicio, p_fim: fim,
    });
    if (error) {
      if (error.code === "P0002") return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
      throw error;
    }
    return NextResponse.json({ item: { id: data, area, nome, np, inicio, fim, tipo_registro: tipo } }, { status: request.method === "POST" ? 201 : 200 });
  } catch (error) {
    console.error("Erro ao salvar período:", error);
    return NextResponse.json({ error: "Não foi possível salvar no banco de dados. Tente novamente." }, { status: 500 });
  }
}
