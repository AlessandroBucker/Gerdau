import type { LucideIcon } from "lucide-react";

export function RotinaSection({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-600">Rotina operacional</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">{description}</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card sm:p-10">
        <div className="grid min-h-72 place-items-center text-center">
          <div>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={30} /></span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">Área pronta para configuração</h2>
            <p className="mx-auto mt-2 max-w-md leading-6 text-slate-500">Esta tela já faz parte do menu da Rotina e está preparada para receber os dados e funcionalidades deste módulo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
