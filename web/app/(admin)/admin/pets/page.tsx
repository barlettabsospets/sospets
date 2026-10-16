import type { Metadata } from "next";
import { Suspense } from "react";
import { PainelPets } from "@/components/admin/PainelPets";
import { lerConfiguracoes, lerPetsDoAdmin } from "@/lib/dados/admin";
import { mesAtual } from "@/lib/dominio/meses";

export const metadata: Metadata = { title: "Pets" };

// os dados dependem da sessão (cookies), então ficam dentro do <Suspense>
async function Pets() {
  const [pets, config] = await Promise.all([lerPetsDoAdmin(), lerConfiguracoes()]);
  return <PainelPets pets={pets} mesAtual={mesAtual()} dadosDesde={config.dadosDesde} />;
}

// Pets do admin (admin-animais.html).
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <Suspense>
        <Pets />
      </Suspense>
    </main>
  );
}
