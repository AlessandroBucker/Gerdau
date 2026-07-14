"use client";

import { FormEvent, useRef, useState } from "react";
import { CalendarDays, Download, ExternalLink, FileText, LoaderCircle, LockKeyhole, LogOut } from "lucide-react";
import { readJsonResponse } from "@/lib/client-response";

type DocumentItem = {
  id: string;
  titulo: string;
  dataPlanejada: string | null;
  diaSemana: string | null;
  criadoEm: string;
  viewUrl: string;
  downloadUrl: string;
};

type AccessData = { descricao: string; documentos: DocumentItem[] };

export function DocumentPortal() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<AccessData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 8));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{8}$/.test(code)) {
      setError("Digite os 8 dígitos do seu Número Pessoal.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalNumber: code }),
      });
      const payload = await readJsonResponse<AccessData & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível validar o Número Pessoal.");
      setData(payload);
      setCode("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível validar o Número Pessoal.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setData(null);
    setCode("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (!data) {
    return (
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card sm:rounded-3xl">
        <div className="p-6 sm:p-10">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><LockKeyhole aria-hidden="true" size={24} /></div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">Área segura</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Acesse seus documentos</h1>
          <p className="mt-3 leading-7 text-slate-500">Informe seu Número Pessoal de 8 dígitos para consultar os PDFs disponíveis.</p>
          <form className="mt-8" onSubmit={submit} noValidate>
            <label htmlFor="access-code" className="mb-2 block text-sm font-semibold text-slate-700">Número Pessoal</label>
            <input ref={inputRef} id="access-code" name="access-code" value={code} onChange={(event) => updateCode(event.target.value)} inputMode="numeric" autoComplete="username" pattern="[0-9]{8}" maxLength={8} placeholder="00000000" aria-invalid={Boolean(error)} aria-describedby={error ? "access-error" : "access-help"} className={`w-full rounded-xl border bg-slate-50 px-3 py-4 text-center text-xl font-semibold tracking-[0.22em] text-slate-900 transition placeholder:text-slate-300 sm:px-4 sm:text-2xl sm:tracking-[0.3em] ${error ? "border-red-400 ring-4 ring-red-50" : "border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50"}`} />
            {error ? <p id="access-error" role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p> : <p id="access-help" className="mt-2 text-sm text-slate-400">Somente números</p>}
            <button type="submit" disabled={loading || code.length !== 8} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{loading && <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />}{loading ? "Validando..." : "Acessar"}</button>
          </form>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4 text-center text-xs text-slate-400">Seus links são protegidos e possuem validade limitada.</div>
      </section>
    );
  }

  const groups = groupDocuments(data.documentos);

  return (
    <section className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card sm:rounded-3xl">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-7">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-600">Portal de Documentos</p>
          <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Olá, {data.descricao}</h1>
          <p className="mt-1 text-sm text-slate-500">Arquivos organizados pela data planejada.</p>
        </div>
        <button onClick={logout} className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><LogOut aria-hidden="true" size={16} /> Sair</button>
      </header>

      <div className="p-4 sm:p-8">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center sm:py-16"><FileText className="mx-auto text-slate-300" aria-hidden="true" size={40} /><h2 className="mt-4 font-semibold text-slate-700">Nenhum documento disponível</h2><p className="mt-1 text-sm text-slate-400">Novos arquivos aparecerão aqui quando forem liberados.</p></div>
        ) : (
          <div className="space-y-7">
            {groups.map(group => (
              <section key={group.key} aria-labelledby={`group-${group.key.replace(/[^a-z0-9]/gi, "-")}`}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><CalendarDays aria-hidden="true" size={20} /></span>
                  <div>
                    <h2 id={`group-${group.key.replace(/[^a-z0-9]/gi, "-")}`} className="font-bold text-slate-900">{group.dateLabel}</h2>
                    <p className="text-sm font-medium text-brand-600">{group.weekdayLabel}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{group.documents.length} PDF(s)</span>
                </div>

                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                  {group.documents.map(document => (
                    <article key={document.id} className="p-4 transition hover:bg-slate-50/80 sm:flex sm:items-center sm:gap-4 sm:p-5">
                      <a href={document.viewUrl} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg" title={`Visualizar ${document.titulo}`}>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><FileText aria-hidden="true" size={21} /></span>
                        <span className="min-w-0">
                          <span className="block break-words font-semibold text-slate-800 group-hover:text-brand-700 group-hover:underline">{document.titulo}</span>
                          <span className="mt-1 block text-xs text-slate-400">Enviado em {formatDate(document.criadoEm)}</span>
                        </span>
                      </a>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:shrink-0">
                        <a href={document.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><ExternalLink aria-hidden="true" size={15} /> Visualizar</a>
                        <a href={document.downloadUrl} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"><Download aria-hidden="true" size={15} /> Baixar</a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function groupDocuments(documents: DocumentItem[]) {
  const groups = new Map<string, DocumentItem[]>();
  for (const document of documents) {
    const key = document.dataPlanejada ?? "sem-data";
    groups.set(key, [...(groups.get(key) ?? []), document]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left === "sem-data" ? 1 : right === "sem-data" ? -1 : left.localeCompare(right))
    .map(([key, items]) => ({
      key,
      dateLabel: key === "sem-data" ? "Data não informada" : formatPlannedDate(key),
      weekdayLabel: key === "sem-data" ? "Sem planejamento" : (items[0].diaSemana ?? ""),
      documents: items.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR")),
    }));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function formatPlannedDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day, 12));
}
