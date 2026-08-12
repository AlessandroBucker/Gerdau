"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Factory, LoaderCircle, RotateCw, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { DataLoading } from "@/components/data-loading";

type Stop = { id: string; area: string; tipo: string; inicio: string; fim: string; horaInicio: string; horaFim: string };
type Activity = { id?: string; setor: string; especialidade: string; ordem: string; descricao: string; responsavel: string; equipe: string; observacoes: string; dataInicio?: string; horaInicio?: string; dataFim?: string; horaFim?: string; status?: string; quantidadeReprogramacoes?: number };

const lppActivities: Activity[] = [
  { setor: "Central de solda", especialidade: "Mecânica", ordem: "", descricao: "Revisão completa da STREKER", responsavel: "WISLEY", equipe: "", observacoes: "" },
  { setor: "Central de solda", especialidade: "Elétrica", ordem: "", descricao: "Revisão completa da STREKER", responsavel: "DANIEL", equipe: "", observacoes: "" },
  { setor: "Edireitadeira", especialidade: "Elétrica", ordem: "81820109", descricao: "P-E-2M MÁQUINA ENDIREIT. MALMEDIE LPP", responsavel: "WISLEY", equipe: "WISLEY", observacoes: "" },
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
  const [reprogramming, setReprogramming] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);

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
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Não foi possível carregar a parada."))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><DataLoading label="Carregando cronograma da parada..." /></section>;
  if (error || !stop) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">{error || "Parada não encontrada."}</div>;

  const sectors = [...new Set(activities.map(activity => activity.setor))];

  async function reschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reprogramming?.id) return;
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/rotina/stops/${params.id}/activities`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ atividadeId: reprogramming.id, dataInicio: form.get("dataInicio"), horaInicio: form.get("horaInicio"), dataFim: form.get("dataFim"), horaFim: form.get("horaFim"), motivo: form.get("motivo"), reprogramadoPor: form.get("reprogramadoPor") }) });
    const result = await response.json();
    if (!response.ok) { alert(result.error || "Não foi possível reprogramar a atividade."); setSaving(false); return; }
    const refreshed = await fetch(`/api/rotina/stops/${params.id}/activities`, { cache: "no-store" }).then(value => value.json());
    if (refreshed.activities) setActivities(refreshed.activities);
    setSaving(false); setReprogramming(null);
  }

  return <div>
    <header className="mb-5 flex flex-wrap items-center gap-3">
      <Link href="/ROTINA/paradas" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Voltar"><ArrowLeft size={20} /></Link>
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600"><Factory size={24} /></span>
      <div><p className="text-xs font-bold uppercase tracking-wider text-rose-600">Cronograma da parada</p><h1 className="text-2xl font-bold tracking-tight text-slate-950">Parada de 8h - {stop.area} ({formatDate(stop.inicio)})</h1></div>
    </header>

    <section className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-3">
      <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Área</p><p className="mt-1 font-bold text-slate-800">{stop.area}</p></div>
      <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tipo</p><p className="mt-1 font-bold text-slate-800">{stop.tipo}</p></div>
      <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Período</p><p className="mt-1 inline-flex items-center gap-2 font-bold text-slate-800"><CalendarClock size={16} />{formatDate(stop.inicio)} {stop.horaInicio} até {formatDate(stop.fim)} {stop.horaFim}</p></div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold text-slate-900">Atividades programadas</h2><p className="mt-1 text-sm text-slate-500">Cronograma organizado pelos setores da área.</p></div>
      {activities.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600"><tr><th className="w-[12%] px-4 py-3">Especialidade</th><th className="w-[11%] px-4 py-3">Ordem</th><th className="w-[32%] px-4 py-3">Descrição da atividade</th><th className="w-[14%] px-4 py-3">Responsável APR</th><th className="w-[14%] px-4 py-3">Equipe</th><th className="w-[17%] px-4 py-3">Observações</th></tr></thead>
        <tbody>{sectors.map(sector => <SectorRows key={sector} sector={sector} activities={activities.filter(activity => activity.setor === sector)} onReprogram={setReprogramming} />)}</tbody>
      </table></div> : <div className="grid min-h-52 place-items-center p-8 text-center"><div><CalendarClock className="mx-auto text-slate-300" size={34} /><p className="mt-3 font-semibold text-slate-500">Nenhuma atividade cadastrada para esta parada.</p></div></div>}
    </section>
    {reprogramming && <ReprogramModal activity={reprogramming} saving={saving} onClose={() => setReprogramming(null)} onSubmit={reschedule} />}
  </div>;
}

function SectorRows({ sector, activities, onReprogram }: { sector: string; activities: Activity[]; onReprogram: (activity: Activity) => void }) {
  return <>
    <tr className="border-y border-brand-200 bg-brand-50"><th colSpan={6} className="px-4 py-2 text-center text-base font-extrabold uppercase tracking-wide text-brand-800">{sector}</th></tr>
    {activities.map((activity, index) => <tr key={`${sector}-${index}`} className="border-b border-slate-200 hover:bg-slate-50">
      <td className="px-4 py-2.5 font-semibold text-slate-700">{activity.especialidade}</td><td className="whitespace-nowrap px-4 py-2.5 font-mono font-bold text-brand-700">{activity.ordem || "—"}</td><td className="px-4 py-2.5 font-medium text-slate-800">{activity.descricao}</td><td className="px-4 py-2.5 font-semibold text-slate-700">{activity.responsavel || "—"}</td><td className="px-4 py-2.5 text-slate-700">{activity.equipe || "—"}</td><td className="px-4 py-2.5 text-slate-500"><div className="flex items-center justify-between gap-2"><span>{activity.observacoes || "—"}</span>{activity.id && <button onClick={() => onReprogram(activity)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100"><RotateCw size={13} /> Reprogramar</button>}</div></td>
    </tr>)}
  </>;
}

function ReprogramModal({ activity, saving, onClose, onSubmit }: { activity: Activity; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600"><RotateCw size={20} /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-amber-600">Reprogramar atividade</p><h2 className="truncate text-lg font-bold text-slate-900">{activity.descricao}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div><form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2"><DateField label="Nova data de início" name="dataInicio" defaultValue={activity.dataInicio} /><DateField label="Hora de início" name="horaInicio" type="time" defaultValue={activity.horaInicio} required={false} /><DateField label="Nova data de fim" name="dataFim" defaultValue={activity.dataFim} /><DateField label="Hora de fim" name="horaFim" type="time" defaultValue={activity.horaFim} required={false} /><div className="sm:col-span-2"><DateField label="Motivo da reprogramação" name="motivo" /></div><div className="sm:col-span-2"><DateField label="Reprogramado por" name="reprogramadoPor" /></div><div className="mt-2 flex gap-2 sm:col-span-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600">Cancelar</button><button disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-white hover:bg-amber-600 disabled:opacity-60">{saving && <LoaderCircle className="animate-spin" size={17} />}Reprogramar</button></div></form></div></div>;
}

function DateField({ label, name, type = "text", defaultValue, required = true }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-400" /></label>;
}
