import { describe, expect, it } from "vitest";
import { dataPorExtenso, progressoDaMeta, saldoDaCampanha } from "./campanhas";

describe("campanhas", () => {
  it("progresso da meta: Stuart do protótipo (1.200 de 2.000) é 60%", () => {
    expect(progressoDaMeta(1200, 2000)).toBe(60);
  });

  it("passa da meta, mas a barra para em 100%", () => {
    expect(progressoDaMeta(2500, 2000)).toBe(100);
  });

  it("sem meta, sem progresso", () => {
    expect(progressoDaMeta(300, null)).toBeNull();
  });

  it("saldo sem erro de centavos", () => {
    expect(saldoDaCampanha(0.3, 0.1)).toBe(0.2);
    expect(saldoDaCampanha(640, 640)).toBe(0);
  });

  it("data no formato do protótipo", () => {
    expect(dataPorExtenso("2026-08-10")).toBe("10/08/2026");
  });
});
