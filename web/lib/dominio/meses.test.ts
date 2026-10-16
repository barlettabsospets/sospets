import { describe, expect, it } from "vitest";
import { inicioDoMes, listaDeMeses, mesAtual, mesesEntre, paraMes, somarMeses } from "./meses";

describe("meses", () => {
  it("paraMes aceita data do banco e mês", () => {
    expect(paraMes("2026-10-01")).toBe("2026-10");
    expect(paraMes("2026-10-15")).toBe("2026-10");
    expect(paraMes("2026-10")).toBe("2026-10");
    expect(() => paraMes("10/2026")).toThrow();
  });

  it("inicioDoMes é o formato do banco", () => {
    expect(inicioDoMes("2026-10")).toBe("2026-10-01");
  });

  it("mesesEntre, como no protótipo", () => {
    expect(mesesEntre("2026-01", "2026-10")).toBe(9);
    expect(mesesEntre("2025-11", "2026-02")).toBe(3);
    expect(mesesEntre("2026-10", "2026-10")).toBe(0);
  });

  it("somarMeses vira o ano", () => {
    expect(somarMeses("2026-12", 1)).toBe("2027-01");
    expect(somarMeses("2026-01", -1)).toBe("2025-12");
  });

  it("listaDeMeses inclui as pontas", () => {
    expect(listaDeMeses("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(listaDeMeses("2026-02", "2026-01")).toEqual([]);
  });

  it("mesAtual usa o horário de Brasília", () => {
    // 1º de novembro, 01:30 em UTC = 31 de outubro, 22:30 em Brasília
    expect(mesAtual(new Date("2026-11-01T01:30:00Z"))).toBe("2026-10");
    expect(mesAtual(new Date("2026-11-01T03:30:00Z"))).toBe("2026-11");
  });
});
