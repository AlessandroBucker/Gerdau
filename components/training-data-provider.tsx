"use client";

import { createContext, FormEvent, ReactNode, useContext, useEffect, useState } from "react";

export type TrainingStore = {
  colaboradores: { id: string; np: string; nome: string; situacao: string; obs: string }[];
  treinamentos: { id: string; nome: string; validade: string; situacao: string; obs: string }[];
  registros: { id: string; colaboradorId: string; treinamentoId: string; formacao: string; vencimento: string; reciclagem: string; obs: string }[];
  movimentos: { id: string; tipo: string; acao: string; descricao: string; quando: string }[];
};
const EMPTY_STORE: TrainingStore = { colaboradores: [], treinamentos: [], registros: [], movimentos: [] };
type PendingWrite = { data: TrainingStore; onSuccess?: () => void };
type ContextValue = { data: TrainingStore; ready: boolean; error: string; save: (data: TrainingStore, onSuccess?: () => void) => Promise<boolean> };
const STORE_KEY = "controle-treinamentos-v2-2026-10-26";
const DataContext = createContext<ContextValue | null>(null);

export function TrainingDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TrainingStore>(EMPTY_STORE);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [pending, setPending] = useState<PendingWrite | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/rotina/training-management", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (response.status === 401) { setLoginOpen(true); return; }
      if (!response.ok) throw new Error(result.error || "Falha ao carregar Supabase.");
      if (mounted) { setData(result.data as TrainingStore); localStorage.setItem(STORE_KEY, JSON.stringify(result.data)); setError(""); }
    }).catch(error => {
      if (!mounted) return;
      const cached = localStorage.getItem(STORE_KEY);
      if (cached) { try { setData(JSON.parse(cached) as TrainingStore); } catch { /* usa a carga inicial */ } }
      setError(error instanceof Error ? `${error.message} Exibindo a última cópia local.` : "Falha ao carregar Supabase.");
    }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  async function persist(next: TrainingStore) {
    const response = await fetch("/api/rotina/training-management", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: next }) });
    if (response.status === 401) return "unauthorized" as const;
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Falha ao salvar no Supabase.");
    setData(next); localStorage.setItem(STORE_KEY, JSON.stringify(next)); setError("");
    return "saved" as const;
  }

  async function save(next: TrainingStore, onSuccess?: () => void) {
    try {
      const result = await persist(next);
      if (result === "unauthorized") { setPending({ data: next, onSuccess }); setLoginError(""); setLoginOpen(true); return false; }
      onSuccess?.();
      return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Falha ao salvar no Supabase."); return false; }
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loginBusy) return;
    setLoginBusy(true); setLoginError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Usuário ou senha inválidos.");
      const dataResponse = await fetch("/api/rotina/training-management", { cache: "no-store" });
      const loaded = await dataResponse.json();
      if (!dataResponse.ok) throw new Error(loaded.error || "Falha ao carregar dados.");
      setData(loaded.data as TrainingStore);
      localStorage.setItem(STORE_KEY, JSON.stringify(loaded.data));
      if (pending) {
        const saved = await persist(pending.data);
        if (saved === "unauthorized") throw new Error("A sessão administrativa não foi validada.");
        pending.onSuccess?.(); setPending(null);
      }
      setLoginOpen(false);
      window.dispatchEvent(new Event("admin-session-ready"));
    } catch (error) { setLoginError(error instanceof Error ? error.message : "Não foi possível validar o acesso."); }
    finally { setLoginBusy(false); }
  }

  return <DataContext.Provider value={{ data, ready, error, save }}>
    {children}
    {loginOpen && <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="mb-2 text-xl font-bold text-slate-900">Acesso administrativo</h2><p className="mb-5 text-sm text-slate-500">Entre para consultar e alterar os dados de treinamento.</p><form onSubmit={authenticate} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Usuário<input name="username" autoComplete="username" required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" /></label><label className="block text-sm font-semibold text-slate-700">Senha<input name="password" type="password" autoComplete="current-password" required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5" /></label>{loginError && <p role="alert" className="text-sm text-red-700">{loginError}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => { setLoginOpen(false); setPending(null); }} className="rounded-lg border border-slate-200 px-4 py-2.5 font-bold text-slate-600">Cancelar</button><button disabled={loginBusy} className="rounded-lg bg-brand-600 px-4 py-2.5 font-bold text-white disabled:opacity-60">{loginBusy ? "Validando..." : "Entrar e continuar"}</button></div></form></div></div>}
  </DataContext.Provider>;
}

export function useTrainingData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useTrainingData deve ser usado dentro de TrainingDataProvider.");
  return value;
}
