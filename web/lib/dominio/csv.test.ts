import { describe, expect, it } from "vitest";
import { dataBR, gerarCsv, mesBR, nomeDoArquivo } from "./csv";

describe("gerarCsv", () => {
  it("separa por ponto e vírgula, com BOM, vírgula nos decimais e Sim/Não", () => {
    expect(gerarCsv(["Descrição", "Valor", "Pago"], [["Ração", 120, true], ["Vacina", 24.5, false]])).toBe(
      "\uFEFFDescrição;Valor;Pago\r\nRação;120,00;Sim\r\nVacina;24,50;Não\r\n",
    );
  });
  it("põe entre aspas o que tem ; aspas ou quebra de linha, e deixa vazio o null", () => {
    expect(gerarCsv(["a", "b", "c"], [['Ração; "premium"', "duas\nlinhas", null]])).toBe(
      '\uFEFFa;b;c\r\n"Ração; ""premium""";"duas\nlinhas";\r\n',
    );
  });
  it("não deixa texto virar fórmula no Excel", () => {
    expect(gerarCsv(["d"], [["=SOMA(A1:A9)"], ["+1"], ["-2"], ["@soma"]])).toBe(
      "\uFEFFd\r\n'=SOMA(A1:A9)\r\n'+1\r\n'-2\r\n'@soma\r\n",
    );
  });
});

describe("datas e nome", () => {
  it("formata em português", () => {
    expect(dataBR("2026-10-03")).toBe("03/10/2026");
    expect(dataBR("2026-10-03T22:10:00+00:00")).toBe("03/10/2026");
    expect(mesBR("2026-10-01")).toBe("10/2026");
    expect(dataBR(null)).toBeNull();
    expect(nomeDoArquivo("despesas", "2026-10-15")).toBe("sospets-despesas-2026-10-15.csv");
  });
});
