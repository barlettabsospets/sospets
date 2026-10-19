import type { Metadata } from "next";
import { Suspense } from "react";
import { ListaCampanhas } from "@/components/admin/ListaCampanhas";
import { Dica } from "@/components/ui/Dica";
import { lerCampanhasDoAdmin } from "@/lib/dados/admin";

export const metadata: Metadata = { title: "Campanhas" };

// os dados dependem da sessão (cookies), então ficam dentro do <Suspense>
async function Campanhas() {
  return <ListaCampanhas campanhas={await lerCampanhasDoAdmin()} />;
}

// Campanhas (admin-campanhas.html).
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <div className="ahead">
        <div className="com-dica">
          <h1>Campanhas</h1>
          <Dica sobre="a página Campanhas">Arrecadações para um caso específico, como a do Stuart ou do Nelson. Doações e despesas podem ser ligadas a uma campanha, e o site mostra só os totais.</Dica>
        </div>
      </div>
      <Suspense>
        <Campanhas />
      </Suspense>
    </main>
  );
}
