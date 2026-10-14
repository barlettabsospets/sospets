import type { Metadata, Viewport } from "next";
import { CabecalhoAdmin, TabbarAdmin } from "@/components/layout/CabecalhoAdmin";
import { FaixaDoAmbiente, PularParaConteudo } from "@/components/layout/partes";
import { PreCarregarFontes } from "@/components/ui/PreCarregarFontes";
import { ProvedorDeToast } from "@/components/ui/Toast";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Área do administrador", template: "%s | Área do administrador" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#FFF4E3" };

// Layout raiz da área do administrador (body.pub.admin, como no protótipo).
// TODO(T3.2): o proxy manda para /entrar quem não tiver sessão.
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
        </ProvedorDeToast>
      </body>
    </html>
  );
}
