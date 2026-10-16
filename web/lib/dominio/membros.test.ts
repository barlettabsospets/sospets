import { describe, expect, it } from "vitest";
import { textoDoPadrao, valorDoMembro, valorProprio } from "./membros";

describe("valor do membro", () => {
  it("usa o valor próprio ou, sem ele, o padrão", () => {
    expect(valorDoMembro({ valorMensal: 30 }, 20)).toBe(30);
    expect(valorDoMembro({ valorMensal: null }, 20)).toBe(20);
  });

  it("valorProprio: igual ao padrão ou vazio passa a seguir o padrão", () => {
    expect(valorProprio(20, 20)).toBeNull();
    expect(valorProprio(0, 20)).toBeNull();
    expect(valorProprio(35, 20)).toBe(35);
  });
});

describe("textoDoPadrao", () => {
  it("conta quem segue o padrão e quem tem valor próprio (seed: 21 e 3)", () => {
    const membros = [...Array(21).fill({ valorMensal: null }), { valorMensal: 30 }, { valorMensal: 30 }, { valorMensal: 50 }];
    expect(textoDoPadrao(membros)).toBe("21 membros seguem o padrão. 3 têm valor próprio.");
  });

  it("usa o singular", () => {
    expect(textoDoPadrao([{ valorMensal: null }, { valorMensal: 30 }])).toBe("1 membro segue o padrão. 1 tem valor próprio.");
  });
});
