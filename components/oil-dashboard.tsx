"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Droplets, Pencil, Plus, X } from "lucide-react";
import { OilCollection, oilQualities, oilPeriods, parseOilCollection, nextQuarterlyCollection } from "@/lib/oil-analysis";
import { simulateOilCollections } from "@/lib/oil-simulation";
import { OilPeriodTable } from "@/components/oil-period-table";
import { DataLoading } from "@/components/data-loading";

const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900";
const buttonClass = "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50";
const blank: Omit<OilCollection, "id" | "oleo_id"> = { data_coleta: null, descricao: "", local: "", plano: "", tipo_oleo: "", data_planejada: "", coletado: false, enviado: false, qualidade: "Pendente", acao: "", ordem: "", data_analise: null };
const qualityClass = { Pendente: "bg-slate-100 text-slate-600", Normal: "bg-emerald-100 text-emerald-800", Atenção: "bg-amber-100 text-amber-800", Crítico: "bg-red-100 text-red-800" };
const date = (value: string | null) => value ? value.split("-").reverse().join("/") : "A definir";

const collectionFilters = [
  { label: "Coletas planejadas", matches: (_item: OilCollection) => true },
  { label: "Aguardando coleta", matches: (item: OilCollection) => !item.coletado },
  { label: "Aguardando análise", matches: (item: OilCollection) => item.enviado && item.qualidade === "Pendente" },
  { label: "Atenção / crítico", matches: (item: OilCollection) => item.qualidade === "Atenção" || item.qualidade === "Crítico" },
];

function Quality({ value }: { value: OilCollection["qualidade"] }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${qualityClass[value]}`}>{value}</span>;
}
function Stage({ done }: { done: boolean }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${done ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{done && <Check size={14} />}{done ? "Sim" : "Pendente"}</span>;
}

export function OilDashboard() {
  const simulation = true;
  const [simulated, setSimulated] = useState<OilCollection[]>([]);
  const visibleItems = simulated;
  const [activeFilter, setActiveFilter] = useState(0);
  const groups = Array.from(visibleItems.reduce((map, item) => { const group = map.get(item.oleo_id) || []; group.push(item); map.set(item.oleo_id, group); return map; }, new Map<string, OilCollection[]>()).values());
  const matchesGroup = (group: OilCollection[], index: number) => {
    const { current, next } = oilPeriods(group);
    return index === 0 || (index === 1 ? !!next : !!current && collectionFilters[index].matches(current));
  };
  const filteredItems = groups.filter(group => matchesGroup(group, activeFilter));
  function newCollection(item: OilCollection) { setEditing({ ...blank, tag: item.tag, ponto: item.ponto, tipo_equipamento: item.tipo_equipamento, volume_reservatorio: item.volume_reservatorio, data_planejada: nextQuarterlyCollection(visibleItems.filter(row => row.oleo_id === item.oleo_id)), oleo_id: item.oleo_id, descricao: item.descricao, local: item.local, plano: item.plano, tipo_oleo: item.tipo_oleo }); }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Partial<OilCollection> | null>(null);

  function load() {
    setSimulated(simulateOilCollections([]));
    setError("");
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return <div className="oil-dashboard">
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-3 text-brand-600"><Droplets size={26} /></span><h1 className="text-3xl font-bold tracking-tight text-slate-950">Análises de óleo</h1></div><p className="mt-3 text-sm text-slate-500">Coletas trimestrais (a cada 3 meses): planejamento, acompanhamento e resultados.</p></div>
      <button className={`${buttonClass} inline-flex items-center gap-2`} onClick={() => setEditing(blank)}><Plus size={17} /> Nova coleta</button>
    </header>

    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Filtrar coletas">{collectionFilters.map(({ label, matches }, index) => <button type="button" key={label} aria-pressed={activeFilter === index} aria-controls="oil-collections" onClick={() => setActiveFilter(index)} className={`rounded-2xl border p-5 text-left transition hover:border-brand-400 hover:bg-brand-50 ${activeFilter === index ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-slate-200 bg-white"}`}><span className="block text-xs font-semibold text-slate-500">{label}</span><span className="mt-2 block text-2xl font-bold text-slate-900">{loading || error ? "—" : groups.filter(group => matchesGroup(group, index)).length}</span></button>)}</div>
    <section id="oil-collections" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-200 p-4"><h2 className="text-lg font-bold text-slate-900">Tabela de coletas</h2><p aria-live="polite" className="mt-1 text-sm text-slate-500">{collectionFilters[activeFilter].label}{!loading && !error && ` · ${filteredItems.length} registro(s)`}</p></div>
      {loading ? <DataLoading label="Carregando análises de óleo..." compact /> : error ? <div role="alert" className="p-6 text-sm text-red-700">{error}<button onClick={load} className="ml-3 underline">Tentar novamente</button></div> : <OilPeriodTable key={String(simulation)} groups={filteredItems} onEdit={setEditing} onNew={newCollection} />}

    </section>
    {editing && <OilForm simulation={simulation} item={editing} onClose={() => setEditing(null)} onSave={saved => { setEditing(null); if (simulation) setSimulated(current => [...current.filter(i => i.id !== saved.id).map(i => i.oleo_id === saved.oleo_id ? { ...i, descricao: saved.descricao, local: saved.local, plano: saved.plano, tipo_oleo: saved.tipo_oleo } : i), saved]); else void load(); }} />}
  </div>;
}

function OilForm({ item, onClose, onSave, simulation }: { simulation: boolean; item: Partial<OilCollection>; onClose: () => void; onSave: (item: OilCollection) => void }) {
  const [draft, setDraft] = useState({ ...blank, ...item });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState(false);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  async function save() {
    setBusy(true); setError("");
    try {
      if (simulation) { const values = parseOilCollection(draft); onSave({ ...values, tag: draft.tag, ponto: draft.ponto, tipo_equipamento: draft.tipo_equipamento, volume_reservatorio: draft.volume_reservatorio, id: item.id || `sim-${crypto.randomUUID()}`, oleo_id: item.oleo_id || `sim-${crypto.randomUUID()}` }); return; }
      const response = await fetch("/api/rotina/oil", { method: item.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json();
      if (response.status === 401) { setLogin(true); return; }
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
      onSave(data.collection);
    } catch (error) { setError(error instanceof Error ? error.message : "Erro de conexão."); }
    finally { setBusy(false); }
  }
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível autenticar.");
      setLogin(false); await save();
    } catch (error) { setError(error instanceof Error ? error.message : "Erro de conexão."); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="oil-form-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 id="oil-form-title" className="text-xl font-bold">{login ? "Acesso administrativo" : item.id ? "Editar coleta" : "Nova coleta"}</h2><button disabled={busy} onClick={onClose} aria-label="Fechar" className="rounded-lg p-2"><X size={20} /></button></div>{login ? <form onSubmit={authenticate} className="space-y-4"><p className="text-sm text-slate-500">Entre com o acesso administrativo do portal para salvar a coleta.</p><label className="block text-sm font-semibold">Usuário<input autoFocus required name="username" autoComplete="username" className={inputClass} /></label><label className="block text-sm font-semibold">Senha<input required name="password" type="password" autoComplete="current-password" className={inputClass} /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={busy} className={buttonClass}>{busy ? "Salvando..." : "Entrar e salvar"}</button></form> : <form onSubmit={e => { e.preventDefault(); void save(); }} className="grid gap-4 sm:grid-cols-2"><p className="text-xs text-slate-500 sm:col-span-2">Frequência trimestral. A próxima coleta é sugerida 3 meses após a última data planejada deste óleo.</p><fieldset disabled={busy} className="contents">{([{ key: "descricao", label: "Descrição item de manutenção" }, { key: "local", label: "Local de instalação" }, { key: "plano", label: "Plano de manutenção da coleta" }, { key: "tipo_oleo", label: "Tipo de óleo" }, { key: "data_planejada", label: "Data planejada", type: "date" }, { key: "data_coleta", label: "Data da coleta realizada", type: "date" }, { key: "ordem", label: "Ordem de manutenção da coleta" }] as const).map(field => <label key={field.key} className="text-sm font-semibold">{field.label}<input autoFocus={field.key === "descricao"} required={field.key === "data_coleta" ? draft.coletado : field.key !== "data_planejada" && (field.key !== "ordem" || draft.qualidade !== "Pendente")} maxLength={200} type={"type" in field ? field.type : "text"} value={draft[field.key] ?? ""} onChange={e => setDraft({ ...draft, [field.key]: e.target.value })} className={inputClass} /></label>)}<label className="text-sm font-semibold">Qualidade do óleo<select className={inputClass} value={draft.qualidade} onChange={e => setDraft({ ...draft, qualidade: e.target.value as OilCollection["qualidade"], data_analise: e.target.value === "Pendente" ? null : draft.data_analise })}>{oilQualities.map(q => <option key={q}>{q}</option>)}</select></label><div className="flex flex-wrap gap-5 sm:col-span-2">{(["coletado", "enviado"] as const).map(key => <label key={key} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${draft[key] ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}><input type="checkbox" checked={draft[key]} disabled={key === "enviado" && !draft.coletado} onChange={e => setDraft({ ...draft, [key]: e.target.checked, ...(key === "coletado" && !e.target.checked ? { enviado: false, data_coleta: null } : {}) })} className="h-4 w-4 accent-emerald-600" />{key === "coletado" ? "Coletado" : "Enviado"}</label>)}</div>{draft.qualidade !== "Pendente" && <label className="text-sm font-semibold">Data da análise<input type="date" required value={draft.data_analise ?? ""} onChange={e => setDraft({ ...draft, data_analise: e.target.value })} className={inputClass} /></label>}<label className="text-sm font-semibold sm:col-span-2">Ação recomendada / acompanhamento<textarea rows={3} maxLength={4000} value={draft.acao} onChange={e => setDraft({ ...draft, acao: e.target.value })} className={inputClass} placeholder="Descreva a ação necessária após a análise." /></label></fieldset>{error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}<div className="flex justify-end gap-2 sm:col-span-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Cancelar</button><button disabled={busy} className={buttonClass}>{busy ? "Salvando..." : "Salvar coleta"}</button></div></form>}</section></div>;
}
