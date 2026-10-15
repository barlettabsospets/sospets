import { describe, expect, it } from "vitest";
import { arrecadadoNoMes, type Contribuicao, diaEMes, diaEmBrasilia, linhasDoMes, notaSemContribuir } from "./contribuicoes";
import type { Membro } from "./membros";

describe("notaSemContribuir", () => {
  it("contribuiu no mês anterior", () => {
    expect(notaSemContribuir("2026-09", "2026-10")).toBe("Contribuiu no mês anterior");
  });

  it("conta os meses até o mês escolhido, como o protótipo (seed: Úrsula e Vera)", () => {
    expect(notaSemContribuir("2026-07", "2026-10")).toBe("Sem contribuir há 3 meses");
    expect(notaSemContribuir("2026-08", "2026-10")).toBe("Sem contribuir há 2 meses");
  });

  it("atravessa a virada do ano", () => {
    expect(notaSemContribuir("2025-12", "2026-01")).toBe("Contribuiu no mês anterior");
  });

  it("sem nenhuma contribuição antes", () => {
    expect(notaSemContribuir(null, "2026-10")).toBe("Ainda não contribuiu");
  });
});

const membro = (id: string, extra: Partial<Membro> = {}): Membro => ({ id, nome: `Pessoa ${id}`, valorMensal: null, ativo: true, ...extra });
const contrib = (membroId: string | null, competencia: string, valor = 20): Contribuicao =>
  ({ id: `${membroId}-${competencia}`, competencia: competencia as Contribuicao["competencia"], valor, membroId, registradaEm: `${competencia}-07` });

describe("linhasDoMes", () => {
  const membros = [membro("a"), membro("b", { valorMensal: 30 }), membro("c", { ativo: false }), membro("d", { ativo: false })];
  const contribs = [contrib("a", "2026-10"), contrib("a", "2026-09"), contrib("b", "2026-06"), contrib("c", "2026-10"), contrib(null, "2026-10", 50)];
  const linhas = linhasDoMes(membros, contribs, "2026-10", 20);

  it("mostra os ativos e os inativos que contribuíram no mês", () => {
    expect(linhas.map((l) => l.membro.id)).toEqual(["a", "b", "c"]);
  });

  it("liga a contribuição do mês e sugere o valor do membro", () => {
    expect(linhas[0].contribuicao?.id).toBe("a-2026-10");
    expect(linhas[1].contribuicao).toBeNull();
    expect(linhas[1].sugerido).toBe(30);
  });

  it("a nota olha só para meses anteriores ao escolhido", () => {
    expect(linhas[1].nota).toBe("Sem contribuir há 4 meses");
    expect(linhasDoMes(membros, contribs, "2026-09", 20)[0].nota).toBe("Ainda não contribuiu");
  });

  it("arrecadado soma membros e avulsas do mês", () => {
    expect(arrecadadoNoMes(contribs, "2026-10")).toBe(90);
  });
});

describe("datas", () => {
  it("diaEMes", () => {
    expect(diaEMes("2026-10-07")).toBe("07/10");
  });

  it("diaEmBrasilia usa o fuso de Brasília", () => {
    expect(diaEmBrasilia("2026-10-08T01:30:00Z")).toBe("2026-10-07");
  });
});
