import { describe, expect, it } from "vitest";
import {
  capitalizar, formatarBRL, formatarInteiro, mesAbreviado, mesPorExtenso, nomeDoMes, porcentagem,
} from "./formatacao";

describe("formatarBRL", () => {
  it("formata os totais de outubro de 2026 do protótipo", () => {
    expect(formatarBRL(410)).toBe("R$ 410,00");
    expect(formatarBRL(354)).toBe("R$ 354,00");
  });

  it("usa ponto nos milhares e vírgula nos centavos", () => {
    expect(formatarBRL(1234.5)).toBe("R$ 1.234,50");
  });

  it("usa espaço comum, como o fmt() do protótipo", () => {
    expect(formatarBRL(20)).not.toContain(" ");
  });

  it("formata negativos", () => {
    expect(formatarBRL(-56)).toBe("-R$ 56,00");
  });
});

describe("números", () => {
  it("formatarInteiro arredonda e separa milhares", () => {
    expect(formatarInteiro(1234.4)).toBe("1.234");
  });

  it("porcentagem é inteira e 0 sem base", () => {
    expect(porcentagem(820, 960)).toBe(85);
    expect(porcentagem(1, 0)).toBe(0);
  });
});

describe("meses na tela", () => {
  it("por extenso, abreviado e só o nome", () => {
    expect(mesPorExtenso("2026-10")).toBe("outubro de 2026");
    expect(mesAbreviado("2026-10")).toBe("out/2026");
    expect(nomeDoMes("2026-03")).toBe("março");
    expect(capitalizar(mesPorExtenso("2026-03"))).toBe("Março de 2026");
  });
});
