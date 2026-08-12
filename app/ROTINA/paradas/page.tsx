"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, Factory, Pencil, Plus, X } from "lucide-react";
import { DataLoading } from "@/components/data-loading";
import { useRouter } from "next/navigation";

type Stop = { id?: string; area: string; tipo: string; inicio: string; horaInicio: string; fim: string; horaFim: string };

function formatDate(iso: string) { return new Intl.DateTimeFormat("pt-BR").format(new Date(`${iso}T12:00:00`)); }

function DateTime({ date, time }: { date: string; time: string }) {
  return <div><span className="font-semibold text-slate-800">{formatDate(date)}</span><span className={`ml-2 rounded-md px-2 py-1 text-xs font-bold ${time ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-400"}`}>{time || "Hora não informada"}</span></div>;
}

export default function ParadasPage() {
  const router = useRouter();
  const [stops, setStops] = useState<Stop[]>([]);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/rotina/stops", { cache: "no-store" }).then(response => response.json()).then(data => { if (data.stops) setStops(data.stops); }).finally(() => setLoading(false)); }, []);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stop: Stop = { area: String(form.get("area")), tipo: String(form.get("tipo")), inicio: String(form.get("inicio")), horaInicio: String(form.get("horaInicio")), fim: String(form.get("fim")), horaFim: String(form.get("horaFim")) };
    if (stop.fim < stop.inicio) return;
    if (editing === "new") setStops(current => [...current, stop]);
    else if (typeof editing === "number") setStops(current => current.map((item, index) => index === editing ? stop : item));
    setEditing(null);
  }

  return <div>
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600"><Factory size={24} /></span><h1 className="text-3xl font-bold tracking-tight text-slate-950">Paradas</h1></div><button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"><Plus size={18} /> Adicionar parada</button></header>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-900">Programação de paradas</h2><p className="mt-1 text-sm text-slate-500">{stops.length} eventos cadastrados · Clique em uma linha para visualizar.</p></div>
      {loading ? <DataLoading label="Carregando paradas..." compact /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Área</th><th className="px-5 py-3">Tipo de parada</th><th className="px-5 py-3">Início</th><th className="px-5 py-3">Fim</th></tr></thead><tbody className="divide-y divide-slate-200">{stops.map((item, index) => <tr key={`${item.area}-${index}`} onClick={() => item.id && router.push(`/ROTINA/paradas/${item.id}`)} className="cursor-pointer hover:bg-rose-50/50"><td className="px-5 py-4"><span className="rounded-lg bg-rose-50 px-2.5 py-1 text-sm font-bold text-rose-700">{item.area}</span></td><td className="px-5 py-4 font-semibold text-slate-800">{item.tipo}</td><td className="px-5 py-4"><DateTime date={item.inicio} time={item.horaInicio} /></td><td className="px-5 py-4"><DateTime date={item.fim} time={item.horaFim} /></td></tr>)}</tbody></table></div>}
    </section>

    {editing !== null && <StopForm stop={editing === "new" ? null : stops[editing]} onClose={() => setEditing(null)} onSubmit={save} />}
  </div>;
}

function Details({ stop, onClose, onEdit }: { stop: Stop; onClose: () => void; onEdit: () => void }) {
  return <Modal title="Detalhes da parada" onClose={onClose}><div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2"><Detail label="Área" value={stop.area} /><Detail label="Tipo de parada" value={stop.tipo} /><Detail label="Início" value={`${formatDate(stop.inicio)}${stop.horaInicio ? ` às ${stop.horaInicio}` : ""}`} /><Detail label="Fim" value={`${formatDate(stop.fim)}${stop.horaFim ? ` às ${stop.horaFim}` : ""}`} /></div><button onClick={onEdit} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white hover:bg-brand-700"><Pencil size={17} /> Editar informações</button></Modal>;
}

function StopForm({ stop, onClose, onSubmit }: { stop: Stop | null; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={stop ? "Editar parada" : "Adicionar parada"} onClose={onClose}><form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Field label="Área" name="area" defaultValue={stop?.area} /><Field label="Tipo de parada" name="tipo" defaultValue={stop?.tipo} /><Field label="Data de início" name="inicio" type="date" defaultValue={stop?.inicio} /><Field label="Hora de início" name="horaInicio" type="time" defaultValue={stop?.horaInicio} required={false} /><Field label="Data de fim" name="fim" type="date" defaultValue={stop?.fim} /><Field label="Hora de fim" name="horaFim" type="time" defaultValue={stop?.horaFim} required={false} /><div className="flex gap-2 sm:col-span-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600">Cancelar</button><button className="flex-1 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white">Salvar</button></div></form></Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><CalendarClock size={20} /></span><h2 className="flex-1 text-xl font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div>{children}</div></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>; }
function Field({ label, name, type = "text", defaultValue, required = true }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) { return <label className="text-sm font-semibold text-slate-700">{label}<input name={name} type={type} required={required} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" /></label>; }
