import { describe, expect, it } from "vitest";
import { formatarBRL } from "./formatacao";

describe("formatarBRL", () => {
  it("formata os totais de outubro de 2026 do protótipo", () => {
    // Intl usa espaço não separável entre "R$" e o número.
    expect(formatarBRL(410)).toBe("R$ 410,00");
    expect(formatarBRL(354)).toBe("R$ 354,00");
  });

  it("usa ponto nos milhares e vírgula nos centavos", () => {
    expect(formatarBRL(1234.5)).toBe("R$ 1.234,50");
  });
});
