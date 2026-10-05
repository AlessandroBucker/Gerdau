export const oilQualities = ["Pendente", "Normal", "Atenção", "Crítico"] as const;

export function quarterlyDate(iso: string, quarters = 1): string {
  if (!validDate(iso)) throw new Error("Data de referência inválida.");
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + quarters * 3, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function nextQuarterlyCollection(items: OilCollection[]): string | null {
  const dates = items.map(item => item.data_planejada || item.data_coleta).filter((value): value is string => !!value).sort();
  return dates.length ? quarterlyDate(dates[dates.length - 1]) : null;
}
export type OilCollection = {
  id: string;
  oleo_id: string;
  data_coleta: string | null;
  descricao: string;
  local: string;
  plano: string;
  tipo_oleo: string;
  tag?: string;
  ponto?: string;
  tipo_equipamento?: string;
  volume_reservatorio?: number | null;
  data_planejada: string | null;
  coletado: boolean;
  enviado: boolean;
  qualidade: typeof oilQualities[number];
  acao: string;
  ordem: string;
  data_analise: string | null;
};

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseOilCollection(body: Record<string, unknown>): Omit<OilCollection, "id" | "oleo_id"> {
  const clean = (key: string) => typeof body[key] === "string" ? (body[key] as string).trim() : "";
  const descricao = clean("descricao");
  const local = clean("local"), plano = clean("plano"), tipo_oleo = clean("tipo_oleo"), ordem = clean("ordem"), acao = clean("acao");
  if (!local || !plano || !tipo_oleo) throw new Error("Informe o local, o plano de manutenção e o tipo de óleo.");
  if ([descricao, local, plano, tipo_oleo, ordem].some(value => value.length > 200) || acao.length > 4000) throw new Error("Os campos excedem o tamanho permitido.");
  if (body.data_planejada && !validDate(body.data_planejada)) throw new Error("Informe uma data planejada válida.");
  if (typeof body.coletado !== "boolean" || typeof body.enviado !== "boolean") throw new Error("Status da coleta inválido.");
  if (!oilQualities.includes(body.qualidade as OilCollection["qualidade"])) throw new Error("Qualidade inválida.");
  if (body.enviado && !body.coletado) throw new Error("Marque a coleta como realizada antes do envio.");
  const qualidade = body.qualidade as OilCollection["qualidade"];
  const data_analise = clean("data_analise") || null;
  const data_coleta = clean("data_coleta") || null;
  if (data_coleta && !validDate(data_coleta)) throw new Error("Data da coleta inválida.");
  if (body.coletado && !data_coleta) throw new Error("Informe a data em que a coleta foi realizada.");
  if (!body.coletado && data_coleta) throw new Error("Marque Coletado para informar a data da coleta.");
  if (data_analise && !validDate(data_analise)) throw new Error("Data da análise inválida.");
  if (qualidade !== "Pendente" && (!body.enviado || !ordem || !data_analise)) throw new Error("Para concluir a análise, informe o envio, a ordem de manutenção e a data da análise.");
  if (qualidade === "Pendente" && data_analise) throw new Error("Selecione a qualidade do óleo para registrar a data da análise.");
  return { descricao, local, plano, tipo_oleo, ordem, acao, data_coleta, data_planejada: typeof body.data_planejada === "string" && body.data_planejada ? body.data_planejada : null, coletado: body.coletado, enviado: body.enviado, qualidade, data_analise };
}

export function oilPeriods(items: OilCollection[]) {
  const performed = items.filter(i => i.coletado).sort((a, b) => (b.data_coleta || "").localeCompare(a.data_coleta || "") || b.id.localeCompare(a.id));
  const upcoming = items.filter(i => !i.coletado).sort((a, b) => (a.data_planejada || "9999").localeCompare(b.data_planejada || "9999") || a.id.localeCompare(b.id));
  return { current: performed[0], previous: performed[1], next: upcoming[0], performed, upcoming };
}
