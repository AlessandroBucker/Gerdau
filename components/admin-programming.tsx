"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Download, Eye, FileText, LoaderCircle, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/client-response";

type Person = { id: string; numero_pessoal: string; descricao: string; ativo: boolean };
type DocumentItem = { id: string; titulo: string; dataPlanejada: string | null; diaSemana: string | null; criadoEm: string; viewUrl: string; downloadUrl: string };
type AccessData = { id: string; numeroPessoal: string; descricao: string; documentos: DocumentItem[] };
type WeekGroup = { key: string; label: string; documents: DocumentItem[] };

export function AdminProgramming() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [data, setData] = useState<AccessData | null>(null);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [error, setError] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");

  const weeks = useMemo(() => groupDocumentsByWeek(data?.documentos ?? []), [data]);
  const activeWeek = weeks.find(week => week.key === selectedWeek) ?? weeks[0];
  const selectedDocument = activeWeek?.documents.find(document => document.id === selectedDocumentId) ?? activeWeek?.documents[0];

  const loadProgramming = useCallback(async (personId: string) => {
    if (!personId) { setData(null); return; }
    setLoadingDocuments(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/programacao?codeId=${encodeURIComponent(personId)}`, { cache: "no-store" });
      if (response.status === 401) return router.replace("/admin/login");
      const payload = await readJsonResponse<AccessData & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar a programação.");
      const availableWeeks = groupDocumentsByWeek(payload.documentos);
      setData(payload);
      setSelectedWeek(availableWeeks[0]?.key ?? "");
      setSelectedDocumentId(availableWeeks[0]?.documents[0]?.id ?? "");
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a programação.");
    } finally {
      setLoadingDocuments(false);
    }
  }, [router]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/codes", { cache: "no-store" });
        if (response.status === 401) return router.replace("/admin/login");
        const payload = await readJsonResponse<{ codes?: Person[]; error?: string }>(response);
        if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar as pessoas.");
        const loadedPeople = payload.codes ?? [];
        setPeople(loadedPeople);
        if (loadedPeople[0]) {
          setSelectedPersonId(loadedPeople[0].id);
          await loadProgramming(loadedPeople[0].id);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as pessoas.");
      } finally {
        setLoadingPeople(false);
      }
    })();
  }, [loadProgramming, router]);

  function changePerson(personId: string) {
    setSelectedPersonId(personId);
    void loadProgramming(personId);
  }

  function changeWeek(key: string) {
    const week = weeks.find(item => item.key === key);
    setSelectedWeek(key);
    setSelectedDocumentId(week?.documents[0]?.id ?? "");
  }

  return (
    <section className="mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card sm:rounded-3xl">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-9 sm:py-7">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-600">Portal de Documentos · Administração</p>
          <label htmlFor="person-selector" className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Users className="text-brand-600" size={18} /> Visualizar programação de</label>
          <select id="person-selector" disabled={loadingPeople || people.length === 0} value={selectedPersonId} onChange={event => changePerson(event.target.value)} className="mt-2 w-full max-w-xl rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:opacity-60">
            {loadingPeople ? <option>Carregando pessoas...</option> : people.length === 0 ? <option>Nenhuma pessoa cadastrada</option> : people.map(person => <option key={person.id} value={person.id}>{person.descricao} — {person.numero_pessoal}{person.ativo ? "" : " (inativo)"}</option>)}
          </select>
          {data && <p className="mt-2 text-sm text-slate-500">Consulte a programação de {data.descricao} de segunda a sábado.</p>}
        </div>
        <Link href="/admin" className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><ArrowLeft size={16} /> Voltar ao Admin</Link>
      </header>

      <div className="p-4 sm:p-7">
        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {loadingDocuments ? (
          <div className="px-6 py-24 text-center text-slate-400"><LoaderCircle className="mx-auto animate-spin" size={32} /><p className="mt-3">Carregando programação...</p></div>
        ) : !data ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center"><Users className="mx-auto text-slate-300" size={40} /><h2 className="mt-4 font-semibold text-slate-700">Selecione uma pessoa</h2></div>
        ) : weeks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center"><FileText className="mx-auto text-slate-300" size={40} /><h2 className="mt-4 font-semibold text-slate-700">Nenhum documento disponível</h2></div>
        ) : (
          <>
            <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <label htmlFor="week-selector" className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><CalendarDays className="text-brand-600" size={18} /> Semana da programação</label>
              <select id="week-selector" value={activeWeek?.key ?? ""} onChange={event => changeWeek(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:max-w-md">
                {weeks.map(week => <option key={week.key} value={week.key}>{week.label} — {week.documents.length} PDF(s)</option>)}
              </select>
            </div>
            <div className="grid min-h-[620px] gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                <div className="border-b border-slate-200 bg-white px-4 py-3"><h2 className="font-bold text-slate-900">Ordens da semana</h2><p className="text-xs text-slate-500">Selecione um arquivo para visualizar.</p></div>
                <div className="max-h-[360px] space-y-2 overflow-y-auto p-2 lg:max-h-[690px]">
                  {activeWeek?.documents.map(document => {
                    const active = document.id === selectedDocument?.id;
                    return <button key={document.id} type="button" onClick={() => setSelectedDocumentId(document.id)} className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-brand-300 bg-brand-50 shadow-sm" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}><span className="flex items-start gap-2.5"><FileText className={active ? "mt-0.5 shrink-0 text-brand-600" : "mt-0.5 shrink-0 text-red-500"} size={18} /><span className="min-w-0"><span className="block break-words text-sm font-semibold text-slate-800">{document.titulo}</span><span className="mt-1 block text-xs text-slate-500">{document.dataPlanejada ? `${formatPlannedDate(document.dataPlanejada)} · ${document.diaSemana ?? ""}` : "Sem data planejada"}</span></span></span></button>;
                  })}
                </div>
              </aside>
              <main className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {selectedDocument && <div className="flex h-full min-h-[620px] flex-col"><div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="break-words font-bold text-slate-900">{selectedDocument.titulo}</h2><p className="text-xs text-slate-500">Planejado: {selectedDocument.dataPlanejada ? formatPlannedDate(selectedDocument.dataPlanejada) : "não informado"}</p></div><div className="flex shrink-0 gap-2"><a href={selectedDocument.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Eye size={15} /> Nova aba</a><a href={selectedDocument.downloadUrl} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"><Download size={15} /> Baixar</a></div></div><iframe key={selectedDocument.id} src={selectedDocument.viewUrl} title={`Visualização de ${selectedDocument.titulo}`} className="h-[70vh] min-h-[560px] w-full flex-1 bg-white" /></div>}
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
  return [...groups.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([start, items]) => {
    const end = addDays(start, 5);
    return { key: start, label: `${formatPlannedDate(start)} a ${formatPlannedDate(end)} (segunda a sábado)`, documents: items.filter(document => document.dataPlanejada && document.dataPlanejada <= end).sort((a, b) => (a.dataPlanejada ?? "").localeCompare(b.dataPlanejada ?? "") || a.titulo.localeCompare(b.titulo, "pt-BR")) };
  }).filter(week => week.documents.length > 0);
}

function mondayOf(value: string) { const date = parseLocalDate(value); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); return toIsoDate(date); }
function addDays(value: string, amount: number) { const date = parseLocalDate(value); date.setDate(date.getDate() + amount); return toIsoDate(date); }
function parseLocalDate(value: string) { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day, 12); }
function toIsoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatPlannedDate(value: string) { return new Intl.DateTimeFormat("pt-BR").format(parseLocalDate(value)); }
