"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/client-response";

export function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const data = await readJsonResponse<{ ok?: boolean; error?: string }>(response);
      if (!response.ok) throw new Error(data.error);
      router.replace("/admin");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível entrar.");
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-card sm:p-10">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><ShieldCheck size={25} /></div>
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Administração</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Acesso restrito</h1>
      <p className="mt-2 text-slate-500">Entre com suas credenciais administrativas.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field label="Usuário" name="username" autoComplete="username" />
        <Field label="Senha" name="password" type="password" autoComplete="current-password" />
        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {loading && <LoaderCircle className="animate-spin" size={18} />} {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}

function Field({ label, name, type = "text", autoComplete }: { label: string; name: string; type?: string; autoComplete: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input required name={name} type={type} autoComplete={autoComplete} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:ring-4 focus:ring-brand-50" /></label>;
}
