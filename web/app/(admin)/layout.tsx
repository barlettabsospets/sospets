import type { Metadata, Viewport } from "next";
import { CabecalhoAdmin, TabbarAdmin } from "@/components/layout/CabecalhoAdmin";
import { FaixaDoAmbiente, PularParaConteudo } from "@/components/layout/partes";
import { ConviteAtalho } from "@/components/ui/ConviteAtalho";
import { PreCarregarFontes } from "@/components/ui/PreCarregarFontes";
import { ProvedorDeToast } from "@/components/ui/Toast";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Área do administrador", template: "%s | Área do administrador" },
  robots: { index: false, follow: false },
  appleWebApp: { title: "SOS Pets" },
};

export const viewport: Viewport = { themeColor: "#FFF4E3" };

// Layout raiz da área do administrador (body.pub.admin, como no protótipo).
// Só administradores chegam aqui: o proxy manda os outros para /entrar.
export default function LayoutAdmin({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body className="pub admin">
        <PreCarregarFontes />
        <ProvedorDeToast>
          <PularParaConteudo />
          <FaixaDoAmbiente />
          <CabecalhoAdmin />
          {children}
          <TabbarAdmin />
          <ConviteAtalho />
        </ProvedorDeToast>
      </body>
    </html>
  );
}
