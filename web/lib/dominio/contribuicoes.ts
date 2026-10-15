// Contribuições do mês (admin-contribuicoes.html): quem já contribuiu, quem falta
// e o aviso de "sem contribuir".
import { type Mes, mesesEntre } from "./meses";
import { type Membro, valorDoMembro } from "./membros";
import { somar } from "./saldo";

// contribuição não cancelada (membroId null = doação avulsa)
export type Contribuicao = {
  id: string;
  competencia: Mes;
  valor: number;
  membroId: string | null;
  // quando foi registrada ("Pago em 07/10"), já no dia de Brasília: "2026-10-07"
  registradaEm: string;
};

export type LinhaDoMes = {
  membro: Membro;
  // valor sugerido no campo: o próprio do membro ou o padrão
  sugerido: number;
  contribuicao: Contribuicao | null;
  nota: string;
  // passou do limite de "Mais" (aviso_meses): a nota aparece em destaque
  alerta: boolean;
};

// Texto embaixo do nome de quem ainda não contribuiu no mês, como no protótipo:
// os meses contam até o mês escolhido (última em julho, vendo outubro = "há 3 meses").
export function notaSemContribuir(ultima: Mes | null, mes: Mes): string {
  if (!ultima) return "Ainda não contribuiu";
  const meses = mesesEntre(ultima, mes);
  return meses <= 1 ? "Contribuiu no mês anterior" : `Sem contribuir há ${meses} meses`;
}

// Destaque de quem está sem contribuir há aviso_meses ou mais (com 3: "mais de 2 meses").
// Quem nunca contribuiu não entra: pode ser um membro novo.
export const passouDoAviso = (ultima: Mes | null, mes: Mes, avisoMeses: number) =>
  ultima !== null && mesesEntre(ultima, mes) >= avisoMeses;

// A lista do mês: membros ativos e também os inativos que contribuíram nesse mês.
export function linhasDoMes(
  membros: Membro[],
  contribuicoes: Contribuicao[],
  mes: Mes,
  padrao: number,
  avisoMeses: number,
): LinhaDoMes[] {
  const doMes = new Map<string, Contribuicao>();
  const ultima = new Map<string, Mes>();
  for (const c of contribuicoes) {
    if (!c.membroId) continue;
    if (c.competencia === mes) doMes.set(c.membroId, c);
    else if (c.competencia < mes && (ultima.get(c.membroId) ?? "") < c.competencia) ultima.set(c.membroId, c.competencia);
  }
  return membros
    .filter((m) => m.ativo || doMes.has(m.id))
    .map((m) => ({
      membro: m,
      sugerido: valorDoMembro(m, padrao),
      contribuicao: doMes.get(m.id) ?? null,
      nota: notaSemContribuir(ultima.get(m.id) ?? null, mes),
      alerta: passouDoAviso(ultima.get(m.id) ?? null, mes, avisoMeses),
    }));
}

// "Arrecadado no mês": tudo o que entrou no mês, como o "Entrou" do site (membros e avulsas).
export const arrecadadoNoMes = (contribuicoes: Contribuicao[], mes: Mes) =>
  somar(contribuicoes.filter((c) => c.competencia === mes).map((c) => c.valor));

// "2026-10-07" → "07/10"
export const diaEMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;

// timestamptz do banco → dia em Brasília ("2026-10-07")
export function diaEmBrasilia(instante: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(instante));
}
