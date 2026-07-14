import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminError, requireAdmin } from "@/lib/admin-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { data, error } = await createSupabaseAdmin()
    .from("codigos_acesso")
    .select("id, codigo, descricao, ativo, criado_em, expira_em, documentos_pdf(count)")
    .order("criado_em", { ascending: false });

  if (error) return adminError(error, "Não foi possível carregar os usuários.");
  return NextResponse.json({ codes: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body: unknown = await request.json();
    const description = typeof body === "object" && body !== null && "description" in body ? String(body.description).trim() : "";
    const requestedCode = typeof body === "object" && body !== null && "code" in body ? String(body.code).trim() : "";

    if (!description || description.length > 200) {
      return NextResponse.json({ error: "Informe uma descrição com até 200 caracteres." }, { status: 400 });
    }
    if (requestedCode && !/^\d{6}$/.test(requestedCode)) {
      return NextResponse.json({ error: "O código personalizado deve conter 6 dígitos." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    for (let attempt = 0; attempt < (requestedCode ? 1 : 12); attempt++) {
      const code = requestedCode || randomInt(0, 1_000_000).toString().padStart(6, "0");
      const { data, error } = await supabase
        .from("codigos_acesso")
        .insert({ codigo: code, descricao: description })
        .select("id, codigo, descricao, ativo, criado_em, expira_em")
        .single();

      if (!error) return NextResponse.json({ code: data }, { status: 201 });
      if (error.code !== "23505") return adminError(error, "Não foi possível criar o usuário.");
      if (requestedCode) return NextResponse.json({ error: "Esse identificador de usuário já está em uso." }, { status: 409 });
    }
    return NextResponse.json({ error: "Não foi possível gerar um identificador único. Tente novamente." }, { status: 409 });
  } catch (error) {
    return adminError(error, "Não foi possível criar o usuário.");
  }
}
