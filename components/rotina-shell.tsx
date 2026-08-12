"use client";

import {
  CalendarDays,
  ChevronRight,
  Factory,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Palmtree,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Visão geral", href: "/ROTINA", icon: LayoutDashboard },
  { label: "Férias de colaboradores", href: "/ROTINA/ferias", icon: Palmtree },
  { label: "Conjuntos reservas", href: "/ROTINA/conjuntos-reservas", icon: PackageCheck },
  { label: "Calendário do plantão", href: "/ROTINA/calendario-plantao", icon: CalendarDays },
  { label: "Paradas", href: "/ROTINA/paradas", icon: Factory },
];

export function RotinaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const widePage = pathname === "/ROTINA/conjuntos-reservas" || pathname === "/ROTINA/calendario-plantao";
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(widePage);

  useEffect(() => {
    if (widePage) setMenuCollapsed(true);
  }, [widePage, pathname]);

  return (
    <div className={`min-h-screen bg-slate-50 lg:grid ${menuCollapsed ? "lg:grid-cols-[88px_1fr]" : "lg:grid-cols-[280px_1fr]"}`}>
      {menuOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-slate-950 text-white shadow-2xl transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuCollapsed ? "lg:w-[88px]" : "lg:w-[280px]"} ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className={`flex h-20 items-center border-b border-white/10 ${menuCollapsed ? "lg:justify-center lg:px-3" : "justify-between px-6"}`}>
          <Link href="/ROTINA" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/20">
              <CalendarDays size={21} />
            </span>
            <span className={menuCollapsed ? "lg:hidden" : ""}>
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-100">Portal</span>
              <span className="block text-lg font-bold">Rotina</span>
            </span>
          </Link>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className={`flex-1 space-y-1 overflow-y-auto py-6 ${menuCollapsed ? "lg:px-3" : "px-4"}`} aria-label="Menu da rotina">
          <p className={`mb-3 px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 ${menuCollapsed ? "lg:hidden" : ""}`}>Navegação</p>
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={menuCollapsed ? label : undefined}
                onClick={() => setMenuOpen(false)}
                className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${menuCollapsed ? "lg:justify-center" : ""} ${active ? "bg-brand-600 text-white shadow-lg shadow-brand-950/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={19} className={active ? "text-white" : "text-slate-500 group-hover:text-brand-100"} />
                <span className={`flex-1 ${menuCollapsed ? "lg:hidden" : ""}`}>{label}</span>
                <ChevronRight size={16} className={`${menuCollapsed ? "lg:hidden" : ""} ${active ? "opacity-100" : "opacity-0 transition group-hover:opacity-60"}`} />
              </Link>
            );
          })}
        </nav>

        <div className={`border-t border-white/10 px-4 py-4 ${menuCollapsed ? "lg:text-center" : ""}`}>
          <button onClick={() => setMenuCollapsed(value => !value)} title={menuCollapsed ? "Expandir menu" : "Recolher menu"} className="hidden w-full items-center justify-center gap-2 rounded-xl p-2.5 text-sm font-semibold text-slate-400 hover:bg-white/10 hover:text-white lg:flex">
            {menuCollapsed ? <PanelLeftOpen size={20} /> : <><PanelLeftClose size={20} /><span>Recolher menu</span></>}
          </button>
          <p className={`mt-3 text-xs leading-5 text-slate-500 ${menuCollapsed ? "lg:hidden" : ""}`}>Acesso livre · Não requer login</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-7 lg:hidden">
          <button onClick={() => setMenuOpen(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-700 shadow-sm" aria-label="Abrir menu">
            <Menu size={21} />
          </button>
          <span className="ml-3 font-bold text-slate-900">Portal Rotina</span>
        </header>
        <main className={`mx-auto w-full ${widePage ? "max-w-none p-2 sm:p-3 lg:p-4" : "max-w-7xl p-4 sm:p-7 lg:p-10"}`}>{children}</main>
      </div>
    </div>
  );
}
