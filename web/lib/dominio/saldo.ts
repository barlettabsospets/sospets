import { porcentagem } from "./formatacao";
import { type Mes, paraMes } from "./meses";

// Dinheiro chega do banco como número (numeric → JSON). Somas sempre em centavos,
// para 0,1 + 0,2 dar 0,30 e não 0,30000000000000004.
export const paraCentavos = (valor: number) => Math.round(valor * 100);
export const deCentavos = (centavos: number) => centavos / 100;
export const somar = (valores: number[]) => deCentavos(valores.reduce((t, v) => t + paraCentavos(v), 0));

// Uma linha de pub_resumo_mensal.
export type ResumoDoMes = { mes: string; entrou: number; saiu: number; contribuicoes: number; despesas: number };

// Saldo = tudo o que entrou − tudo o que saiu, do início dos dados até o fim do mês escolhido.
export function saldoAte(resumo: ResumoDoMes[], mes: Mes): number {
  const ate = resumo.filter((r) => paraMes(r.mes) <= mes);
  return deCentavos(
    ate.reduce((t, r) => t + paraCentavos(r.entrou) - paraCentavos(r.saiu), 0),
  );
}

// Entrou − saiu de um período: "Sobrou" ou, quando saiu mais, "Faltou" (pago com o caixa).
export function resultadoDoPeriodo(entrou: number, saiu: number) {
  const diferenca = deCentavos(paraCentavos(entrou) - paraCentavos(saiu));
  const faltou = diferenca < 0;
  const usado = Math.min(100, porcentagem(saiu, entrou));
  return {
    rotulo: faltou ? "Faltou" : "Sobrou",
    valor: Math.abs(diferenca),
    faltou,
    // % do que entrou que foi usado (barra "usado × sobrou" da Prestação de contas)
    usado,
  } as const;
}
