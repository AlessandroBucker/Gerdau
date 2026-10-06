"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, ArrowDown, Pencil, Plus, X } from "lucide-react";
import { Schedule } from "@/lib/plantao-schedule";
import { Shift, TeamPerson, teamTitles, sortTeam, moveTeamPerson } from "@/lib/plantao-team";

export function PlantaoTeamEditor({ people, onSave, onClose, saving, schedules }: {
  schedules: Schedule[]; people: TeamPerson[]; saving: boolean; onSave: (people: TeamPerson[]) => Promise<boolean>; onClose: () => void;
}) {
  const [editing, setEditing] = useState<TeamPerson | "new" | null>(null);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) { setError("Informe o nome da pessoa."); return; }
    const person: TeamPerson = {
      id: editing && editing !== "new" ? editing.id : crypto.randomUUID(), name,
      team: Number(form.get("team")), shift: form.get("shift") as Shift,
      active: editing && editing !== "new" ? editing.active : true,
      position: editing && editing !== "new" && editing.team === Number(form.get("team")) ? editing.position : Math.min(1000000,Math.max(-1,...people.filter(item=>item.team===Number(form.get("team"))).map(item=>item.position??0))+1),
    };
    if (await onSave(editing === "new" ? [...people, person] : people.map(item => item.id === person.id ? person : item))) {
      setEditing(null); setError("");
    }
  }
  const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
  return <section className="calendar-print-hide mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card" aria-label="Gerenciar colaboradores">
    <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-slate-900">Gerenciar colaboradores</h2><button type="button" disabled={saving} onClick={onClose} aria-label="Fechar gerenciamento" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
    <p className="mt-1 text-sm text-slate-500">Use Subir e Descer para ordenar os colaboradores dentro da equipe. A ordem é salva automaticamente no banco e aplicada também na impressão. Colaboradores desativados ficam guardados aqui.</p>
    <button type="button" disabled={saving} onClick={() => { setEditing("new"); setError(""); }} className="my-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16} /> Adicionar colaborador</button>
    {editing && <form key={editing === "new" ? "new" : editing.id} onSubmit={save} className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
      <label className="text-sm font-semibold">Nome<input autoFocus required maxLength={100} name="name" defaultValue={editing === "new" ? "" : editing.name} className={inputClass} /></label>
      <label className="text-sm font-semibold">Equipe<select name="team" defaultValue={editing === "new" ? 0 : editing.team} className={inputClass}>{teamTitles.map((title, index) => <option key={title} value={index}>{title}</option>)}</select></label>
      <label className="text-sm font-semibold">Escala<select required name="shift" defaultValue={editing === "new" ? "P" : editing.shift} className={inputClass}>{schedules.map(row=><option key={row.id} value={row.id}>{row.name}{row.active?"":" (desativada)"}</option>)}</select></label>
      {error && <p role="alert" className="text-sm text-red-600 sm:col-span-3">{error}</p>}
      <div className="flex gap-2 sm:col-span-3"><button disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">{saving ? "Salvando..." : "Salvar linha"}</button><button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancelar</button></div>
    </form>}
    <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Nome</th><th className="p-2">Equipe</th><th className="p-2">Escala</th><th className="p-2">Situação</th><th className="p-2">Ações</th></tr></thead><tbody>{sortTeam(people).map(person => <tr key={person.id} className={`border-b border-slate-100 ${person.active ? "" : "bg-slate-50 text-slate-500"}`}><td className="p-2 font-semibold">{person.name}</td><td className="p-2">{teamTitles[person.team]}</td><td className="p-2">{person.shift}</td><td className="p-2">{person.active ? "Ativa" : "Desativada"}</td><td className="p-2"><div className="flex flex-wrap gap-2">{([-1,1] as const).map(direction => { const peers=sortTeam(people.filter(item=>item.team===person.team && item.active===person.active)); const index=peers.findIndex(item=>item.id===person.id); return <button key={direction} type="button" disabled={saving || editing !== null || !peers[index+direction]} aria-label={(direction===-1 ? "Subir " : "Descer ")+person.name} onClick={()=>onSave(moveTeamPerson(people,person.id,direction))} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 disabled:opacity-40">{direction===-1?<ArrowUp size={14}/>:<ArrowDown size={14}/>} {direction===-1?"Subir":"Descer"}</button>; })}<button type="button" disabled={saving} aria-label={`Editar ${person.name}`} onClick={() => { setEditing(person); setError(""); }} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2"><Pencil size={14} /> Editar</button><button type="button" disabled={saving || editing !== null} aria-label={`${person.active ? "Desativar" : "Ativar"} ${person.name}`} onClick={() => onSave(people.map(item => item.id === person.id ? { ...item, active: !item.active } : item))} className="rounded-lg border px-3 py-2 disabled:opacity-40">{person.active ? "Desativar" : "Ativar"}</button></div></td></tr>)}</tbody></table></div>
  </section>;
}
