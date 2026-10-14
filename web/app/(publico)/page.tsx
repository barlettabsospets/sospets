import { PainelPrestacao } from "@/components/publico/PainelPrestacao";
import {
  lerCampanhas, lerDespesas, lerGastosPorCategoria, lerMesAtual, lerPets, lerResumoMensal,
} from "@/lib/dados/publico";

// Prestação de contas (index.html). Os dados vêm das views pub_*, com cache de 5 minutos.
export default async function PrestacaoDeContas() {
  const [mesAtual, resumo, gastos, ultimas, pets, campanhas] = await Promise.all([
    lerMesAtual(),
    lerResumoMensal(),
    lerGastosPorCategoria(),
    lerDespesas(5),
    lerPets(),
    lerCampanhas(),
  ]);

  return (
    <PainelPrestacao
      dados={{
        mesAtual,
        resumo,
        gastos,
        ultimas,
        // o cartão só precisa das datas e da espécie
        pets: pets.map(({ especie, entrou_em, lar_em, adotado_em, obito_em, castrado_em }) => ({
          especie, entrou_em, lar_em, adotado_em, obito_em, castrado_em,
        })),
        campanhas,
      }}
    />
  );
}
