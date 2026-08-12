"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileDown, ImagePlus, LoaderCircle, LockKeyhole, PackageCheck, Pencil, Plus, Printer, X } from "lucide-react";
import { DataLoading } from "@/components/data-loading";

type Conjunto = { id?: string; ordem: string; equipamento: string; observacao: string; padrinho: string; recebimentoCentral: string; recebimentoArea: string; necessidade: string; status: string; prioridade?: string; comentarioCentral?: string };

const initialConjuntos: Conjunto[] = [
  { ordem: "80523201", equipamento: "L1 - Reforma da alonga", observacao: "Eixo cisalhado necessário comprar novo (alonga par está de reserva na L1)", padrinho: "Daniel", recebimentoCentral: "02/06/2026", recebimentoArea: "Rotina reformas 2 Sem", necessidade: "05/07/2026", status: "" },
  { ordem: "80514423", equipamento: "Reforma redutor PR2, PR3 e PR4 (reserva 1)", observacao: "Fazer furação em todas as ranhuras do flange do eixo de saída", padrinho: "Ricardo", recebimentoCentral: "10/04/2026", recebimentoArea: "10/04/2026", necessidade: "12/06/2026", status: "" },
  { ordem: "80514423", equipamento: "Reforma redutor PR2, PR3 e PR4 (reserva 2)", observacao: "Fazer furação em todas as ranhuras do flange do eixo de saída", padrinho: "Ricardo", recebimentoCentral: "10/04/2026", recebimentoArea: "10/04/2026", necessidade: "03/09/2026", status: "" },
  { ordem: "80528051", equipamento: "Eixo Spindle 1", observacao: "", padrinho: "José", recebimentoCentral: "03/06/2026", recebimentoArea: "07/05/2026", necessidade: "03/07/2026", status: "Andamento" },
  { ordem: "80528051", equipamento: "Eixo Spindle 2", observacao: "", padrinho: "José", recebimentoCentral: "03/06/2026", recebimentoArea: "07/05/2026", necessidade: "03/08/2026", status: "" },
  { ordem: "80548886", equipamento: "Braço reserva PR's 2, 3 e 4", observacao: "Deixar pino da articulação e pino terminal cilindro com ajuste deslizante, trocar todas buchas de desgaste, remover rolo do eixo e enviar para Metais Ribeiro recuperar", padrinho: "Ricardo", recebimentoCentral: "10/04/2026", recebimentoArea: "07/05/2026", necessidade: "12/06/2026", status: "" },
  { ordem: "80526353", equipamento: "Braço reserva dos impulsionadores e do PR1", observacao: "Deixar pino da articulação e pino terminal cilindro com ajuste deslizante; trocar todas buchas de desgaste, confeccionar calços conforme amostra que está junto ao braço a ser reformado, remover rolo do eixo e enviar para Metais Ribeiro recuperar", padrinho: "Ricardo", recebimentoCentral: "10/04/2026", recebimentoArea: "07/05/2026", necessidade: "12/06/2026", status: "" },
  { ordem: "80508100", equipamento: "Redutor da grelha", observacao: "Está há cerca de 2 anos na central; o conjunto atende L1 e L2, saiu da L1, mas deve estar em boas condições", padrinho: "José", recebimentoCentral: "02/07/2024", recebimentoArea: "16/10/2025", necessidade: "03/08/2026", status: "" },
  { ordem: "80529606", equipamento: "Redutor das calhas tombadoras (1)", observacao: "Devido à falta de M.O., a Laminação 1 enviou para reforma externa em fornecedor parceiro", padrinho: "José", recebimentoCentral: "01/06/2026", recebimentoArea: "07/05/2026", necessidade: "12/06/2026", status: "Fornecedor externo" },
  { ordem: "80529606", equipamento: "Redutor das calhas tombadoras (2)", observacao: "Trocar acoplamento para o padrão novo fornecido pela área (acoplamento de cardã)", padrinho: "José", recebimentoCentral: "01/06/2026", recebimentoArea: "07/05/2026", necessidade: "30/06/2026", status: "" },
  { ordem: "80529606", equipamento: "Redutor das calhas tombadoras (3)", observacao: "Trocar acoplamento para o padrão novo fornecido pela área (acoplamento de cardã)", padrinho: "José", recebimentoCentral: "", recebimentoArea: "03/06/2026", necessidade: "15/07/2026", status: "" },
  { ordem: "80529606", equipamento: "Redutor das calhas tombadoras (4)", observacao: "Trocar acoplamento para o padrão novo fornecido pela área (acoplamento de cardã)", padrinho: "José", recebimentoCentral: "", recebimentoArea: "03/06/2026", necessidade: "03/08/2026", status: "" },
  { ordem: "80559216", equipamento: "L1 - Reforma do par de prendedores", observacao: "Reformar o par de prendedores", padrinho: "Vinícius", recebimentoCentral: "-", recebimentoArea: "23/06/2026", necessidade: "03/07/2026", status: "Andamento" },
  { ordem: "80559213", equipamento: "L1 - Reforma do par alonga", observacao: "Será entregue na Manutenção Central até dia 06/07/2026", padrinho: "Daniel", recebimentoCentral: "Será enviado", recebimentoArea: "01/08/2026", necessidade: "17/07/2026", status: "" },
  { ordem: "80559216", equipamento: "L1 - Reforma do par de prendedores", observacao: "Será entregue na manutenção após troca em área dos que estão em reforma atualmente", padrinho: "Vinícius", recebimentoCentral: "Será enviado", recebimentoArea: "23/07/2026", necessidade: "15/08/2026", status: "" },
  { ordem: "80562227", equipamento: "L1 - Montar acoplamento no rolo-perfilado da calha tombadora e inspeção de rolamento", observacao: "Está na Manutenção Central", padrinho: "", recebimentoCentral: "", recebimentoArea: "23/07/2026", necessidade: "10/08/2026", status: "" },
  { ordem: "80562229", equipamento: "L1 - Montar acoplamento no rolo-liso da calha tombadora e inspeção de rolamento", observacao: "Está na Manutenção Central", padrinho: "", recebimentoCentral: "", recebimentoArea: "23/07/2026", necessidade: "10/08/2026", status: "" },
];

function valueOrDash(value: string) {
  return value || <span className="text-slate-300">—</span>;
}

export default function ConjuntosReservasPage() {
  const [conjuntos, setConjuntos] = useState(initialConjuntos);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [images, setImages] = useState<Record<number, string[]>>({});
  const [authAction, setAuthAction] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Conjunto | null | "new">(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/rotina/sets", { cache: "no-store" }).then(response => response.json()).then(data => { if (data.sets?.length) setConjuntos(data.sets); }).finally(() => setLoading(false)); }, []);

  function requestAccess(action: "add" | "edit") {
    if (action === "edit" && selectedIndex === null) return;
    setAuthError("");
    setAuthAction(action);
  }

  async function openDetails(index: number) {
    setSelectedIndex(index);
    setViewingIndex(index);
    const id = conjuntos[index].id;
    if (id) { const data = await fetch(`/api/rotina/sets/${id}/images`, { cache: "no-store" }).then(response => response.json()); if (data.images) setImages(current => ({ ...current, [index]: data.images.map((image: { url: string }) => image.url) })); }
  }

  async function addImages(files: FileList | null) {
    if (viewingIndex === null || !files?.length) return;
    const id = conjuntos[viewingIndex].id;
    if (!id) { alert("Salve este conjunto no banco antes de adicionar imagens."); return; }
    const upload = new FormData(); Array.from(files).forEach(file => upload.append("images", file));
    const response = await fetch(`/api/rotina/sets/${id}/images`, { method: "POST", body: upload }); const result = await response.json(); if (!response.ok) { alert(result.error || "Não foi possível enviar as imagens."); return; }
    const data = await fetch(`/api/rotina/sets/${id}/images`, { cache: "no-store" }).then(value => value.json()); if (data.images) setImages(current => ({ ...current, [viewingIndex]: data.images.map((image: { url: string }) => image.url) }));
  }

  function editFromDetails() {
    setViewingIndex(null);
    requestAccess("edit");
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Usuário ou senha inválidos.");
      const action = authAction;
      setAuthAction(null);
      setEditing(action === "edit" && selectedIndex !== null ? conjuntos[selectedIndex] : "new");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Não foi possível validar o acesso.");
    } finally { setAuthLoading(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item: Conjunto = { prioridade: String(form.get("prioridade")), equipamento: String(form.get("equipamento")), observacao: String(form.get("observacao")), padrinho: String(form.get("padrinho")), recebimentoCentral: String(form.get("recebimentoCentral")), recebimentoArea: String(form.get("recebimentoArea")), necessidade: String(form.get("necessidade")), status: String(form.get("status")), comentarioCentral: String(form.get("comentarioCentral")), ordem: String(form.get("ordem")) };
    const existing = editing !== "new" ? editing : null;
    const response = await fetch(existing?.id ? `/api/rotina/sets/${existing.id}` : "/api/rotina/sets", { method: existing?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    const data = await response.json(); if (!response.ok) { alert(data.error || "Não foi possível salvar o conjunto."); return; }
    const savedId = existing?.id ?? data.set?.id;
    const files = form.getAll("imagens").filter((value): value is File => value instanceof File && value.size > 0);
    if (savedId && files.length) { const upload = new FormData(); files.forEach(file => upload.append("images", file)); const imageResponse = await fetch(`/api/rotina/sets/${savedId}/images`, { method: "POST", body: upload }); if (!imageResponse.ok) { const error = await imageResponse.json(); alert(error.error || "Conjunto salvo, mas as imagens não foram enviadas."); } }
    const refreshed = await fetch("/api/rotina/sets", { cache: "no-store" }).then(result => result.json()); if (refreshed.sets) setConjuntos(refreshed.sets);
    setEditing(null);
  }

  return (
    <div className="print-table-page">
      <header className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><PackageCheck size={24} /></span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Conjuntos reservas</h1>
      </header>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="table-toolbar flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
          <div><h1 className="text-sm font-bold text-slate-900">Controle de reformas</h1><p className="text-[11px] text-slate-500">{conjuntos.length} conjuntos cadastrados</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => requestAccess("add")} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700"><Plus size={15} /> Incluir conjunto</button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><FileDown size={15} /> Imprimir tabela em PDF</button>
          </div>
        </div>

        {loading ? <DataLoading label="Carregando conjuntos reservas..." compact /> : <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-[10px] 2xl:text-[11px]">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-[16%] break-normal px-3 py-2">Prioridade do conjunto</th>
                <th className="w-[42%] break-normal px-3 py-2">Equipamentos e descrição breve</th>
                <th className="w-[18%] break-normal px-3 py-2">Data de necessidade da área</th>
                <th className="w-[14%] break-normal px-3 py-2">Status</th>
                <th className="w-[10%] whitespace-nowrap px-3 py-2">Ordem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conjuntos.map((item, index) => (
                <tr key={`${item.ordem}-${index}`} onClick={() => void openDetails(index)} className={`cursor-pointer align-top transition ${selectedIndex === index ? "bg-brand-50 ring-1 ring-inset ring-brand-200" : "hover:bg-slate-50/80"}`}>
                  <td className="break-normal px-3 py-2 text-center text-slate-500">{valueOrDash(item.prioridade ?? "")}</td>
                  <td className="break-words px-3 py-2 font-semibold leading-4 text-slate-800">{item.equipamento}</td>
                  <td className="break-words px-3 py-2 font-semibold text-slate-700">{valueOrDash(item.necessidade)}</td>
                  <td className="break-words px-3 py-2">{item.status ? <span className={`inline-flex max-w-full break-words rounded px-1.5 py-0.5 text-[9px] font-bold uppercase leading-3 ${item.status === "Andamento" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{item.status}</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono font-bold text-brand-700">{item.ordem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </section>
      {viewingIndex !== null && conjuntos[viewingIndex] && <ConjuntoDetails item={conjuntos[viewingIndex]} images={images[viewingIndex] ?? []} onAddImages={(files) => void addImages(files)} onEdit={editFromDetails} onClose={() => setViewingIndex(null)} />}
      {authAction && <Modal title="Acesso restrito" onClose={() => setAuthAction(null)} icon={<LockKeyhole size={20} />}><p className="mb-4 text-sm text-slate-500">Informe as credenciais administrativas para continuar.</p><form onSubmit={authenticate} className="space-y-3"><Field label="Usuário" name="username" /><Field label="Senha" name="password" type="password" />{authError && <p className="text-sm font-semibold text-red-600">{authError}</p>}<button disabled={authLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white">{authLoading && <LoaderCircle className="animate-spin" size={17} />}Continuar</button></form></Modal>}
      {editing && <ConjuntoForm item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSubmit={save} />}
    </div>
  );
}

function ConjuntoDetails({ item, images, onAddImages, onEdit, onClose }: { item: Conjunto; images: string[]; onAddImages: (files: FileList | null) => void; onEdit: () => void; onClose: () => void }) {
  const details = [
    ["Prioridade do conjunto", item.prioridade], ["Ordem", item.ordem], ["Equipamento e descrição", item.equipamento],
    ["Observação da área para reforma", item.observacao], ["Padrinho da Laminação", item.padrinho],
    ["Recebimento na Manutenção Central", item.recebimentoCentral], ["Recebimento do serviço da área", item.recebimentoArea],
    ["Data de necessidade da área", item.necessidade], ["Status", item.status], ["Comentário da Manutenção Central", item.comentarioCentral],
  ];
  function printDetails() { const previous = document.title; document.title = `Conjunto_${item.ordem}_${item.equipamento}`.replace(/[^a-zA-Z0-9_-]+/g, "_"); window.addEventListener("afterprint", () => { document.title = previous; }, { once: true }); window.print(); }
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true"><div className="conjunto-detail-print mx-auto min-h-full max-w-5xl rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center gap-3 rounded-t-2xl border-b border-slate-200 bg-white px-5 py-4 sm:px-7"><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Detalhes do conjunto</p><h2 className="text-xl font-bold text-slate-900">{item.equipamento}</h2></div><div className="conjunto-print-controls flex gap-2"><button onClick={printDetails} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Printer size={16} /> Imprimir</button><button onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"><Pencil size={16} /> Editar dados</button><button onClick={onClose} className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><X size={21} /></button></div></div><div className="p-5 sm:p-7"><section className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="bg-white p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{value || "—"}</p></div>)}</section><section className="mt-7"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">Imagens do conjunto</h3><p className="text-sm text-slate-500">Registros visuais do equipamento e da reforma.</p></div><label className="conjunto-print-controls inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100"><ImagePlus size={18} /> Adicionar imagem<input type="file" accept="image/*" multiple className="hidden" onChange={event => { onAddImages(event.target.files); event.target.value = ""; }} /></label></div>{images.length ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{images.map((source, index) => <div key={`${source}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><img src={source} alt={`Imagem ${index + 1} do conjunto`} className="h-52 w-full object-cover" /></div>)}</div> : <div className="grid min-h-44 place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center"><div><ImagePlus className="mx-auto text-slate-300" size={30} /><p className="mt-2 text-sm font-semibold text-slate-500">Nenhuma imagem adicionada</p></div></div>}</section></div></div></div>;
}

function ConjuntoForm({ item, onClose, onSubmit }: { item: Conjunto | null; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [previews, setPreviews] = useState<string[]>([]);
  return <Modal title={item ? "Editar conjunto" : "Incluir conjunto"} onClose={onClose} icon={item ? <Pencil size={19} /> : <Plus size={20} />}><form onSubmit={onSubmit} className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Prioridade<select name="prioridade" defaultValue={item?.prioridade ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"><option value="">Selecione</option>{["24h", "1 semana", "2 semanas", "1 mês", "2 meses", "6 meses", "1 ano"].map(option => <option key={option} value={option}>{option}</option>)}</select></label><Field label="Ordem" name="ordem" defaultValue={item?.ordem} /><div className="sm:col-span-2"><Field label="Equipamento e descrição" name="equipamento" defaultValue={item?.equipamento} /></div><div className="sm:col-span-2"><Field label="Observação da área" name="observacao" defaultValue={item?.observacao} required={false} /></div><Field label="Padrinho da Laminação" name="padrinho" defaultValue={item?.padrinho} required={false} /><label className="block text-sm font-semibold text-slate-700">Status<select name="status" defaultValue={item?.status ?? "Nova solicitação"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">{["Nova solicitação", "Programar", "Programado", "Em andamento", "Concluído"].map(option => <option key={option} value={option}>{option}</option>)}</select></label><Field label="Recebimento na Man. Central" name="recebimentoCentral" defaultValue={item?.recebimentoCentral} required={false} /><Field label="Recebimento do serviço da área" name="recebimentoArea" defaultValue={item?.recebimentoArea} required={false} /><Field label="Necessidade da área" name="necessidade" defaultValue={item?.necessidade} required={false} /><div className="sm:col-span-2"><Field label="Comentário da Manutenção Central" name="comentarioCentral" defaultValue={item?.comentarioCentral} required={false} /></div><div className="sm:col-span-2"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-bold text-brand-700 hover:bg-brand-50"><ImagePlus size={19} /> Adicionar fotos ou imagens<input name="imagens" type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={event => { setPreviews(Array.from(event.target.files ?? []).map(file => URL.createObjectURL(file))); }} /></label>{previews.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{previews.map((source, index) => <img key={source} src={source} alt={`Pré-visualização ${index + 1}`} className="h-24 w-full rounded-lg border border-slate-200 object-cover" />)}</div>}<p className="mt-2 text-xs text-slate-400">JPG, PNG ou WebP. Máximo de 10 MB por imagem.</p></div><div className="flex gap-2 sm:col-span-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600">Cancelar</button><button className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white">Salvar</button></div></form></Modal>;
}

function Modal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span><h2 className="flex-1 text-xl font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div>{children}</div></div>;
}

function Field({ label, name, type = "text", defaultValue, required = true }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input name={name} type={type} required={required} defaultValue={defaultValue} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>;
}
