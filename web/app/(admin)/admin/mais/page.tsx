import type { Metadata } from "next";
import { Suspense } from "react";
import { PainelMais } from "@/components/admin/PainelMais";
import { Dica } from "@/components/ui/Dica";
import { lerCategorias, lerConfiguracoes, lerHistorico } from "@/lib/dados/admin";
import { lerCampanhas } from "@/lib/dados/publico";

export const metadata: Metadata = { title: "Mais" };

// os dados dependem da sessão (cookies), então ficam dentro do <Suspense>
async function Mais() {
  const [categorias, campanhas, config, historico] = await Promise.all([
    lerCategorias(), lerCampanhas(), lerConfiguracoes(), lerHistorico(1),
  ]);
  return (
    <PainelMais
      categorias={categorias}
      campanhas={campanhas}
      dataDesde={config.dataDesde}
      avisoMeses={config.avisoMeses}
      historico={historico}
    />
  );
}

// Mais (admin-mais.html).
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <div className="ahead">
        <div className="com-dica">
          <h1>Mais</h1>
          <Dica sobre="a página Mais">Exportar dados, categorias de despesa, campanhas, configurações e o histórico de alterações.</Dica>
        </div>
      </div>
      <Suspense>
        <Mais />
      </Suspense>
    </main>
  );
}
