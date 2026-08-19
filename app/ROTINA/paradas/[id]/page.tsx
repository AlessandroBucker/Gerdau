"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, ChevronDown, ChevronRight, Clock, Download, Factory, GripVertical, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataLoading } from "@/components/data-loading";

type Stop = { id: string; area: string; tipo: string; inicio: string; fim: string; horaInicio: string; horaFim: string };
type Activity = { id?: string; setor: string; especialidade: string; ordem: string; descricao: string; responsavel: string; equipe: string; observacoes: string; dataInicio?: string; horaInicio?: string; dataFim?: string; horaFim?: string; duracaoPrevistaMinutos?: number; status?: string; quantidadeReprogramacoes?: number };
const emptyActivity: Activity = { setor: "", especialidade: "", ordem: "", descricao: "", responsavel: "", equipe: "", observacoes: "", dataInicio: "", horaInicio: "", dataFim: "", horaFim: "" };

const defaultSpecialties = [
  "Mecânica",
  "Elétrica",
  "Lubrificação",
  "Instrumentação",
  "Automação",
  "Civil",
  "Operação",
  "Caldeiraria",
  "Preditiva",
  "Utilidades",
  "Usinagem",
];

const defaultResponsibles = [
  "Daniel",
  "Wisley",
  "Ricardo",
  "Lucas",
  "José",
  "Jean",
  "Vinícius",
  "Jones",
];

const lppActivities: Activity[] = [
  { setor: "Central de solda", especialidade: "Mecânica", ordem: "", descricao: "Revisão completa da STREKER", responsavel: "WISLEY", equipe: "WISLEY", observacoes: "", dataInicio: "2026-08-13", horaInicio: "07:30", dataFim: "2026-08-13", horaFim: "11:30", duracaoPrevistaMinutos: 240 },
  { setor: "Central de solda", especialidade: "Elétrica", ordem: "", descricao: "Revisão completa da STREKER", responsavel: "DANIEL", equipe: "DANIEL", observacoes: "", dataInicio: "2026-08-13", horaInicio: "11:30", dataFim: "2026-08-13", horaFim: "15:30", duracaoPrevistaMinutos: 240 },
  { setor: "Edireitadeira", especialidade: "Mecânica", ordem: "", descricao: "Limpar base da endireitadeira", responsavel: "Ricardo", equipe: "Ricardo", observacoes: "", dataInicio: "2026-08-13", horaInicio: "08:00", dataFim: "2026-08-13", horaFim: "10:30", duracaoPrevistaMinutos: 150 },
  { setor: "Edireitadeira", especialidade: "Lubrificação", ordem: "82197520", descricao: "P-L-1S-ENDIREITADEIRA GSG", responsavel: "Ricardo", equipe: "Ricardo", observacoes: "", dataInicio: "2026-08-13", horaInicio: "10:30", dataFim: "2026-08-13", horaFim: "13:00", duracaoPrevistaMinutos: 150 },
  { setor: "Laminador", especialidade: "Lubrificação", ordem: "64213208", descricao: "TROCAR ÓLEO REDUTORES GAIOLA 1", responsavel: "LUCAS", equipe: "LUCAS E JONES", observacoes: "", dataInicio: "2026-08-13", horaInicio: "07:30", dataFim: "2026-08-13", horaFim: "09:30", duracaoPrevistaMinutos: 120 },
  { setor: "Laminador", especialidade: "Lubrificação", ordem: "64213209", descricao: "TROCAR ÓLEO REDUTORES GAIOLA 12", responsavel: "LUCAS", equipe: "LUCAS E JONES", observacoes: "", dataInicio: "2026-08-13", horaInicio: "09:30", dataFim: "2026-08-13", horaFim: "11:30", duracaoPrevistaMinutos: 120 },
  { setor: "Laminador", especialidade: "Lubrificação", ordem: "", descricao: "LUBRIFICAR ALONGAS E ACOPLAMENTOS", responsavel: "LUCAS", equipe: "LUCAS E JONES", observacoes: "", dataInicio: "2026-08-13", horaInicio: "11:30", dataFim: "2026-08-13", horaFim: "13:30", duracaoPrevistaMinutos: 120 },
  { setor: "Laminador", especialidade: "Elétrica", ordem: "", descricao: "CABEAMENTO E ELETRODUTO DO ENCODER DA GAIOLA 2", responsavel: "WISLEY", equipe: "WISLEY", observacoes: "", dataInicio: "2026-08-13", horaInicio: "13:00", dataFim: "2026-08-13", horaFim: "15:30", duracaoPrevistaMinutos: 150 },
  { setor: "Leito de resfriamento", especialidade: "Mecânica", ordem: "", descricao: "SUBSTITUIR ROLETES DO LEITO DO LPP", responsavel: "JEAN", equipe: "JEAN", observacoes: "", dataInicio: "2026-08-13", horaInicio: "08:00", dataFim: "2026-08-13", horaFim: "12:00", duracaoPrevistaMinutos: 240 },
  { setor: "Leito de resfriamento", especialidade: "Mecânica", ordem: "", descricao: "INPEÇÃO DO LEITO DE DE RESFRIAMENTO", responsavel: "JOSÉ", equipe: "JOSÉ", observacoes: "", dataInicio: "2026-08-13", horaInicio: "12:00", dataFim: "2026-08-13", horaFim: "15:00", duracaoPrevistaMinutos: 180 },
];

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatDuration(minutes?: number | null, dataInicio?: string, horaInicio?: string, dataFim?: string, horaFim?: string) {
  let totalMinutes = minutes;
  if ((totalMinutes === undefined || totalMinutes === null || totalMinutes === 0) && dataInicio && dataFim) {
    const start = new Date(`${dataInicio}T${horaInicio || "00:00"}:00`);
    const end = new Date(`${dataFim}T${horaFim || "23:59"}:00`);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
      totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    }
  }
  if (!totalMinutes || totalMinutes <= 0) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
}

type DaySlot = { dateStr: string; label: string; weekday: string; fullDate: string; widthPercent: number };
type TimelineBounds = { start: Date; end: Date; startMs: number; endMs: number; totalMs: number; days: DaySlot[]; stop: Stop };

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getDaysList(inicio: string, fim: string): DaySlot[] {
  if (!inicio) return [];
  const endStr = fim || inicio;
  const [y1, m1, d1] = inicio.split("-").map(Number);
  const [y2, m2, d2] = endStr.split("-").map(Number);
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);

  const days: DaySlot[] = [];
  const cur = new Date(start);

  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const label = `${d}/${m}`;
    const weekday = weekDays[cur.getDay()];
    const fullDate = `${d}/${m}/${y}`;
    days.push({ dateStr, label, weekday, fullDate, widthPercent: 0 });
    cur.setDate(cur.getDate() + 1);
  }

  if (days.length === 0) {
    days.push({ dateStr: inicio, label: formatDate(inicio).slice(0, 5), weekday: "Dia", fullDate: formatDate(inicio), widthPercent: 100 });
  }

  const width = 100 / days.length;
  days.forEach(d => { d.widthPercent = width; });

  return days;
}

function getTimelineBounds(stop: Stop): TimelineBounds {
  const days = getDaysList(stop.inicio, stop.fim);
  const [y1, m1, d1] = stop.inicio.split("-").map(Number);
  const [y2, m2, d2] = (stop.fim || stop.inicio).split("-").map(Number);

  const start = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);
  const end = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const totalMs = Math.max(1000, endMs - startMs);

  return { start, end, startMs, endMs, totalMs, days, stop };
}

export default function StopSchedulePage() {
  const params = useParams<{ id: string }>();
  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
  const [orderedSectors, setOrderedSectors] = useState<string[]>([]);
  const [collapsedSectors, setCollapsedSectors] = useState<Record<string, boolean>>({});
  const [draggedSector, setDraggedSector] = useState<string | null>(null);
  const [dragOverSector, setDragOverSector] = useState<string | null>(null);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const specialtyOptions = useMemo(
    () => [...new Set([...defaultSpecialties, ...activities.map(activity => activity.especialidade).filter(Boolean)])],
    [activities]
  );
  const responsibleOptions = useMemo(
    () => [...new Set([...defaultResponsibles, ...activities.map(activity => activity.responsavel).filter(Boolean)])],
    [activities]
  );

  const sectors = useMemo(() => {
    const presentSectors = new Set(activities.map(activity => activity.setor).filter(Boolean));
    const ordered = orderedSectors.filter(sector => presentSectors.has(sector));
    const leftovers = Array.from(presentSectors).filter(sector => !orderedSectors.includes(sector));
    return [...ordered, ...leftovers];
  }, [orderedSectors, activities]);

  const bounds = useMemo(() => (stop ? getTimelineBounds(stop) : null), [stop]);

  useEffect(() => {
    Promise.all([
      fetch("/api/rotina/stops", { cache: "no-store" }).then(response => response.json()),
      fetch(`/api/rotina/stops/${params.id}/activities`, { cache: "no-store" }).then(response => response.ok ? response.json() : ({ activities: [] })),
    ])
      .then(([stopsData, activitiesData]) => {
        const selected = (stopsData.stops as Stop[]).find(item => item.id === params.id);
        if (!selected) throw new Error("Parada não encontrada.");
        setStop(selected);
        setActivities(activitiesData.activities?.length ? activitiesData.activities : selected.area.toUpperCase().includes("LPP") && selected.inicio === "2026-08-13" ? lppActivities : []);
        const loadedSectors = [...new Set([...(activitiesData.sectors ?? []), ...((activitiesData.activities ?? []) as Activity[]).map(activity => activity.setor).filter(Boolean)])];
        setSectorOptions(loadedSectors);
        setOrderedSectors(loadedSectors);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Não foi possível carregar a parada."))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><DataLoading label="Carregando cronograma da parada..." /></section>;
  if (error || !stop || !bounds) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">{error || "Parada não encontrada."}</div>;

  async function reloadActivities() {
    const response = await fetch(`/api/rotina/stops/${params.id}/activities`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível carregar as atividades.");
    setActivities(data.activities ?? []);
    const loadedSectors = [...new Set([...(data.sectors ?? []), ...((data.activities ?? []) as Activity[]).map(activity => activity.setor).filter(Boolean)])];
    setSectorOptions(loadedSectors);
    setOrderedSectors(prev => [...new Set([...prev, ...loadedSectors])]);
  }

  function openActivity(activity?: Activity) {
    setFormError("");
    setEditing(activity ? { ...activity } : { ...emptyActivity, dataInicio: stop?.inicio ?? "", dataFim: stop?.fim ?? "" });
  }

  function toggleSectorCollapse(sector: string) {
    setCollapsedSectors(prev => ({ ...prev, [sector]: !prev[sector] }));
  }

  function expandAll() {
    setCollapsedSectors({});
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};
    sectors.forEach(sector => { next[sector] = true; });
    setCollapsedSectors(next);
  }

  async function handleReorderSectors(fromSector: string, toSector: string) {
    if (fromSector === toSector) return;
    const currentList = [...sectors];
    const fromIndex = currentList.indexOf(fromSector);
    const toIndex = currentList.indexOf(toSector);
    if (fromIndex === -1 || toIndex === -1) return;

    currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, fromSector);
    setOrderedSectors(currentList);

    try {
      await fetch(`/api/rotina/stops/${params.id}/activities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectors: currentList }),
      });
    } catch (err) {
      console.error("Erro ao salvar ordem dos setores:", err);
    }
  }

  async function saveActivity() {
    if (!editing) return;
    setSaving(true); setFormError("");
    try {
      const response = await fetch(`/api/rotina/stops/${params.id}/activities`, {
        method: editing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing.id ? { ...editing, action: "edit", atividadeId: editing.id } : editing),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a atividade.");
      await reloadActivities();
      setEditing(null);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar a atividade.");
    } finally { setSaving(false); }
  }

  async function confirmDelete(activity: Activity) {
    setSaving(true); setFormError("");
    try {
      if (activity.id) {
        const response = await fetch(`/api/rotina/stops/${params.id}/activities`, {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ atividadeId: activity.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível excluir a atividade.");
        await reloadActivities();
      } else {
        setActivities(prev => prev.filter(item => item !== activity));
      }
      setDeletingActivity(null);
      setEditing(null);
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : "Não foi possível excluir a atividade.";
      setFormError(msg);
      alert(msg);
    } finally { setSaving(false); }
  }

  async function saveStop() {
    if (!editingStop) return;
    setSaving(true); setFormError("");
    try {
      const response = await fetch(`/api/rotina/stops/${params.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingStop),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a parada.");
      setStop(data.stop);
      setEditingStop(null);
      await reloadActivities();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar a parada.");
    } finally { setSaving(false); }
  }

  function downloadPdf() {
    if (!stop) return;
    const previousTitle = document.title;
    document.title = `Cronograma_Parada_${stop.area}_${formatDate(stop.inicio).replaceAll("/", "-")}`.replace(/[^a-zA-Z0-9_-]+/g, "_");
    window.addEventListener("afterprint", () => { document.title = previousTitle; }, { once: true });
    window.print();
  }

  return <div className="stop-schedule-print">
    <header className="mb-5 flex flex-wrap items-center gap-3">
      <Link href="/ROTINA/paradas" className="stop-print-hide grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Voltar"><ArrowLeft size={20} /></Link>
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600"><Factory size={24} /></span>
      <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-rose-600">Cronograma da parada</p><h1 className="text-2xl font-bold tracking-tight text-slate-950">Parada de 8h - {stop.area} ({formatDate(stop.inicio)})</h1></div>
      <button onClick={() => openActivity()} className="stop-print-hide inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 shadow-sm hover:bg-brand-50"><Plus size={18} /> Incluir atividade</button>
      <button onClick={downloadPdf} className="stop-print-hide inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700"><Download size={18} /> Baixar PDF</button>
    </header>

    <section className="relative mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 pr-16 shadow-card sm:grid-cols-3">
      <button onClick={() => { setFormError(""); setEditingStop({ ...stop }); }} className="stop-print-hide absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-brand-700" aria-label="Editar informações da parada" title="Editar informações da parada"><Pencil size={18} /></button>
      <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Área</p><p className="mt-1 font-bold text-slate-800">{stop.area}</p></div>
      <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tipo</p><p className="mt-1 font-bold text-slate-800">{stop.tipo}</p></div>
      <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Período</p><p className="mt-1 inline-flex items-center gap-2 font-bold text-slate-800"><CalendarClock size={16} />{formatDate(stop.inicio)} {stop.horaInicio} até {formatDate(stop.fim)} {stop.horaFim}</p></div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Atividades programadas</h2>
          <p className="text-xs text-slate-500">Cronograma detalhado com duração e visualização Gantt por horário.</p>
        </div>
        {sectors.length > 0 && (
          <div className="stop-print-hide flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <ChevronDown size={14} /> Expandir todos
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight size={14} /> Recolher todos
            </button>
          </div>
        )}
      </div>

      {activities.length ? <div className="stop-schedule-table overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm">
        <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="w-[10%] px-3 py-3">Especialidade</th>
            <th className="w-[8%] px-3 py-3">Ordem</th>
            <th className="w-[20%] px-3 py-3">Descrição da atividade</th>
            <th className="w-[10%] px-3 py-3">Responsável</th>
            <th className="w-[9%] px-3 py-3">Equipe</th>
            <th className="w-[7%] px-3 py-3 text-center">Duração</th>
            <th className="w-[31%] min-w-[320px] px-3 py-2">
              <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1"><Clock size={13} className="text-brand-600" /> Cronograma Gantt</span>
                <span className="font-mono text-[10px] font-bold text-brand-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {formatDate(stop.inicio)} {stop.inicio !== stop.fim ? `→ ${formatDate(stop.fim)}` : ""}
                </span>
              </div>
              <div className="flex w-full overflow-hidden rounded-md border border-slate-300 bg-slate-100 shadow-2xs divide-x divide-slate-300">
                {bounds.days.map((day) => (
                  <div
                    key={day.dateStr}
                    className="flex flex-col items-center justify-center py-1 text-center bg-white/90"
                    style={{ width: `${day.widthPercent}%` }}
                  >
                    <span className="font-mono text-[10px] font-bold text-slate-800 leading-tight">
                      {day.label}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase leading-none">
                      {day.weekday}
                    </span>
                  </div>
                ))}
              </div>
            </th>
            <th className="stop-print-hide w-[5%] px-2 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {sectors.map(sector => (
            <SectorRows
              key={sector}
              sector={sector}
              activities={activities.filter(activity => activity.setor === sector)}
              bounds={bounds}
              isCollapsed={Boolean(collapsedSectors[sector])}
              isDragging={draggedSector === sector}
              isDragOver={dragOverSector === sector}
              onToggleCollapse={() => toggleSectorCollapse(sector)}
              onDragStart={(e) => {
                setDraggedSector(sector);
                e.dataTransfer.setData("text/plain", sector);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverSector !== sector) setDragOverSector(sector);
              }}
              onDragLeave={() => {
                if (dragOverSector === sector) setDragOverSector(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = e.dataTransfer.getData("text/plain") || draggedSector;
                if (from) handleReorderSectors(from, sector);
                setDraggedSector(null);
                setDragOverSector(null);
              }}
              onDragEnd={() => {
                setDraggedSector(null);
                setDragOverSector(null);
              }}
              onSelect={openActivity}
              onDelete={activity => setDeletingActivity(activity)}
            />
          ))}
        </tbody>
      </table></div> : <div className="grid min-h-52 place-items-center p-8 text-center"><div><CalendarClock className="mx-auto text-slate-300" size={34} /><p className="mt-3 font-semibold text-slate-500">Nenhuma atividade cadastrada para esta parada.</p></div></div>}
    </section>
    {editing && <ActivityDialog activity={editing} stop={stop} sectors={sectorOptions} specialties={specialtyOptions} responsibles={responsibleOptions} saving={saving} error={formError} onChange={setEditing} onClose={() => !saving && setEditing(null)} onSave={saveActivity} onDelete={activity => setDeletingActivity(activity)} />}
    {editingStop && <StopDialog stop={editingStop} saving={saving} error={formError} onChange={setEditingStop} onClose={() => !saving && setEditingStop(null)} onSave={saveStop} />}
    {deletingActivity && <DeleteActivityModal activity={deletingActivity} saving={saving} onCancel={() => !saving && setDeletingActivity(null)} onConfirm={() => confirmDelete(deletingActivity)} />}
  </div>;
}

function SectorRows({
  sector,
  activities,
  bounds,
  isCollapsed,
  isDragging,
  isDragOver,
  onToggleCollapse,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onSelect,
  onDelete,
}: {
  sector: string;
  activities: Activity[];
  bounds: TimelineBounds;
  isCollapsed: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onToggleCollapse: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onSelect: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}) {
  return <>
    <tr
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`border-y border-brand-200 select-none transition-colors ${
        isDragging
          ? "opacity-40 bg-brand-100"
          : isDragOver
          ? "bg-brand-200 ring-2 ring-brand-500"
          : "bg-brand-50 hover:bg-brand-100/70"
      }`}
    >
      <th colSpan={8} className="px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={onToggleCollapse}
            className="flex cursor-pointer items-center gap-2.5 text-left font-extrabold uppercase tracking-wide text-brand-900 hover:text-brand-950"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
              className="stop-print-hide grid h-7 w-7 place-items-center rounded-lg text-brand-700 hover:bg-brand-200/60 transition"
              title={isCollapsed ? "Expandir atividades deste setor" : "Minimizar atividades deste setor"}
              aria-label={isCollapsed ? "Expandir atividades deste setor" : "Minimizar atividades deste setor"}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            </button>
            <span className="text-base">{sector}</span>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-800 border border-brand-200">
              {activities.length} {activities.length === 1 ? "atividade" : "atividades"}
            </span>
          </div>

          <div
            className="stop-print-hide flex cursor-grab items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-brand-700 bg-white/70 hover:bg-white border border-brand-200 active:cursor-grabbing shadow-2xs"
            title="Arraste para reorganizar a ordem deste setor"
          >
            <GripVertical size={15} />
            <span className="hidden sm:inline">Reorganizar</span>
          </div>
        </div>
      </th>
    </tr>

    {!isCollapsed && activities.map((activity, index) => <tr key={activity.id ?? `${sector}-${index}`} className="group border-b border-slate-200 hover:bg-brand-50/50 transition">
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-3 py-2.5 font-semibold text-slate-700">{activity.especialidade}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer whitespace-nowrap px-3 py-2.5 font-mono font-bold text-brand-700">{activity.ordem || "—"}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-3 py-2.5 font-medium text-slate-800">{activity.descricao}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-3 py-2.5 font-semibold text-slate-700">{activity.responsavel || "—"}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-3 py-2.5 text-slate-700">{activity.equipe || "—"}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-3 py-2.5 text-center whitespace-nowrap">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 border border-slate-200">
          <Clock size={12} className="text-brand-600" />
          {formatDuration(activity.duracaoPrevistaMinutos, activity.dataInicio, activity.horaInicio, activity.dataFim, activity.horaFim)}
        </span>
      </td>
      <td className="px-3 py-2 min-w-[320px]">
        <GanttBar activity={activity} bounds={bounds} onClick={() => onSelect(activity)} />
      </td>
      <td className="stop-print-hide px-2 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onSelect(activity)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-100 hover:text-brand-700"
            title="Editar atividade"
            aria-label="Editar atividade"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(activity)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
            title="Excluir atividade"
            aria-label="Excluir atividade"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>)}
  </>;
}

function GanttBar({ activity, bounds, onClick }: { activity: Activity; bounds: TimelineBounds; onClick: () => void }) {
  const hasTimes = Boolean(activity.dataInicio && activity.horaInicio && activity.dataFim && activity.horaFim);
  const actStart = new Date(`${activity.dataInicio || bounds.stop.inicio}T${activity.horaInicio || bounds.stop.horaInicio || "00:00"}:00`);
  const actEnd = new Date(`${activity.dataFim || bounds.stop.fim}T${activity.horaFim || bounds.stop.horaFim || "23:59"}:00`);

  const left = Math.max(0, Math.min(95, ((actStart.getTime() - bounds.startMs) / bounds.totalMs) * 100));
  const right = Math.max(5, Math.min(100, ((actEnd.getTime() - bounds.startMs) / bounds.totalMs) * 100));
  const width = Math.max(5, Math.min(100 - left, right - left));

  const timeLabel = hasTimes ? `${activity.horaInicio} - ${activity.horaFim}` : `${bounds.stop.horaInicio} - ${bounds.stop.horaFim}`;
  const duration = formatDuration(activity.duracaoPrevistaMinutos, activity.dataInicio, activity.horaInicio, activity.dataFim, activity.horaFim);

  return (
    <div
      onClick={onClick}
      title={`${activity.descricao} | Horário: ${timeLabel} | Duração: ${duration}`}
      className="group/gantt relative h-7 w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 grid grid-cols-4 divide-x divide-slate-200/50" />
      <div
        className="absolute top-0.5 bottom-0.5 flex items-center justify-between rounded-md bg-linear-to-r from-brand-600 to-brand-500 px-2 text-white shadow-2xs transition-all group-hover/gantt:brightness-110"
        style={{ left: `${left}%`, width: `${width}%` }}
      >
        <span className="truncate font-mono text-[10px] font-bold tracking-tight">{timeLabel}</span>
        <span className="ml-1 hidden shrink-0 rounded bg-black/20 px-1 py-0.2 text-[9px] font-extrabold sm:inline">{duration}</span>
      </div>
    </div>
  );
}

function DeleteActivityModal({ activity, saving, onCancel, onConfirm }: { activity: Activity; saving: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="stop-print-hide fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={e => e.target === e.currentTarget && !saving && onCancel()}>
    <div role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">Excluir atividade</h3>
          <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
        </div>
        <button onClick={onCancel} disabled={saving} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-900 leading-snug">{activity.descricao || "Atividade sem descrição"}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-white px-2 py-0.5 font-bold text-slate-600 border border-slate-200">{activity.setor}</span>
          {activity.especialidade && <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-slate-600 border border-slate-200">{activity.especialidade}</span>}
          {activity.ordem && <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono font-bold text-brand-700">OM: {activity.ordem}</span>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onConfirm}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {saving ? "Excluindo..." : "Confirmar exclusão"}
        </button>
      </div>
    </div>
  </div>;
}

function ActivityDialog({ activity, stop, sectors, specialties, responsibles, saving, error, onChange, onClose, onSave, onDelete }: { activity: Activity; stop: Stop; sectors: string[]; specialties: string[]; responsibles: string[]; saving: boolean; error: string; onChange: (activity: Activity) => void; onClose: () => void; onSave: () => void; onDelete: (activity: Activity) => void }) {
  const field = (key: keyof Activity, value: string) => onChange({ ...activity, [key]: value });

  const calculatedDuration = formatDuration(
    activity.duracaoPrevistaMinutos,
    activity.dataInicio || stop.inicio,
    activity.horaInicio || stop.horaInicio,
    activity.dataFim || stop.fim,
    activity.horaFim || stop.horaFim
  );

  return <div className="stop-print-hide fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="activity-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center border-b border-slate-200 px-5 py-4"><div className="min-w-0 flex-1"><h2 id="activity-dialog-title" className="text-lg font-bold text-slate-900">{activity.id ? "Editar atividade" : "Incluir atividade"}</h2><p className="text-sm text-slate-500">Preencha os dados do cronograma e o período programado.</p></div><button onClick={onClose} disabled={saving} className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <CreatableSelect
          label="Setor"
          required
          value={activity.setor}
          options={sectors}
          placeholder="Selecione um setor"
          newItemLabel="+ Outro setor (digitar novo)..."
          newButtonLabel="+ Novo setor"
          onChange={value => field("setor", value)}
          id="setor-select"
        />
        <CreatableSelect
          label="Especialidade"
          value={activity.especialidade}
          options={specialties}
          placeholder="Selecione uma especialidade"
          newItemLabel="+ Outra especialidade (digitar nova)..."
          newButtonLabel="+ Nova especialidade"
          onChange={value => field("especialidade", value)}
          id="especialidade-select"
        />
        <FormField label="Ordem" value={activity.ordem} onChange={value => field("ordem", value)} />
        <CreatableSelect
          label="Responsável APR"
          value={activity.responsavel}
          options={responsibles}
          placeholder="Selecione o responsável"
          newItemLabel="+ Outro responsável (digitar novo)..."
          newButtonLabel="+ Novo responsável"
          onChange={value => field("responsavel", value)}
          id="responsavel-select"
        />
        <div className="sm:col-span-2"><FormField label="Descrição da atividade" required value={activity.descricao} onChange={value => field("descricao", value)} /></div>
        <FormField label="Equipe" value={activity.equipe} onChange={value => field("equipe", value)} />
        <FormField label="Observações" value={activity.observacoes} onChange={value => field("observacoes", value)} />

        {/* Agendamento de Horário & Gantt */}
        <div className="sm:col-span-2 border-t border-slate-200 pt-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Agendamento & Duração</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <StopInput label="Data de início" type="date" value={activity.dataInicio || stop.inicio} onChange={value => field("dataInicio", value)} />
            <StopInput label="Hora de início" type="time" value={activity.horaInicio || stop.horaInicio} onChange={value => field("horaInicio", value)} />
            <StopInput label="Data de término" type="date" value={activity.dataFim || stop.fim} onChange={value => field("dataFim", value)} />
            <StopInput label="Hora de término" type="time" value={activity.horaFim || stop.horaFim} onChange={value => field("horaFim", value)} />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/70 p-3">
            <div className="flex items-center gap-2 text-brand-900">
              <Clock size={16} className="text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wide">Duração calculada:</span>
              <span className="text-sm font-extrabold text-brand-950">{calculatedDuration}</span>
            </div>
            <span className="font-mono text-xs font-semibold text-brand-700">
              {(activity.horaInicio || stop.horaInicio)} → {(activity.horaFim || stop.horaFim)}
            </span>
          </div>
        </div>

        {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-5 py-4">
        {(activity.id || activity.descricao) && (
          <button
            type="button"
            onClick={() => onDelete(activity)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={17} /> Excluir atividade
          </button>
        )}
        <div className="flex-1" />
        <button onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
        <button onClick={onSave} disabled={saving || !activity.setor.trim() || !activity.descricao.trim()} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"><Save size={17} /> {saving ? "Salvando..." : "Salvar"}</button>
      </div>
    </div>
  </div>;
}

function CreatableSelect({
  label,
  value,
  options,
  placeholder,
  required = false,
  onChange,
  newItemLabel = "+ Outro (digitar novo)...",
  newButtonLabel = "+ Novo",
  listButtonLabel = "← Selecionar da lista",
  id,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
  newItemLabel?: string;
  newButtonLabel?: string;
  listButtonLabel?: string;
  id: string;
}) {
  const isKnown = options.includes(value);
  const [isCustom, setIsCustom] = useState(!isKnown && Boolean(value));

  useEffect(() => {
    setIsCustom(!options.includes(value) && Boolean(value));
  }, [value, options]);

  function handleSelectChange(nextValue: string) {
    if (nextValue === "__NEW_CUSTOM__") {
      setIsCustom(true);
      onChange("");
    } else {
      setIsCustom(false);
      onChange(nextValue);
    }
  }

  const listId = `datalist-${id}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => {
            if (isCustom) {
              setIsCustom(false);
              onChange(options[0] ?? "");
            } else {
              setIsCustom(true);
              onChange("");
            }
          }}
          className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
        >
          {isCustom ? listButtonLabel : newButtonLabel}
        </button>
      </div>

      {isCustom ? (
        <div className="relative mt-1.5">
          <input
            autoFocus
            list={listId}
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder={placeholder ? `Digite o novo valor para ${label.toLowerCase()}...` : `Digite o novo ${label.toLowerCase()}...`}
            className="h-11 w-full rounded-lg border border-brand-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <datalist id={listId}>
            {options.map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      ) : (
        <select
          value={value}
          onChange={event => handleSelectChange(event.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="" disabled>
            {placeholder || `Selecione um(a) ${label.toLowerCase()}`}
          </option>
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value="__NEW_CUSTOM__" className="font-bold text-brand-700">
            {newItemLabel}
          </option>
        </select>
      )}
    </div>
  );
}

function FormField({ label, value, required, onChange }: { label: string; value: string; required?: boolean; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}<input value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>;
}

function StopDialog({ stop, saving, error, onChange, onClose, onSave }: { stop: Stop; saving: boolean; error: string; onChange: (stop: Stop) => void; onClose: () => void; onSave: () => void }) {
  const field = (key: keyof Stop, value: string) => onChange({ ...stop, [key]: value });
  return <div className="stop-print-hide fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="stop-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center border-b border-slate-200 px-5 py-4"><div className="min-w-0 flex-1"><h2 id="stop-dialog-title" className="text-lg font-bold text-slate-900">Editar informações da parada</h2><p className="text-sm text-slate-500">Atualize a identificação e o período programado.</p></div><button onClick={onClose} disabled={saving} className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <FormField label="Área" required value={stop.area} onChange={value => field("area", value)} />
        <FormField label="Tipo da parada" required value={stop.tipo} onChange={value => field("tipo", value)} />
        <StopInput label="Data de início" type="date" required value={stop.inicio} onChange={value => field("inicio", value)} />
        <StopInput label="Hora de início" type="time" value={stop.horaInicio} onChange={value => field("horaInicio", value)} />
        <StopInput label="Data de fim" type="date" required value={stop.fim} onChange={value => field("fim", value)} />
        <StopInput label="Hora de fim" type="time" value={stop.horaFim} onChange={value => field("horaFim", value)} />
        {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4"><button onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button><button onClick={onSave} disabled={saving || !stop.area.trim() || !stop.tipo.trim() || !stop.inicio || !stop.fim} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"><Save size={17} /> {saving ? "Salvando..." : "Salvar"}</button></div>
    </div>
  </div>;
}

function StopInput({ label, type, value, required, onChange }: { label: string; type: "date" | "time"; value: string; required?: boolean; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}<input type={type} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>;
}
