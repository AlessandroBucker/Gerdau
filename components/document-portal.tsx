"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { CalendarDays, Download, Eye, FileText, LoaderCircle, LockKeyhole, LogOut } from "lucide-react";
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
type WeekGroup = { key: string; start: string; end: string; label: string; documents: DocumentItem[] };

export function DocumentPortal() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<AccessData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const weeks = useMemo(() => groupDocumentsByWeek(data?.documentos ?? []), [data]);
  const activeWeek = weeks.find((week) => week.key === selectedWeek) ?? weeks[0];
  const selectedDocument = activeWeek?.documents.find((document) => document.id === selectedDocumentId)
    ?? activeWeek?.documents[0];

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
      const availableWeeks = groupDocumentsByWeek(payload.documentos);
      setData(payload);
      setSelectedWeek(availableWeeks[0]?.key ?? "");
      setSelectedDocumentId(availableWeeks[0]?.documents[0]?.id ?? "");
      setCode("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível validar o Número Pessoal.");
    } finally {
      setLoading(false);
    }
  }

  function changeWeek(key: string) {
    const week = weeks.find((item) => item.key === key);
    setSelectedWeek(key);
    setSelectedDocumentId(week?.documents[0]?.id ?? "");
  }

  function logout() {
    setData(null);
    setCode("");
    setError("");
    setSelectedWeek("");
    setSelectedDocumentId("");
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
            <input ref={inputRef} id="access-code" value={code} onChange={(event) => updateCode(event.target.value)} inputMode="numeric" autoComplete="username" pattern="[0-9]{8}" maxLength={8} placeholder="00000000" aria-invalid={Boolean(error)} className={`w-full rounded-xl border bg-slate-50 px-3 py-4 text-center text-xl font-semibold tracking-[0.22em] text-slate-900 transition placeholder:text-slate-300 sm:text-2xl ${error ? "border-red-400 ring-4 ring-red-50" : "border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50"}`} />
            {error ? <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p> : <p className="mt-2 text-sm text-slate-400">Somente números</p>}
            <button type="submit" disabled={loading || code.length !== 8} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{loading && <LoaderCircle className="animate-spin" size={18} />}{loading ? "Validando..." : "Acessar"}</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card sm:rounded-3xl">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-7">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-600">Portal de Documentos</p>
          <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Olá, {data.descricao}</h1>
          <p className="mt-1 text-sm text-slate-500">Consulte sua programação de segunda a sábado.</p>
        </div>
        <button onClick={logout} className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><LogOut size={16} /> Sair</button>
      </header>

      <div className="p-4 sm:p-7">
        {weeks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center"><FileText className="mx-auto text-slate-300" size={40} /><h2 className="mt-4 font-semibold text-slate-700">Nenhum documento disponível</h2></div>
        ) : (
          <>
            <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <label htmlFor="week-selector" className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><CalendarDays className="text-brand-600" size={18} /> Semana da programação</label>
              <select id="week-selector" value={activeWeek?.key ?? ""} onChange={(event) => changeWeek(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:max-w-md">
                {weeks.map((week) => <option key={week.key} value={week.key}>{week.label} — {week.documents.length} PDF(s)</option>)}
              </select>
            </div>

            <div className="grid min-h-[620px] gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                <div className="border-b border-slate-200 bg-white px-4 py-3">
                  <h2 className="font-bold text-slate-900">Ordens da semana</h2>
                  <p className="text-xs text-slate-500">Selecione um arquivo para visualizar.</p>
                </div>
                <div className="max-h-[360px] space-y-2 overflow-y-auto p-2 lg:max-h-[690px]">
                  {activeWeek?.documents.map((document) => {
                    const active = document.id === selectedDocument?.id;
                    return (
                      <button key={document.id} type="button" onClick={() => setSelectedDocumentId(document.id)} className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-brand-300 bg-brand-50 shadow-sm" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}>
                        <span className="flex items-start gap-2.5">
                          <FileText className={active ? "mt-0.5 shrink-0 text-brand-600" : "mt-0.5 shrink-0 text-red-500"} size={18} />
                          <span className="min-w-0">
                            <span className="block break-words text-sm font-semibold text-slate-800">{document.titulo}</span>
                            <span className="mt-1 block text-xs text-slate-500">{document.dataPlanejada ? `${formatPlannedDate(document.dataPlanejada)} · ${document.diaSemana ?? ""}` : "Sem data planejada"}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <main className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {selectedDocument ? (
                  <div className="flex h-full min-h-[620px] flex-col">
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0"><h2 className="break-words font-bold text-slate-900">{selectedDocument.titulo}</h2><p className="text-xs text-slate-500">Planejado: {selectedDocument.dataPlanejada ? formatPlannedDate(selectedDocument.dataPlanejada) : "não informado"}</p></div>
                      <div className="flex shrink-0 gap-2">
                        <a href={selectedDocument.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Eye size={15} /> Nova aba</a>
                        <a href={selectedDocument.downloadUrl} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"><Download size={15} /> Baixar</a>
                      </div>
                    </div>
                    <iframe key={selectedDocument.id} src={selectedDocument.viewUrl} title={`Visualização de ${selectedDocument.titulo}`} className="h-[70vh] min-h-[560px] w-full flex-1 bg-white" />
                  </div>
                ) : null}
              </main>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function groupDocumentsByWeek(documents: DocumentItem[]): WeekGroup[] {
  const groups = new Map<string, DocumentItem[]>();
  for (const document of documents) {
    if (!document.dataPlanejada) continue;
    const start = mondayOf(document.dataPlanejada);
    groups.set(start, [...(groups.get(start) ?? []), document]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([start, items]) => {
      const end = addDays(start, 5);
      return {
        key: start,
        start,
        end,
        label: `${formatPlannedDate(start)} a ${formatPlannedDate(end)} (segunda a sábado)`,
        documents: items
          .filter((document) => document.dataPlanejada && document.dataPlanejada <= end)
          .sort((a, b) => (a.dataPlanejada ?? "").localeCompare(b.dataPlanejada ?? "") || a.titulo.localeCompare(b.titulo, "pt-BR")),
      };
    })
    .filter((week) => week.documents.length > 0);
}

function mondayOf(value: string) {
  const date = parseLocalDate(value);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return toIsoDate(date);
}

function addDays(value: string, amount: number) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatPlannedDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(parseLocalDate(value));
}
