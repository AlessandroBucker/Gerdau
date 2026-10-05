import Link from "next/link";
import { ArrowLeft, Thermometer, Waves } from "lucide-react";

export default function DiagnosticoPage() {
  return <div>
    <Link href="/ROTINA/preditiva" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600"><ArrowLeft size={16} />Preditiva</Link>
    <header className="mb-6"><h1 className="text-3xl font-bold tracking-tight text-slate-950">Diagnóstico de Equipamentos</h1><p className="mt-3 text-sm text-slate-500">Análise de Vibração e Análise Termográfica.</p></header>
    <div className="grid gap-5 md:grid-cols-2">{[
      { title: "Análise de Vibração", icon: Waves, color: "bg-blue-50 text-blue-600" },
      { title: "Análise Termográfica", icon: Thermometer, color: "bg-orange-50 text-orange-600" },
    ].map(({ title, icon: Icon, color }) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"><span className={`mb-4 inline-flex rounded-xl p-3 ${color}`}><Icon size={24} /></span><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-3 text-sm text-slate-500">Área em preparação para cadastro e acompanhamento dos diagnósticos.</p></section>)}</div>
  </div>;
}
