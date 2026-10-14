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
