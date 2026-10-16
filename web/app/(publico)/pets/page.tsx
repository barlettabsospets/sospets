import type { Metadata } from "next";
import { CatalogoPets } from "@/components/publico/CatalogoPets";
import { lerCampanhas, lerDadosDesde, lerMesAtual, lerPets } from "@/lib/dados/publico";
import { paraMes } from "@/lib/dominio/meses";

export const metadata: Metadata = {
  title: "Pets",
  description: "Os pets acompanhados pelo SOS Pets DF Águas Claras: na rua, em lar temporário, adotados e na fila de castração.",
};

// Pets (animais.html). Dados de pub_pets e pub_campanhas, com cache de 5 minutos.
export default async function Pets() {
  const [pets, campanhas, mesAtual, dadosDesde] = await Promise.all([lerPets(), lerCampanhas(), lerMesAtual(), lerDadosDesde()]);
  return (
    <CatalogoPets
      pets={pets}
      campanhas={campanhas}
      mesAtual={mesAtual}
      dadosDesde={dadosDesde ? paraMes(dadosDesde) : mesAtual}
    />
  );
}
