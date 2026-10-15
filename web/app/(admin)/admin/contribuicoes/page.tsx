import type { Metadata } from "next";
import { Suspense } from "react";
import { PainelContribuicoes } from "@/components/admin/PainelContribuicoes";
import { lerCampanhasAbertas, lerConfiguracoes, lerContribuicoes, lerMembros } from "@/lib/dados/admin";
import { mesAtual } from "@/lib/dominio/meses";

export const metadata: Metadata = { title: "Contribuições" };

// os dados dependem da sessão (cookies), então ficam dentro do <Suspense>
async function Contribuicoes() {
  const [membros, contribuicoes, campanhas, config] = await Promise.all([
    lerMembros(), lerContribuicoes(), lerCampanhasAbertas(), lerConfiguracoes(),
  ]);
  return (
    <PainelContribuicoes
      membros={membros}
      contribuicoes={contribuicoes}
      campanhas={campanhas}
      mesAtual={mesAtual()}
      dadosDesde={config.dadosDesde}
      padrao={config.valorPadrao}
      avisoMeses={config.avisoMeses}
    />
  );
}

// Contribuições (admin-contribuicoes.html), a tela inicial do admin.
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <Suspense>
        <Contribuicoes />
      </Suspense>
    </main>
  );
}
