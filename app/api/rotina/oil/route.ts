import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin, adminError } from "@/lib/admin-api";
import { parseOilCollection } from "@/lib/oil-analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await createSupabaseAdmin().from("analises_oleo").select("*").order("data_planejada");
    if (error) throw error;
    return NextResponse.json({ collections: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return adminError(error, "Não foi possível carregar as análises de óleo. Verifique a configuração da tabela no Supabase."); }
}

async function save(request: NextRequest, update: boolean) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body, values;
  try {
    body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Dados inválidos.");
    values = parseOilCollection(body);
    if (body.oleo_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.oleo_id)) throw new Error("Invalid oil ID");
    if (update && (typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id))) throw new Error("Identificador inválido.");
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Dados inválidos." }, { status: 400 }); }
  try {
    const { data, error } = await createSupabaseAdmin().rpc("salvar_coleta_oleo", { p_id: update ? body.id : null, p_oleo_id: body.oleo_id || null, p_values: values });
    if (error?.code === "PGRST116") return NextResponse.json({ error: "Coleta não encontrada." }, { status: 404 });
    if (error) throw error;
    return NextResponse.json({ collection: data }, { status: update ? 200 : 201 });
  } catch (error) { return adminError(error, "Não foi possível salvar a coleta."); }
}
export async function POST(request: NextRequest) { return save(request, false); }
export async function PUT(request: NextRequest) { return save(request, true); }
