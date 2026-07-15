import { NextRequest, NextResponse } from "next/server";
import { adminError, requireAdmin } from "@/lib/admin-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Documento = {
  id: string;
  titulo: string;
  url_arquivo: string;
  data_planejada: string | null;
  dia_semana: string | null;
  criado_em: string;
};

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const codeId = request.nextUrl.searchParams.get("codeId")?.trim() ?? "";
  if (!codeId) return NextResponse.json({ error: "Selecione uma pessoa." }, { status: 400 });

  try {
    const supabase = createSupabaseAdmin();
    const { data: accessCode, error } = await supabase
      .from("codigos_acesso")
      .select("id, numero_pessoal, descricao, documentos_pdf(id, titulo, url_arquivo, data_planejada, dia_semana, criado_em)")
      .eq("id", codeId)
      .maybeSingle();

    if (error) return adminError(error, "Não foi possível carregar a programação.");
    if (!accessCode) return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "documentos-pdf";
    const documents = (accessCode.documentos_pdf ?? []) as Documento[];
    const signedDocuments = await Promise.all(documents.map(async (document) => {
      const [viewResult, downloadResult] = await Promise.all([
        supabase.storage.from(bucket).createSignedUrl(document.url_arquivo, 300),
        supabase.storage.from(bucket).createSignedUrl(document.url_arquivo, 300, { download: safeFilename(document.titulo) }),
      ]);
      if (viewResult.error || downloadResult.error) {
        console.error("Erro ao assinar arquivo para visualização administrativa:", document.id, viewResult.error?.message ?? downloadResult.error?.message);
        return null;
      }
      return {
        id: document.id,
        titulo: document.titulo,
        dataPlanejada: document.data_planejada,
        diaSemana: document.dia_semana,
        criadoEm: document.criado_em,
        viewUrl: viewResult.data.signedUrl,
        downloadUrl: downloadResult.data.signedUrl,
      };
    }));

    return NextResponse.json({
      id: accessCode.id,
      numeroPessoal: accessCode.numero_pessoal,
      descricao: accessCode.descricao,
      documentos: signedDocuments.filter(Boolean),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return adminError(error, "Não foi possível carregar a programação.");
  }
}

function safeFilename(title: string) {
  const normalized = title.replace(/[\\/:*?"<>|\u0000-\u001F]/g, "_").trim() || "documento";
  return normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`;
}
