import { type Mes, numeroDoMes } from "./meses";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const inteiro = new Intl.NumberFormat("pt-BR");

// Formata um valor em reais: 410 → "R$ 410,00".
// Como o fmt() do protótipo, troca o espaço não separável do Intl por um espaço comum
// (quem impede a quebra de linha é o CSS, com white-space: nowrap).
export function formatarBRL(valor: number): string {
  return brl.format(valor).replace(/ /g, " ");
}

// 1234 → "1.234"
export function formatarInteiro(n: number): string {
  return inteiro.format(Math.round(n));
}

// Porcentagem inteira, como pct() do protótipo; 0 quando não há base.
export function porcentagem(parte: number, total: number): number {
  return total ? Math.round((parte / total) * 100) : 0;
}

export const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
] as const;
export const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;

export const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// "2026-10" → "outubro"
export const nomeDoMes = (mes: Mes) => MESES_LONGOS[numeroDoMes(mes) - 1];

// "2026-10" → "outubro de 2026"
export const mesPorExtenso = (mes: Mes) => `${nomeDoMes(mes)} de ${mes.slice(0, 4)}`;

// "2026-10" → "out/2026"
export const mesAbreviado = (mes: Mes) => `${MESES_CURTOS[numeroDoMes(mes) - 1]}/${mes.slice(0, 4)}`;
