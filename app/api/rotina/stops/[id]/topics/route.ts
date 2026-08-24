import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const validStages = new Set(["pre_parada", "pos_parada"]);

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { data, error } = await createSupabaseAdmin().from("parada_assuntos")
      .select("etapa, conteudo").eq("evento_id", id);
    if (error) throw error;
    const topics = { preParada: "", posParada: "" };
    for (const row of data ?? []) {
      if (row.etapa === "pre_parada") topics.preParada = row.conteudo ?? "";
      if (row.etapa === "pos_parada") topics.posParada = row.conteudo ?? "";
    }
    return NextResponse.json({ topics }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao carregar assuntos da parada:", error);
    return NextResponse.json({ error: "Não foi possível carregar os assuntos da parada." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const stage = typeof body.etapa === "string" ? body.etapa : "";
    const content = typeof body.conteudo === "string" ? body.conteudo : "";
    if (!validStages.has(stage)) return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: stop, error: stopError } = await supabase.from("parada_detalhes")
      .select("evento_id").eq("evento_id", id).maybeSingle();
    if (stopError) throw stopError;
    if (!stop) return NextResponse.json({ error: "Parada não encontrada." }, { status: 404 });

    const { error } = await supabase.from("parada_assuntos")
      .upsert({ evento_id: id, etapa: stage, conteudo: content }, { onConflict: "evento_id,etapa" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao salvar assuntos da parada:", error);
    return NextResponse.json({ error: "Não foi possível salvar os assuntos da parada." }, { status: 500 });
  }
}
