import Link from "next/link";
import { Activity, ArrowRight, Droplets, Thermometer, Waves } from "lucide-react";

export default function PreditivaPage() {
  return <div>
    <header className="mb-6">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-3 text-brand-600"><Activity size={25} /></span><h1 className="text-3xl font-bold tracking-tight text-slate-950">Preditiva</h1></div>
      <p className="mt-3 text-sm text-slate-500">Selecione a área de acompanhamento da manutenção preditiva.</p>
    </header>
    <div className="grid gap-5 md:grid-cols-2">
      <Link href="/ROTINA/preditiva/diagnostico" className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:border-brand-400 hover:shadow-lg">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Activity size={26} /></span>
        <h2 className="text-xl font-bold text-slate-900">Diagnóstico de Equipamentos</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-600"><p className="flex items-center gap-2"><Waves size={18} className="text-blue-600" />Análise de Vibração</p><p className="flex items-center gap-2"><Thermometer size={18} className="text-orange-500" />Análise Termográfica</p></div>
        <span className="mt-6 flex items-center gap-2 text-sm font-bold text-brand-600">Acessar diagnóstico <ArrowRight size={17} className="transition group-hover:translate-x-1" /></span>
      </Link>
      <Link href="/ROTINA/analises-oleo" className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:border-brand-400 hover:shadow-lg">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Droplets size={26} /></span>
        <h2 className="text-xl font-bold text-slate-900">Análises de óleo</h2>
        <p className="mb-6 mt-4 text-sm leading-6 text-slate-600">Planejamento das coletas, envio de amostras, qualidade do óleo e ações de acompanhamento.</p>
        <span className="mt-auto flex items-center gap-2 text-sm font-bold text-brand-600">Acessar análises de óleo <ArrowRight size={17} className="transition group-hover:translate-x-1" /></span>
      </Link>
    </div>
  </div>;
}
