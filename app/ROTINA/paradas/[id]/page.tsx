"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, ChevronDown, ChevronRight, Download, Factory, FileSpreadsheet, FileText, GripVertical, ListChecks, MessageSquareText, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataLoading } from "@/components/data-loading";

type Stop = { id: string; area: string; tipo: string; inicio: string; fim: string; horaInicio: string; horaFim: string };
type Activity = { id?: string; setor: string; especialidade: string; ordem: string; descricao: string; responsavel: string; equipe: string; observacoes: string; dataInicio?: string; horaInicio?: string; dataFim?: string; horaFim?: string; duracaoPrevistaMinutos?: number; permiteSabado?: boolean; permiteDomingo?: boolean; status?: string; percentualConclusao?: number; comentarioEvolucao?: string; quantidadeReprogramacoes?: number };
type StopTopics = { preParada: string; posParada: string };
const emptyActivity: Activity = { setor: "", especialidade: "", ordem: "", descricao: "", responsavel: "", equipe: "", observacoes: "", dataInicio: "", horaInicio: "", duracaoPrevistaMinutos: undefined, permiteSabado: false, permiteDomingo: false };

function compareActivitiesByStart(left: Activity, right: Activity) {
  const leftStart = `${left.dataInicio || "9999-12-31"}T${left.horaInicio || "23:59"}`;
  const rightStart = `${right.dataInicio || "9999-12-31"}T${right.horaInicio || "23:59"}`;
  return leftStart.localeCompare(rightStart);
}

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

function formatStopPeriod(stop: Stop) {
  const start = `${formatDate(stop.inicio)}${stop.horaInicio ? ` ${stop.horaInicio}` : ""}`;
  const end = `${stop.inicio === stop.fim ? "" : `${formatDate(stop.fim)} `}${stop.horaFim || ""}`.trim();
  return end ? `${start} até ${end}` : start;
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
type ScheduleColumn = "especialidade" | "ordem" | "descricao" | "responsavel" | "equipe" | "observacoes" | "gantt" | "comentarioEvolucao";

const defaultScheduleColumnWidths: Record<ScheduleColumn, number> = {
  especialidade: 150,
  ordem: 120,
  descricao: 300,
  responsavel: 160,
  equipe: 140,
  observacoes: 180,
  gantt: 420,
  comentarioEvolucao: 240,
};

const scheduleColumns = Object.keys(defaultScheduleColumnWidths) as ScheduleColumn[];

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
  const [newActivities, setNewActivities] = useState<Activity[] | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [topics, setTopics] = useState<StopTopics>({ preParada: "", posParada: "" });
  const [openTopics, setOpenTopics] = useState<Record<keyof StopTopics, boolean>>({ preParada: false, posParada: false });
  const [savingTopic, setSavingTopic] = useState<keyof StopTopics | null>(null);
  const [topicFeedback, setTopicFeedback] = useState<Record<keyof StopTopics, string>>({ preParada: "", posParada: "" });
  const [columnWidths, setColumnWidths] = useState<Record<ScheduleColumn, number>>(defaultScheduleColumnWidths);
  const [columnWidthsLoaded, setColumnWidthsLoaded] = useState(false);
  const [trackingActivities, setTrackingActivities] = useState(false);
  const [savingProgress, setSavingProgress] = useState<Record<string, boolean>>({});
  const [savingComment, setSavingComment] = useState<Record<string, boolean>>({});

  const specialtyOptions = useMemo(
    () => [...new Set([...defaultSpecialties, ...activities.map(activity => activity.especialidade).filter(Boolean)])],
    [activities]
  );
  const responsibleOptions = useMemo(
    () => [...new Set([...defaultResponsibles, ...activities.map(activity => activity.responsavel).filter(Boolean)])],
    [activities]
  );

  const bounds = useMemo(() => (stop ? getTimelineBounds(stop) : null), [stop]);

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return activities.filter(activity => {
      const matchesSearch = !term || [activity.ordem, activity.descricao, activity.setor, activity.responsavel]
        .some(value => value.toLocaleLowerCase("pt-BR").includes(term));
      return matchesSearch && (!selectedDay || !bounds || activityOccursOnDay(activity, bounds, selectedDay));
    });
  }, [activities, bounds, search, selectedDay]);

  const hasActiveFilters = Boolean(search.trim() || selectedDay);

  function clearFilters() {
    setSearch("");
    setSelectedDay("");
  }

  const sectors = useMemo(() => {
    const presentSectors = new Set(activities.map(activity => activity.setor).filter(Boolean));
    const ordered = orderedSectors.filter(sector => presentSectors.has(sector));
    const leftovers = Array.from(presentSectors).filter(sector => !orderedSectors.includes(sector));
    return [...ordered, ...leftovers];
  }, [orderedSectors, activities]);

  const visibleSectors = useMemo(() => {
    const matches = new Set(filteredActivities.map(activity => activity.setor));
    return sectors.filter(sector => matches.has(sector));
  }, [filteredActivities, sectors]);

  const visibleColumns = useMemo<ScheduleColumn[]>(() => scheduleColumns.filter(column => trackingActivities || column !== "comentarioEvolucao"), [trackingActivities]);
  const visibleColumnWidth = useMemo(() => visibleColumns.reduce((total, column) => total + columnWidths[column], 0), [columnWidths, visibleColumns]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("stop-schedule-column-widths");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Record<ScheduleColumn, number>>;
        const sanitized = { ...defaultScheduleColumnWidths };
        scheduleColumns.forEach(column => {
          if (Number.isFinite(parsed[column]) && Number(parsed[column]) >= 80) sanitized[column] = Number(parsed[column]);
        });
        setColumnWidths(sanitized);
      }
    } catch { /* Mantém as larguras padrão. */ }
    setColumnWidthsLoaded(true);
  }, []);

  useEffect(() => {
    if (columnWidthsLoaded) window.localStorage.setItem("stop-schedule-column-widths", JSON.stringify(columnWidths));
  }, [columnWidths, columnWidthsLoaded]);

  function startColumnResize(column: ScheduleColumn, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = columnWidths[column];
    const onMove = (moveEvent: MouseEvent) => {
      setColumnWidths(widths => ({ ...widths, [column]: Math.max(80, startWidth + moveEvent.clientX - startX) }));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/rotina/stops", { cache: "no-store" }).then(response => response.json()),
      fetch(`/api/rotina/stops/${params.id}/activities`, { cache: "no-store" }).then(response => response.ok ? response.json() : ({ activities: [] })),
      fetch(`/api/rotina/stops/${params.id}/topics`, { cache: "no-store" }).then(response => response.ok ? response.json() : ({ topics: { preParada: "", posParada: "" } })),
    ])
      .then(([stopsData, activitiesData, topicsData]) => {
        const selected = (stopsData.stops as Stop[]).find(item => item.id === params.id);
        if (!selected) throw new Error("Parada não encontrada.");
        setStop(selected);
        setActivities(activitiesData.activities?.length ? activitiesData.activities : selected.area.toUpperCase().includes("LPP") && selected.inicio === "2026-08-13" ? lppActivities : []);
        const loadedSectors = [...new Set([...(activitiesData.sectors ?? []), ...((activitiesData.activities ?? []) as Activity[]).map(activity => activity.setor).filter(Boolean)])];
        setSectorOptions(loadedSectors);
        setOrderedSectors(loadedSectors);
        setTopics(topicsData.topics ?? { preParada: "", posParada: "" });
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

  async function saveProgress(activity: Activity, rawValue: number) {
    if (!activity.id) return;
    const percentualConclusao = Math.max(0, Math.min(100, Math.round(rawValue)));
    setActivities(current => current.map(item => item.id === activity.id ? { ...item, percentualConclusao } : item));
    setSavingProgress(current => ({ ...current, [activity.id!]: true }));
    try {
      const response = await fetch(`/api/rotina/stops/${params.id}/activities`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "progress", atividadeId: activity.id, percentualConclusao }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a evolução.");
      setActivities(current => current.map(item => item.id === activity.id ? { ...item, percentualConclusao: data.percentualConclusao, status: data.status } : item));
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar a evolução.");
      await reloadActivities();
    } finally {
      setSavingProgress(current => ({ ...current, [activity.id!]: false }));
    }
  }

  async function saveEvolutionComment(activity: Activity, comentarioEvolucao: string) {
    if (!activity.id || comentarioEvolucao === (activity.comentarioEvolucao ?? "")) return;
    setSavingComment(current => ({ ...current, [activity.id!]: true }));
    try {
      const response = await fetch(`/api/rotina/stops/${params.id}/activities`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "progress-comment", atividadeId: activity.id, comentarioEvolucao }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar o comentário da evolução.");
      setActivities(current => current.map(item => item.id === activity.id ? { ...item, comentarioEvolucao: data.comentarioEvolucao } : item));
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar o comentário da evolução.");
      await reloadActivities();
    } finally {
      setSavingComment(current => ({ ...current, [activity.id!]: false }));
    }
  }

  function openActivity(activity?: Activity) {
    setFormError("");
    if (activity) {
      setEditing({ ...activity });
      return;
    }
    const blankActivity = { ...emptyActivity, dataInicio: stop?.inicio ?? "", horaInicio: stop?.horaInicio ?? "" };
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setEditing(blankActivity);
    } else {
      setNewActivities([blankActivity]);
    }
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
      const activityToSave = {
        ...editing,
        dataInicio: editing.dataInicio || stop?.inicio || "",
        horaInicio: editing.horaInicio || stop?.horaInicio || "",
      };
      const response = await fetch(`/api/rotina/stops/${params.id}/activities`, {
        method: editing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing.id ? { ...activityToSave, action: "edit", atividadeId: editing.id } : activityToSave),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a atividade.");
      await reloadActivities();
      setEditing(null);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar a atividade.");
    } finally { setSaving(false); }
  }

  async function saveNewActivities() {
    if (!newActivities?.length) return;
    setSaving(true); setFormError("");
    try {
      const activitiesToSave = newActivities.map(activity => ({
        ...activity,
        dataInicio: activity.dataInicio || stop?.inicio || "",
        horaInicio: activity.horaInicio || stop?.horaInicio || "",
      }));
      const response = await fetch(`/api/rotina/stops/${params.id}/activities`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activities: activitiesToSave }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar as atividades.");
      await reloadActivities();
      setNewActivities(null);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar as atividades.");
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

  async function saveTopic(key: keyof StopTopics) {
    setSavingTopic(key);
    setTopicFeedback(current => ({ ...current, [key]: "" }));
    try {
      const response = await fetch(`/api/rotina/stops/${params.id}/topics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: key === "preParada" ? "pre_parada" : "pos_parada", conteudo: topics[key] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
      setTopicFeedback(current => ({ ...current, [key]: "Salvo com sucesso." }));
    } catch (error) {
      setTopicFeedback(current => ({ ...current, [key]: error instanceof Error ? error.message : "Não foi possível salvar." }));
    } finally {
      setSavingTopic(null);
    }
  }

  function downloadPdf(orientation: "portrait" | "landscape") {
    if (!stop) return;
    setExportOpen(false);
    setCollapsedSectors({});
    const printArea = document.querySelector(".stop-schedule-print");
    printArea?.classList.toggle("stop-print-landscape", orientation === "landscape");
    const previousTitle = document.title;
    document.title = `Cronograma_Parada_${stop.area}_${formatDate(stop.inicio).replaceAll("/", "-")}`.replace(/[^a-zA-Z0-9_-]+/g, "_");
    window.addEventListener("afterprint", () => {
      document.title = previousTitle;
      printArea?.classList.remove("stop-print-landscape");
    }, { once: true });
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }

  function exportExcel() {
    if (!stop) return;
    setExportOpen(false);

    const columns: Array<{ label: string; value: (activity: Activity) => string | number }> = [
      { label: "Setor", value: activity => activity.setor },
      { label: "Especialidade", value: activity => activity.especialidade },
      { label: "Ordem", value: activity => activity.ordem },
      { label: "Descrição da atividade", value: activity => activity.descricao },
      { label: "Responsável", value: activity => activity.responsavel },
      { label: "Equipe", value: activity => activity.equipe },
      { label: "Observações", value: activity => activity.observacoes },
      { label: "Data de início", value: activity => formatDate(activity.dataInicio || stop.inicio) },
      { label: "Hora de início", value: activity => activity.horaInicio || stop.horaInicio || "" },
      { label: "Data de fim", value: activity => formatDate(activity.dataFim || activity.dataInicio || stop.fim) },
      { label: "Hora de fim", value: activity => activity.horaFim || stop.horaFim || "" },
      { label: "Duração prevista (minutos)", value: activity => activity.duracaoPrevistaMinutos || "" },
      { label: "Utiliza sábado", value: activity => activity.permiteSabado ? "Sim" : "Não" },
      { label: "Utiliza domingo", value: activity => activity.permiteDomingo ? "Sim" : "Não" },
      { label: "Status", value: activity => activity.status || "" },
      { label: "Reprogramações", value: activity => activity.quantidadeReprogramacoes || 0 },
    ];
    const escapeXml = (value: string | number) => String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
    const cell = (value: string | number, style = "") => {
      const isNumber = typeof value === "number";
      return `<Cell${style ? ` ss:StyleID="${style}"` : ""}><Data ss:Type="${isNumber ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`;
    };
    const rows = [
      `<Row>${columns.map(column => cell(column.label, "Header")).join("")}</Row>`,
      ...activities.map(activity => `<Row>${columns.map(column => cell(column.value(activity))).join("")}</Row>`),
    ].join("");
    const openTopicRows = ([
      { key: "preParada" as const, label: "Assuntos pré-parada" },
      { key: "posParada" as const, label: "Assuntos pós-parada" },
    ]).filter(topic => openTopics[topic.key]).map(topic => `<Row>${cell(topic.label, "Header")}${cell(topics[topic.key])}</Row>`).join("");
    const topicsWorksheet = openTopicRows
      ? `<Worksheet ss:Name="Assuntos"><Table><Row>${cell("Etapa", "Header")}${cell("Comentários", "Header")}</Row>${openTopicRows}</Table></Worksheet>`
      : "";
    const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#DCE6F1" ss:Pattern="Solid"/></Style></Styles>
        <Worksheet ss:Name="Atividades"><Table>${rows}</Table></Worksheet>
        ${topicsWorksheet}
      </Workbook>`;
    const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cronograma_Parada_${stop.area}_${formatDate(stop.inicio).replaceAll("/", "-")}.xls`.replace(/[^a-zA-Z0-9_.-]+/g, "_");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return <div className="stop-schedule-print pb-20 lg:pb-0">
    <header className="sticky top-0 z-30 mb-3 bg-slate-50/95 py-2 backdrop-blur lg:mb-5 lg:flex lg:flex-wrap lg:items-center lg:gap-3 lg:py-3">
      <div className="flex min-w-0 items-center gap-2 lg:contents">
        <Link href="/ROTINA/paradas" className="stop-print-hide grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 lg:h-11 lg:w-11" aria-label="Voltar"><ArrowLeft size={20} /></Link>
        <span className="hidden h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600 lg:grid"><Factory size={24} /></span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-950 lg:text-2xl">
            <span className="lg:hidden">Cronograma — {stop.area}</span>
            <span className="hidden lg:inline">Cronograma {stop.tipo}</span>
          </h1>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500 lg:text-sm lg:[&>span:first-child]:hidden lg:[&>span:last-child]:inline">
            <span>{formatDate(stop.inicio)} {stop.horaInicio} → {formatDate(stop.fim)} {stop.horaFim}</span>
            <span className="hidden">({formatStopPeriod(stop)})</span>
          </p>
        </div>
      </div>
      <label className="stop-print-hide relative hidden w-72 lg:block xl:w-96">
        <span className="sr-only">Buscar atividade ou ordem</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar atividade ou ordem" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
      </label>
      <button onClick={() => openActivity()} className="stop-print-hide hidden items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 shadow-sm hover:bg-brand-50 lg:inline-flex"><Plus size={18} /> Incluir atividade</button>
      <button type="button" onClick={() => setTrackingActivities(active => !active)} aria-pressed={trackingActivities} className={`stop-print-hide hidden items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm lg:inline-flex ${trackingActivities ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}><ListChecks size={18} /> Acompanhar atividades</button>
      <div className="stop-print-hide hidden lg:flex lg:justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen(open => !open)}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            aria-label="Exportar cronograma"
            title="Exportar cronograma"
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:inline-flex lg:h-auto lg:w-auto lg:gap-2 lg:border-transparent lg:bg-brand-600 lg:px-4 lg:py-2.5 lg:text-sm lg:text-white lg:hover:bg-brand-700"
          >
            <Download size={18} /> <span className="hidden lg:inline">Exportar</span> <ChevronDown className="hidden lg:block" size={16} />
          </button>
          {exportOpen && <ExportMenu onPdf={downloadPdf} onExcel={exportExcel} />}
        </div>
      </div>
    </header>

    {activities.length > 0 && <div className={`stop-print-hide mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:hidden ${filtersOpen ? "block" : "hidden"}`}>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar atividade ou ordem" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100" />
      </label>
      <div className="mt-2 flex items-center justify-between gap-3 px-1 text-xs">
        <span className="font-semibold text-slate-500">{filteredActivities.length} {filteredActivities.length === 1 ? "resultado" : "resultados"}</span>
        {hasActiveFilters && <button type="button" onClick={clearFilters} className="font-bold text-brand-700 hover:text-brand-800 hover:underline">Limpar filtros</button>}
      </div>
    </div>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {activities.length ? <>
        <div className="stop-schedule-mobile divide-y divide-slate-200 lg:hidden">
          {visibleSectors.map(sector => {
            const sectorActivities = filteredActivities
              .filter(activity => activity.setor === sector)
              .sort(compareActivitiesByStart);
            const isCollapsed = Boolean(collapsedSectors[sector]);
            return <div key={sector}>
              <button type="button" onClick={() => toggleSectorCollapse(sector)} className="flex w-full items-center gap-2 bg-brand-50/80 px-4 py-3 text-left text-brand-950" aria-expanded={!isCollapsed}>
                <ChevronDown size={17} className={`shrink-0 text-brand-700 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                <span className="min-w-0 flex-1 truncate text-sm font-extrabold uppercase tracking-wide">{sector}</span>
                <span className="shrink-0 rounded-full border border-brand-100 bg-brand-100/80 px-2 py-0.5 text-[10px] font-extrabold uppercase text-brand-800">{sectorActivities.length} {sectorActivities.length === 1 ? "atividade" : "atividades"}</span>
              </button>
              {!isCollapsed && <div className="divide-y divide-slate-100">
                {sectorActivities.map((activity, index) => <button key={activity.id ?? `${sector}-${index}`} type="button" onClick={() => openActivity(activity)} className="block w-full px-4 py-3 text-left transition active:bg-brand-50">
                  <span className="flex min-w-0 items-center gap-2 text-xs">
                    <span className="truncate font-bold text-slate-700">{activity.especialidade || "Sem especialidade"}</span>
                    {activity.ordem && <span className="shrink-0 rounded-md bg-brand-50 px-2 py-0.5 font-mono font-bold text-brand-700">{activity.ordem}</span>}
                    <span className="ml-auto shrink-0 font-medium text-slate-500">{formatDate(activity.dataInicio || stop.inicio).slice(0, 5)} {activity.horaInicio || stop.horaInicio}</span>
                  </span>
                  <span className="mt-1.5 block whitespace-normal break-words text-sm font-medium leading-5 text-slate-900">{activity.descricao}</span>
                </button>)}
              </div>}
            </div>;
          })}
          {filteredActivities.length === 0 && <div className="grid min-h-40 place-items-center px-6 py-8 text-center"><div><CalendarClock className="mx-auto text-slate-300" size={30} /><p className="mt-2 text-sm font-semibold text-slate-500">Nenhuma atividade encontrada neste dia.</p></div></div>}
        </div>
        <div className="stop-schedule-table hidden max-h-[calc(100vh-112px)] overflow-auto lg:block"><table className="w-full min-w-[1380px] table-fixed text-left text-sm">
        <colgroup>
          {visibleColumns.map(column => <col key={column} style={{ width: `${(columnWidths[column] / visibleColumnWidth) * 100}%` }} />)}
        </colgroup>
        <thead className="sticky top-0 z-20 bg-slate-100 text-[10px] font-bold uppercase leading-tight tracking-normal text-slate-600 shadow-sm lg:text-xs lg:tracking-wide">
          <tr>
            <th className="relative whitespace-normal break-words px-2 py-2.5 lg:px-3 lg:py-3">Especialidade<ColumnResizeHandle onMouseDown={event => startColumnResize("especialidade", event)} /></th>
            <th className="relative whitespace-normal break-words px-2 py-2.5 lg:px-3 lg:py-3">Ordem<ColumnResizeHandle onMouseDown={event => startColumnResize("ordem", event)} /></th>
            <th className="relative whitespace-normal break-words px-2 py-2.5 lg:px-3 lg:py-3">Descrição da atividade<ColumnResizeHandle onMouseDown={event => startColumnResize("descricao", event)} /></th>
            <th className="relative whitespace-normal break-words px-2 py-2.5 lg:px-3 lg:py-3">Responsável<ColumnResizeHandle onMouseDown={event => startColumnResize("responsavel", event)} /></th>
            <th className="relative whitespace-normal break-words px-2 py-2.5 lg:px-3 lg:py-3">Equipe<ColumnResizeHandle onMouseDown={event => startColumnResize("equipe", event)} /></th>
            <th className="relative whitespace-normal break-words px-2 py-2.5 lg:px-3 lg:py-3">Observações<ColumnResizeHandle onMouseDown={event => startColumnResize("observacoes", event)} /></th>
            <th className="relative min-w-[320px] px-3 py-2">
              <div className="flex w-full items-stretch gap-2">
                {trackingActivities && <span className="grid w-20 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-[9px] font-bold text-slate-600">Evolução</span>}
                <div className="flex min-w-0 flex-1 overflow-hidden rounded-md border border-slate-300 bg-slate-100 shadow-2xs divide-x divide-slate-300">
                {bounds.days.map((day) => (
                  <div
                    key={day.dateStr}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedDay === day.dateStr}
                    title={selectedDay === day.dateStr ? `Remover filtro de ${day.fullDate}` : `Exibir atividades de ${day.fullDate}`}
                    onClick={() => setSelectedDay(current => current === day.dateStr ? "" : day.dateStr)}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedDay(current => current === day.dateStr ? "" : day.dateStr);
                      }
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center py-1 text-center outline-none transition focus:ring-2 focus:ring-inset focus:ring-brand-500 ${selectedDay === day.dateStr ? "bg-brand-600 text-white" : "bg-white/90 hover:bg-brand-50"}`}
                    style={{ width: `${day.widthPercent}%` }}
                  >
                    <span className={`font-mono text-[10px] font-bold leading-tight ${selectedDay === day.dateStr ? "text-white" : "text-slate-800"}`}>
                      {day.label}
                    </span>
                    <span className={`text-[9px] font-bold uppercase leading-none ${selectedDay === day.dateStr ? "text-brand-100" : "text-slate-500"}`}>
                      {day.weekday}
                    </span>
                  </div>
                ))}
                </div>
              </div>
              <ColumnResizeHandle onMouseDown={event => startColumnResize("gantt", event)} />
            </th>
            {trackingActivities && <th className="relative whitespace-normal break-words px-2 py-2.5 lg:px-3 lg:py-3">Comentário da evolução<ColumnResizeHandle onMouseDown={event => startColumnResize("comentarioEvolucao", event)} /></th>}
          </tr>
        </thead>
        <tbody>
          {visibleSectors.map(sector => (
            <SectorRows
              key={sector}
              sector={sector}
              activities={filteredActivities
                .filter(activity => activity.setor === sector)
                .sort(compareActivitiesByStart)}
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
              trackingActivities={trackingActivities}
              savingProgress={savingProgress}
              onProgressChange={saveProgress}
              savingComment={savingComment}
              onCommentChange={saveEvolutionComment}
            />
          ))}
          {filteredActivities.length === 0 && <tr><td colSpan={trackingActivities ? 8 : 7} className="h-32 px-6 text-center"><CalendarClock className="mx-auto text-slate-300" size={28} /><p className="mt-2 font-semibold text-slate-500">Nenhuma atividade encontrada neste dia. Selecione outra data no cabeçalho.</p></td></tr>}
        </tbody>
      </table></div>
      </> : <div className="grid min-h-52 place-items-center p-8 text-center"><div><CalendarClock className="mx-auto text-slate-300" size={34} /><p className="mt-3 font-semibold text-slate-500">Nenhuma atividade cadastrada para esta parada.</p></div></div>}
    </section>

    <section className="stop-topics-print mt-4 grid gap-3">
      {([
        { key: "preParada" as const, title: "Assuntos pré-parada", placeholder: "Registre alinhamentos, pendências e observações anteriores à parada..." },
        { key: "posParada" as const, title: "Assuntos pós-parada", placeholder: "Registre conclusões, pendências e observações posteriores à parada..." },
      ]).map(item => {
        const isOpen = openTopics[item.key];
        const feedback = topicFeedback[item.key];
        return <div key={item.key} className={`stop-topic-item overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${isOpen ? "stop-topic-open" : ""}`}>
          <button type="button" onClick={() => setOpenTopics(current => ({ ...current, [item.key]: !current[item.key] }))} className="flex w-full items-center gap-3 px-4 py-3.5 text-left font-bold text-slate-800 hover:bg-slate-50" aria-expanded={isOpen}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><MessageSquareText size={19} /></span>
            <span className="min-w-0 flex-1">{item.title}</span>
            {topics[item.key].trim() && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Possui conteúdo salvo" />}
            <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          {isOpen && <>
            <div className="stop-topic-editor border-t border-slate-100 p-4">
              <textarea value={topics[item.key]} onChange={event => { setTopics(current => ({ ...current, [item.key]: event.target.value })); setTopicFeedback(current => ({ ...current, [item.key]: "" })); }} rows={6} placeholder={item.placeholder} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className={`text-xs font-semibold ${feedback === "Salvo com sucesso." ? "text-emerald-600" : "text-red-600"}`}>{feedback}</p>
                <button type="button" onClick={() => saveTopic(item.key)} disabled={savingTopic !== null} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"><Save size={16} /> {savingTopic === item.key ? "Salvando..." : "Salvar"}</button>
              </div>
            </div>
            <div className="stop-topic-print-content hidden whitespace-pre-wrap border-t border-slate-300 p-3 text-sm leading-5 text-slate-800">{topics[item.key] || "Sem comentários registrados."}</div>
          </>}
        </div>;
      })}
    </section>

    <div className="stop-print-hide fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.10)] backdrop-blur lg:hidden">
      <div className="mx-auto flex w-full max-w-lg items-center gap-2">
        <button type="button" onClick={() => openActivity()} aria-label="Incluir atividade" title="Incluir atividade" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm active:bg-brand-700"><Plus size={20} /> Incluir atividade</button>
        <button type="button" onClick={() => setFiltersOpen(open => !open)} aria-label="Buscar e filtrar atividades" aria-expanded={filtersOpen} className={`relative grid h-10 w-10 place-items-center rounded-xl border shadow-sm ${filtersOpen || hasActiveFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600"}`}>
          <Search size={19} />
          {hasActiveFilters && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" />}
        </button>
        <div className="relative">
          <button type="button" onClick={() => setExportOpen(open => !open)} aria-haspopup="menu" aria-expanded={exportOpen} aria-label="Exportar cronograma" title="Exportar cronograma" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm active:bg-slate-50"><Download size={19} /></button>
          {exportOpen && <ExportMenu onPdf={downloadPdf} onExcel={exportExcel} placement="up" />}
        </div>
      </div>
    </div>

    {editing && <ActivityDialog activity={editing} stop={stop} sectors={sectorOptions} specialties={specialtyOptions} responsibles={responsibleOptions} saving={saving} error={formError} onChange={setEditing} onClose={() => !saving && setEditing(null)} onSave={saveActivity} onDelete={activity => setDeletingActivity(activity)} />}
    {newActivities && <BatchActivityDialog activities={newActivities} stop={stop} saving={saving} error={formError} onChange={setNewActivities} onClose={() => !saving && setNewActivities(null)} onSave={saveNewActivities} />}
    {editingStop && <StopDialog stop={editingStop} saving={saving} error={formError} onChange={setEditingStop} onClose={() => !saving && setEditingStop(null)} onSave={saveStop} />}
    {deletingActivity && <DeleteActivityModal activity={deletingActivity} saving={saving} onCancel={() => !saving && setDeletingActivity(null)} onConfirm={() => confirmDelete(deletingActivity)} />}
  </div>;
}

function ExportMenu({ onPdf, onExcel, placement = "down" }: { onPdf: (orientation: "portrait" | "landscape") => void; onExcel: () => void; placement?: "up" | "down" }) {
  return <div role="menu" className={`absolute z-40 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${placement === "up" ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"}`}>
    <button type="button" role="menuitem" onClick={() => onPdf("portrait")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"><FileText size={18} /> PDF vertical</button>
    <button type="button" role="menuitem" onClick={() => onPdf("landscape")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"><FileText size={18} /> PDF horizontal</button>
    <button type="button" role="menuitem" onClick={onExcel} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"><FileSpreadsheet size={18} /> Exportar como Excel</button>
  </div>;
}

function ColumnResizeHandle({ onMouseDown }: { onMouseDown: (event: React.MouseEvent) => void }) {
  return <span
    role="separator"
    aria-orientation="vertical"
    title="Arraste para ajustar a largura da coluna"
    onMouseDown={onMouseDown}
    className="stop-print-hide absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize border-r-2 border-transparent transition hover:border-brand-500"
  />;
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
  trackingActivities,
  savingProgress,
  onProgressChange,
  savingComment,
  onCommentChange,
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
  trackingActivities: boolean;
  savingProgress: Record<string, boolean>;
  onProgressChange: (activity: Activity, value: number) => void;
  savingComment: Record<string, boolean>;
  onCommentChange: (activity: Activity, value: string) => void;
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
      <th colSpan={trackingActivities ? 8 : 7} className="px-4 py-2.5">
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
            className="stop-print-hide flex cursor-grab items-center rounded-lg p-2 text-brand-700 bg-white/70 hover:bg-white border border-brand-200 active:cursor-grabbing shadow-sm"
            title="Arraste para reorganizar a ordem deste setor"
          >
            <GripVertical size={15} />
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
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-3 py-2.5 text-slate-700">{activity.observacoes || "—"}</td>
      <td className="px-3 py-2 min-w-[320px]">
        <div className="flex items-center gap-2">
          {trackingActivities && <label className="relative block w-20 shrink-0">
            <input
              key={`${activity.id}-${activity.percentualConclusao ?? 0}`}
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={activity.percentualConclusao ?? 0}
              disabled={!activity.id || savingProgress[activity.id]}
              onClick={event => event.stopPropagation()}
              onBlur={event => onProgressChange(activity, Number(event.currentTarget.value))}
              onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}
              aria-label={`Evolução de ${activity.descricao}`}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 pr-6 text-center text-sm font-bold text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
          </label>}
          <GanttBar activity={activity} bounds={bounds} onClick={() => onSelect(activity)} />
        </div>
      </td>
      {trackingActivities && <td className="px-2 py-2">
        <input
          key={`${activity.id}-${activity.comentarioEvolucao ?? ""}`}
          type="text"
          defaultValue={activity.comentarioEvolucao ?? ""}
          disabled={!activity.id || savingComment[activity.id]}
          onClick={event => event.stopPropagation()}
          onBlur={event => onCommentChange(activity, event.currentTarget.value)}
          onKeyDown={event => { if (event.key === "Enter" && event.ctrlKey) event.currentTarget.blur(); }}
          placeholder="Informar comentário"
          aria-label={`Comentário da evolução de ${activity.descricao}`}
          className="stop-evolution-comment-input h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        />
        <span className="stop-evolution-comment-print hidden whitespace-normal break-words">{activity.comentarioEvolucao || "—"}</span>
      </td>}
    </tr>)}
  </>;
}

function activityDuration(activity: Activity, bounds: TimelineBounds) {
  return formatDuration(activityDurationMinutes(activity, bounds));
}

function activityOccursOnDay(activity: Activity, bounds: TimelineBounds, date: string) {
  const activityStartDate = activity.dataInicio || bounds.stop.inicio;
  if (date < activityStartDate) return false;
  const eligibleDays = bounds.days.filter(day => {
    if (day.dateStr < activityStartDate) return false;
    const weekDay = new Date(`${day.dateStr}T12:00:00`).getDay();
    if (weekDay === 6) return activity.permiteSabado === true;
    if (weekDay === 0) return activity.permiteDomingo === true;
    return true;
  });
  const dayIndex = eligibleDays.findIndex(day => day.dateStr === date);
  return dayIndex >= 0 && activityDurationMinutes(activity, bounds) - dayIndex * 8 * 60 > 0;
}

function activityDurationMinutes(activity: Activity, bounds: TimelineBounds) {
  const storedMinutes = Number(activity.duracaoPrevistaMinutos);
  if (Number.isFinite(storedMinutes) && storedMinutes > 0) {
    return storedMinutes;
  }
  const start = new Date(`${activity.dataInicio || bounds.stop.inicio}T${activity.horaInicio || bounds.stop.horaInicio || "00:00"}:00`);
  const end = new Date(`${activity.dataFim || bounds.stop.fim}T${activity.horaFim || bounds.stop.horaFim || "23:59"}:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function activityProgressState(activity: Activity) {
  const progress = Math.max(0, Math.min(100, Number(activity.percentualConclusao) || 0));
  if (progress >= 100) return { label: "Concluída", bar: "bg-emerald-500", border: "border-emerald-300" };
  if (progress > 0) return { label: "Em andamento", bar: "bg-amber-400", border: "border-amber-300" };
  const scheduledStart = new Date(`${activity.dataInicio || "9999-12-31"}T${activity.horaInicio || "00:00"}:00`);
  if (!Number.isNaN(scheduledStart.getTime()) && Date.now() >= scheduledStart.getTime()) {
    return { label: "Não iniciada", bar: "bg-red-500", border: "border-red-300" };
  }
  return { label: "Programada", bar: "bg-blue-600", border: "border-blue-300" };
}

function GanttBar({ activity, bounds, onClick }: { activity: Activity; bounds: TimelineBounds; onClick: () => void }) {
  const hasTimes = Boolean(activity.dataInicio && activity.horaInicio && activity.dataFim && activity.horaFim);
  const activityStartDate = activity.dataInicio || bounds.stop.inicio;
  const totalDurationMinutes = activityDurationMinutes(activity, bounds);
  const scheduledDays = bounds.days.filter(day => {
    if (day.dateStr < activityStartDate) return false;
    const weekDay = new Date(`${day.dateStr}T12:00:00`).getDay();
    if (weekDay === 6) return activity.permiteSabado === true;
    if (weekDay === 0) return activity.permiteDomingo === true;
    return true;
  });

  const timeLabel = hasTimes ? `${activity.horaInicio} - ${activity.horaFim}` : `${bounds.stop.horaInicio} - ${bounds.stop.horaFim}`;
  const duration = activityDuration(activity, bounds);
  const progressState = activityProgressState(activity);
  const progress = Math.max(0, Math.min(100, Number(activity.percentualConclusao) || 0));

  return (
    <div
      onClick={onClick}
      title={`${activity.descricao} | ${progressState.label}: ${progress}% | Horário: ${timeLabel} | Duração: ${duration}`}
      className="group/gantt flex h-10 w-full cursor-pointer items-center gap-2"
    >
      <div
        className={`grid h-10 min-w-0 flex-1 overflow-hidden rounded-xl border bg-slate-100 shadow-sm transition ${progressState.border}`}
        style={{ gridTemplateColumns: `repeat(${Math.max(bounds.days.length, 1)}, minmax(0, 1fr))` }}
      >
        {bounds.days.map(day => {
          const activityDayIndex = scheduledDays.findIndex(scheduledDay => scheduledDay.dateStr === day.dateStr);
          const remainingMinutes = activityDayIndex >= 0 ? totalDurationMinutes - activityDayIndex * 8 * 60 : 0;
          const allocatedMinutes = Math.max(0, Math.min(8 * 60, remainingMinutes));
          return <span key={day.dateStr} className="relative overflow-hidden border-r border-slate-300/90 bg-slate-100 last:border-r-0">
            {allocatedMinutes > 0 && <span
              className={`absolute inset-y-0 left-0 flex items-center justify-center px-1 text-center text-[10px] font-extrabold leading-none text-white transition-all group-hover/gantt:brightness-110 ${progressState.bar}`}
              style={{ width: "100%" }}
              title={`${formatDuration(allocatedMinutes)} programadas em ${day.fullDate}`}
            >
              {activityDayIndex === 0 ? `${Math.round(totalDurationMinutes)} min` : ""}
            </span>}
          </span>;
        })}
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

function BatchActivityDialog({ activities, stop, saving, error, onChange, onClose, onSave }: { activities: Activity[]; stop: Stop; saving: boolean; error: string; onChange: (activities: Activity[]) => void; onClose: () => void; onSave: () => void }) {
  const fields: Array<keyof Activity> = ["setor", "especialidade", "ordem", "descricao", "responsavel", "equipe", "observacoes", "dataInicio", "horaInicio", "duracaoPrevistaMinutos", "permiteSabado", "permiteDomingo"];
  const labels = ["Setor", "Especialidade", "Ordem", "Descrição", "Responsável", "Equipe", "Observações", "Data início", "Hora início", "Tempo (min)", "Sábado", "Domingo"];
  const blank = (): Activity => ({ ...emptyActivity, dataInicio: stop.inicio, horaInicio: stop.horaInicio });
  const downloadExcelTemplate = () => {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const sample = ["", "", "", "", "", "", "", stop.inicio, stop.horaInicio, "", "Não", "Não"];
    const content = `\uFEFF${[labels, sample].map(row => row.map(escape).join(";")).join("\r\n")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    link.download = "modelo_atividades_parada.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const update = (row: number, key: keyof Activity, value: string | boolean) => onChange(activities.map((activity, index) => index === row ? { ...activity, [key]: key === "duracaoPrevistaMinutos" ? (Number(value) || undefined) : value } : activity));
  const paste = (event: React.ClipboardEvent<HTMLInputElement>, row: number, startColumn: number) => {
    const text = event.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) return;
    event.preventDefault();
    const pastedRows = text.trim().split(/\r?\n/).filter(Boolean).map(line => line.split("\t"));
    const next = [...activities];
    pastedRows.forEach((values, offset) => {
      const index = row + offset;
      const base = next[index] ?? blank();
      const filled = { ...base } as Activity;
      values.slice(0, fields.length - startColumn).forEach((value, column) => {
        const key = fields[startColumn + column];
        const rawValue = value.trim();
        const dateMatch = key === "dataInicio" && rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        const normalizedValue = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : rawValue;
        (filled as any)[key] = key === "duracaoPrevistaMinutos"
          ? (Number(normalizedValue) || undefined)
          : key === "permiteSabado" || key === "permiteDomingo"
            ? ["sim", "s", "true", "1", "x"].includes(normalizedValue.toLocaleLowerCase("pt-BR"))
            : normalizedValue;
      });
      next[index] = filled;
    });
    onChange(next);
  };
  const valid = activities.length > 0 && activities.every(activity => activity.setor.trim() && activity.descricao.trim() && activity.duracaoPrevistaMinutos);

  return <div className="stop-print-hide fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => event.target === event.currentTarget && !saving && onClose()}>
    <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-[96vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-slate-900">Incluir atividades</h2><p className="text-sm text-slate-500">Uma atividade por linha. Cole dados tabulados do Excel com Ctrl+V.</p></div><button type="button" onClick={downloadExcelTemplate} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"><Download size={16} /> Excel</button><button onClick={onClose} disabled={saving} className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div>
      <div className="max-h-[60vh] overflow-auto p-5"><table className="min-w-[1650px] w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr>{labels.map(label => <th key={label} className="px-2 py-2">{label}</th>)}<th className="px-2 py-2" /></tr></thead><tbody>{activities.map((activity, row) => <tr key={row} className="border-t border-slate-200">{fields.map((key, column) => <td key={key} className="p-1">{key === "permiteSabado" || key === "permiteDomingo" ? <label className="grid h-10 min-w-20 place-items-center"><input type="checkbox" checked={activity[key] === true} onChange={event => update(row, key, event.target.checked)} className="h-5 w-5 accent-brand-600" /></label> : <input type={key === "dataInicio" ? "date" : key === "horaInicio" ? "time" : key === "duracaoPrevistaMinutos" ? "number" : "text"} min={key === "duracaoPrevistaMinutos" ? "1" : undefined} value={String(activity[key] ?? "")} onPaste={event => paste(event, row, column)} onChange={event => update(row, key, event.target.value)} className="h-10 w-full min-w-28 rounded-lg border border-slate-300 px-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />}</td>)}<td className="p-1"><button type="button" disabled={activities.length === 1} onClick={() => onChange(activities.filter((_, index) => index !== row))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30" aria-label="Remover linha"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>
      {error && <p className="mx-5 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => onChange([...activities, blank()])} className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"><Plus size={17} /> Adicionar linha</button><div className="flex-1" /><button onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancelar</button><button onClick={onSave} disabled={saving || !valid} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save size={17} /> {saving ? "Salvando..." : "Salvar atividades"}</button></div>
    </div>
  </div>;
}

function ActivityDialog({ activity, stop, sectors, specialties, responsibles, saving, error, onChange, onClose, onSave, onDelete }: { activity: Activity; stop: Stop; sectors: string[]; specialties: string[]; responsibles: string[]; saving: boolean; error: string; onChange: (activity: Activity) => void; onClose: () => void; onSave: () => void; onDelete: (activity: Activity) => void }) {
  const field = (key: keyof Activity, value: string) => onChange({ ...activity, [key]: value });
  const executionMinutes = activity.duracaoPrevistaMinutos ?? 0;

  return <div className="stop-print-hide fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-0 sm:p-4" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="activity-dialog-title" className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
      <div className="flex shrink-0 items-center border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4"><div className="min-w-0 flex-1"><h2 id="activity-dialog-title" className="text-lg font-bold text-slate-900">{activity.id ? "Editar atividade" : "Incluir atividade"}</h2><p className="text-sm text-slate-500">Preencha os dados de uma atividade.</p></div><button onClick={onClose} disabled={saving} className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div>
      <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
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

        {/* Agendamento da atividade */}
        <div className="sm:col-span-2 border-t border-slate-200 pt-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Agendamento</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StopInput label="Data de início" type="date" value={activity.dataInicio || stop.inicio} onChange={value => field("dataInicio", value)} />
            <StopInput label="Hora de início" type="time" value={activity.horaInicio || stop.horaInicio} onChange={value => field("horaInicio", value)} />
            <div>
              <label className="text-sm font-bold text-slate-700">Tempo de execução <span className="text-red-500">*</span></label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={executionMinutes || ""}
                  onChange={event => onChange({ ...activity, duracaoPrevistaMinutos: Number(event.target.value) || undefined })}
                  placeholder="Ex.: 120"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-16 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-500">minutos</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={activity.permiteSabado === true} onChange={event => onChange({ ...activity, permiteSabado: event.target.checked })} className="h-4 w-4 accent-brand-600" />
              Utilizar sábado
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={activity.permiteDomingo === true} onChange={event => onChange({ ...activity, permiteDomingo: event.target.checked })} className="h-4 w-4 accent-brand-600" />
              Utilizar domingo
            </label>
          </div>
        </div>

        {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
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
        <button onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:px-4">Cancelar</button>
        <button onClick={onSave} disabled={saving || !activity.setor.trim() || !activity.descricao.trim() || !activity.duracaoPrevistaMinutos} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 sm:px-4"><Save size={17} /> {saving ? "Salvando..." : "Salvar atividade"}</button>
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
