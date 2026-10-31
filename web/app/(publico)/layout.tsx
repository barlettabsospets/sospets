import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { CabecalhoPublico } from "@/components/layout/CabecalhoPublico";
import { FaixaDoAmbiente, PularParaConteudo } from "@/components/layout/partes";
import { RodapePublico } from "@/components/layout/RodapePublico";
import { ConviteAtalho } from "@/components/ui/ConviteAtalho";
import { PreCarregarFontes } from "@/components/ui/PreCarregarFontes";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Prestação de contas | SOS Pets DF Águas Claras",
    template: "%s | SOS Pets DF Águas Claras",
  },
  description: "Quanto o SOS Pets DF Águas Claras arrecadou, gastou e quantos pets ajudou, mês a mês.",
  // nome embaixo do ícone na tela inicial do iPhone
  appleWebApp: { title: "SOS Pets" },
};

export const viewport: Viewport = { themeColor: "#FFF4E3" };

// Layout raiz das páginas públicas (body.pub, como no protótipo).
export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body className="pub">
        <PreCarregarFontes />
        <PularParaConteudo />
        <FaixaDoAmbiente />
        <CabecalhoPublico />
        {children}
        <RodapePublico />
        <ConviteAtalho />
        {/* indicador 5 (visitantes): Vercel Web Analytics, sem cookies nem dados pessoais; só nas páginas públicas */}
        <Analytics />
      </body>
    </html>
  );
}
