"use client";
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { OilCollection, oilPeriods } from "@/lib/oil-analysis";

const date = (value: string | null) => value ? value.split("-").reverse().join("/") : "A definir";
function OilHistory({ items, onClose, onEdit }: { items: OilCollection[]; onClose: () => void; onEdit: (item: OilCollection) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const { current, performed, upcoming } = oilPeriods(items);
  const sorted = [...performed, ...upcoming.slice().sort((a, b) => (b.data_planejada || "").localeCompare(a.data_planejada || ""))];
  const oil = items[0];
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="oil-history-title" className="w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-950/50">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4"><div><h2 id="oil-history-title" className="text-lg font-bold">Histórico de coletas</h2><p className="mt-1 text-sm">{oil.descricao}</p><p className="mt-1 text-xs text-slate-500">{oil.local} · Plano {oil.plano}</p><p className="mt-2 text-xs text-slate-500">{items.length} coletas · Realizadas da mais recente à mais antiga; planejadas ao final.</p></div><button type="button" autoFocus aria-label="Fechar histórico" onClick={() => dialog.current?.close()} className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
    <div className="space-y-3 p-4">{sorted.map(item => <article key={item.id} className={`rounded-xl border p-4 ${item.id === current?.id ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-white"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-slate-900">{item.coletado ? `Coleta de ${item.data_coleta ? date(item.data_coleta) : "data não informada"}` : `Planejada para ${date(item.data_planejada)}`}<span className="ml-2 text-xs font-normal text-slate-500">{item.id === current?.id ? "Última realizada" : item.coletado ? "Coleta anterior" : "Próxima coleta"}</span></h3><button type="button" aria-label={`Editar coleta de ${date(item.data_coleta || item.data_planejada)}`} className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => onEdit(item)}><Pencil size={13} />Editar</button></div>
      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">{[["Data planejada", date(item.data_planejada)], ["Data da coleta", item.data_coleta ? date(item.data_coleta) : "Não realizada"], ["Ordem de manutenção", item.ordem || "Não informada"], ["Data da análise", item.data_analise ? date(item.data_analise) : "Não informada"], ["Coletado", item.coletado ? "Sim" : "Pendente"], ["Enviado", item.enviado ? "Sim" : "Pendente"]].map(([label,value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}<div><dt className="mb-1 text-slate-500">Qualidade do óleo</dt><dd><Quality item={item} /></dd></div></dl>
      <p className="mt-3 whitespace-pre-wrap break-words border-t border-slate-200 pt-2 text-xs"><strong>Ação: </strong>{item.acao || "Não definida"}</p>
    </article>)}</div>
  </dialog>;
}
function OilDetails({ item, onClose }: { item: OilCollection; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="oil-details-title" className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-950/50">
    <div className="flex items-center justify-between gap-4"><h2 id="oil-details-title" className="font-bold text-slate-900">Identificação do óleo</h2><button type="button" autoFocus aria-label="Fechar detalhes" onClick={() => dialog.current?.close()} className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
    <dl className="mt-4 space-y-4 text-sm">{[["Descrição item de manutenção", item.descricao], ["TAG", item.tag || ""], ["Tipo de óleo", item.tipo_oleo], ["Ponto", item.ponto || ""], ["Tipo do equipamento", item.tipo_equipamento || ""], ["Volume do reservatório", item.volume_reservatorio == null ? "" : item.volume_reservatorio.toLocaleString("pt-BR")], ["Local de instalação", item.local], ["Plano de manutenção da coleta", item.plano]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium text-slate-900">{value || "Não informado"}</dd></div>)}</dl>
  </dialog>;
}
function Quality({ item }: { item?: OilCollection }) {
  if (!item) return <>—</>;
  const colors = { Pendente: "bg-slate-100 text-slate-600", Normal: "bg-emerald-100 text-emerald-800", Atenção: "bg-amber-100 text-amber-800", Crítico: "bg-red-100 text-red-800" };
  return <span className={`rounded-full px-2 py-1 ${colors[item.qualidade]}`}>{item.qualidade}</span>;
}
function Stage({ item }: { item?: OilCollection }) {
  if (!item) return <span className="text-slate-500">Não realizada</span>;
  const label = item.qualidade !== "Pendente" ? "Analisada" : item.enviado ? "Enviada · aguardando análise" : item.coletado ? "Coletada · aguardando envio" : "Planejada";
  const color = item.qualidade !== "Pendente" ? "bg-emerald-100 text-emerald-800" : item.enviado ? "bg-blue-100 text-blue-800" : item.coletado ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600";
  return <div className="flex flex-wrap items-center gap-1.5"><span className={`rounded-full px-2 py-1 ${color}`}>{label}</span><span className="whitespace-nowrap text-[10px] text-slate-500" title="Data planejada">{date(item.data_planejada)}</span></div>;
}
export function OilPeriodTable({ groups, onEdit, onNew }: { groups: OilCollection[][]; onEdit: (item: OilCollection) => void; onNew: (item: OilCollection) => void }) {
  const [details, setDetails] = useState<OilCollection | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const historyGroup = groups.find(group => group[0].oleo_id === historyId);
  return <>
    <div className="overflow-x-auto"><table className="oil-period-table w-full text-left"><thead>
      <tr className="text-center"><th rowSpan={2}>Nova coleta</th><th colSpan={2} scope="colgroup" className="bg-slate-100">Identificação do óleo</th><th colSpan={1} scope="colgroup" className="border-l border-slate-300 bg-slate-200">Coleta anterior</th><th colSpan={3} scope="colgroup" className="border-l border-blue-200 bg-blue-100 text-blue-900">Coleta atual · última realizada</th><th scope="colgroup" className="border-l border-emerald-200 bg-emerald-100 text-emerald-900">Próxima coleta</th></tr>
      <tr className="bg-slate-50">{["Descrição item de manutenção", "Tipo de óleo", "Qualidade do óleo", "Etapa da coleta", "Qualidade do óleo", "Ação", "Data planejada"].map((label, i) => <th scope="col" key={i} className={[2,3,6].includes(i) ? "border-l border-slate-300" : ""}>{label}</th>)}</tr>
    </thead><tbody className="divide-y divide-slate-100">{groups.map(group => {
      const item = group[0]; const { current, previous, next } = oilPeriods(group);
      return <tr key={item.oleo_id} className="hover:bg-slate-50">
        <td><div className="flex items-center gap-2"><button title="Adicionar coleta ao histórico deste óleo" aria-label={`Nova coleta de ${item.descricao}`} onClick={() => onNew(item)}><Plus size={15} /></button></div></td>
        <td title={item.descricao}><button type="button" onClick={() => setDetails(item)} className="text-left text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-600">{item.descricao || "Não informada"}</button></td><td>{item.tipo_oleo}</td>
        <td className="border-l border-slate-200"><Quality item={previous} /></td>
        <td className="border-l border-blue-200"><Stage item={current} /></td><td><Quality item={current} /></td><td title={current?.acao}>{current?.acao || "—"}</td>
        <td className="border-l border-emerald-200"><button className="text-brand-700 underline" title={next ? "Editar próxima coleta" : "Planejar próxima coleta"} onClick={() => next ? onEdit(next) : onNew(item)}>{next ? date(next.data_planejada) : "Planejar"}</button></td>

      </tr>;
    })}{!groups.length && <tr><td colSpan={8} className="text-center">Nenhum óleo corresponde ao filtro selecionado.</td></tr>}</tbody></table></div>
    {details && <OilDetails item={details} onClose={() => setDetails(null)} />}
    {historyGroup && <OilHistory items={historyGroup} onClose={() => setHistoryId(null)} onEdit={item => { setHistoryId(null); onEdit(item); }} />}
  </>;
}
