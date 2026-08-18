"use client";

import { ChevronLeft, ChevronRight, CirclePlus, PackageOpen, Pencil, Plus, Search, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Stage = "nome" | "disponivel_area" | "necessario_reparo" | "recuperacao";
type SpareSet = { id: number; nome: string; ordem: string; area: string; responsavel: string; prioridade: string; stage: Stage; quantidade?: number };

const stages: { id: Stage; title: string; color: string; dot: string }[] = [
  { id: "nome", title: "Nome do conjunto", color: "border-slate-300", dot: "bg-slate-400" },
  { id: "disponivel_area", title: "Conjunto disponível e área", color: "border-emerald-300", dot: "bg-emerald-500" },
  { id: "necessario_reparo", title: "Necessário reparo", color: "border-amber-300", dot: "bg-amber-500" },
  { id: "recuperacao", title: "Em recuperação", color: "border-blue-300", dot: "bg-blue-500" },
];

const initialSetTypes: SpareSet[] = [
  { id: 1, nome: "L1 - Reforma da alonga", ordem: "80523201", area: "LPP", responsavel: "Daniel", prioridade: "Alta", stage: "necessario_reparo" },
  { id: 2, nome: "Reforma redutor PR2, PR3 e PR4", ordem: "80514423", area: "LPP", responsavel: "Ricardo", prioridade: "Alta", stage: "recuperacao" },
  { id: 3, nome: "Eixo Spindle - Reserva na área", ordem: "80528051", area: "Área", responsavel: "José", prioridade: "Média", stage: "disponivel_area" },
  { id: 4, nome: "Eixo Spindle - Reserva em reparo", ordem: "80528051", area: "Oficina Mecânica", responsavel: "José", prioridade: "Média", stage: "necessario_reparo" },
  { id: 5, nome: "Braço reserva PRs 2, 3 e 4", ordem: "80548886", area: "LPP", responsavel: "Ricardo", prioridade: "Alta", stage: "necessario_reparo" },
  { id: 6, nome: "Braço reserva dos impulsionadores e PR1", ordem: "80526353", area: "LPP", responsavel: "Ricardo", prioridade: "Alta", stage: "necessario_reparo" },
  { id: 7, nome: "Redutor da grelha", ordem: "80508100", area: "LPP", responsavel: "José", prioridade: "Alta", stage: "disponivel_area" },
  { id: 8, nome: "Par de prendedores", ordem: "80559216", area: "LPP", responsavel: "Vinícius", prioridade: "Alta", stage: "recuperacao" },
  { id: 9, nome: "Cilindro de acionamento com rótulas, pinos e buchas montados", ordem: "", area: "Desbaste 1 - Mesa basculante", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 10, nome: "Cilindro contrapeso/amortecimento com rótulas, pinos e buchas montados", ordem: "", area: "Desbaste 1 - Mesa basculante", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 11, nome: "CJ rolo pequeno entrada 1º passe montado e lubrificado", ordem: "", area: "Desbaste 1 - Mesa basculante", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 12, nome: "CJ rolo grande com motor na base e lubrificado", ordem: "", area: "Desbaste 1 - Mesa basculante", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 13, nome: "CJ rolo grande c/pescoço e motor na base, lubrificado", ordem: "", area: "Desbaste 1 - Mesa basculante", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 14, nome: "Pino de cisalhamento reserva com buchas e anéis elásticos", ordem: "", area: "Desbaste 1 - Gaiola trio", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 8 },
  { id: 15, nome: "Eixo spindle recuperado", ordem: "", area: "Desbaste 1 - Gaiola trio", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 16, nome: "Cardã de acionamento dos rolos", ordem: "SAP 14400826", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 2 },
  { id: 17, nome: "Motoredutor reserva montado com óleo e acoplamento", ordem: "", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 4 },
  { id: 18, nome: "Rolo liso montado com acoplamento, mancais lubrificados e mangueira de relubrificação no mancal LOA", ordem: "", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 19, nome: "Cilindro de elevação da soleira", ordem: "Código 10356633", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 20, nome: "Cilindro de translação da soleira", ordem: "Código 10351065", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 21, nome: "Mangueira de levantamento da soleira", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 4 },
  { id: 22, nome: "Bomba hidráulica central do forno", ordem: "Código 10300800", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 23, nome: "Mangueira da bomba central hidráulica do forno", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 24, nome: "Conjunto rolo refrigerado", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 25, nome: "Conjunto rolo enfornamento", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 26, nome: "Cilindro do bebeto", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 27, nome: "Mangueira hidráulica dos cilindros bebeto com engates rápidos", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 2 },
  { id: 28, nome: "Cilindro pneumático da porta de enfornamento", ordem: "Código 10356690", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 29, nome: "Cilindro pneumático das portas de desenfornamento", ordem: "Código 10301582", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 30, nome: "Cilindro pneumático da válvula de tiragem forçada", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 31, nome: "Pino de fixação do cilindro da calha do primeiro passe", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 32, nome: "Conexão para o cilindro da soleira", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 2 },
  { id: 42, nome: "Mangueira de translação da soleira", ordem: "", area: "1M - Forno/Desb", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 2 },
  { id: 33, nome: "Rolo com perfil 2º passe com acoplamento montado, mancais lubrificados e mangueira de relubrificação no mancal LOA", ordem: "", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 34, nome: "Rolo com perfil 4º passe com acoplamento montado, mancais lubrificados e mangueira de relubrificação no mancal LOA", ordem: "", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 35, nome: "Rolo com perfis 2º e 4º montado com motor acoplado, mancais lubrificados e mangueira de relubrificação no mancal LOA", ordem: "", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 36, nome: "Rolete louco comprido da calha do 3º passe montado e lubrificado", ordem: "", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 37, nome: "Rolete louco curto da calha do 1º passe montado e lubrificado", ordem: "", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 38, nome: "Cilindro pneumático 12 polegadas reserva para as calhas do 1º, 2º e 5º passe com terminal da haste montado", ordem: "", area: "Desbaste 1 - Calhas tombadoras", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 39, nome: "Corrente montada com cachorrinhos, pino e cupilha para montagem", ordem: "", area: "Desbaste 1 - Transferidor de correntes", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 3 },
  { id: 40, nome: "Corrente cortada no comprimento para acionamento principal do transferidor de correntes", ordem: "", area: "Desbaste 1 - Transferidor de correntes", responsavel: "", prioridade: "Média", stage: "nome" },
  { id: 41, nome: "Conjunto esticador montado", ordem: "", area: "Desbaste 1 - Transferidor de correntes", responsavel: "", prioridade: "Média", stage: "nome", quantidade: 3 },
];

const initialItems: SpareSet[] = initialSetTypes.flatMap(({ id: _, quantidade = 1, ...item }, groupIndex) =>
  Array.from({ length: quantidade }, (_, unitIndex) => ({
    ...item,
    id: (groupIndex + 1) * 100 + unitIndex,
    quantidade: 1,
    nome: quantidade > 1 ? `${item.nome} (${unitIndex + 1}/${quantidade})` : item.nome,
    stage: "disponivel_area",
  })),
);

const emptyItem: Omit<SpareSet, "id"> = { nome: "", ordem: "", area: "", responsavel: "", prioridade: "Média", stage: "nome" };

export default function ConjuntosSobressalentesPage() {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<SpareSet | null>(null);
  const [creating, setCreating] = useState(false);
  const filtered = useMemo(() => items.filter(item => `${item.nome} ${item.ordem} ${item.area} ${item.responsavel}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const catalogItems = useMemo(() => Array.from(new Map(filtered.map(item => {
    const nome = item.nome.replace(/ \(\d+\/\d+\)$/, "");
    return [nome, { ...item, nome }];
  })).values()), [filtered]);

  function move(item: SpareSet, direction: -1 | 1) {
    const current = stages.findIndex(stage => stage.id === item.stage);
    const target = stages[current + direction];
    if (target) setItems(value => value.map(entry => entry.id === item.id ? { ...entry, stage: target.id } : entry));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = { nome: String(data.get("nome")), ordem: String(data.get("ordem")), area: String(data.get("area")), responsavel: String(data.get("responsavel")), prioridade: String(data.get("prioridade")), stage: String(data.get("stage")) as Stage };
    if (editing) setItems(items => items.map(item => item.id === editing.id ? { ...item, ...value } : item));
    else setItems(items => [...items, { id: Date.now(), ...value }]);
    setEditing(null); setCreating(false);
  }

  return <div>
    <header className="mb-5 flex flex-wrap items-center gap-3">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><PackageOpen size={24} /></span>
      <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Controle de conjuntos</p><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Conjuntos Sobressalentes</h1></div>
      <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700"><Plus size={18} /> Incluir conjunto</button>
    </header>

    <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Search size={18} className="text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por conjunto, ordem, área ou responsável..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none" />
    </div>

    <section className="overflow-x-auto pb-3">
      <div className="grid min-w-[1100px] grid-cols-4 gap-3">
        {stages.map(stage => <div key={stage.id} className={`rounded-xl border-t-4 ${stage.color} bg-slate-100 px-3 py-3`}><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} /><h2 className="flex-1 text-sm font-extrabold uppercase tracking-wide text-slate-700">{stage.title}</h2><span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">{stage.id === "nome" ? catalogItems.length : filtered.filter(item => item.stage === stage.id).length}</span></div></div>)}
        {catalogItems.map(catalogItem => {
          const setItems = filtered.filter(item => item.nome.replace(/ \(\d+\/\d+\)$/, "") === catalogItem.nome);
          return <div key={catalogItem.nome} className="contents">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="font-bold leading-5 text-slate-900">{catalogItem.nome}</h3><div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold"><span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{catalogItem.area}</span><span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">{stages.find(stage => stage.id === catalogItem.stage)?.title}</span></div></article>
            {stages.slice(1).map((stage, index) => <div key={stage.id} className={`min-h-24 rounded-xl border-t-4 ${stage.color} bg-slate-100 p-3`}><div className="space-y-2">{setItems.filter(item => item.stage === stage.id).map(item => <article key={item.id} className="relative rounded-xl border border-slate-200 bg-white px-8 py-3 shadow-sm"><button disabled={index === 0} onClick={() => move(item, -1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 disabled:invisible" title="Etapa anterior"><ChevronLeft size={14} /></button><h3 className="text-sm font-bold leading-4 text-slate-900">{item.nome}</h3><p className="mt-1 font-mono text-[11px] font-bold text-brand-700">{item.ordem || "Sem ordem"}</p><button disabled={index === stages.length - 2} onClick={() => move(item, 1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 disabled:invisible" title="Próxima etapa"><ChevronRight size={14} /></button></article>)}</div></div>)}
          </div>;
        })}
      </div>
    </section>
    {(creating || editing) && <SetDialog item={editing} onClose={() => { setCreating(false); setEditing(null); }} onSave={save} />}
  </div>;
}

function SetDialog({ item, onClose, onSave }: { item: SpareSet | null; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  const value = item ?? emptyItem;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><CirclePlus size={20} /></span><h2 className="flex-1 text-xl font-bold text-slate-900">{item ? "Editar conjunto" : "Incluir conjunto"}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div>
    <form onSubmit={onSave} className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Nome do conjunto" name="nome" value={value.nome} /><Field label="Ordem" name="ordem" value={value.ordem} />
      <Field label="Área" name="area" value={value.area} /><Field label="Responsável" name="responsavel" value={value.responsavel} />
      <Select label="Prioridade" name="prioridade" value={value.prioridade} options={["Baixa", "Média", "Alta"]} />
      <Select label="Etapa" name="stage" value={value.stage} options={stages.map(stage => stage.id)} labels={stages.map(stage => stage.title)} />
      <div className="flex gap-2 sm:col-span-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600">Cancelar</button><button className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white">Salvar</button></div>
    </form>
  </div></div>;
}

function Field({ label, name, value }: { label: string; name: string; value: string }) { return <label className="text-sm font-bold text-slate-700">{label}<input required name={name} defaultValue={value} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>; }
function Select({ label, name, value, options, labels = options }: { label: string; name: string; value: string; options: string[]; labels?: string[] }) { return <label className="text-sm font-bold text-slate-700">{label}<select name={name} defaultValue={value} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-brand-500">{options.map((option, index) => <option key={option} value={option}>{labels[index]}</option>)}</select></label>; }
