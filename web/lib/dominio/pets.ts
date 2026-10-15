import { type Mes, paraMes } from "./meses";

export type SituacaoPet = "rua" | "lar" | "adotado" | "falecido";

// Datas como vêm do banco (pub_pets): "AAAA-MM-DD" ou null.
export type DatasDoPet = {
  entrou_em: string;
  lar_em: string | null;
  adotado_em: string | null;
  obito_em: string | null;
};

const ate = (data: string | null, mes: Mes) => data !== null && paraMes(data) <= mes;

// Situação de um pet no fim de um mês: falecido → adotado → lar temporário → rua;
// null se ainda não tinha entrado. Mesma regra de situacaoPet() do protótipo e de
// situacao_pet() no SQL (o teste situacao-sql.test.ts compara as duas).
export function situacaoPet(pet: DatasDoPet, mes: Mes): SituacaoPet | null {
  if (paraMes(pet.entrou_em) > mes) return null;
  if (ate(pet.obito_em, mes)) return "falecido";
  if (ate(pet.adotado_em, mes)) return "adotado";
  if (ate(pet.lar_em, mes)) return "lar";
  return "rua";
}

// Acompanhado = na rua ou em lar temporário.
export function acompanhado(pet: DatasDoPet, mes: Mes): boolean {
  const s = situacaoPet(pet, mes);
  return s === "rua" || s === "lar";
}

// Fila de castração: acompanhado e ainda não castrado naquele mês
// (como o protótipo: castrado só conta a partir do mês da castração).
export function naFilaDeCastracao(
  pet: DatasDoPet & { castrado: "sim" | "nao" | "nao_sei"; castrado_em: string | null },
  mes: Mes,
): boolean {
  if (!acompanhado(pet, mes)) return false;
  const castradoNoMes = pet.castrado === "sim" && (pet.castrado_em === null || paraMes(pet.castrado_em) <= mes);
  return !castradoNoMes;
}

// --- cartão "Pets" da Prestação de contas --------------------------------------------

export type PetDoPainel = DatasDoPet & { especie: "cachorro" | "gato"; castrado_em: string | null };

export type GrupoDePets = "castrados" | "adotados" | "lar" | "rua";

export type Contagem = { total: number; caes: number; gatos: number };

const contar = (pets: PetDoPainel[]): Contagem => {
  const caes = pets.filter((p) => p.especie === "cachorro").length;
  return { total: pets.length, caes, gatos: pets.length - caes };
};

const entre = (data: string | null, inicio: Mes, fim: Mes) =>
  data !== null && paraMes(data) >= inicio && paraMes(data) <= fim;

// Quantos pets em cada grupo, como no cartão do protótipo:
// castrados e adotados são o que aconteceu no período (de inicio a fim);
// lar temporário e rua são a situação no fim do período.
export function contarGrupo(pets: PetDoPainel[], grupo: GrupoDePets, inicio: Mes, fim: Mes): Contagem {
  switch (grupo) {
    case "castrados":
      return contar(pets.filter((p) => entre(p.castrado_em, inicio, fim)));
    case "adotados":
      return contar(pets.filter((p) => entre(p.adotado_em, inicio, fim)));
    case "lar":
    case "rua":
      return contar(pets.filter((p) => situacaoPet(p, fim) === grupo));
  }
}

// Número grande do cartão: "desde o início" = todos que já passaram pelo grupo;
// num mês = acompanhados (rua + lar) no fim dele.
export function contarTopo(pets: PetDoPainel[], desdeOInicio: boolean, fim: Mes): Contagem {
  return contar(desdeOInicio ? pets : pets.filter((p) => acompanhado(p, fim)));
}

// --- página Pets ----------------------------------------------------------------

// Quando o pet saiu da rua pela primeira vez (lar temporário ou adoção), ou null.
export function saidaDaRua(pet: DatasDoPet): Mes | null {
  const datas = [pet.lar_em, pet.adotado_em].filter((d): d is string => d !== null).map(paraMes).sort();
  return datas[0] ?? null;
}
