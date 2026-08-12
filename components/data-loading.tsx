import { LoaderCircle } from "lucide-react";

export function DataLoading({ label = "Carregando dados...", compact = false }: { label?: string; compact?: boolean }) {
  return <div role="status" aria-live="polite" className={`grid place-items-center bg-white text-center ${compact ? "min-h-32" : "min-h-72"}`}><div><LoaderCircle className="mx-auto animate-spin text-brand-600" size={compact ? 28 : 36} /><p className="mt-3 text-sm font-semibold text-slate-500">{label}</p></div></div>;
}
