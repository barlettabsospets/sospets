import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import {
  categoriasDoMes, type DespesaParaSomar, opcoesDoFormulario, porCategoria, porPet, resumoDoMes, somarDespesas, textoDaQuantidade,
} from "./despesas";

// dados.js do protótipo: as despesas de agosto a outubro que a página Despesas mostra
type DespesaPrototipo = { d: string; t: string; c: string; v: number; a: string };
const prototipo = vm.runInNewContext(
  readFileSync(join(__dirname, "../../../sospets-design/sospets-kit/design/dados.js"), "utf8") +
    "\n;({ DESPESAS, PETS, corCat })",
) as { DESPESAS: DespesaPrototipo[]; PETS: { n: string; e: "cachorro" | "gato" }[]; corCat: (c: string) => string };

const doBanco = (d: DespesaPrototipo): DespesaParaSomar => ({
  categoria: d.c,
  cor: prototipo.corCat(d.c),
  valor: d.v,
  petId: d.a ? "id-" + d.a : null,
  pet: d.a || "Vários pets",
  especie: d.a ? prototipo.PETS.find((p) => p.n === d.a)!.e : null,
});
const doMes = (mes: string) => prototipo.DESPESAS.filter((d) => d.d.startsWith(mes)).map(doBanco);

describe("página Despesas: mesmos números do despesas.html", () => {
  it("totais de cada mês batem com a Prestação de contas", () => {
    expect(somarDespesas(doMes("2026-08"))).toBe(610);
    expect(somarDespesas(doMes("2026-09"))).toBe(724);
    expect(somarDespesas(doMes("2026-10"))).toBe(354);
  });

  it("porCategoria: da que mais gastou para a que menos, com a quantidade", () => {
    expect(porCategoria(doMes("2026-10")).map((x) => [x.categoria, x.quantidade, x.total])).toEqual([
      ["Veterinário e consultas", 1, 180],
      ["Ração", 1, 120],
      ["Transporte", 1, 30],
      ["Vacinas", 1, 24],
    ]);
    expect(porCategoria(doMes("2026-10"))[0].cor).toBe("#2D5F9A");
  });

  it("porPet: quem mais gastou primeiro e Vários pets no fim", () => {
    expect(porPet(doMes("2026-10")).map((x) => [x.nome, x.total])).toEqual([
      ["Luna", 210],
      ["Mel", 24],
      ["Vários pets", 120],
    ]);
    expect(porPet(doMes("2026-09")).at(-1)).toMatchObject({ chave: "", nome: "Vários pets", total: 180 });
  });
});

describe("tela Despesas do admin", () => {
  const d = (categoria: string, valor: number) => ({ categoria, cor: `#${categoria.length}00000`, valor });
  const outubro = [d("Ração", 120), d("Ração", 0.1), d("Castração", 200), d("Exames", 80)];

  it("resumo: total e quantidade", () => {
    expect(resumoDoMes(outubro)).toEqual({ total: 400.1, quantidade: 4 });
    expect(textoDaQuantidade(resumoDoMes(outubro))).toBe("4 despesas");
    expect(textoDaQuantidade({ quantidade: 1 })).toBe("1 despesa");
  });

  it("por categoria: da que mais gastou para a que menos", () => {
    expect(categoriasDoMes(outubro).map((c) => [c.categoria, c.total])).toEqual([
      ["Castração", 200], ["Ração", 120.1], ["Exames", 80],
    ]);
  });

  it("opções: as ativas e a atual, mesmo desativada", () => {
    const cats = [{ id: "a", ativa: true }, { id: "b", ativa: false }, { id: "c", ativa: false }];
    expect(opcoesDoFormulario(cats, (c) => c.ativa, null).map((c) => c.id)).toEqual(["a"]);
    expect(opcoesDoFormulario(cats, (c) => c.ativa, "b").map((c) => c.id)).toEqual(["a", "b"]);
  });
});
