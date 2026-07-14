import { NextRequest, NextResponse } from "next/server";
import { adminError, requireAdmin } from "@/lib/admin-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !("active" in body) || typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    const { data, error } = await createSupabaseAdmin()
      .from("codigos_acesso")
      .update({ ativo: body.active })
      .eq("id", id)
      .select("id, ativo")
      .maybeSingle();
    if (error) return adminError(error, "Não foi possível alterar o status.");
    if (!data) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    return NextResponse.json({ code: data });
  } catch (error) {
    return adminError(error, "Não foi possível alterar o status.");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "documentos-pdf";
  const { data: objects, error: listError } = await supabase.storage.from(bucket).list(id, { limit: 1000 });
  if (listError) return adminError(listError, "Não foi possível localizar os arquivos do Número Pessoal.");

  if (objects?.length) {
    const paths = objects.filter((item) => item.name !== ".emptyFolderPlaceholder").map((item) => `${id}/${item.name}`);
    if (paths.length) {
      const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
      if (removeError) return adminError(removeError, "Não foi possível excluir os arquivos vinculados.");
    }
  }

  const { data, error } = await supabase.from("codigos_acesso").delete().eq("id", id).select("id").maybeSingle();
  if (error) return adminError(error, "Não foi possível excluir o Número Pessoal.");
  if (!data) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
