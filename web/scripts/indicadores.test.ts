import { describe, expect, it } from "vitest";
import { calcularIndicadores, dataEmBrasilia, type DadosDoMes, feriados, prazoDoMes } from "./indicadores";

describe("prazoDoMes (5º dia útil do mês seguinte)", () => {
  it.each([
    ["2026-09", "2026-10-07"],
    ["2026-10", "2026-11-09"], // Finados (2/11) numa segunda
    ["2026-11", "2026-12-07"],
    ["2026-12", "2027-01-08"], // 1/1 é feriado
    ["2026-03", "2026-04-08"], // Sexta-feira Santa (3/4/2026) não conta
  ])("%s → %s", (mes, prazo) => {
    expect(prazoDoMes(mes)).toBe(prazo);
  });

  it("feriados incluem a Sexta-feira Santa", () => {
    expect(feriados(2026).has("2026-04-03")).toBe(true);
    expect(feriados(2027).has("2027-03-26")).toBe(true);
  });
});

describe("dataEmBrasilia", () => {
  it("usa o fuso de Brasília", () => {
    expect(dataEmBrasilia("2026-11-03T01:30:00Z")).toBe("2026-11-02");
    expect(dataEmBrasilia("2026-11-03T12:00:00Z")).toBe("2026-11-03");
  });
});

describe("calcularIndicadores", () => {
  const adm = "admin-1";
  const base: DadosDoMes = {
    mes: "2026-11",
    despesas: [
      { data: "2026-11-01", criado_em: "2026-11-05T15:00:00Z", criado_por: adm, cancelada_em: null }, // 4 dias
      { data: "2026-11-01", criado_em: "2026-11-20T15:00:00Z", criado_por: adm, cancelada_em: null }, // 19 dias
      { data: "2026-11-10", criado_em: "2026-12-04T15:00:00Z", criado_por: "admin-2", cancelada_em: "2026-12-05T10:00:00Z" },
      // importada (sem autor): fica de fora
      { data: "2026-11-02", criado_em: "2026-10-30T15:00:00Z", criado_por: null, cancelada_em: null },
    ],
    contribuicoes: [
      { criado_em: "2026-11-10T15:00:00Z", criado_por: adm, cancelada_em: null, membro_id: "m1" },
      { criado_em: "2026-11-11T15:00:00Z", criado_por: adm, cancelada_em: null, membro_id: "m2" },
      { criado_em: "2026-11-11T15:00:00Z", criado_por: adm, cancelada_em: "2026-11-11T16:00:00Z", membro_id: "m3" },
      { criado_em: "2026-11-12T15:00:00Z", criado_por: adm, cancelada_em: null, membro_id: null },
    ],
    autoresNoHistorico: [adm, adm, "admin-2", null],
    administradoresAtivos: 2,
    membrosAtivos: 10,
    entrou: 1150,
    entrouMesAnterior: 1000,
  };

  it("calcula cada indicador só com o que a equipe lançou", () => {
    expect(calcularIndicadores(base)).toEqual({
      prazo: "2026-12-07",
      adminsAtivos: { lancando: 2, total: 2 },
      prazoDespesa: { ate7dias: 1, total: 3, percentual: 33.3 },
      fechamento: { ultimoLancamento: "2026-12-04", noPrazo: true },
      correcoes: { canceladas: 2, total: 7, percentual: 28.6 },
      membrosEmDia: { contribuiram: 2, ativos: 10, percentual: 20 },
      arrecadacao: { entrou: 1150, variacao: 15 },
    });
  });

  it("lançamento depois do prazo e mês sem lançamentos", () => {
    const atrasado = { ...base, despesas: [{ data: "2026-11-01", criado_em: "2026-12-09T15:00:00Z", criado_por: adm, cancelada_em: null }], contribuicoes: [] };
    expect(calcularIndicadores(atrasado).fechamento).toEqual({ ultimoLancamento: "2026-12-09", noPrazo: false });
    const vazio = calcularIndicadores({ ...base, despesas: [], contribuicoes: [], entrouMesAnterior: null });
    expect(vazio.fechamento).toEqual({ ultimoLancamento: null, noPrazo: null });
    expect(vazio.prazoDespesa.percentual).toBeNull();
    expect(vazio.arrecadacao.variacao).toBeNull();
  });
});
