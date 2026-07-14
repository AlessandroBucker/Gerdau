import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminError, requireAdmin } from "@/lib/admin-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const codeId = String(form.get("codeId") ?? "");
    if (!(file instanceof File) || !UUID.test(codeId)) {
      return NextResponse.json({ error: "Selecione um código e um arquivo PDF." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json({ error: "O PDF deve ter no máximo 50 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const header = new TextDecoder("ascii").decode(bytes.slice(0, 5));
    if (file.type !== "application/pdf" || header !== "%PDF-") {
      return NextResponse.json({ error: "O arquivo enviado não é um PDF válido." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: accessCode, error: codeError } = await supabase
      .from("codigos_acesso").select("id").eq("id", codeId).eq("ativo", true).maybeSingle();
    if (codeError) return adminError(codeError, "Não foi possível validar o código selecionado.");
    if (!accessCode) return NextResponse.json({ error: "O código selecionado não está ativo." }, { status: 400 });

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "documentos-pdf";
    const objectPath = `${codeId}/${randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) return adminError(uploadError, "Não foi possível enviar o PDF.");

    const title = safeTitle(file.name);
    const { data, error: insertError } = await supabase
      .from("documentos_pdf")
      .insert({ titulo: title, url_arquivo: objectPath, codigo_id: codeId })
      .select("id, titulo, criado_em")
      .single();
    if (insertError) {
      await supabase.storage.from(bucket).remove([objectPath]);
      return adminError(insertError, "O arquivo foi enviado, mas não pôde ser vinculado.");
    }
    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    return adminError(error, "Não foi possível processar o upload.");
  }
}

function safeTitle(value: string) {
  const title = value.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim().slice(0, 180);
  return title || "documento.pdf";
}
