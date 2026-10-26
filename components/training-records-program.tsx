"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTrainingData, type TrainingStore } from "@/components/training-data-provider";

type RecordItem = TrainingStore["registros"][number];
type AgendaItem = { id: string; area: string; nome: string; np: string; inicio: string; fim: string };
type SortKey = "colaborador" | "treinamento" | "validade" | "formacao" | "vencimento" | "reciclagem" | "status";

function datePt(value: string) { return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "—"; }
function expiry(start: string, validity: string) {
  if (!start) return "";
  const years = validity.match(/(\d+)\s*ANO/i)?.[1];
  const date = new Date(`${start}T12:00:00`);
  if (years) date.setFullYear(date.getFullYear() + Number(years));
  else if (/ANUAL/i.test(validity)) date.setFullYear(date.getFullYear() + 1);
  else return "";
  return date.toISOString().slice(0, 10);
}
function statusOf(item: RecordItem) {
  if (!item.vencimento) return "Sem vencimento";
  const days = Math.ceil((new Date(`${item.vencimento}T12:00:00`).getTime() - new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00`).getTime()) / 86400000);
  if (days < 0) return "Vencido";
  if (days <= 90) return `Vence em ${days} dias`;
  return "Em dia";
}
function uid() { return crypto.randomUUID(); }

export function TrainingRecordsProgram() {
  const { data: store, ready, error: databaseError, save: saveStore } = useTrainingData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const [editing, setEditing] = useState<RecordItem | null | "new">(null);
  const [message, setMessage] = useState("");
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [agendaError, setAgendaError] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "reciclagem", direction: "asc" });

  useEffect(() => {
    const load = () => fetch("/api/rotina/trainings", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao carregar a agenda.");
      setAgenda(result.trainings ?? []);
      setAgendaError("");
    }).catch(error => setAgendaError(error instanceof Error ? error.message : "Falha ao carregar a agenda."));
    void load();
    window.addEventListener("admin-session-ready", load);
    return () => window.removeEventListener("admin-session-ready", load);
  }, []);

  const rows = useMemo(() => {
    const registered = store.registros.map(record => ({
    record,
    person: store.colaboradores.find(item => item.id === record.colaboradorId),
    course: store.treinamentos.find(item => item.id === record.treinamentoId),
    status: statusOf(record), agenda: false as const,
  })).filter(row => `${row.person?.nome ?? ""} ${row.course?.nome ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")) && (statusFilter === "Todos os status" || (statusFilter === "Vence em até 90 dias" ? row.status.startsWith("Vence") : row.status === statusFilter)));
    const scheduled = agenda.map(item => {
      const byNp = item.np ? store.colaboradores.find(person => person.np === item.np) : undefined;
      const firstName = item.nome.split(/[,-]/)[0].trim().toLocaleLowerCase("pt-BR");
      const byName = store.colaboradores.filter(person => person.nome.toLocaleLowerCase("pt-BR").startsWith(firstName));
      const person = byNp ?? (byName.length === 1 ? byName[0] : undefined);
      return { record: null, person, course: null, status: item.fim < new Date().toISOString().slice(0, 10) ? "Aguardando registro" : "Programado", agenda: true as const, item };
    }).filter(row => `${row.person?.nome ?? ""} ${row.item.nome} ${row.item.area}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")) && (statusFilter === "Todos os status" || statusFilter === row.status));
    return [...registered, ...scheduled];
  }, [store, agenda, search, statusFilter]);

  const sortedRows = useMemo(() => {
    const value = (row: (typeof rows)[number]) => {
      if (sort.key === "colaborador") return row.person?.nome ?? (row.agenda ? row.item.nome.split(/[,-]/)[0].trim() : "");
      if (sort.key === "treinamento") return row.agenda ? row.item.nome : row.course?.nome ?? "";
      if (sort.key === "validade") return row.agenda ? "" : row.course?.validade ?? "";
      if (sort.key === "formacao") return row.agenda ? "" : row.record?.formacao ?? "";
      if (sort.key === "vencimento") return row.agenda ? "" : row.record?.vencimento ?? "";
      if (sort.key === "reciclagem") return row.agenda ? row.item.inicio : row.record?.reciclagem ?? "";
      return row.status;
    };
    return [...rows].sort((a, b) => String(value(a)).localeCompare(String(value(b)), "pt-BR", { numeric: true, sensitivity: "base" }) * (sort.direction === "asc" ? 1 : -1));
  }, [rows, sort]);

  function sortBy(key: SortKey) {
    setSort(current => current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  }

  function persist(next: TrainingStore, onSuccess: () => void) { void saveStore(next, onSuccess); }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const colaboradorId = String(form.get("colaboradorId") ?? "");
    const treinamentoId = String(form.get("treinamentoId") ?? "");
    const course = store.treinamentos.find(item => item.id === treinamentoId);
    const formation = String(form.get("formacao") ?? "");
    const original = editing && editing !== "new" ? editing : null;
    const item: RecordItem = { id: original?.id ?? uid(), colaboradorId, treinamentoId, formacao: formation, vencimento: String(form.get("vencimento") ?? "") || expiry(formation, course?.validade ?? ""), reciclagem: String(form.get("reciclagem") ?? ""), obs: String(form.get("obs") ?? "").trim() };
    const person = store.colaboradores.find(row => row.id === colaboradorId);
    const description = `${person?.nome ?? "Colaborador"} - ${course?.nome ?? "Treinamento"}`;
    const movement: TrainingStore["movimentos"][number] = { id: uid(), tipo: original ? "alteracao" : "inclusao", acao: original ? "Registro alterado" : "Registro de treinamento inclu\u00eddo", descricao: description, quando: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date()) };
    const registros = original ? store.registros.map(row => row.id === item.id ? item : row) : [...store.registros, item];
    persist({ ...store, registros, movimentos: [movement, ...store.movimentos] }, () => { setEditing(null); setMessage(original ? "Registro atualizado." : "Treinamento adicionado."); });
  }
  function remove(item: RecordItem) {
    const person = store.colaboradores.find(row => row.id === item.colaboradorId);
    const course = store.treinamentos.find(row => row.id === item.treinamentoId);
    const movement: TrainingStore["movimentos"][number] = { id: uid(), tipo: "exclusao", acao: "Registro exclu\u00eddo", descricao: `${person?.nome ?? "Colaborador"} - ${course?.nome ?? "Treinamento"}`, quando: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date()) };
    persist({ ...store, registros: store.registros.filter(row => row.id !== item.id), movimentos: [movement, ...store.movimentos] }, () => { setEditing(null); setMessage("Registro exclu\u00eddo."); });
  }

  const selected = editing && editing !== "new" ? editing : null;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div><h2 className="text-lg font-bold text-slate-900">Programação de treinamentos</h2><p className="mt-1 text-sm text-slate-500">Registros por colaborador, validade e datas de treinamento.</p></div>
      <button onClick={() => { setMessage(""); setEditing("new"); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"><span className="text-lg leading-none">＋</span> Adicionar treinamento</button>
    </div>
    <div className="space-y-3 px-5 py-4 sm:px-6">
      {(databaseError || agendaError) && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{databaseError || agendaError}</p>}
      <p className="text-xs text-slate-500">A agenda antiga está integrada aqui. Itens com status Programado ainda não são registros de conclusão; as datas ficam em Reciclagem / turma.</p>
      {message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
      <input aria-label="Buscar por colaborador ou treinamento" className="w-full rounded-lg border border-slate-300 px-4 py-2.5" placeholder="Buscar por colaborador ou treinamento" value={search} onChange={event => setSearch(event.target.value)} />
      <select aria-label="Filtrar status" className="w-full rounded-lg border border-slate-300 px-4 py-2.5" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>{["Todos os status", "Programado", "Aguardando registro", "Em dia", "Vence em até 90 dias", "Vencido", "Sem vencimento"].map(value => <option key={value}>{value}</option>)}</select>
    </div>
    <div className="overflow-x-auto px-5 pb-5 sm:px-6"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-700"><tr>{([{ key: "colaborador", label: "Colaborador" }, { key: "treinamento", label: "Treinamento" }, { key: "validade", label: "Validade" }, { key: "formacao", label: "Formação" }, { key: "vencimento", label: "Vencimento" }, { key: "reciclagem", label: "Reciclagem / turma" }, { key: "status", label: "Status" }] as { key: SortKey; label: string }[]).map(column => <th key={column.key} className="whitespace-nowrap px-3 py-3"><button type="button" onClick={() => sortBy(column.key)} className="inline-flex items-center gap-1.5 hover:text-brand-700" aria-label={`Ordenar por ${column.label}`}>{column.label}<span aria-hidden="true" className="text-slate-400">{sort.key === column.key ? sort.direction === "asc" ? "↑" : "↓" : "↕"}</span></button></th>)}<th className="whitespace-nowrap px-3 py-3">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{!ready ? <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Carregando registros...</td></tr> : sortedRows.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Nenhum registro.</td></tr> : sortedRows.map(row => <tr key={`${row.agenda ? "agenda" : "registro"}-${row.agenda ? row.item.id : row.record!.id}`} onDoubleClick={() => !row.agenda && row.record && setEditing(row.record)} className={`hover:bg-slate-50 ${row.agenda ? "bg-blue-50/40" : "cursor-pointer"}`}><td className="max-w-40 px-3 py-3 font-semibold">{row.person?.nome ?? (row.agenda ? row.item.nome.split(/[,-]/)[0].trim() : "Colaborador removido")}</td><td className="max-w-56 px-3 py-3">{row.agenda ? row.item.nome : row.course?.nome ?? "Treinamento removido"}</td><td className="whitespace-nowrap px-3 py-3">{row.agenda ? "—" : row.course?.validade || "—"}</td><td className="whitespace-nowrap px-3 py-3">{row.agenda ? "—" : datePt(row.record!.formacao)}</td><td className="whitespace-nowrap px-3 py-3">{row.agenda ? "—" : datePt(row.record!.vencimento)}</td><td className="whitespace-nowrap px-3 py-3">{row.agenda ? `${datePt(row.item.inicio)}${row.item.fim !== row.item.inicio ? ` – ${datePt(row.item.fim)}` : ""}` : datePt(row.record!.reciclagem)}</td><td className="px-3 py-3"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${row.status === "Vencido" ? "bg-red-100 text-red-800" : row.status.startsWith("Vence") ? "bg-amber-100 text-amber-800" : row.agenda ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{row.status}</span></td><td className="px-3 py-3">{row.agenda ? <span className="text-xs text-slate-500">Da agenda</span> : <button onClick={() => { setMessage(""); setEditing(row.record); }} className="rounded-lg bg-slate-100 px-3 py-2 font-bold text-slate-800 hover:bg-slate-200">Editar</button>}</td></tr>)}</tbody></table></div>
    {editing && <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="training-record-modal-title"><div className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 id="training-record-modal-title" className="text-xl font-bold text-[#123b5c]">{selected ? "Editar registro" : "Incluir registro"}</h2><button onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar">✕</button></div><form key={selected?.id ?? "new-record"} onSubmit={save} className="space-y-3"><label className="block text-sm font-semibold">Colaborador<select name="colaboradorId" required defaultValue={selected?.colaboradorId ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5"><option value="">Selecione</option>{store.colaboradores.filter(item => item.situacao === "Ativo").map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label className="block text-sm font-semibold">Treinamento<select name="treinamentoId" required defaultValue={selected?.treinamentoId ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5"><option value="">Selecione</option>{store.treinamentos.filter(item => item.situacao === "Ativo").map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label className="block text-sm font-semibold">Data de formação (opcional)<input name="formacao" type="date" defaultValue={selected?.formacao ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" /></label><label className="block text-sm font-semibold">Data de vencimento (opcional)<input name="vencimento" type="date" defaultValue={selected?.vencimento ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" /></label><label className="block text-sm font-semibold">Data da reciclagem / turma inscrita (opcional)<input name="reciclagem" type="date" defaultValue={selected?.reciclagem ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" /></label><label className="block text-sm font-semibold">Observações<textarea name="obs" defaultValue={selected?.obs ?? ""} className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" /></label><div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">{selected && <button type="button" onClick={() => remove(selected)} className="rounded-lg bg-red-50 px-4 py-3 font-bold text-red-800 hover:bg-red-100">Excluir registro</button>}<div className="flex flex-1 justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-3 font-bold text-slate-600">Cancelar</button><button className="rounded-lg bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700">Salvar registro</button></div></div></form></div></div>}
  </section>;
}
