// Campanhas (admin-campanhas.html): progresso da meta e saldo.
import { porcentagem } from "./formatacao";
import { somar } from "./saldo";

// % da meta, no máximo 100 (como no protótipo); null quando não há meta
export const progressoDaMeta = (arrecadado: number, meta: number | null) =>
  meta ? Math.min(100, porcentagem(arrecadado, meta)) : null;

// saldo = arrecadado − gasto, em centavos para não errar no ponto flutuante
export const saldoDaCampanha = (arrecadado: number, gasto: number) => somar([arrecadado, -gasto]);

// "2026-08-10" → "10/08/2026"
export const dataPorExtenso = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
