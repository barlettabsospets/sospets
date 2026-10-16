import { describe, expect, it } from "vitest";
import { type ResumoDoMes, resultadoDoPeriodo, saldoAte, somar } from "./saldo";

// IN, OUT e CNT do index.html do protótipo
const IN = [520, 640, 900, 830, 960, 1040, 870, 780, 890, 410];
const OUT = [450, 540.5, 790, 640.25, 820, 905.6, 700, 610, 724, 354];
const resumo: ResumoDoMes[] = IN.map((entrou, i) => ({
  mes: `2026-${String(i + 1).padStart(2, "0")}-01`,
  entrou,
  saiu: OUT[i],
  contribuicoes: 0,
  despesas: 0,
}));

describe("somar", () => {
  it("soma em centavos", () => {
    expect(somar([0.1, 0.2])).toBe(0.3);
    expect(somar(OUT)).toBe(6534.35);
  });
});

describe("saldoAte", () => {
  it("em caixa hoje: tudo o que entrou menos tudo o que saiu", () => {
    expect(saldoAte(resumo, "2026-10")).toBe(1305.65);
  });

  it("no fim de um mês passado, só até aquele mês", () => {
    expect(saldoAte(resumo, "2026-01")).toBe(70);
    expect(saldoAte(resumo, "2026-04")).toBe(469.25); // 2.890,00 − 2.420,75
  });

  it("antes do início dos dados, zero", () => {
    expect(saldoAte(resumo, "2025-12")).toBe(0);
  });
});

describe("resultadoDoPeriodo", () => {
  it("sobrou, com a porcentagem usada", () => {
    expect(resultadoDoPeriodo(960, 820)).toEqual({ rotulo: "Sobrou", valor: 140, faltou: false, usado: 85 });
  });

  it("faltou quando saiu mais do que entrou", () => {
    expect(resultadoDoPeriodo(100, 156.3)).toEqual({ rotulo: "Faltou", valor: 56.3, faltou: true, usado: 100 });
  });

  it("outubro de 2026", () => {
    expect(resultadoDoPeriodo(410, 354)).toMatchObject({ rotulo: "Sobrou", valor: 56, usado: 86 });
  });
});
