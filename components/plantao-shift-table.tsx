"use client";
import { Schedule, ScheduleEvent, scheduleDay, dateKey } from "@/lib/plantao-schedule";
export function ShiftTable({ dates, title, schedules, events, onDay }: { dates: Date[]; title: string; schedules: Schedule[]; events: ScheduleEvent[]; onDay:(id:string,date:string)=>void }) {
 const letters=["D","S","T","Q","Q","S","S"];
 return <div className="w-full overflow-hidden"><table className="w-full table-fixed border-collapse text-center">
  <thead>
   <tr><th colSpan={dates.length} className="h-6 border border-slate-400 bg-white p-0 text-xs font-extrabold uppercase leading-none text-slate-950 sm:text-sm">{title}</th></tr>
   <tr>{dates.map(date=><th key={dateKey(date)} className={`border border-slate-400 bg-slate-100 py-1 text-[9px] font-bold sm:text-[10px] xl:text-xs ${date.getDay()===0||date.getDay()===6?"text-red-600":"text-slate-800"}`}>{letters[date.getDay()]}</th>)}</tr>
   <tr>{dates.map(date=><th key={dateKey(date)} className="border border-slate-500 bg-blue-950 py-1 text-[8px] font-bold tracking-tighter text-white sm:text-[9px] xl:text-[10px]">{String(date.getDate()).padStart(2,"0")}/{String(date.getMonth()+1).padStart(2,"0")}</th>)}</tr>
  </thead>
  <tbody>{schedules.filter(row=>row.active).map(row=><tr key={row.id} aria-label={row.name}>{dates.map(date=>{
   const key=dateKey(date),state=scheduleDay(row.id,key,events);
   return <td key={key} className="h-7 border border-slate-400 p-0 text-[9px] font-bold text-slate-950 xl:text-[10px]" style={{backgroundColor:state?(state.working?row.color:"#475569"):"#f1f5f9"}}><button className="block h-7 w-full truncate px-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" onClick={()=>onDay(row.id,key)} title={`${row.name} · ${key} · ${state?(state.working?"Trabalho":"Folga"):"Sem configuração"}${state?.restart?" · Início do ciclo":""}`} aria-label={`Editar ${row.name} em ${key}: ${state?(state.working?"Trabalho":"Folga"):"Sem configuração"}`}>{state?.working?row.name:<span aria-hidden="true">&nbsp;</span>}</button></td>;
  })}</tr>)}</tbody></table>{!schedules.some(row=>row.active)&&<p className="p-3 text-sm">Nenhuma escala ativa.</p>}
 </div>;
}
