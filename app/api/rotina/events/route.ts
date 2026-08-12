import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  tipos_evento: { slug: string; nome: string; cor: string } | { slug: string; nome: string; cor: string }[];
  areas: { nome: string } | { nome: string }[] | null;
};

export async function GET() {
  try {
    const { data, error } = await createSupabaseAdmin()
      .from("eventos")
      .select("id, titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim, tipos_evento!inner(slug, nome, cor), areas(nome)")
      .neq("status", "cancelado")
      .order("data_inicio", { ascending: true });
    if (error) throw error;
    const events = ((data ?? []) as EventRow[]).map(row => {
      const type = Array.isArray(row.tipos_evento) ? row.tipos_evento[0] : row.tipos_evento;
      const area = Array.isArray(row.areas) ? row.areas[0] : row.areas;
      return { id: row.id, title: row.titulo, description: row.descricao, type: type.slug, typeName: type.nome, color: type.cor, area: area?.nome ?? null, start: row.data_inicio, end: row.data_fim, startTime: row.hora_inicio, endTime: row.hora_fim };
    });
    return NextResponse.json({ events }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Erro ao listar eventos da rotina:", error);
    return NextResponse.json({ error: "Não foi possível carregar os eventos." }, { status: 500 });
  }
}
