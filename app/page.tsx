import { CalendarDays, FileText, Settings } from "lucide-react";
import Link from "next/link";

const options = [
  {
    title: "Portal de documentos",
    description: "Consulte seus documentos PDF utilizando o Número Pessoal.",
    href: "/documentos",
    icon: FileText,
    iconClass: "bg-brand-50 text-brand-600",
  },
  {
    title: "Administração",
    description: "Gerencie usuários, documentos e programações do portal.",
    href: "/admin",
    icon: Settings,
    iconClass: "bg-slate-100 text-slate-700",
  },
  {
    title: "Rotina",
    description: "Acesse eventos, férias, plantões, paradas e conjuntos reservas.",
    href: "/ROTINA",
    icon: CalendarDays,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-5xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Portal Gerdau</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Selecione uma área</h1>
          <p className="mt-3 text-slate-500">Escolha abaixo o ambiente que deseja acessar.</p>
        </header>
        <div className="grid gap-5 md:grid-cols-3">
          {options.map(({ title, description, href, icon: Icon, iconClass }) => (
            <Link key={href} href={href} className="group flex min-h-60 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
              <span className={`grid h-12 w-12 place-items-center rounded-xl ${iconClass}`}><Icon size={24} /></span>
              <h2 className="mt-5 text-xl font-bold text-slate-900 group-hover:text-brand-700">{title}</h2>
              <p className="mt-2 flex-1 leading-6 text-slate-500">{description}</p>
              <span className="mt-5 text-sm font-bold text-brand-600">Acessar <span className="ml-1 transition-transform group-hover:ml-2">→</span></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
