"use client";

import { useMemo } from "react";
import { useTrainingData } from "@/components/training-data-provider";

function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "—";
}

export function TrainingCapacityMatrix() {
  const { data } = useTrainingData();
  const people = useMemo(() => data.colaboradores.filter(person => person.situacao === "Ativo").sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [data.colaboradores]);
  const courses = useMemo(() => data.treinamentos.filter(course => course.situacao === "Ativo").sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [data.treinamentos]);
  const records = useMemo(() => {
    const latest = new Map<string, (typeof data.registros)[number]>();
    for (const record of data.registros) {
      const key = `${record.treinamentoId}:${record.colaboradorId}`;
      const existing = latest.get(key);
      if (!existing || record.formacao > existing.formacao) latest.set(key, record);
    }
    return latest;
  }, [data.registros]);

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
    <header className="border-b border-slate-100 px-5 py-5 sm:px-6">
      <h2 className="text-lg font-bold text-slate-900">Matriz de capacitação</h2>
      <p className="mt-1 text-sm text-slate-500">Validade dos treinamentos por colaborador. Role horizontalmente para consultar toda a equipe.</p>
    </header>
    <div className="overflow-auto">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold text-slate-700">
          <tr><th className="sticky left-0 z-20 min-w-64 border-b border-r border-slate-200 bg-slate-50 px-4 py-3">Treinamento</th>{people.map(person => <th key={person.id} title={person.np ? `NP ${person.np}` : undefined} className="h-48 w-12 min-w-12 border-b border-slate-200 px-2 py-3 align-bottom"><span className="mx-auto block whitespace-nowrap font-semibold" style={{ writingMode: "vertical-rl" }}>{person.nome}</span></th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.length === 0 || people.length === 0 ? <tr><td colSpan={Math.max(1, people.length + 1)} className="px-4 py-10 text-center text-slate-500">Cadastre colaboradores e treinamentos ativos para preencher a matriz.</td></tr> : courses.map(course => <tr key={course.id} className="hover:bg-slate-50">
            <th scope="row" className="sticky left-0 z-[1] border-r border-slate-200 bg-white px-4 py-3 text-left font-semibold text-slate-800">{course.nome}<span className="mt-1 block text-xs font-normal text-slate-500">Validade padrão: {course.validade || "Não definida"}</span></th>
            {people.map(person => {
              const record = records.get(`${course.id}:${person.id}`);
              const expired = !!record?.vencimento && record.vencimento < new Date().toISOString().slice(0, 10);
              return <td key={person.id} title={record ? `Formação: ${formatDate(record.formacao)} · Vencimento: ${formatDate(record.vencimento)}` : "Sem registro"} className="whitespace-nowrap px-3 py-3"><span className={record ? expired ? "rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700" : "rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700" : "text-slate-300"}>{record ? formatDate(record.vencimento) === "—" ? "Sem vencimento" : formatDate(record.vencimento) : "—"}</span></td>;
            })}
          </tr>)}
        </tbody>
      </table>
    </div>
    <footer className="flex flex-wrap gap-4 border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Registro válido</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Vencido</span><span>— Sem registro</span></footer>
  </section>;
}
