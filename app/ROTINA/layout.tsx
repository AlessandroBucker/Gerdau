import type { Metadata } from "next";
import { RotinaShell } from "@/components/rotina-shell";

export const metadata: Metadata = {
  title: "Rotina Operacional",
  description: "Central de informações da rotina operacional.",
};

export default function RotinaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RotinaShell>{children}</RotinaShell>;
}
