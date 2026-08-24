"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { CalendarClock, Factory, Pencil, Plus, Search, X } from "lucide-react";
import { DataLoading } from "@/components/data-loading";
import { useRouter } from "next/navigation";

type Stop = { id?: string; area: string; tipo: string; inicio: string; horaInicio: string; fim: string; horaFim: string };

function formatDate(iso: string) { return new Intl.DateTimeFormat("pt-BR").format(new Date(`${iso}T12:00:00`)); }

function formatStopRange(stop: Stop) {
  const startTime = stop.horaInicio || "Horário não informado";
  const endTime = stop.horaFim || "Horário não informado";
  if (stop.inicio === stop.fim) return `${formatDate(stop.inicio)} · ${startTime}–${endTime}`;
  return `${formatDate(stop.inicio)} ${startTime} → ${formatDate(stop.fim)} ${endTime}`;
}

function stopCategory(type: string) {
  const categories = ["Preventiva", "Corretiva", "Elétrica", "Mecânica", "Anual", "Programada", "Emergencial"];
  return categories.find(category => type.toLocaleLowerCase("pt-BR").includes(category.toLocaleLowerCase("pt-BR"))) ?? type.trim().split(/\s+/)[0] ?? "Parada";
}

function stopTime(stop: Stop, edge: "start" | "end") {
  const date = edge === "start" ? stop.inicio : stop.fim;
  const time = edge === "start" ? (stop.horaInicio || "00:00") : (stop.horaFim || "23:59");
  return new Date(`${date}T${time}:00`).getTime();
}

function DateTime({ date, time }: { date: string; time: string }) {
  return <div><span className="font-semibold text-slate-800">{formatDate(date)}</span><span className={`ml-2 rounded-md px-2 py-1 text-xs font-bold ${time ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-400"}`}>{time || "Hora não informada"}</span></div>;
}

export default function ParadasPage() {
  const router = useRouter();
  const [stops, setStops] = useState<Stop[]>([]);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredStops = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return stops;
    return stops.filter(stop => [stop.area, stop.tipo, formatDate(stop.inicio), formatDate(stop.fim), stop.horaInicio, stop.horaFim]
      .some(value => value.toLocaleLowerCase("pt-BR").includes(term)));
  }, [search, stops]);

  const groupedStops = useMemo(() => {
    const now = Date.now();
    const occurring = filteredStops.filter(stop => stopTime(stop, "start") <= now && stopTime(stop, "end") >= now)
      .sort((left, right) => stopTime(left, "start") - stopTime(right, "start"));
    const future = filteredStops.filter(stop => stopTime(stop, "start") > now)
      .sort((left, right) => stopTime(left, "start") - stopTime(right, "start"));
    const previous = filteredStops.filter(stop => stopTime(stop, "end") < now)
      .sort((left, right) => stopTime(right, "end") - stopTime(left, "end"));
    return [
      { label: "Ocorrendo", items: occurring, tone: "bg-emerald-50 text-emerald-800" },
      { label: "Futuras", items: future, tone: "bg-blue-50 text-blue-800" },
      { label: "Anteriores", items: previous, tone: "bg-slate-100 text-slate-700" },
    ].filter(group => group.items.length > 0);
  }, [filteredStops]);

  useEffect(() => { fetch("/api/rotina/stops", { cache: "no-store" }).then(response => response.json()).then(data => { if (data.stops) setStops(data.stops); }).finally(() => setLoading(false)); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stop: Stop = { area: String(form.get("area")), tipo: String(form.get("tipo")), inicio: String(form.get("inicio")), horaInicio: String(form.get("horaInicio")), fim: String(form.get("fim")), horaFim: String(form.get("horaFim")) };
    setFormError("");
    if (stop.fim < stop.inicio) { setFormError("O fim da parada deve ser posterior ao início."); return; }
    setSaving(true);
    try {
      const current = typeof editing === "number" ? stops[editing] : null;
      const response = await fetch(current?.id ? `/api/rotina/stops/${current.id}` : "/api/rotina/stops", { method: current?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stop) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a parada.");
      if (editing === "new") setStops(currentStops => [...currentStops, data.stop]);
      else if (typeof editing === "number") setStops(currentStops => currentStops.map((item, index) => index === editing ? data.stop : item));
      setEditing(null);
    } catch (error) { setFormError(error instanceof Error ? error.message : "Não foi possível salvar a parada."); }
    finally { setSaving(false); }
  }

  return <div className="pb-20 lg:pb-0">
    <header className="mb-6 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600"><Factory size={24} /></span><h1 className="text-3xl font-bold tracking-tight text-slate-950">Paradas</h1></header>
    <div className="mb-3 hidden items-center justify-end gap-2 lg:flex">
      <button type="button" onClick={() => setEditing("new")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-brand-700"><Plus size={18} /> Adicionar parada</button>
      <button type="button" onClick={() => setSearchOpen(open => !open)} aria-expanded={searchOpen} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold shadow-sm ${searchOpen || search ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}><Search size={18} /> Pesquisar</button>
    </div>
    {searchOpen && <div className="mb-3 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
      <div className="flex items-center gap-3">
        <label className="relative block min-w-0 flex-1"><span className="sr-only">Pesquisar paradas</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input autoFocus value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar área, tipo ou data" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100" />{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Limpar pesquisa"><X size={16} /></button>}</label>
        <span className="shrink-0 text-sm font-semibold text-slate-500">{filteredStops.length} {filteredStops.length === 1 ? "resultado" : "resultados"}</span>
      </div>
    </div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {loading ? <DataLoading label="Carregando paradas..." compact /> : <>
        <div className="lg:hidden">
          {groupedStops.map(group => <section key={group.label} aria-label={group.label}>
            <div className={`flex items-center justify-between border-y border-slate-200 px-4 py-2 ${group.tone}`}><h3 className="text-xs font-extrabold uppercase tracking-wider">{group.label}</h3><span className="text-xs font-bold">{group.items.length}</span></div>
            <div className="divide-y divide-slate-200">{group.items.map(item => { const index = stops.indexOf(item); return <article key={item.id ?? `${item.area}-${index}`} role="button" tabIndex={0} onClick={() => item.id && router.push(`/ROTINA/paradas/${item.id}`)} onKeyDown={event => { if ((event.key === "Enter" || event.key === " ") && item.id) router.push(`/ROTINA/paradas/${item.id}`); }} className="group cursor-pointer px-4 py-4 outline-none transition active:bg-rose-50 focus:bg-rose-50">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <span className="inline-flex rounded-lg bg-rose-50 px-2.5 py-1 text-sm font-bold text-rose-700">{item.area}</span>
                <h3 className="mt-2 break-words text-base font-bold leading-6 text-slate-900">{item.tipo}</h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium leading-5 text-slate-600"><CalendarClock size={15} className="shrink-0 text-slate-400" /> {formatStopRange(item)}</p>
                <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600">{stopCategory(item.tipo)}</span>
              </div>
              <button type="button" onClick={event => { event.stopPropagation(); setEditing(index); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm active:bg-brand-50 active:text-brand-700" aria-label={`Editar ${item.tipo}`}><Pencil size={16} /></button>
            </div>
          </article>; })}</div>
          </section>)}
          {groupedStops.length === 0 && <div className="grid min-h-44 place-items-center px-6 text-center"><div><Search className="mx-auto text-slate-300" size={30} /><p className="mt-2 text-sm font-semibold text-slate-500">Nenhuma parada encontrada.</p></div></div>}
        </div>
        <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[860px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Área</th><th className="px-5 py-3">Tipo de parada</th><th className="px-5 py-3">Início</th><th className="px-5 py-3">Fim</th><th className="px-5 py-3 text-right">Editar</th></tr></thead><tbody className="divide-y divide-slate-200">{groupedStops.map(group => <Fragment key={group.label}><tr><th colSpan={5} className={`px-5 py-2 text-xs font-extrabold uppercase tracking-wider ${group.tone}`}>{group.label} <span className="ml-2 opacity-70">{group.items.length}</span></th></tr>{group.items.map(item => { const index = stops.indexOf(item); return <tr key={item.id ?? `${item.area}-${index}`} onClick={() => item.id && router.push(`/ROTINA/paradas/${item.id}`)} className="cursor-pointer hover:bg-rose-50/50"><td className="px-5 py-4"><span className="rounded-lg bg-rose-50 px-2.5 py-1 text-sm font-bold text-rose-700">{item.area}</span></td><td className="px-5 py-4 font-semibold text-slate-800">{item.tipo}</td><td className="px-5 py-4"><DateTime date={item.inicio} time={item.horaInicio} /></td><td className="px-5 py-4"><DateTime date={item.fim} time={item.horaFim} /></td><td className="px-5 py-4 text-right"><button type="button" onClick={event => { event.stopPropagation(); setEditing(index); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700" aria-label={`Editar ${item.tipo}`}><Pencil size={16} /> Editar</button></td></tr>; })}</Fragment>)}</tbody></table></div>
      </>}
    </section>

    {searchOpen && <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 px-3 lg:hidden">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
        <label className="relative block"><span className="sr-only">Pesquisar paradas</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input autoFocus value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar área, tipo ou data" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100" />{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 active:bg-slate-100" aria-label="Limpar pesquisa"><X size={16} /></button>}</label>
        <p className="mt-2 px-1 text-xs font-semibold text-slate-500">{filteredStops.length} {filteredStops.length === 1 ? "resultado" : "resultados"}</p>
      </div>
    </div>}

    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.10)] backdrop-blur lg:hidden">
      <div className="mx-auto flex w-full max-w-lg items-center gap-2">
        <button type="button" onClick={() => setEditing("new")} className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm active:bg-brand-700"><Plus size={20} /> Adicionar parada</button>
        <button type="button" onClick={() => setSearchOpen(open => !open)} aria-expanded={searchOpen} aria-label="Pesquisar paradas" title="Pesquisar" className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border shadow-sm ${searchOpen || search ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700"}`}><Search size={20} /></button>
      </div>
    </div>

    {editing !== null && <StopForm stop={editing === "new" ? null : stops[editing]} saving={saving} error={formError} onClose={() => setEditing(null)} onSubmit={save} />}
  </div>;
}

function Details({ stop, onClose, onEdit }: { stop: Stop; onClose: () => void; onEdit: () => void }) {
  return <Modal title="Detalhes da parada" onClose={onClose}><div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2"><Detail label="Área" value={stop.area} /><Detail label="Tipo de parada" value={stop.tipo} /><Detail label="Início" value={`${formatDate(stop.inicio)}${stop.horaInicio ? ` às ${stop.horaInicio}` : ""}`} /><Detail label="Fim" value={`${formatDate(stop.fim)}${stop.horaFim ? ` às ${stop.horaFim}` : ""}`} /></div><button onClick={onEdit} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white hover:bg-brand-700"><Pencil size={17} /> Editar informações</button></Modal>;
}

function StopForm({ stop, saving, error, onClose, onSubmit }: { stop: Stop | null; saving: boolean; error: string; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={stop ? "Editar parada" : "Adicionar parada"} onClose={onClose}><form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Field label="Área" name="area" defaultValue={stop?.area} /><Field label="Tipo de parada" name="tipo" defaultValue={stop?.tipo} /><Field label="Data de início" name="inicio" type="date" defaultValue={stop?.inicio} /><Field label="Hora de início" name="horaInicio" type="time" defaultValue={stop?.horaInicio} required={false} /><Field label="Data de fim" name="fim" type="date" defaultValue={stop?.fim} /><Field label="Hora de fim" name="horaFim" type="time" defaultValue={stop?.horaFim} required={false} />{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 sm:col-span-2">{error}</p>}<div className="flex gap-2 sm:col-span-2"><button disabled={saving} type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600 disabled:opacity-50">Cancelar</button><button disabled={saving} className="flex-1 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button></div></form></Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><CalendarClock size={20} /></span><h2 className="flex-1 text-xl font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div>{children}</div></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>; }
function Field({ label, name, type = "text", defaultValue, required = true }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) { return <label className="text-sm font-semibold text-slate-700">{label}<input name={name} type={type} required={required} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" /></label>; }
