import { describe, expect, it } from "vitest";
import {
  categoriaDoItem,
  centavos,
  contribuicoesParaGravar,
  type LinhaCadastro,
  linhaDoCadastro,
  membroDoNome,
  membrosDoCadastro,
  mesesDoCadastro,
  petDoNome,
  valorDaCelula,
} from "./importar-planilha";

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

describe("mesesDoCadastro", () => {
  it("lê meses e campanhas", () => {
    expect(mesesDoCadastro("jan, fev, ago (campanha Nelson)", 2026)).toEqual(["2026-01", "2026-02", "2026-08 nelson"]);
    expect(mesesDoCadastro("mar, mar", 2026)).toEqual(["2026-03", "2026-03"]);
  });
});

describe("linhaDoCadastro", () => {
  const l = (nome: string, meses: string, nomeFinal: string, fixo = false): LinhaCadastro =>
    ({ nome, meses, nomeFinal, fixo, valorMensal: null, ativo: true });
  const cadastro = [l("Bruno", "mai", "Bruno da 104"), l("Bruno", "jul", "Bruno Teste"), l("Ana", "jan, fev (campanha Exemplo)", "Ana Exemplo", true)];

  it("mesma grafia em meses diferentes: decide o mês", () => {
    expect(linhaDoCadastro("bruno", "2026-05-01", null, cadastro)?.nomeFinal).toBe("Bruno da 104");
    expect(linhaDoCadastro("Bruno", "2026-07-01", null, cadastro)?.nomeFinal).toBe("Bruno Teste");
    expect(linhaDoCadastro("Bruno", "2026-09-01", null, cadastro)).toBeNull();
  });

  it("grafia única vale para qualquer mês", () => {
    expect(linhaDoCadastro("ANA", "2026-03-01", null, cadastro)?.nomeFinal).toBe("Ana Exemplo");
  });
});

describe("contribuicoesParaGravar", () => {
  const cadastro: LinhaCadastro[] = [
    { nome: "Ana", meses: "jan", nomeFinal: "Ana Exemplo", fixo: true, valorMensal: null, ativo: true },
    { nome: "Aninha", meses: "jan", nomeFinal: "Ana Exemplo", fixo: true, valorMensal: null, ativo: true },
    { nome: "Loja", meses: "jan", nomeFinal: "Loja Exemplo", fixo: false, valorMensal: null, ativo: true },
  ];
  const c = (nome: string | null, valor: number, campanha: string | null = null) =>
    ({ competencia: "2026-01-01", valor, nome, campanha, origem: "x" });

  it("soma o mesmo membro no mês; campanha e não-membro viram avulsa; sem nome é anônima", () => {
    const { linhas, avisos } = contribuicoesParaGravar(
      [c("Ana", 2000), c("Aninha", 1000), c("Ana", 500, "Resgate Exemplo"), c("Loja", 3000), c(null, 700), c("Zé", 100)],
      cadastro,
    );
    expect(linhas).toEqual([
      { competencia: "2026-01-01", valor: 3000, membro: "Ana Exemplo", nomeAvulso: null, campanha: null },
      { competencia: "2026-01-01", valor: 500, membro: null, nomeAvulso: "Ana Exemplo", campanha: "Resgate Exemplo" },
      { competencia: "2026-01-01", valor: 3000, membro: null, nomeAvulso: "Loja Exemplo", campanha: null },
      { competencia: "2026-01-01", valor: 700, membro: null, nomeAvulso: null, campanha: null },
      { competencia: "2026-01-01", valor: 100, membro: null, nomeAvulso: "Zé", campanha: null },
    ]);
    expect(avisos).toHaveLength(1);
  });
});

describe("membrosDoCadastro", () => {
  it("um membro por nome final, só os fixos", () => {
    const l = (nomeFinal: string, fixo: boolean, valorMensal: number | null, ativo = true): LinhaCadastro =>
      ({ nome: "x", meses: "", nomeFinal, fixo, valorMensal, ativo });
    expect(membrosDoCadastro([l("Ana Exemplo", true, null), l("Ana Exemplo", true, 30), l("Loja", false, null), l("Bruno Teste", true, null, false)]))
      .toEqual([{ nome: "Ana Exemplo", valorMensal: 30, ativo: true }, { nome: "Bruno Teste", valorMensal: null, ativo: false }]);
  });
});

describe("petDoNome", () => {
  const pets = [
    { id: "1", nome: "Mortícia e Ophelia", oculto: false },
    { id: "2", nome: "Banguela/Heitor", oculto: false },
    { id: "3", nome: "Stuart", oculto: false },
    { id: "4", nome: "Stuart", oculto: true },
    { id: "5", nome: "Mel", oculto: false },
    { id: "6", nome: "Mel", oculto: false },
  ];
  it("acha por cada nome, ignora ocultos e não escolhe entre repetidos", () => {
    expect(petDoNome("Ophelia", pets)).toBe("1");
    expect(petDoNome("banguela", pets)).toBe("2");
    expect(petDoNome("Stuart", pets)).toBe("3");
    expect(petDoNome("Mel", pets)).toBeNull();
    expect(petDoNome("Nelson", pets)).toBeNull();
  });
});
