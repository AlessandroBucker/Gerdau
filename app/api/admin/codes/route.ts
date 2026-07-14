import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminError, requireAdmin } from "@/lib/admin-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { data, error } = await createSupabaseAdmin()
    .from("codigos_acesso")
    .select("id, numero_pessoal, descricao, ativo, criado_em, expira_em, documentos_pdf(count)")
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
    const requestedNumber = typeof body === "object" && body !== null && "personalNumber" in body ? String(body.personalNumber).trim() : "";

    if (!description || description.length > 200) {
      return NextResponse.json({ error: "Informe uma descrição com até 200 caracteres." }, { status: 400 });
    }
    if (requestedNumber && !/^\d{8}$/.test(requestedNumber)) {
      return NextResponse.json({ error: "O Número Pessoal deve conter exatamente 8 dígitos." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    for (let attempt = 0; attempt < (requestedNumber ? 1 : 12); attempt++) {
      const personalNumber = requestedNumber || randomInt(0, 100_000_000).toString().padStart(8, "0");
      const { data, error } = await supabase
        .from("codigos_acesso")
        .insert({ numero_pessoal: personalNumber, descricao: description })
        .select("id, numero_pessoal, descricao, ativo, criado_em, expira_em")
        .single();

      if (!error) return NextResponse.json({ code: data }, { status: 201 });
      if (error.code !== "23505") return adminError(error, "Não foi possível criar o usuário.");
      if (requestedNumber) return NextResponse.json({ error: "Esse Número Pessoal já está em uso." }, { status: 409 });
    }
    return NextResponse.json({ error: "Não foi possível gerar um identificador único. Tente novamente." }, { status: 409 });
  } catch (error) {
    return adminError(error, "Não foi possível criar o usuário.");
  }
}
