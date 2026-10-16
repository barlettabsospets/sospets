import type { Metadata } from "next";
import { Suspense } from "react";
import { PainelDespesas } from "@/components/admin/PainelDespesas";
import {
  lerCampanhasDoAdmin, lerCategorias, lerConfiguracoes, lerDespesasDoAdmin, lerPetsParaEscolha,
} from "@/lib/dados/admin";
import { mesAtual } from "@/lib/dominio/meses";

export const metadata: Metadata = { title: "Despesas" };

// os dados dependem da sessão (cookies), então ficam dentro do <Suspense>
async function Despesas() {
  const [despesas, categorias, pets, campanhas, config] = await Promise.all([
    lerDespesasDoAdmin(), lerCategorias(), lerPetsParaEscolha(), lerCampanhasDoAdmin(), lerConfiguracoes(),
  ]);
  return (
    <PainelDespesas
      despesas={despesas}
      categorias={categorias}
      pets={pets}
      campanhas={campanhas}
      mesAtual={mesAtual()}
      dadosDesde={config.dadosDesde}
    />
  );
}

// Despesas do admin (admin-despesas.html).
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <Suspense>
        <Despesas />
      </Suspense>
    </main>
  );
}
