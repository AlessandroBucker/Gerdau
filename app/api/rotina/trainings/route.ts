import { saveEmployeePeriod } from "@/lib/save-employee-period";
﻿import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await createSupabaseAdmin().from("eventos")
      .select("id, titulo, data_inicio, data_fim, areas(nome), tipos_evento!inner(slug), evento_colaboradores(colaboradores(numero_pessoal))")
      .eq("tipos_evento.slug", "treinamento").neq("status", "cancelado").order("data_inicio");
    if (error) throw error;
    const trainings = (data ?? []).map((row: any) => ({
      id: row.id, tipo_registro: "treinamento", nome: row.titulo, inicio: row.data_inicio, fim: row.data_fim,
      area: (Array.isArray(row.areas) ? row.areas[0] : row.areas)?.nome ?? "",
      np: row.evento_colaboradores?.[0]?.colaboradores?.numero_pessoal ?? "",
    }));
    return NextResponse.json({ trainings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao listar treinamentos:", error);
    return NextResponse.json({ error: "Não foi possível carregar os treinamentos." }, { status: 500 });
  }
}


export async function POST(request: NextRequest) { return saveEmployeePeriod(request, "treinamento"); }
export async function PATCH(request: NextRequest) { return saveEmployeePeriod(request, "treinamento"); }
