import { describe, expect, it } from "vitest";
import { categoriaDoItem, centavos, membroDoNome, valorDaCelula } from "./importar-planilha";

describe("categoriaDoItem", () => {
  it.each([
    ["Castração", "Castração"],
    ["Teste FIV/Felv", "Exames"],
    ["Teste de FIV e Felv", "Exames"],
    ["Hemograma", "Exames"],
    ["Ultrassom", "Exames"],
    ["Vacinas", "Vacinas"],
    ["Consulta", "Veterinário e consultas"],
    ["Internação", "Veterinário e consultas"],
    ["Nexgard (cachorros)", "Medicamentos"],
    ["Vermífugo filhotes", "Medicamentos"],
    ["Antipulgas (3 un.)", "Medicamentos"],
    ["Ração gatos de rua", "Ração"],
    ["Sachês", "Ração"],
    ["Areia LT", "Lar temporário"],
    ["Pá higiênica", "Lar temporário"],
    ["Uber Pet", "Transporte"],
  ])("%s → %s", (item, categoria) => {
    expect(categoriaDoItem(item)).toEqual({ categoria, reconhecida: true });
  });

  it("caixa de transporte é equipamento, não transporte", () => {
    expect(categoriaDoItem("Cx transporte gatoeira").categoria).toBe("Outros");
  });

  it("o que não reconhece vai para Outros e avisa", () => {
    expect(categoriaDoItem("Lona (casinhas)")).toEqual({ categoria: "Outros", reconhecida: false });
  });
});

describe("valorDaCelula", () => {
  it("lê número, texto, fórmula e texto rico", () => {
    expect(valorDaCelula(20)).toBe(20);
    expect(valorDaCelula("  Ana Exemplo ")).toBe("Ana Exemplo");
    expect(valorDaCelula("")).toBeNull();
    expect(valorDaCelula(null)).toBeNull();
    expect(valorDaCelula({ formula: "SUM(C3:C14)", result: 530 })).toBe(530);
    expect(valorDaCelula({ richText: [{ text: "Ra" }, { text: "ção" }] })).toBe("Ração");
  });
});

describe("centavos", () => {
  it("evita erro de ponto flutuante", () => {
    expect(centavos(140.16999999999999)).toBe(14017);
    expect(centavos(0.1 + 0.2)).toBe(30);
  });
});

describe("membroDoNome", () => {
  const membros = [{ nome: "Ana Exemplo", grafias: ["Ana", "Aninha Teste"] }, { nome: "Bruno Teste" }];

  it("acha pelo nome ou por uma grafia, sem acento, maiúsculas nem espaços sobrando", () => {
    expect(membroDoNome("bruno  teste ", membros)).toBe("Bruno Teste");
    expect(membroDoNome("Aninha Teste", membros)).toBe("Ana Exemplo");
    expect(membroDoNome("ANA", membros)).toBe("Ana Exemplo");
  });

  it("nome parecido não é o mesmo membro: vira doação avulsa", () => {
    expect(membroDoNome("Ana Modelo", membros)).toBeNull();
  });
});
