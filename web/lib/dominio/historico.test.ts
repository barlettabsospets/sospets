import { describe, expect, it } from "vitest";
import { quandoFoi } from "./historico";

// 15/10/2026, 21:30 em Brasília (00:30 de 16/10 em UTC)
const AGORA = new Date("2026-10-16T00:30:00Z");

describe("quandoFoi", () => {
  it("hoje e ontem no horário de Brasília, mesmo quando em UTC já é outro dia", () => {
    expect(quandoFoi("2026-10-15T23:41:00Z", AGORA)).toBe("hoje, 20:41");
    expect(quandoFoi("2026-10-15T02:59:00Z", AGORA)).toBe("ontem, 23:59");
    expect(quandoFoi("2026-10-14T21:03:00Z", AGORA)).toBe("ontem, 18:03");
  });
  it("outros dias com a data; de outro ano, com o ano", () => {
    expect(quandoFoi("2026-10-12T12:15:00Z", AGORA)).toBe("12/10, 09:15");
    expect(quandoFoi("2025-12-31T12:00:00Z", AGORA)).toBe("31/12/2025, 09:00");
  });
});
