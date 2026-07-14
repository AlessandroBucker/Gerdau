import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminError, requireAdmin } from "@/lib/admin-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OBJECT_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/i;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 20;

type RequestedFile = { name: string; size: number; type: string };
type CompletedFile = { path: string; title: string };

// Cria autorizações temporárias. Os PDFs não atravessam a função da Vercel.
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json() as { action?: string; codeId?: string; files?: unknown; documents?: unknown; plannedDate?: string };
    if (body.action === "complete") return completeUpload(body.codeId ?? "", body.documents, body.plannedDate ?? "");
    return prepareUpload(body.codeId ?? "", body.files);
  } catch (error) {
    return adminError(error, "Não foi possível preparar o upload.");
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json() as { codeId?: string; paths?: unknown };
    const paths = parsePaths(body.codeId ?? "", body.paths);
    if (!paths) return NextResponse.json({ error: "Arquivos de limpeza inválidos." }, { status: 400 });
    if (paths.length) {
      const { error } = await createSupabaseAdmin().storage.from(bucketName()).remove(paths);
      if (error) return adminError(error, "Não foi possível limpar o lote incompleto.");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error, "Não foi possível limpar o lote incompleto.");
  }
}

async function prepareUpload(codeId: string, rawFiles: unknown) {
  if (!UUID.test(codeId) || !Array.isArray(rawFiles) || rawFiles.length === 0 || rawFiles.length > MAX_FILES) {
    return NextResponse.json({ error: `Selecione um usuário e de 1 a ${MAX_FILES} PDFs.` }, { status: 400 });
  }

  const files = rawFiles as RequestedFile[];
  for (const file of files) {
    if (!file || typeof file.name !== "string" || !Number.isInteger(file.size) || file.size <= 0 || file.size > MAX_FILE_SIZE || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Cada arquivo deve ser um PDF válido de até 50 MB." }, { status: 400 });
    }
  }

  const supabase = createSupabaseAdmin();
  const { data: user, error: userError } = await supabase
    .from("codigos_acesso").select("id").eq("id", codeId).eq("ativo", true).maybeSingle();
  if (userError) return adminError(userError, "Não foi possível validar o usuário selecionado.");
  if (!user) return NextResponse.json({ error: "O usuário selecionado não está ativo." }, { status: 400 });

  const uploads = [];
  for (const file of files) {
    const path = `${codeId}/${randomUUID()}.pdf`;
    const { data, error } = await supabase.storage.from(bucketName()).createSignedUploadUrl(path);
    if (error) {
      return adminError(error, "Não foi possível autorizar todos os uploads.");
    }
    uploads.push({ path, token: data.token, title: safeTitle(file.name) });
  }

  return NextResponse.json({ uploads, bucket: bucketName() });
}

async function completeUpload(codeId: string, rawDocuments: unknown, plannedDate: string) {
  if (!UUID.test(codeId) || !Array.isArray(rawDocuments) || rawDocuments.length === 0 || rawDocuments.length > MAX_FILES) {
    return NextResponse.json({ error: "Lote de documentos inválido." }, { status: 400 });
  }

  const documents = rawDocuments as CompletedFile[];
  const paths = documents.map((document) => document?.path);
  if (!isValidDate(plannedDate) || !parsePaths(codeId, paths) || documents.some((document) => typeof document.title !== "string" || !document.title.trim())) {
    return NextResponse.json({ error: "Lote de documentos inválido." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const rows = documents.map((document) => ({
    titulo: safeTitle(document.title),
    url_arquivo: document.path,
    codigo_id: codeId,
    data_planejada: plannedDate,
  }));
  const { data, error } = await supabase.from("documentos_pdf").insert(rows).select("id, titulo, data_planejada, dia_semana, criado_em");
  if (error) {
    await supabase.storage.from(bucketName()).remove(paths);
    return adminError(error, "Os PDFs foram enviados, mas não puderam ser vinculados ao usuário.");
  }
  return NextResponse.json({ documents: data, count: data.length }, { status: 201 });
}

function parsePaths(codeId: string, rawPaths: unknown) {
  if (!UUID.test(codeId) || !Array.isArray(rawPaths) || rawPaths.length > MAX_FILES) return null;
  const paths = rawPaths.map(String);
  return paths.every((path) => OBJECT_PATH.test(path) && path.startsWith(`${codeId}/`)) ? paths : null;
}

function bucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "documentos-pdf";
}

function safeTitle(value: string) {
  const title = value.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim().slice(0, 180);
  return title || "documento.pdf";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
