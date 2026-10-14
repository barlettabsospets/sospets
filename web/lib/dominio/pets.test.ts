import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { type Mes, listaDeMeses } from "./meses";
import { acompanhado, naFilaDeCastracao, situacaoPet } from "./pets";

// dados.js do protótipo: os mesmos pets e a mesma situacaoPet() que a página usa
type PetPrototipo = { n: string; ent: string; lar?: string; ado?: string; obito?: string; cast?: string };
const prototipo = vm.runInNewContext(
  readFileSync(join(__dirname, "../../../sospets-design/sospets-kit/design/dados.js"), "utf8") +
    "\n;({ PETS, situacaoPet })",
) as { PETS: PetPrototipo[]; situacaoPet: (p: PetPrototipo, ym: string) => string | null };

const doBanco = (p: PetPrototipo) => ({
  entrou_em: `${p.ent}-01`,
  lar_em: p.lar ? `${p.lar}-01` : null,
  adotado_em: p.ado ? `${p.ado}-01` : null,
  obito_em: p.obito ? `${p.obito}-01` : null,
  castrado: (p.cast ? "sim" : "nao_sei") as "sim" | "nao_sei",
  castrado_em: p.cast ? `${p.cast}-01` : null,
});

describe("situacaoPet", () => {
  it("dá o mesmo resultado do protótipo para os 48 pets em todos os meses", () => {
    const meses = listaDeMeses("2025-06", "2026-12");
    let comparacoes = 0;
    for (const p of prototipo.PETS) {
      for (const mes of meses) {
        expect(situacaoPet(doBanco(p), mes), `${p.n} em ${mes}`).toBe(prototipo.situacaoPet(p, mes));
        comparacoes++;
      }
    }
    expect(comparacoes).toBe(48 * meses.length);
  });

  it("falecido vem antes de adotado, lar e rua", () => {
    const pet = { entrou_em: "2026-01-01", lar_em: "2026-02-01", adotado_em: "2026-03-01", obito_em: "2026-04-01" };
    expect(situacaoPet(pet, "2025-12")).toBeNull();
    expect(situacaoPet(pet, "2026-01")).toBe("rua");
    expect(situacaoPet(pet, "2026-02")).toBe("lar");
    expect(situacaoPet(pet, "2026-03")).toBe("adotado");
    expect(situacaoPet(pet, "2026-04")).toBe("falecido");
  });
});

describe("contagens de outubro de 2026, como no protótipo", () => {
  const pets = prototipo.PETS.map(doBanco);
  const out: Mes = "2026-10";

  it("pets acompanhados hoje (rua + lar)", () => {
    expect(pets.filter((p) => acompanhado(p, out))).toHaveLength(25);
  });

  it("fila de castração igual ao filtro 'fila' do admin-animais", () => {
    const filaPrototipo = prototipo.PETS.filter((p) => {
      const s = prototipo.situacaoPet(p, out);
      return (s === "rua" || s === "lar") && !(p.cast && p.cast <= out);
    });
    expect(pets.filter((p) => naFilaDeCastracao(p, out))).toHaveLength(filaPrototipo.length);
  });

  it("castrado só conta a partir do mês da castração", () => {
    const amora = doBanco(prototipo.PETS.find((p) => p.n === "Amora")!); // castrada em 2026-10
    expect(naFilaDeCastracao(amora, "2026-09")).toBe(true);
    expect(naFilaDeCastracao(amora, "2026-10")).toBe(false);
  });
});
