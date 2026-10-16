import type { Metadata } from "next";
import Link from "next/link";
import { PreCarregarFontes } from "@/components/ui/PreCarregarFontes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Página não encontrada | SOS Pets DF Águas Claras",
};

// 404 para endereços que não existem (o app tem um layout raiz por área, então este é global).
export default function PaginaNaoEncontrada() {
  return (
    <html lang="pt-BR">
      <body className="pub">
        <PreCarregarFontes />
        <main id="main" className="wrap tp">
          <header className="tp-head">
            <div>
              <h1>Página não encontrada</h1>
              <p className="sub">
                Este endereço não existe. <Link href="/">Voltar para a prestação de contas</Link>
              </p>
            </div>
          </header>
        </main>
      </body>
    </html>
  );
}
