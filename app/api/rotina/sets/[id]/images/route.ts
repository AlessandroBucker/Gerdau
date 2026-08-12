import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const bucket = "conjuntos-reserva-imagens";
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("conjunto_imagens").select("id,caminho_arquivo,nome_arquivo").eq("conjunto_id", id).order("criado_em");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const images = await Promise.all((data ?? []).map(async image => { const signed = await supabase.storage.from(bucket).createSignedUrl(image.caminho_arquivo, 3600); return signed.error ? null : { id: image.id, name: image.nome_arquivo, url: signed.data.signedUrl }; }));
  return NextResponse.json({ images: images.filter(Boolean) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { id } = await params; const form = await request.formData(); const files = form.getAll("images").filter((value): value is File => value instanceof File);
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]); const supabase = createSupabaseAdmin();
  for (const file of files) { if (!allowed.has(file.type) || file.size > 10485760) return NextResponse.json({ error: `${file.name}: imagem inválida ou maior que 10 MB.` }, { status: 400 }); const ext = file.name.split(".").pop()?.toLowerCase() || "img"; const path = `${id}/${randomUUID()}.${ext}`; const upload = await supabase.storage.from(bucket).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type }); if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 500 }); const record = await supabase.from("conjunto_imagens").insert({ conjunto_id: id, caminho_arquivo: path, nome_arquivo: file.name, tipo_mime: file.type, tamanho_bytes: file.size }); if (record.error) { await supabase.storage.from(bucket).remove([path]); return NextResponse.json({ error: record.error.message }, { status: 500 }); } }
  return NextResponse.json({ count: files.length });
}
