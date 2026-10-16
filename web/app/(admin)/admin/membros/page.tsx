import type { Metadata } from "next";
import { Suspense } from "react";
import { ListaMembros } from "@/components/admin/ListaMembros";
import { lerConfiguracoes, lerMembros } from "@/lib/dados/admin";

export const metadata: Metadata = { title: "Membros" };

// os dados dependem da sessão (cookies), então ficam dentro do <Suspense>
async function Membros() {
  const [membros, config] = await Promise.all([lerMembros(), lerConfiguracoes()]);
  return <ListaMembros membros={membros} padrao={config.valorPadrao} />;
}

// Membros (admin-membros.html).
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <div className="ahead">
        <h1>Membros</h1>
        <p>Os nomes aparecem só aqui, para você. O site público nunca mostra quem contribui.</p>
      </div>
      <Suspense>
        <Membros />
      </Suspense>
    </main>
  );
}
