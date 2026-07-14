"use client";

import { FormEvent, useRef, useState } from "react";
import { Download, ExternalLink, FileText, LoaderCircle, LockKeyhole, LogOut } from "lucide-react";
import { readJsonResponse } from "@/lib/client-response";

type DocumentItem = {
  id: string;
  titulo: string;
  criadoEm: string;
  viewUrl: string;
  downloadUrl: string;
};

type AccessData = {
  descricao: string;
  documentos: DocumentItem[];
};

export function DocumentPortal() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<AccessData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Digite os 6 dígitos do seu código de acesso.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await readJsonResponse<AccessData & { error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível validar o código.");
      }

      setData(payload);
      setCode("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível validar o código.");
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
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
        <div className="p-7 sm:p-10">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <LockKeyhole aria-hidden="true" size={24} />
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">Área segura</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Acesse seus documentos</h1>
          <p className="mt-3 leading-7 text-slate-500">Informe o código de 6 dígitos recebido para consultar os PDFs disponíveis.</p>

          <form className="mt-8" onSubmit={submit} noValidate>
            <label htmlFor="access-code" className="mb-2 block text-sm font-semibold text-slate-700">Código de acesso</label>
            <input
              ref={inputRef}
              id="access-code"
              name="access-code"
              value={code}
              onChange={(event) => updateCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "access-error" : "access-help"}
              className={`w-full rounded-xl border bg-slate-50 px-4 py-4 text-center text-2xl font-semibold tracking-[0.35em] text-slate-900 transition placeholder:text-slate-300 ${error ? "border-red-400 ring-4 ring-red-50" : "border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50"}`}
            />
            {error ? (
              <p id="access-error" role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p>
            ) : (
              <p id="access-help" className="mt-2 text-sm text-slate-400">Somente números</p>
            )}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />}
              {loading ? "Validando..." : "Acessar"}
            </button>
          </form>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/80 px-7 py-4 text-center text-xs text-slate-400">Seus links são protegidos e possuem validade limitada.</div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
      <header className="flex flex-col gap-5 border-b border-slate-100 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">
        <div>
          <p className="text-sm font-semibold text-brand-600">Portal de Documentos</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Olá, {data.descricao}</h1>
          <p className="mt-1 text-sm text-slate-500">Estes são os arquivos disponíveis para você.</p>
        </div>
        <button onClick={logout} className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
          <LogOut aria-hidden="true" size={16} /> Sair
        </button>
      </header>

      <div className="p-4 sm:p-8">
        {data.documentos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
            <FileText className="mx-auto text-slate-300" aria-hidden="true" size={40} />
            <h2 className="mt-4 font-semibold text-slate-700">Nenhum documento disponível</h2>
            <p className="mt-1 text-sm text-slate-400">Novos arquivos aparecerão aqui quando forem liberados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Nome do arquivo</th>
                  <th className="px-5 py-4 font-semibold">Data de upload</th>
                  <th className="px-5 py-4 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.documentos.map((document) => (
                  <tr key={document.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><FileText aria-hidden="true" size={20} /></span>
                        <span className="font-semibold text-slate-800">{document.titulo}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{formatDate(document.criadoEm)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <a href={document.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><ExternalLink aria-hidden="true" size={15} /> Visualizar</a>
                        <a href={document.downloadUrl} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"><Download aria-hidden="true" size={15} /> Baixar</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
