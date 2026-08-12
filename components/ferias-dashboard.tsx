"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, LoaderCircle, LockKeyhole, Palmtree, Pencil, Plus, X } from "lucide-react";
import { DataLoading } from "@/components/data-loading";

type Vacation = { id: string; area: string; nome: string; np: string; inicio: string; fim: string };
type SortKey = "area" | "nome" | "np" | "inicio" | "fim" | "dias" | "status";

function localDate(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR").format(localDate(iso));
}

function daysBetween(start: string, end: string) {
  return Math.floor((localDate(end).getTime() - localDate(start).getTime()) / 86400000) + 1;
}

function statusOf(item: Vacation) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (today < localDate(item.inicio)) return "Programada";
  if (today > localDate(item.fim)) return "Concluída";
  return "Em férias";
}

export function FeriasDashboard() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "inicio", direction: "asc" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [authAction, setAuthAction] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Vacation | null | "new">(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/rotina/vacations", { cache: "no-store" }).then(response => response.json()).then(data => { if (data.vacations) setVacations(data.vacations); }).finally(() => setLoading(false)); }, []);

  const sorted = useMemo(() => [...vacations].sort((a, b) => {
    const value = (item: Vacation) => sort.key === "dias" ? daysBetween(item.inicio, item.fim) : sort.key === "status" ? statusOf(item) : item[sort.key];
    return String(value(a)).localeCompare(String(value(b)), "pt-BR", { numeric: true }) * (sort.direction === "asc" ? 1 : -1);
  }), [vacations, sort]);

  const current = sorted.filter(item => statusOf(item) !== "Concluída");
  const previous = sorted.filter(item => statusOf(item) === "Concluída");

  function changeSort(key: SortKey) {
    setSort(currentSort => currentSort.key === key ? { key, direction: currentSort.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  }

  function requestAccess(action: "add" | "edit") {
    if (action === "edit" && selectedId === null) return;
    setAuthError("");
    setAuthAction(action);
  }

  function openDetails(id: string) {
    setSelectedId(id);
    setViewingId(id);
  }

  function editFromDetails() {
    setViewingId(null);
    requestAccess("edit");
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Usuário ou senha inválidos.");
      const action = authAction;
      setAuthAction(null);
      setEditing(action === "edit" ? vacations.find(item => item.id === selectedId) ?? null : "new");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Não foi possível validar o acesso.");
    } finally {
      setAuthLoading(false);
    }
  }

  function saveVacation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      area: String(form.get("area")), nome: String(form.get("nome")), np: String(form.get("np")),
      inicio: String(form.get("inicio")), fim: String(form.get("fim")),
    };
    if (values.fim < values.inicio) return;
    if (editing === "new") {
      setVacations(items => [...items, { id: crypto.randomUUID(), ...values }]);
    } else if (editing) {
      setVacations(items => items.map(item => item.id === editing.id ? { ...item, ...values } : item));
    }
    setEditing(null);
  }

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Palmtree size={24} /></span><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Férias de colaboradores</h1></div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-lg font-bold text-slate-900">Programação de férias</h2><p className="mt-1 text-sm text-slate-500">Clique em qualquer título para reorganizar a tabela.</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => requestAccess("add")} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"><Plus size={17} /> Adicionar férias</button>
          </div>
        </div>
        {loading ? <DataLoading label="Carregando férias..." compact /> : <VacationTable items={current} selectedId={selectedId} onSelect={openDetails} sort={sort} onSort={changeSort} emptyText="Nenhuma programação futura encontrada." />}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><h2 className="text-lg font-bold text-slate-900">Férias anteriores</h2><p className="mt-1 text-sm text-slate-500">Histórico de períodos já concluídos.</p></div>
        {loading ? <DataLoading label="Carregando histórico..." compact /> : <VacationTable items={previous} selectedId={selectedId} onSelect={openDetails} sort={sort} onSort={changeSort} emptyText="Ainda não há férias anteriores cadastradas." />}
      </section>

      {viewingId && vacations.find(item => item.id === viewingId) && <VacationDetails item={vacations.find(item => item.id === viewingId)!} onClose={() => setViewingId(null)} onEdit={editFromDetails} />}
      {authAction && <AuthModal loading={authLoading} error={authError} onClose={() => setAuthAction(null)} onSubmit={authenticate} />}
      {editing && <VacationForm item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSubmit={saveVacation} />}
    </div>
  );
}

function VacationDetails({ item, onClose, onEdit }: { item: Vacation; onClose: () => void; onEdit: () => void }) {
  const status = statusOf(item);
  return <Modal title="Detalhes das férias" onClose={onClose} icon={<Palmtree size={21} />}><div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2"><Detail label="Área" value={item.area} /><Detail label="Colaborador" value={item.nome} /><Detail label="NP" value={item.np || "Não informado"} /><Detail label="Status" value={status} /><Detail label="Data de início" value={formatDate(item.inicio)} /><Detail label="Data de fim" value={formatDate(item.fim)} /><Detail label="Dias de férias" value={String(daysBetween(item.inicio, item.fim))} /></div><button onClick={onEdit} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white hover:bg-brand-700"><Pencil size={17} /> Editar informações</button></Modal>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>;
}

function VacationTable({ items, selectedId, onSelect, sort, onSort, emptyText }: { items: Vacation[]; selectedId: string | null; onSelect: (id: string) => void; sort: { key: SortKey; direction: "asc" | "desc" }; onSort: (key: SortKey) => void; emptyText: string }) {
  const columns: { key: SortKey; label: string; center?: boolean }[] = [
    { key: "area", label: "Área" }, { key: "nome", label: "Nome do colaborador" }, { key: "np", label: "NP" },
    { key: "inicio", label: "Data de início" }, { key: "fim", label: "Data de fim" }, { key: "dias", label: "Dias de férias", center: true }, { key: "status", label: "Status" },
  ];
  return <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><tr>{columns.map(column => <th key={column.key} className={`px-5 py-4 ${column.center ? "text-center" : ""}`}><button onClick={() => onSort(column.key)} className={`inline-flex items-center gap-1.5 hover:text-brand-700 ${column.center ? "mx-auto" : ""}`}>{column.label}{sort.key === column.key ? sort.direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} /> : <ArrowUpDown size={14} className="text-slate-300" />}</button></th>)}</tr></thead><tbody className="divide-y divide-slate-100">{items.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">{emptyText}</td></tr> : items.map(item => { const status = statusOf(item); const selected = selectedId === item.id; return <tr key={item.id} onClick={() => onSelect(item.id)} className={`cursor-pointer transition ${status === "Em férias" ? "bg-emerald-100 hover:bg-emerald-200" : selected ? "bg-brand-50 ring-1 ring-inset ring-brand-200" : "hover:bg-slate-50"}`}><td className="whitespace-nowrap px-5 py-4"><span className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-700">{item.area}</span></td><td className="px-5 py-4 font-semibold capitalize text-slate-800">{item.nome.toLocaleLowerCase("pt-BR")}</td><td className="px-5 py-4 font-mono text-slate-500">{item.np || <span className="text-slate-300">—</span>}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(item.inicio)}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(item.fim)}</td><td className="px-5 py-4 text-center font-bold text-slate-700">{daysBetween(item.inicio, item.fim)}</td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${status === "Em férias" ? "bg-emerald-600 text-white" : status === "Concluída" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700"}`}>{status}</span></td></tr>; })}</tbody></table></div>;
}

function AuthModal({ loading, error, onClose, onSubmit }: { loading: boolean; error: string; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title="Acesso restrito" onClose={onClose} icon={<LockKeyhole size={21} />}><p className="mb-5 text-sm text-slate-500">Informe o usuário e a senha administrativos para continuar.</p><form onSubmit={onSubmit} className="space-y-4"><Field label="Usuário" name="username" autoComplete="username" /><Field label="Senha" name="password" type="password" autoComplete="current-password" />{error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-60">{loading && <LoaderCircle size={17} className="animate-spin" />}{loading ? "Validando..." : "Entrar e continuar"}</button></form></Modal>;
}

function VacationForm({ item, onClose, onSubmit }: { item: Vacation | null; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={item ? "Editar férias" : "Adicionar férias"} onClose={onClose} icon={item ? <Pencil size={20} /> : <Plus size={21} />}><form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Nome do colaborador" name="nome" defaultValue={item?.nome} /></div><Field label="Área" name="area" defaultValue={item?.area ?? "Laminação 1"} /><Field label="NP" name="np" defaultValue={item?.np} required={false} /><Field label="Data de início" name="inicio" type="date" defaultValue={item?.inicio} /><Field label="Data de fim" name="fim" type="date" defaultValue={item?.fim} /><div className="mt-2 flex gap-2 sm:col-span-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600">Cancelar</button><button className="flex-1 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white hover:bg-brand-700">Salvar</button></div></form></Modal>;
}

function Modal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span><h2 className="flex-1 text-xl font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div>{children}</div></div>;
}

function Field({ label, name, type = "text", autoComplete, defaultValue, required = true }: { label: string; name: string; type?: string; autoComplete?: string; defaultValue?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input required={required} name={name} type={type} autoComplete={autoComplete} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:ring-4 focus:ring-brand-50" /></label>;
}
