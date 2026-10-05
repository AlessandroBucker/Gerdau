import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin, adminError } from "@/lib/admin-api";
import { isTeam } from "@/lib/plantao-team";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { data, error } = await createSupabaseAdmin().from("plantao_equipe").select("id,name,shift,team,active").order("criado_em").order("id");
    if (error) throw error;
    return NextResponse.json({ people: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return adminError(error, "Não foi possível carregar o plantão do banco. Verifique se a migração 019 foi aplicada."); }
}
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const people: unknown = body?.people;
  if (!isTeam(people) || people.length < 1 || people.length > 500 || people.some(person => !/^[a-zA-Z0-9_-]{1,100}$/.test(person.id))) {
    return NextResponse.json({ error: "Informe linhas válidas com nome, equipe, escala e situação." }, { status: 400 });
  }
  try {
    const values = people.map(({ id, name, shift, team, active }) => ({ id, name: name.trim(), shift, team, active }));
    const { data, error } = await createSupabaseAdmin().from("plantao_equipe").upsert(values, { onConflict: "id" }).select("id,name,shift,team,active");
    if (error) throw error;
    return NextResponse.json({ people: data });
  } catch (error) { return adminError(error, "Não foi possível salvar as linhas no banco de dados."); }
}
