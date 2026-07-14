"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileUp, KeyRound, LoaderCircle, LogOut, Power, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/client-response";

type AccessCode = {
  id: string; codigo: string; descricao: string; ativo: boolean; criado_em: string;
  documentos_pdf?: { count: number }[];
};

export function AdminDashboard() {
  const router = useRouter();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/codes", { cache: "no-store" });
      if (response.status === 401) return router.replace("/admin/login");
      const data = await readJsonResponse<{ codes?: AccessCode[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error);
      setCodes(data.codes ?? []);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Falha ao carregar códigos." });
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void loadCodes(); }, [loadCodes]);

  async function createCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("create"); setMessage(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api("/api/admin/codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: form.get("code"), description: form.get("description") }) });
      formElement.reset(); setMessage({ type: "ok", text: "Código criado com sucesso." }); await loadCodes();
    } catch (error) { showError(error); } finally { setBusy(""); }
  }

  async function toggle(code: AccessCode) {
    setBusy(code.id); setMessage(null);
    try { await api(`/api/admin/codes/${code.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !code.ativo }) }); await loadCodes(); }
    catch (error) { showError(error); } finally { setBusy(""); }
  }

  async function remove(code: AccessCode) {
    if (!confirm(`Excluir o código ${code.codigo} e todos os PDFs vinculados? Esta ação não pode ser desfeita.`)) return;
    setBusy(code.id); setMessage(null);
    try { await api(`/api/admin/codes/${code.id}`, { method: "DELETE" }); setMessage({ type: "ok", text: "Código e arquivos excluídos." }); await loadCodes(); }
    catch (error) { showError(error); } finally { setBusy(""); }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("upload"); setMessage(null);
    const formElement = event.currentTarget;
    try { await api("/api/admin/documents", { method: "POST", body: new FormData(formElement) }); formElement.reset(); setMessage({ type: "ok", text: "PDF enviado e vinculado com sucesso." }); await loadCodes(); }
    catch (error) { showError(error); } finally { setBusy(""); }
  }

  function showError(error: unknown) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Operação não concluída." }); }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2 text-sm font-semibold text-brand-600"><ShieldCheck size={18} /> Área administrativa</div><h1 className="mt-1 text-3xl font-bold text-slate-900">Controle de documentos</h1></div>
        <button onClick={logout} className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-800"><LogOut size={16} /> Sair</button>
      </header>
      {message && <div role="status" className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}

      <div className="grid gap-7 xl:grid-cols-[1.55fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><KeyRound className="text-brand-600" size={20} /> Códigos de acesso</h2><p className="mt-1 text-sm text-slate-500">Crie e controle quem pode acessar documentos.</p></div><button onClick={() => void loadCodes()} aria-label="Atualizar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><RefreshCw size={18} /></button></div>
          <form onSubmit={createCode} className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-[150px_1fr_auto]">
            <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Aleatório" aria-label="Código opcional" className="rounded-xl border border-slate-200 bg-white px-4 py-3" />
            <input required name="description" maxLength={200} placeholder="Descrição / destinatário" aria-label="Descrição" className="rounded-xl border border-slate-200 bg-white px-4 py-3" />
            <button disabled={busy === "create"} className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">Gerar código</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Código</th><th className="px-5 py-3">Descrição</th><th className="px-5 py-3">Criação</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400"><LoaderCircle className="mx-auto animate-spin" /></td></tr> : codes.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Nenhum código cadastrado.</td></tr> : codes.map(code => <tr key={code.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-mono text-lg font-bold tracking-wider text-slate-800">{code.codigo}</td><td className="px-5 py-4"><div className="font-medium text-slate-700">{code.descricao}</div><div className="text-xs text-slate-400">{code.documentos_pdf?.[0]?.count ?? 0} PDF(s)</div></td><td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{new Date(code.criado_em).toLocaleDateString("pt-BR")}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${code.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{code.ativo ? "Ativo" : "Inativo"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button disabled={busy === code.id} onClick={() => void toggle(code)} title={code.ativo ? "Desativar" : "Ativar"} className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40"><Power size={17} /></button><button disabled={busy === code.id} onClick={() => void remove(code)} title="Excluir" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 size={17} /></button></div></td></tr>)}</tbody></table>
          </div>
        </section>

        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileUp className="text-brand-600" size={20} /> Upload de PDF</h2><p className="mt-1 text-sm leading-6 text-slate-500">Envie um PDF de até 50 MB e vincule-o a um código ativo.</p>
          <form onSubmit={upload} className="mt-6 space-y-5"><label className="block text-sm font-semibold text-slate-700">Código de acesso<select required name="codeId" defaultValue="" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><option value="" disabled>Selecione um código</option>{codes.filter(code => code.ativo).map(code => <option key={code.id} value={code.id}>{code.codigo} — {code.descricao}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Arquivo PDF<input required name="file" type="file" accept="application/pdf,.pdf" className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700" /></label><button disabled={busy === "upload" || !codes.some(code => code.ativo)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{busy === "upload" && <LoaderCircle className="animate-spin" size={18} />} Enviar PDF</button></form>
        </section>
      </div>
    </div>
  );
}

async function api(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const data = await readJsonResponse<{ error?: string }>(response);
  if (!response.ok) throw new Error(data.error ?? "Operação não concluída.");
  return data;
}
