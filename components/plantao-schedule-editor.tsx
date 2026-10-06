"use client";
import { FormEvent, useState } from "react";
import { Schedule, ScheduleEvent, scheduleDay, withEvent, nextEventDate, dateKey, dayNumber } from "@/lib/plantao-schedule";

export type DaySelection = { id: string; date: string };
export function PlantaoScheduleEditor({ schedules, events, selected, saving, onSave, onClose }: {
 schedules: Schedule[]; events: ScheduleEvent[]; selected: DaySelection | null; saving: boolean;
 onSave: (row: Schedule, event: ScheduleEvent | null) => Promise<boolean>; onClose: () => void;
}) {
 const [editing,setEditing]=useState<string | null>(selected?.id ?? null);
 const [preview,setPreview]=useState<{row:Schedule;event:ScheduleEvent}|null>(null);
 const [error,setError]=useState("");
 const current=schedules.find(row=>row.id===editing);
 const config=events.filter(event=>event.schedule_id===editing && event.kind==="config" && event.start_date<=(selected?.date ?? dateKey(new Date()))).at(-1);
 function prepare(e:FormEvent<HTMLFormElement>) {
  e.preventDefault();setError("");const f=new FormData(e.currentTarget);
  const row:Schedule={id:current?.id??crypto.randomUUID(),name:String(f.get("name")??current?.name??"").trim(),color:String(f.get("color")??current?.color??"#a3e635"),active:current?.active??true};
  const start=String(f.get("date"));
  const kind=selected?"restart":"config";
  let event:ScheduleEvent={schedule_id:row.id,start_date:start,kind,phase:f.get("phase") as "work"|"rest",work_days:kind==="config"?Number(f.get("work")):null,rest_days:kind==="config"?Number(f.get("rest")):null,cycle_offset:0};
  const existing=events.find(item=>item.schedule_id===row.id && item.start_date===start);
  if(kind==="restart") {
   if(!scheduleDay(row.id,start,events)) {setError("A escala não possui configuração nessa data.");return;}
   if(existing?.kind==="config") event={...existing,phase:event.phase,cycle_offset:0};
  }
  setPreview({row,event});
 }
 const next=preview?nextEventDate(events,preview.event):null;
 const input="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2";
 return <section className="calendar-print-hide mb-4 rounded-xl border bg-white p-4" aria-label="Gerenciar escalas">
  <div className="flex justify-between"><h2 className="text-lg font-bold">{selected?"Reiniciar ciclo a partir de um dia":"Gerenciar escalas"}</h2><button disabled={saving} onClick={onClose} className="rounded border px-3 py-1">Fechar</button></div>
  <p className="my-2 text-sm text-slate-600">Cada mudança exige uma data de início. O histórico anterior e os reinícios futuros são preservados.</p>
  {!selected && <><button disabled={saving} onClick={()=>{setEditing("new");setPreview(null);}} className="my-3 rounded-lg bg-brand-600 px-4 py-2 text-white">Criar escala</button><div className="mb-4 flex flex-wrap gap-3">{schedules.map(row=><div key={row.id} className="rounded-lg border p-3"><b>{row.name}</b> · {row.active?"Ativa":"Desativada"}<div className="mt-2 flex gap-2"><button disabled={saving} className="rounded border px-3 py-1" onClick={()=>{setEditing(row.id);setPreview(null);}}>Editar</button><button disabled={saving} className="rounded border px-3 py-1" onClick={()=>onSave({...row,active:!row.active},null)}>{row.active?"Desativar":"Ativar"}</button></div></div>)}</div></>}
  {editing && <form key={`${editing}-${selected?.date??""}`} onSubmit={prepare} onChange={()=>setPreview(null)}><fieldset disabled={saving} className="grid gap-3 sm:grid-cols-3">
   {!selected && <><label>Nome<input required name="name" maxLength={60} defaultValue={current?.name??""} className={input}/></label><label>Cor<input name="color" type="color" defaultValue={current?.color??"#a3e635"} className={input}/></label><label>Dias de trabalho<input required name="work" type="number" min={1} max={365} defaultValue={config?.work_days??4} className={input}/></label><label>Dias de folga<input required name="rest" type="number" min={1} max={365} defaultValue={config?.rest_days??2} className={input}/></label></>}
   <label>Data de início<input required name="date" type="date" defaultValue={selected?.date??dateKey(new Date())} readOnly={!!selected} className={input}/></label><label>Começar com<select name="phase" className={input}><option value="work">Trabalho (primeiro dia do bloco)</option><option value="rest">Folga (primeiro dia do bloco)</option></select></label>
   <button className="rounded-lg bg-brand-600 px-4 py-2 text-white sm:col-span-3">Visualizar mudança</button>
  </fieldset></form>}
  {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
  {preview && <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4"><h3 className="font-bold">Prévia · {preview.row.name}</h3><p className="my-2 text-sm">Início: {preview.event.start_date}. {next?`Válido até a véspera de ${next}. A programação dessa data será preservada.`:"Sem outro reinício futuro programado."} Dias anteriores permanecem iguais.</p>
   {events.some(item=>item.schedule_id===preview.row.id&&item.start_date===preview.event.start_date)&&<p className="mb-2 text-sm font-bold">Já existe uma mudança nesta data; ela será substituída.</p>}
   <div className="flex flex-wrap gap-2">{Array.from({length:Math.min(28,next?dayNumber(next)-dayNumber(preview.event.start_date):28)},(_,i)=>{const date=new Date((dayNumber(preview.event.start_date)+i)*86400000).toISOString().slice(0,10);const before=scheduleDay(preview.row.id,date,events);const after=scheduleDay(preview.row.id,date,withEvent(events,preview.event));return <div key={date} className="rounded border bg-white p-2 text-xs"><b>{date.slice(8)}/{date.slice(5,7)}</b><div>{before?(before.working?"Trabalho":"Folga"):"—"} → {after?.working?"Trabalho":"Folga"}</div></div>;})}</div>
   <p className="mt-2 text-xs">Amostra dos primeiros 28 dias afetados.</p><button disabled={saving} onClick={async()=>{if(await onSave(preview.row,preview.event)){setPreview(null);setEditing(null);onClose();}}} className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-white disabled:opacity-50">{saving?"Salvando...":"Confirmar e salvar no banco"}</button>
  </div>}
 </section>;
}
