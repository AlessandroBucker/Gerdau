import { TreinamentosDashboard } from "@/components/treinamentos-dashboard";
import { TrainingDataProvider } from "@/components/training-data-provider";

export default function TreinamentosPage() {
  return <TrainingDataProvider><TreinamentosDashboard /></TrainingDataProvider>;
}
