import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const personalNumber = typeof body === "object" && body !== null && "personalNumber" in body
      ? String(body.personalNumber).trim()
      : "";

    if (!/^\d{8}$/.test(personalNumber)) {
      return invalidCodeResponse();
    }

    const supabase = createSupabaseAdmin();
    const { data: accessCode, error } = await supabase
      .from("codigos_acesso")
      .select("id, descricao, ativo, expira_em, documentos_pdf(id, titulo, url_arquivo, data_planejada, dia_semana, criado_em)")
      .eq("numero_pessoal", personalNumber)
      .maybeSingle();

    if (error) {
      console.error("Erro ao consultar número pessoal:", error.message);
      return serverErrorResponse();
    }

    const expired = accessCode?.expira_em && new Date(accessCode.expira_em).getTime() <= Date.now();
    if (!accessCode || !accessCode.ativo || expired) {
      return invalidCodeResponse();
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "documentos-pdf";
    const ttl = readTtl();
    const documents = (accessCode.documentos_pdf ?? []) as Documento[];

    const signedDocuments = await Promise.all(
      documents
        .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
        .map(async (document) => {
          const [viewResult, downloadResult] = await Promise.all([
            supabase.storage.from(bucket).createSignedUrl(document.url_arquivo, ttl),
            supabase.storage.from(bucket).createSignedUrl(document.url_arquivo, ttl, {
              download: safeFilename(document.titulo),
            }),
          ]);

          if (viewResult.error || downloadResult.error) {
            console.error("Erro ao assinar arquivo:", document.id, viewResult.error?.message ?? downloadResult.error?.message);
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
        }),
    );

    return NextResponse.json(
      { descricao: accessCode.descricao, documentos: signedDocuments.filter(Boolean) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Falha em verify-code:", error);
    return serverErrorResponse();
  }
}

function invalidCodeResponse() {
  return NextResponse.json(
    { error: "Número Pessoal inválido, inativo ou expirado." },
    { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

function serverErrorResponse() {
  return NextResponse.json(
    { error: "Não foi possível validar o Número Pessoal agora. Tente novamente." },
    { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

function readTtl() {
  const configured = Number(process.env.SIGNED_URL_TTL_SECONDS ?? 300);
  return Number.isInteger(configured) && configured >= 60 && configured <= 3600 ? configured : 300;
}

function safeFilename(title: string) {
  const normalized = title.replace(/[\\/:*?"<>|\u0000-\u001F]/g, "_").trim() || "documento";
  return normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`;
}
