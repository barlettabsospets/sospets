import { describe, expect, it } from "vitest";
import { escalaDoGrafico, fatiasDaRosca, mesesVisiveis } from "./graficos";

describe("escalaDoGrafico", () => {
  it("com o seed, a mesma escala do protótipo (topo R$ 1.200)", () => {
    expect(escalaDoGrafico(1040)).toEqual({ topo: 1200, linhas: [400, 800, 1200] });
    expect(escalaDoGrafico(1040, true)).toEqual({ topo: 1200, linhas: [600, 1200] });
  });

  it("cresce com os dados, sem a barra passar do topo", () => {
    const { topo, linhas } = escalaDoGrafico(1571.12);
    expect(topo).toBeGreaterThanOrEqual(1571.12);
    expect(linhas).toEqual([600, 1200, 1800]);
  });

  it("valores pequenos e zero", () => {
    expect(escalaDoGrafico(95).topo).toBeGreaterThanOrEqual(95);
    expect(escalaDoGrafico(0).topo).toBeGreaterThan(0);
  });
});

describe("mesesVisiveis", () => {
  it("últimos 6 no computador e 3 no celular", () => {
    expect(mesesVisiveis(10, null, 6)).toEqual([4, 5, 6, 7, 8, 9]);
    expect(mesesVisiveis(10, null, 3)).toEqual([7, 8, 9]);
  });

  it("mês escolhido mais antigo puxa a janela", () => {
    expect(mesesVisiveis(10, 1, 6)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(mesesVisiveis(10, 8, 6)).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it("menos meses do que o espaço", () => {
    expect(mesesVisiveis(2, null, 6)).toEqual([0, 1]);
  });
});

describe("fatiasDaRosca", () => {
  // ordem e cores do protótipo (BY_SET + BY_OUT; COR_CAT)
  const ranking = [
    { nome: "Castração", cor: "#DB7838" },
    { nome: "Veterinário e consultas", cor: "#2D5F9A" },
    { nome: "Ração", cor: "#C2477A" },
    { nome: "Medicamentos", cor: "#D4A017" },
    { nome: "Exames", cor: "#2A9D8F" },
    { nome: "Vacinas", cor: "#7A5BA6" },
    { nome: "Lar temporário", cor: "#A8432F" },
    { nome: "Transporte", cor: "#8C9A2B" },
    { nome: "Outros", cor: "#CFC3B4" },
  ];

  it("outubro de 2026: só as fatias com valor, e o resto em Outras", () => {
    const outubro = new Map([["Veterinário e consultas", 180], ["Ração", 120], ["Vacinas", 24], ["Transporte", 30]]);
    expect(fatiasDaRosca(outubro, ranking)).toEqual([
      { nome: "Veterinário e consultas", valor: 180, cor: "#2D5F9A" },
      { nome: "Ração", valor: 120, cor: "#C2477A" },
      { nome: "Outras (vacinas, transporte)", valor: 54, cor: "#CFC3B4" },
    ]);
  });

  it("sem gastos, nenhuma fatia", () => {
    expect(fatiasDaRosca(new Map(), ranking)).toEqual([]);
  });
});
