import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin, adminError } from "@/lib/admin-api";
import { validDate } from "@/lib/plantao-schedule";
export const dynamic = "force-dynamic";
export async function GET() {
 try {
  const db = createSupabaseAdmin();
  const [rows, events] = await Promise.all([db.from("plantao_escalas").select("*").order("id"),db.from("plantao_escala_eventos").select("*").order("start_date")]);
  if (rows.error || events.error) throw rows.error || events.error;
  return NextResponse.json({ schedules: rows.data, events: events.data }, {headers:{"Cache-Control":"no-store"}});
 } catch(error) { return adminError(error,"Não foi possível carregar as escalas. Tente novamente."); }
}
export async function POST(request: NextRequest) {
 const denied = await requireAdmin(); if(denied) return denied;
 let body;
 try { body=await request.json(); } catch { return NextResponse.json({error:"Dados inválidos."},{status:400}); }
 const row=body?.row, event=body?.event;
 if(!row || typeof row.id!=="string" || !/^[\w-]{1,100}$/.test(row.id) || typeof row.name!=="string" || !row.name.trim() || row.name.length>60 || typeof row.active!=="boolean" || !/^#[\da-fA-F]{6}$/.test(row.color ?? "") ||
  (event && (!validDate(event.start_date) || !["config","restart"].includes(event.kind) || !["work","rest"].includes(event.phase) || (event.kind==="config" && (![event.work_days,event.rest_days].every(n=>Number.isInteger(n)&&n>=1&&n<=365)))))) return NextResponse.json({error:"Informe nome, data e ciclo válidos (1 a 365 dias por bloco)."},{status:400});
 try {
  const db=createSupabaseAdmin();
  const {data:existing,error:readError}=await db.from("plantao_escalas").select("id").eq("id",row.id).maybeSingle();
  if(readError) throw readError;
  if(!existing && (!event || event.kind!=="config")) return NextResponse.json({error:"Uma nova escala exige configuração e data inicial."},{status:400});
  const {error}=await db.rpc("salvar_escala_plantao",{p_row:{id:row.id,name:row.name.trim(),active:row.active,color:row.color},p_event:event?{start_date:event.start_date,kind:event.kind,phase:event.phase,work_days:event.kind==="config"?event.work_days:null,rest_days:event.kind==="config"?event.rest_days:null}:null});
  if(error) throw error;
  return NextResponse.json({ok:true});
 } catch(error) { return adminError(error,"Não foi possível salvar a escala. Recarregue os dados e tente novamente."); }
}
