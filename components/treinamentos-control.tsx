"use client";

import { FormEvent, useState } from "react";
import { useTrainingData, type TrainingStore } from "@/components/training-data-provider";

type Collaborator = { id: string; np: string; nome: string; situacao: string; obs: string };
type Course = { id: string; nome: string; validade: string; situacao: string; obs: string };
type TrainingRecord = { id: string; colaboradorId: string; treinamentoId: string; formacao: string; vencimento: string; reciclagem: string; obs: string };
type Movement = { id: string; tipo: "inclusao" | "alteracao" | "exclusao"; acao: string; descricao: string; quando: string };
type Store = TrainingStore;
type View = "Início" | "Colaboradores" | "Treinamentos" | "Registros" | "Inclusões" | "Alterações" | "Exclusões";
const views: View[] = ["Início", "Colaboradores", "Treinamentos", "Registros", "Inclusões", "Alterações", "Exclusões"];

function uid() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function datePt(value: string) { return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "—"; }
function repair(value: string) {
  if (!value.includes(String.fromCharCode(195))) return value;
  try { return new TextDecoder("utf-8").decode(Uint8Array.from(Array.from(value, c => c.charCodeAt(0)))); } catch { return value; }
}
function expiryFrom(start: string, validity: string) {
  const years = validity.match(/(\d+)\s*ANO/i)?.[1];
  const days = validity.match(/(\d+)\s*DIA/i)?.[1];
  if (!start) return "";
  const date = new Date(`${start}T12:00:00`);
  if (years) date.setFullYear(date.getFullYear() + Number(years));
  else if (/ANUAL/i.test(validity)) date.setFullYear(date.getFullYear() + 1);
  else if (days) date.setDate(date.getDate() + Number(days));
  else return "";
  return date.toISOString().slice(0, 10);
}
function recordStatus(record: TrainingRecord) {
  if (!record.vencimento) return "Sem vencimento";
  const remaining = Math.ceil((new Date(`${record.vencimento}T12:00:00`).getTime() - new Date(`${today()}T12:00:00`).getTime()) / 86400000);
  if (remaining < 0) return "Vencido";
  if (remaining <= 90) return "Vence em até 90 dias";
  return "Em dia";
}

export function TreinamentosControl({ embedded = false }: { embedded?: boolean }) {
  const { data, ready, error: databaseError, save: saveStore } = useTrainingData();
  const [view, setView] = useState<View>("In\u00edcio");
  const [notice, setNotice] = useState("");

  function change(type: Movement["tipo"], action: string, description: string, update: (current: Store) => Store) {
    const movement: Movement = { id: uid(), tipo: type, acao: action, descricao: description, quando: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date()) };
    const next = { ...update(data), movimentos: [movement, ...data.movimentos] };
    void saveStore(next, () => setNotice(`${action}: ${description}`));
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify({ versao: 3, exportadoEm: new Date().toISOString(), aplicacao: "Controle de Treinamentos", id: "backup-controle-treinamentos-2026-10-26.json", dados: data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `backup-controle-treinamentos-${today()}.json`; link.click(); URL.revokeObjectURL(url);
  }

  return <main className={embedded ? "space-y-5" : "mx-auto max-w-[1540px] px-4 pb-10 sm:px-7"}>
    <header className="-mx-4 mb-6 rounded-b-2xl bg-gradient-to-r from-[#123b5c] to-[#23638a] px-6 py-7 text-white sm:-mx-7 sm:px-10"><h1 className="text-3xl font-bold">Controle de Treinamentos</h1><p className="mt-1 text-sm text-blue-100 sm:text-base">Base de colaboradores, catálogo com validade e registros centralizados.</p></header>
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Seções de treinamentos">{views.map(item => <button key={item} onClick={() => { setView(item); setNotice(""); }} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${view === item ? "bg-[#123b5c] text-white" : "bg-slate-200 text-[#123b5c] hover:bg-slate-300"}`}>{item}</button>)}</nav>
    {databaseError && <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{databaseError}</div>}
    {notice && <div role="status" className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">{notice}</div>}
    {!ready ? <div className="rounded-xl border bg-white p-8 text-slate-500">Carregando base...</div> : <>
      {view === "Início" && <Home data={data} onExport={exportJson} />}
      {view === "Colaboradores" && <Collaborators data={data} onChange={change} />}
      {view === "Treinamentos" && <Courses data={data} onChange={change} />}
      {view === "Registros" && <Records data={data} onChange={change} />}
      {(["Inclusões", "Alterações", "Exclusões"] as View[]).includes(view) && <History data={data} view={view} />}
    </>}
    {!embedded && <p className="mt-5 text-xs text-slate-500">Base: <span className="font-semibold">backup-controle-treinamentos-2026-10-26.json</span> · Alterações salvas neste navegador. Use o backup JSON para transportar os dados.</p>}
  </main>;
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) { return <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}><h2 className="mb-4 text-xl font-bold text-[#123b5c]">{title}</h2>{children}</section>; }
type SelectOption = string | { value: string; label: string };
function Field({ label, name, type = "text", required = false, defaultValue, options, placeholder }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string; options?: SelectOption[]; placeholder?: string }) {
  const base = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
  return <label className="block text-sm font-semibold text-slate-800">{label}{options ? <select className={base} name={name} required={required} defaultValue={defaultValue ?? (typeof options[0] === "string" ? options[0] : options[0]?.value)}><option value="">Selecione</option>{options.filter(option => typeof option !== "string" || option !== "").map(option => typeof option === "string" ? <option key={option} value={option}>{option || "Sem validade definida"}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select> : type === "textarea" ? <textarea className={`${base} min-h-20`} name={name} defaultValue={defaultValue} placeholder={placeholder} /> : <input className={base} name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} />}</label>;
}
function Submit({ children }: { children: React.ReactNode }) { return <button className="w-full rounded-lg bg-[#123b5c] px-4 py-3 font-bold text-white hover:bg-[#1b5179]">{children}</button>; }
function Status({ children }: { children: string }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${children === "Ativo" || children === "Em dia" ? "bg-emerald-100 text-emerald-800" : children === "Vencido" ? "bg-red-100 text-red-800" : children.startsWith("Vence") ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"}`}>{children}</span>; }
function Home({ data, onExport }: { data: Store; onExport: () => void }) {
  const activePeople = data.colaboradores.filter(item => item.situacao === "Ativo").length;
  const activeCourses = data.treinamentos.filter(item => item.situacao === "Ativo").length;
  const due = data.registros.filter(item => recordStatus(item) === "Vence em até 90 dias").length;
  const expired = data.registros.filter(item => recordStatus(item) === "Vencido").length;
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Colaboradores ativos", activePeople], ["Treinamentos ativos", activeCourses], ["Vencem em até 90 dias", due], ["Vencidos", expired]].map(([label, count]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-1 text-3xl font-bold ${label === "Vencidos" || label === "Vencem em até 90 dias" ? "text-red-700" : "text-slate-950"}`}>{count}</p></div>)}</div><Panel title="Como usar"><p className="text-slate-800">Cadastre os colaboradores e mantenha o catálogo de treinamentos com a validade padrão. Depois, crie os registros usando essas duas bases. As abas de Inclusões, Alterações e Exclusões guardam o histórico automático das ações.</p><p className="mt-3 text-sm text-slate-500">Para retirar alguém da base sem perder registros antigos, altere sua situação para <strong>Inativo</strong>.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => window.print()} className="rounded-lg bg-[#123b5c] px-4 py-3 font-bold text-white">Gerar relatório A4 / PDF</button><button onClick={onExport} className="rounded-lg bg-slate-200 px-4 py-3 font-bold text-slate-800 hover:bg-slate-300">Salvar todos os dados em JSON</button></div></Panel></div>;
}

function Collaborators({ data, onChange }: { data: Store; onChange: (type: Movement["tipo"], action: string, desc: string, update: (current: Store) => Store) => void }) {
  const [query, setQuery] = useState("");
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const item: Collaborator = { id: uid(), np: String(form.get("np") ?? "").trim(), nome: String(form.get("nome") ?? "").trim(), situacao: String(form.get("situacao")), obs: String(form.get("obs") ?? "").trim() }; onChange("inclusao", "Colaborador incluído", item.nome, current => ({ ...current, colaboradores: [...current.colaboradores, item] })); event.currentTarget.reset(); }
  const list = data.colaboradores.filter(item => `${item.np} ${item.nome} ${item.situacao} ${item.obs}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.62fr)_minmax(0,1.38fr)]"><Panel title="Incluir colaborador"><form onSubmit={save} className="space-y-3"><Field label="NP" name="np" placeholder="Oito dígitos" /><Field label="Nome" name="nome" required /><Field label="Situação" name="situacao" options={["Ativo", "Inativo"]} /><Field label="Observações" name="obs" type="textarea" /><Submit>Salvar colaborador</Submit></form></Panel><Panel title="Base de colaboradores"><input className="mb-3 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" placeholder="Buscar por NP ou nome" value={query} onChange={e => setQuery(e.target.value)} /><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#e8f2f9] text-[#123b5c]"><tr>{["NP", "Nome", "Situação", "Observações", "Ações"].map(x => <th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{list.map(item => <tr key={item.id}><td className="px-3 py-3 font-mono">{item.np || ""}</td><td className="px-3 py-3 font-semibold">{repair(item.nome)}</td><td className="px-3 py-3"><Status>{item.situacao}</Status></td><td className="px-3 py-3">{repair(item.obs)}</td><td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => { const nome = window.prompt("Nome do colaborador", item.nome); if (nome?.trim()) onChange("alteracao", "Colaborador alterado", nome, current => ({ ...current, colaboradores: current.colaboradores.map(row => row.id === item.id ? { ...row, nome: nome.trim() } : row) })); }} className="rounded-md bg-slate-200 px-3 py-2 font-bold">Editar</button><button onClick={() => onChange("exclusao", item.situacao === "Ativo" ? "Colaborador inativado" : "Colaborador ativado", item.nome, current => ({ ...current, colaboradores: current.colaboradores.map(row => row.id === item.id ? { ...row, situacao: row.situacao === "Ativo" ? "Inativo" : "Ativo" } : row) }))} className="rounded-md bg-red-50 px-3 py-2 font-bold text-red-800">{item.situacao === "Ativo" ? "Inativar" : "Ativar"}</button></div></td></tr>)}</tbody></table></div></Panel></div>;
}

function Courses({ data, onChange }: { data: Store; onChange: (type: Movement["tipo"], action: string, desc: string, update: (current: Store) => Store) => void }) {
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const item: Course = { id: uid(), nome: String(form.get("nome") ?? "").trim(), validade: String(form.get("validade") ?? ""), situacao: String(form.get("situacao")), obs: String(form.get("obs") ?? "").trim() }; onChange("inclusao", "Treinamento incluído", item.nome, current => ({ ...current, treinamentos: [...current.treinamentos, item] })); event.currentTarget.reset(); }
  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.62fr)_minmax(0,1.38fr)]"><Panel title="Incluir treinamento"><form onSubmit={save} className="space-y-3"><Field label="Nome do treinamento" name="nome" required /><Field label="Validade padrão" name="validade" options={[{ value: "", label: "Sem validade definida" }, "ANUAL", "2 ANOS", "3 ANOS", "5 ANOS"]} /><Field label="Situação" name="situacao" options={["Ativo", "Inativo"]} /><Field label="Observações" name="obs" type="textarea" /><Submit>Salvar treinamento</Submit></form></Panel><Panel title="Catálogo e validades"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#e8f2f9] text-[#123b5c]"><tr>{["Treinamento", "Validade", "Situação", "Observações", "Ações"].map(x => <th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{data.treinamentos.map(item => <tr key={item.id}><td className="px-3 py-3 font-semibold">{repair(item.nome)}</td><td className="px-3 py-3">{item.validade || "Não definida"}</td><td className="px-3 py-3"><Status>{item.situacao}</Status></td><td className="px-3 py-3">{repair(item.obs)}</td><td className="px-3 py-3"><div className="flex flex-col items-start gap-1.5"><button onClick={() => { const nome = window.prompt("Nome do treinamento", item.nome); if (nome?.trim()) onChange("alteracao", "Treinamento alterado", nome, current => ({ ...current, treinamentos: current.treinamentos.map(row => row.id === item.id ? { ...row, nome: nome.trim() } : row) })); }} className="rounded-md bg-slate-200 px-3 py-2 font-bold">Editar</button><button onClick={() => onChange("exclusao", "Treinamento inativado", item.nome, current => ({ ...current, treinamentos: current.treinamentos.map(row => row.id === item.id ? { ...row, situacao: row.situacao === "Ativo" ? "Inativo" : "Ativo" } : row) }))} className="rounded-md bg-red-50 px-3 py-2 font-bold text-red-800">{item.situacao === "Ativo" ? "Inativar" : "Ativar"}</button></div></td></tr>)}</tbody></table></div></Panel></div>;
}

function Records({ data, onChange }: { data: Store; onChange: (type: Movement["tipo"], action: string, desc: string, update: (current: Store) => Store) => void }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("Todos os status");
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const colaboradorId = String(form.get("colaboradorId")); const treinamentoId = String(form.get("treinamentoId")); const course = data.treinamentos.find(item => item.id === treinamentoId); const item: TrainingRecord = { id: uid(), colaboradorId, treinamentoId, formacao: String(form.get("formacao") ?? ""), vencimento: String(form.get("vencimento") ?? "") || expiryFrom(String(form.get("formacao") ?? ""), course?.validade ?? ""), reciclagem: String(form.get("reciclagem") ?? ""), obs: String(form.get("obs") ?? "").trim() }; const person = data.colaboradores.find(row => row.id === colaboradorId); onChange("inclusao", "Registro de treinamento incluído", `${person?.nome ?? "Colaborador"} · ${course?.nome ?? "Treinamento"}`, current => ({ ...current, registros: [...current.registros, item] })); event.currentTarget.reset(); }
  const rows = data.registros.map(record => ({ record, person: data.colaboradores.find(x => x.id === record.colaboradorId), course: data.treinamentos.find(x => x.id === record.treinamentoId), status: recordStatus(record) })).filter(row => `${row.person?.nome} ${row.course?.nome}`.toLowerCase().includes(query.toLowerCase()) && (status === "Todos os status" || row.status === status));
  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.62fr)_minmax(0,1.38fr)]"><Panel title="Incluir registro"><form onSubmit={save} className="space-y-3"><Field label="Colaborador" name="colaboradorId" required options={[{ value: "", label: "Selecione" }, ...data.colaboradores.filter(x => x.situacao === "Ativo").map(x => ({ value: x.id, label: repair(x.nome) }))]} /><Field label="Treinamento" name="treinamentoId" required options={[{ value: "", label: "Selecione" }, ...data.treinamentos.filter(x => x.situacao === "Ativo").map(x => ({ value: x.id, label: repair(x.nome) }))]} /><Field label="Data de formação (opcional)" name="formacao" type="date" /><Field label="Data de vencimento (opcional)" name="vencimento" type="date" /><Field label="Data da reciclagem / turma inscrita (opcional)" name="reciclagem" type="date" /><Field label="Observações" name="obs" type="textarea" /><Submit>Salvar registro</Submit></form></Panel><Panel title="Registros de treinamentos"><input className="mb-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" placeholder="Buscar por colaborador ou treinamento" value={query} onChange={e => setQuery(e.target.value)} /><select className="mb-3 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" value={status} onChange={e => setStatus(e.target.value)}>{["Todos os status", "Em dia", "Vence em até 90 dias", "Vencido", "Sem vencimento"].map(x => <option key={x}>{x}</option>)}</select><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-[#e8f2f9] text-[#123b5c]"><tr>{["Colaborador", "Treinamento", "Validade", "Formação", "Vencimento", "Reciclagem", "Status", "Ações"].map(x => <th key={x} className="px-2.5 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{rows.length ? rows.map(({ record, person, course, status: rowStatus }) => <tr key={record.id}><td className="px-2.5 py-3 font-semibold">{repair(person?.nome ?? "Colaborador removido")}</td><td className="px-2.5 py-3">{repair(course?.nome ?? "Treinamento removido")}</td><td className="px-2.5 py-3">{course?.validade || "—"}</td><td className="px-2.5 py-3">{datePt(record.formacao)}</td><td className="px-2.5 py-3">{datePt(record.vencimento)}</td><td className="px-2.5 py-3">{datePt(record.reciclagem)}</td><td className="px-2.5 py-3"><Status>{rowStatus}</Status></td><td className="px-2.5 py-3"><button onClick={() => onChange("exclusao", "Registro excluído", `${person?.nome ?? "Colaborador"} · ${course?.nome ?? "Treinamento"}`, current => ({ ...current, registros: current.registros.filter(item => item.id !== record.id) }))} className="rounded-md bg-red-50 px-3 py-2 font-bold text-red-800">Excluir</button></td></tr>) : <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Nenhum registro.</td></tr>}</tbody></table></div></Panel></div>;
}

function History({ data, view }: { data: Store; view: View }) {
  const type = view === "Inclusões" ? "inclusao" : view === "Alterações" ? "alteracao" : "exclusao";
  const rows = data.movimentos.filter(item => item.tipo === type);
  return <Panel title={`Histórico de ${view.toLocaleLowerCase("pt-BR")}`}><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-[#e8f2f9] text-[#123b5c]"><tr><th className="px-3 py-3">Quando</th><th className="px-3 py-3">Ação</th><th className="px-3 py-3">Descrição</th></tr></thead><tbody className="divide-y divide-slate-200">{rows.length ? rows.map(item => <tr key={item.id}><td className="px-3 py-3">{item.quando}</td><td className="px-3 py-3 font-semibold">{repair(item.acao)}</td><td className="px-3 py-3">{repair(item.descricao)}</td></tr>) : <tr><td colSpan={3} className="px-3 py-8 text-center text-slate-500">Nenhuma ação registrada.</td></tr>}</tbody></table></div></Panel>;
}
