"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Download, Factory, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataLoading } from "@/components/data-loading";

type Stop = { id: string; area: string; tipo: string; inicio: string; fim: string; horaInicio: string; horaFim: string };
type Activity = { id?: string; setor: string; especialidade: string; ordem: string; descricao: string; responsavel: string; equipe: string; observacoes: string; dataInicio?: string; horaInicio?: string; dataFim?: string; horaFim?: string; status?: string; quantidadeReprogramacoes?: number };
const emptyActivity: Activity = { setor: "", especialidade: "", ordem: "", descricao: "", responsavel: "", equipe: "", observacoes: "" };

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
  { setor: "Central de solda", especialidade: "Mecânica", ordem: "", descricao: "Revisão completa da STREKER", responsavel: "WISLEY", equipe: "WISLEY", observacoes: "" },
  { setor: "Central de solda", especialidade: "Elétrica", ordem: "", descricao: "Revisão completa da STREKER", responsavel: "DANIEL", equipe: "DANIEL", observacoes: "" },
  { setor: "Edireitadeira", especialidade: "Mecânica", ordem: "", descricao: "Limpar base da endireitadeira", responsavel: "Ricardo", equipe: "Ricardo", observacoes: "" },
  { setor: "Edireitadeira", especialidade: "Lubrificação", ordem: "82197520", descricao: "P-L-1S-ENDIREITADEIRA GSG", responsavel: "Ricardo", equipe: "Ricardo", observacoes: "" },
  { setor: "Laminador", especialidade: "Lubrificação", ordem: "64213208", descricao: "TROCAR ÓLEO REDUTORES GAIOLA 1", responsavel: "LUCAS", equipe: "LUCAS E JONES", observacoes: "" },
  { setor: "Laminador", especialidade: "Lubrificação", ordem: "64213209", descricao: "TROCAR ÓLEO REDUTORES GAIOLA 12", responsavel: "LUCAS", equipe: "LUCAS E JONES", observacoes: "" },
  { setor: "Laminador", especialidade: "Lubrificação", ordem: "", descricao: "LUBRIFICAR ALONGAS E ACOPLAMENTOS", responsavel: "LUCAS", equipe: "LUCAS E JONES", observacoes: "" },
  { setor: "Laminador", especialidade: "Elétrica", ordem: "", descricao: "CABEAMENTO E ELETRODUTO DO ENCODER DA GAIOLA 2", responsavel: "WISLEY", equipe: "WISLEY", observacoes: "" },
  { setor: "Leito de resfriamento", especialidade: "Mecânica", ordem: "", descricao: "SUBSTITUIR ROLETES DO LEITO DO LPP", responsavel: "JEAN", equipe: "JEAN", observacoes: "" },
  { setor: "Leito de resfriamento", especialidade: "Mecânica", ordem: "", descricao: "INPEÇÃO DO LEITO DE DE RESFRIAMENTO", responsavel: "JOSÉ", equipe: "JOSÉ", observacoes: "" },
];

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
export default function StopSchedulePage() {
  const params = useParams<{ id: string }>();
  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
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
        setSectorOptions([...new Set([...(activitiesData.sectors ?? []), ...((activitiesData.activities ?? []) as Activity[]).map(activity => activity.setor).filter(Boolean)])]);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Não foi possível carregar a parada."))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><DataLoading label="Carregando cronograma da parada..." /></section>;
  if (error || !stop) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">{error || "Parada não encontrada."}</div>;

  const sectors = [...new Set(activities.map(activity => activity.setor))];

  async function reloadActivities() {
    const response = await fetch(`/api/rotina/stops/${params.id}/activities`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível carregar as atividades.");
    setActivities(data.activities ?? []);
    setSectorOptions([...new Set([...(data.sectors ?? []), ...((data.activities ?? []) as Activity[]).map(activity => activity.setor).filter(Boolean)])]);
  }

  function openActivity(activity?: Activity) {
    setFormError("");
    setEditing(activity ? { ...activity } : { ...emptyActivity });
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
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold text-slate-900">Atividades programadas</h2></div>
      {activities.length ? <div className="stop-schedule-table overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="w-[12%] px-4 py-3">Especialidade</th>
            <th className="w-[11%] px-4 py-3">Ordem</th>
            <th className="w-[30%] px-4 py-3">Descrição da atividade</th>
            <th className="w-[13%] px-4 py-3">Responsável APR</th>
            <th className="w-[13%] px-4 py-3">Equipe</th>
            <th className="w-[15%] px-4 py-3">Observações</th>
            <th className="stop-print-hide w-[6%] px-3 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>{sectors.map(sector => <SectorRows key={sector} sector={sector} activities={activities.filter(activity => activity.setor === sector)} onSelect={openActivity} onDelete={activity => setDeletingActivity(activity)} />)}</tbody>
      </table></div> : <div className="grid min-h-52 place-items-center p-8 text-center"><div><CalendarClock className="mx-auto text-slate-300" size={34} /><p className="mt-3 font-semibold text-slate-500">Nenhuma atividade cadastrada para esta parada.</p></div></div>}
    </section>
    {editing && <ActivityDialog activity={editing} sectors={sectorOptions} specialties={specialtyOptions} responsibles={responsibleOptions} saving={saving} error={formError} onChange={setEditing} onClose={() => !saving && setEditing(null)} onSave={saveActivity} onDelete={activity => setDeletingActivity(activity)} />}
    {editingStop && <StopDialog stop={editingStop} saving={saving} error={formError} onChange={setEditingStop} onClose={() => !saving && setEditingStop(null)} onSave={saveStop} />}
    {deletingActivity && <DeleteActivityModal activity={deletingActivity} saving={saving} onCancel={() => !saving && setDeletingActivity(null)} onConfirm={() => confirmDelete(deletingActivity)} />}
  </div>;
}

function SectorRows({ sector, activities, onSelect, onDelete }: { sector: string; activities: Activity[]; onSelect: (activity: Activity) => void; onDelete: (activity: Activity) => void }) {
  return <>
    <tr className="border-y border-brand-200 bg-brand-50"><th colSpan={7} className="px-4 py-2 text-center text-base font-extrabold uppercase tracking-wide text-brand-800">{sector}</th></tr>
    {activities.map((activity, index) => <tr key={activity.id ?? `${sector}-${index}`} className="group border-b border-slate-200 hover:bg-brand-50/60">
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-4 py-2.5 font-semibold text-slate-700">{activity.especialidade}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer whitespace-nowrap px-4 py-2.5 font-mono font-bold text-brand-700">{activity.ordem || "—"}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-4 py-2.5 font-medium text-slate-800">{activity.descricao}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-4 py-2.5 font-semibold text-slate-700">{activity.responsavel || "—"}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-4 py-2.5 text-slate-700">{activity.equipe || "—"}</td>
      <td onClick={() => onSelect(activity)} className="cursor-pointer px-4 py-2.5 text-slate-500">{activity.observacoes || "—"}</td>
      <td className="stop-print-hide px-3 py-2.5 text-center">
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

function ActivityDialog({ activity, sectors, specialties, responsibles, saving, error, onChange, onClose, onSave, onDelete }: { activity: Activity; sectors: string[]; specialties: string[]; responsibles: string[]; saving: boolean; error: string; onChange: (activity: Activity) => void; onClose: () => void; onSave: () => void; onDelete: (activity: Activity) => void }) {
  const field = (key: keyof Activity, value: string) => onChange({ ...activity, [key]: value });

  return <div className="stop-print-hide fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="activity-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center border-b border-slate-200 px-5 py-4"><div className="min-w-0 flex-1"><h2 id="activity-dialog-title" className="text-lg font-bold text-slate-900">{activity.id ? "Editar atividade" : "Incluir atividade"}</h2><p className="text-sm text-slate-500">Preencha os dados do cronograma.</p></div><button onClick={onClose} disabled={saving} className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div>
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
