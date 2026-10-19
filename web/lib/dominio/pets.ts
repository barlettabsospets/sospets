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

// --- tela Pets do admin (admin-animais.html) ------------------------------------

type PetComSaude = DatasDoPet & { castrado: "sim" | "nao" | "nao_sei"; castrado_em: string | null };

// Castrado naquele mês (castrado só conta a partir do mês da castração, como no protótipo).
export function castradoNoMes(pet: PetComSaude, mes: Mes): boolean {
  return pet.castrado === "sim" && (pet.castrado_em === null || paraMes(pet.castrado_em) <= mes);
}

// Filtros da lista: as situações, a fila de castração e os dois que vêm de "Precisa de atenção".
export type FiltroDoAdmin = SituacaoPet | "fila" | "precisa" | "nec";

export function passaNoFiltro(
  pet: PetComSaude & { precisa_lar: boolean; necessidade: string | null },
  filtro: FiltroDoAdmin,
  mes: Mes,
): boolean {
  const s = situacaoPet(pet, mes);
  switch (filtro) {
    case "fila":
      return naFilaDeCastracao(pet, mes);
    case "precisa":
      return s === "rua" && pet.precisa_lar;
    case "nec":
      return !!pet.necessidade && (s === "rua" || s === "lar");
    default:
      return s === filtro;
  }
}

// Como a lista se apresenta com cada filtro: "3 pets que precisam de lar temporário".
export const ROTULO_DO_FILTRO: Record<FiltroDoAdmin, [singular: string, plural: string]> = {
  rua: ["pet na rua", "pets na rua"],
  lar: ["pet em lar temporário", "pets em lar temporário"],
  adotado: ["pet adotado", "pets adotados"],
  falecido: ["pet falecido", "pets falecidos"],
  fila: ["pet na fila de castração", "pets na fila de castração"],
  precisa: ["pet que precisa de lar temporário", "pets que precisam de lar temporário"],
  nec: ["pet com alguma necessidade agora", "pets com alguma necessidade agora"],
};

// "há 3 meses", como tempo() do protótipo.
export const tempoDesde = (meses: number) => (meses <= 0 ? "desde este mês" : meses === 1 ? "há 1 mês" : `há ${meses} meses`);

type DatasDaSituacao = Pick<DatasDoPet, "lar_em" | "adotado_em" | "obito_em">;

// A situação escolhida no formulário vira datas: guarda a data do passo atual ("desde", dia 1)
// e limpa os passos que não valem mais. Na rua: sem lar, adoção nem óbito; em lar: sem adoção nem óbito;
// adotado: sem óbito (o lar temporário de antes continua); falecido: só ganha a data do óbito.
export function datasDaSituacao(situacao: SituacaoPet, desde: string, atuais: DatasDaSituacao): DatasDaSituacao {
  switch (situacao) {
    case "rua":
      return { lar_em: null, adotado_em: null, obito_em: null };
    case "lar":
      return { lar_em: desde, adotado_em: null, obito_em: null };
    case "adotado":
      return { lar_em: atuais.lar_em, adotado_em: desde, obito_em: null };
    case "falecido":
      return { ...atuais, obito_em: desde };
  }
}

// Data do passo atual, para o campo "Desde" ao abrir a edição (null na rua).
export function desdeDaSituacao(pet: DatasDoPet, situacao: SituacaoPet): string | null {
  return { rua: null, lar: pet.lar_em, adotado: pet.adotado_em, falecido: pet.obito_em }[situacao];
}

// "Castrado?" no formulário: ao marcar "Sim" pela primeira vez, a castração conta a partir do mês atual;
// se já era castrado, a data que existe continua.
export function dataDaCastracao(castrado: "sim" | "nao" | "nao_sei", atual: string | null, eraCastrado: boolean, mesAtual: Mes): string | null {
  if (castrado !== "sim") return null;
  return eraCastrado ? atual : `${mesAtual}-01`;
}

// Link do WhatsApp para o telefone do adotante: com DDD (10 ou 11 dígitos) ganha o 55 do Brasil;
// já com o 55 (12 ou 13 dígitos) fica como está. Outro formato: sem link.
export function linkDoWhatsApp(telefone: string | null): string | null {
  const d = (telefone ?? "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `https://wa.me/55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return `https://wa.me/${d}`;
  return null;
}
