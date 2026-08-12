"use client";

import { CalendarDays, ChevronDown, ChevronUp, GraduationCap, List, Palmtree, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type EventType = "ferias" | "paradas" | "treinamentos";
type CalendarEvent = { id: string; title: string; type: EventType; start: string; end: string; area?: string | null; startTime?: string | null; endTime?: string | null };

const types = {
  ferias: { label: "Férias de colaboradores", prefix: "Férias", icon: Palmtree, dot: "bg-emerald-500", event: "border-emerald-200 bg-emerald-100 text-emerald-800" },
  paradas: { label: "Paradas", prefix: "Parada", icon: Wrench, dot: "bg-rose-500", event: "border-rose-200 bg-rose-100 text-rose-800" },
  treinamentos: { label: "Treinamentos", prefix: "Treinamento", icon: GraduationCap, dot: "bg-violet-500", event: "border-violet-200 bg-violet-100 text-violet-800" },
} as const;

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function localDate(iso: string) { return new Date(`${iso}T12:00:00`); }
function isoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }

export function EventsDashboard() {
  const today = new Date();
  const todaySinceMonday = (today.getDay() + 6) % 7;
  const [cursor, setCursor] = useState(addDays(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12), -todaySinceMonday));
  const [filters, setFilters] = useState<Record<EventType, boolean>>({ ferias: true, paradas: true, treinamentos: true });
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/rotina/events", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar os eventos.");
        return data.events as Array<Omit<CalendarEvent, "type"> & { type: string }>;
      })
      .then(rows => setEvents(rows.flatMap(row => {
        const type = row.type === "parada" ? "paradas" : row.type === "treinamento" ? "treinamentos" : row.type;
        return type in types ? [{ ...row, type: type as EventType }] : [];
      })))
      .catch(error => setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os eventos."));
  }, []);

  const days = useMemo(() => {
    return Array.from({ length: 42 }, (_, index) => addDays(cursor, index));
  }, [cursor]);
  const visibleEvents = useMemo(() => events.filter(event => filters[event.type] && event.end >= isoDate(days[0]) && event.start <= isoDate(days[days.length - 1])), [days, filters]);

  function selectMonth(value: string) {
    const [year, month] = value.split("-").map(Number);
    if (year && month) {
      const first = new Date(year, month - 1, 1, 12);
      setCursor(addDays(first, -((first.getDay() + 6) % 7)));
    }
  }

  return (
    <div>
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><CalendarDays size={20} /></span><h1 className="text-2xl font-bold tracking-tight text-slate-950">Calendário de eventos</h1></div>
        <div className="flex flex-wrap items-center gap-2"><div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm"><button onClick={() => setView("calendar")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold ${view === "calendar" ? "bg-brand-600 text-white" : "text-slate-500"}`}><CalendarDays size={14} /> Calendário</button><button onClick={() => setView("list")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold ${view === "list" ? "bg-brand-600 text-white" : "text-slate-500"}`}><List size={14} /> Listagem</button></div><label className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm"><span className="mr-2 text-[11px] font-bold text-slate-500">Selecionar mês</span><input type="month" value={`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`} onChange={event => selectMonth(event.target.value)} className="bg-transparent text-xs font-bold text-slate-800 outline-none" /></label></div>
      </header>

      <section className="mb-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">{(Object.keys(types) as EventType[]).map(type => { const config = types[type]; const Icon = config.icon; return <button key={type} onClick={() => setFilters(current => ({ ...current, [type]: !current[type] }))} aria-pressed={filters[type]} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${filters[type] ? "border-slate-200 bg-slate-50 text-slate-800" : "border-slate-100 bg-white text-slate-400 opacity-60"}`}><span className={`grid h-6 w-6 place-items-center rounded-md text-white ${config.dot}`}><Icon size={13} /></span>{config.label}<span className={`ml-1 h-1.5 w-1.5 rounded-full ${filters[type] ? config.dot : "bg-slate-300"}`} /></button>; })}</div>
      </section>
      {loadError && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{loadError}</div>}

      {view === "calendar" ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-slate-200 px-4 py-2 sm:px-6"><span /><h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">{monthNames[cursor.getMonth()]} {cursor.getFullYear()}</h2><div className="ml-auto flex flex-col gap-1"><button onClick={() => setCursor(current => addDays(current, -7))} className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50" aria-label="Subir uma semana"><ChevronUp size={18} /></button><button onClick={() => setCursor(current => addDays(current, 7))} className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50" aria-label="Descer uma semana"><ChevronDown size={18} /></button></div></div>
        <div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid grid-cols-7 border-b-2 border-slate-400 bg-slate-100">{weekdays.map((day, index) => <div key={day} className={`border-r border-slate-300 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider ${index >= 5 ? "text-red-600" : "text-slate-700"}`}>{day}</div>)}</div><div className="border-l border-slate-300">{Array.from({ length: 6 }, (_, weekIndex) => { const week = days.slice(weekIndex * 7, weekIndex * 7 + 7); const weekStart = isoDate(week[0]); const weekEnd = isoDate(week[6]); const weekEvents = visibleEvents.filter(event => event.end >= weekStart && event.start <= weekEnd); return <div key={weekIndex} className="grid grid-cols-7">{week.map((day, dayIndex) => { const iso = isoDate(day); const outside = day.getMonth() !== cursor.getMonth(); const isToday = iso === isoDate(today); const isPast = iso < isoDate(today); return <div key={iso} className={`min-h-28 min-w-0 border-b border-r border-slate-300 px-2 pb-2 pt-1.5 ${isPast ? "bg-slate-200" : outside ? "bg-slate-100" : "bg-white"}`}><div className={`mb-1.5 grid h-7 w-7 place-items-center text-xs font-bold ${isToday ? "rounded-md border-2 border-red-600 bg-white text-red-700" : outside ? "text-slate-400" : isPast ? "text-slate-500" : "text-slate-800"}`}>{day.getDate()}</div><div className="space-y-1">{weekEvents.map(event => { const active = iso >= event.start && iso <= event.end; if (!active) return <div key={event.id} className="h-[22px]" />; const continuesLeft = dayIndex > 0 && iso > event.start; const continuesRight = dayIndex < 6 && iso < event.end; const showTitle = !continuesLeft; const eventText = `${types[event.type].prefix}: ${event.title}`; return <div key={event.id} title={eventText} className={`relative z-10 h-[22px] truncate border-y px-1.5 py-1 text-[10px] font-bold ${types[event.type].event} ${continuesLeft ? "-ml-2 border-l-0 pl-2 rounded-l-none" : "rounded-l-md border-l"} ${continuesRight ? "-mr-2 border-r-0 rounded-r-none" : "rounded-r-md border-r"}`}>{showTitle ? eventText : <span aria-hidden="true">&nbsp;</span>}</div>; })}</div></div>; })}</div>; })}</div></div></div>
        <div className="flex flex-wrap gap-5 border-t border-slate-100 px-5 py-3">{(Object.keys(types) as EventType[]).map(type => <span key={type} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"><span className={`h-3 w-3 rounded-sm ${types[type].dot}`} />{types[type].label}</span>)}</div>
      </section> : <EventsList events={visibleEvents} />}
    </div>
  );
}

function EventsList({ events }: { events: CalendarEvent[] }) {
  const ordered = [...events].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold text-slate-900">Listagem de eventos</h2><p className="mt-1 text-sm text-slate-500">Eventos contínuos aparecem em um único registro.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Evento</th><th className="px-5 py-3">Início</th><th className="px-5 py-3">Fim</th></tr></thead><tbody className="divide-y divide-slate-200">{ordered.length ? ordered.map(event => <tr key={event.id} className="hover:bg-slate-50"><td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${types[event.type].event}`}>{types[event.type].prefix}</span></td><td className="px-5 py-4 font-semibold text-slate-800">{event.title}</td><td className="px-5 py-4 text-slate-600">{new Intl.DateTimeFormat("pt-BR").format(localDate(event.start))}</td><td className="px-5 py-4 text-slate-600">{new Intl.DateTimeFormat("pt-BR").format(localDate(event.end))}</td></tr>) : <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">Nenhum evento encontrado com os filtros selecionados.</td></tr>}</tbody></table></div></section>;
}
