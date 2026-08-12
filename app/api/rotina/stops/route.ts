import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await createSupabaseAdmin().from("eventos")
      .select("id, titulo, data_inicio, data_fim, hora_inicio, hora_fim, areas(nome), tipos_evento!inner(slug), parada_detalhes(tipo_manutencao)")
      .eq("tipos_evento.slug", "parada").neq("status", "cancelado").order("data_inicio");
    if (error) throw error;
    const stops = (data ?? []).map((row: any) => ({
      id: row.id, area: (Array.isArray(row.areas) ? row.areas[0] : row.areas)?.nome ?? "",
      tipo: row.parada_detalhes?.[0]?.tipo_manutencao ? `Parada ${row.parada_detalhes[0].tipo_manutencao.toLowerCase()}` : row.titulo,
      inicio: row.data_inicio, fim: row.data_fim,
      horaInicio: row.hora_inicio?.slice(0, 5) ?? "", horaFim: row.hora_fim?.slice(0, 5) ?? "",
    }));
    return NextResponse.json({ stops }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao listar paradas:", error);
    return NextResponse.json({ error: "Não foi possível carregar as paradas." }, { status: 500 });
  }
}
