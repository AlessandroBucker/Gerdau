import { OilCollection, quarterlyDate } from "./oil-analysis";
import simulationBase from "./oil-simulation-base.json";
import register from "./oil-register.json";

export function simulateOilCollections(source: OilCollection[]): OilCollection[] {
  const reference = source.length ? source : simulationBase as OilCollection[];
  const oils = [...new Map(reference.map(item => [item.oleo_id, item])).values()];
  const qualities: OilCollection["qualidade"][] = ["Normal", "Atenção", "Normal", "Crítico", "Pendente"];
  const actions = { Normal: "Manter acompanhamento", Atenção: "Programar nova análise", Crítico: "Avaliar troca do óleo", Pendente: "Aguardar resultado" };
  return oils.flatMap((oil, index) => [-2, -1, 0, 1].map(period => {
    const quality = qualities[(index + period + 5) % qualities.length];
    const future = period === 1;
    const referenceDate = `2026-09-${String(1 + index % 8).padStart(2, "0")}`;
    const planned = quarterlyDate(referenceDate, period);
    const sent = !future && !(period === 0 && index % 5 === 4 && index % 2 === 0);
    const result = future || !sent ? "Pendente" : quality;
    return {
      ...oil, ...register.find(entry => entry.plano === oil.plano), id: `sim-${oil.oleo_id}-${period}`, oleo_id: `sim-${oil.oleo_id}`,
      data_planejada: planned, data_coleta: future ? null : planned,
      coletado: !future, enviado: sent, qualidade: result,
      data_analise: result === "Pendente" ? null : planned,
      ordem: future ? "" : `SIM-${80000 + index * 10 + period + 2}`,
      acao: future ? "" : !sent ? "Enviar amostra" : actions[result],
    };
  }));
}
