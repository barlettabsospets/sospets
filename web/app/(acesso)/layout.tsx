import type { Metadata, Viewport } from "next";
import { FaixaDoAmbiente, PularParaConteudo } from "@/components/layout/partes";
import { PreCarregarFontes } from "@/components/ui/PreCarregarFontes";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Entrar", template: "%s | SOS Pets DF Águas Claras" },
  robots: { index: false, follow: false },
  appleWebApp: { title: "SOS Pets" },
};

export const viewport: Viewport = { themeColor: "#FFF4E3" };

// Layout raiz do login (body.pub.admin.auth, como no login.html).
export default function LayoutAcesso({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body className="pub admin auth">
        <PreCarregarFontes />
        <PularParaConteudo />
        <FaixaDoAmbiente />
        {children}
      </body>
    </html>
  );
}
