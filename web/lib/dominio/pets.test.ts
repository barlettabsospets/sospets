import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { type Mes, listaDeMeses } from "./meses";
import {
  acompanhado, castradoNoMes, contarGrupo, contarTopo, dataDaCastracao, datasDaSituacao, desdeDaSituacao,
  type FiltroDoAdmin, linkDoWhatsApp, naFilaDeCastracao, passaNoFiltro, saidaDaRua, situacaoPet, tempoDesde,
} from "./pets";

// dados.js do protótipo: os mesmos pets e a mesma situacaoPet() que a página usa
type PetPrototipo = { n: string; ent: string; lar?: string; ado?: string; obito?: string; cast?: string; precisaLar?: boolean; nec?: string };
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
  precisa_lar: !!p.precisaLar,
  necessidade: p.nec ?? null,
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

describe("cartão Pets da Prestação de contas: mesmos números do index.html", () => {
  // o protótipo calcula CAS, ADO, LAR, RUA e CAES assim (index.html)
  const MESES_2026 = Array.from({ length: 10 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}` as Mes);
  const pets = prototipo.PETS.map((p) => ({ ...doBanco(p), especie: (p as { e?: string }).e as "cachorro" | "gato" }));
  const proto = (f: (p: PetPrototipo & { e?: string }, ym: string) => boolean) => MESES_2026.map((ym) => prototipo.PETS.filter((p) => f(p, ym)));
  const CAS = proto((p, ym) => p.cast === ym);
  const ADO = proto((p, ym) => p.ado === ym);
  const LAR = proto((p, ym) => prototipo.situacaoPet(p, ym) === "lar");
  const RUA = proto((p, ym) => prototipo.situacaoPet(p, ym) === "rua");
  const caes = (l: (PetPrototipo & { e?: string })[]) => l.filter((p) => p.e === "cachorro").length;

  it("cada mês: castrados, adotados, lar e rua, com cães e gatos", () => {
    MESES_2026.forEach((mes, i) => {
      for (const [grupo, esperado] of [["castrados", CAS[i]], ["adotados", ADO[i]], ["lar", LAR[i]], ["rua", RUA[i]]] as const) {
        const c = contarGrupo(pets, grupo, mes, mes);
        expect(c, `${grupo} em ${mes}`).toEqual({ total: esperado.length, caes: caes(esperado), gatos: esperado.length - caes(esperado) });
      }
    });
  });

  it("desde o início: eventos somados desde janeiro e situação de hoje", () => {
    const soma = (l: unknown[][]) => l.reduce((t, x) => t + x.length, 0);
    expect(contarGrupo(pets, "castrados", "2026-01", "2026-10").total).toBe(soma(CAS));
    expect(contarGrupo(pets, "adotados", "2026-01", "2026-10").total).toBe(soma(ADO));
    expect(contarTopo(pets, true, "2026-10")).toEqual({ total: 48, caes: 14, gatos: 34 });
    expect(contarTopo(pets, false, "2026-10").total).toBe(LAR[9].length + RUA[9].length);
  });
});

describe("saidaDaRua", () => {
  it("é o primeiro mês entre lar temporário e adoção, como saidaRua() do animais.html", () => {
    for (const p of prototipo.PETS) {
      const esperado = [p.lar, p.ado].filter(Boolean).sort()[0] ?? null;
      expect(saidaDaRua(doBanco(p)), p.n).toBe(esperado);
    }
  });
});

describe("tela Pets do admin", () => {
  // os filtros de admin-animais.html (FILTRO), escritos sobre os dados do protótipo
  const st = (p: PetPrototipo, ym: string) => prototipo.situacaoPet(p, ym);
  const castNo = (p: PetPrototipo, ym: string) => !!p.cast && p.cast <= ym;
  const FILTRO: Record<FiltroDoAdmin, (p: PetPrototipo, ym: string) => boolean> = {
    rua: (p, ym) => st(p, ym) === "rua",
    lar: (p, ym) => st(p, ym) === "lar",
    adotado: (p, ym) => st(p, ym) === "adotado",
    falecido: (p, ym) => st(p, ym) === "falecido",
    fila: (p, ym) => ["rua", "lar"].includes(st(p, ym) ?? "") && !castNo(p, ym),
    precisa: (p, ym) => st(p, ym) === "rua" && !!p.precisaLar,
    nec: (p, ym) => !!p.nec && ["rua", "lar"].includes(st(p, ym) ?? ""),
  };

  it("os filtros dão o mesmo resultado do protótipo para os 48 pets em todos os meses", () => {
    const meses = listaDeMeses("2026-01", "2026-10");
    for (const f of Object.keys(FILTRO) as FiltroDoAdmin[]) {
      for (const mes of meses) {
        const nossos = prototipo.PETS.filter((p) => passaNoFiltro(doBanco(p), f, mes)).map((p) => p.n);
        const deles = prototipo.PETS.filter((p) => FILTRO[f](p, mes)).map((p) => p.n);
        expect(nossos, `${f} em ${mes}`).toEqual(deles);
      }
    }
    // o protótipo tem gente nestes filtros no mês atual (não tem falecido nem pet com necessidade)
    for (const f of ["rua", "lar", "adotado", "fila", "precisa"] as const) {
      expect(prototipo.PETS.some((p) => FILTRO[f](p, "2026-10")), f).toBe(true);
    }
  });

  it("necessidade e falecido", () => {
    const pet = {
      entrou_em: "2026-01-01", lar_em: null, adotado_em: null, obito_em: null,
      castrado: "nao" as const, castrado_em: null, precisa_lar: false, necessidade: "Precisa de cirurgia",
    };
    expect(passaNoFiltro(pet, "nec", "2026-10")).toBe(true);
    expect(passaNoFiltro({ ...pet, necessidade: null }, "nec", "2026-10")).toBe(false);
    const falecido = { ...pet, obito_em: "2026-08-01" };
    expect(passaNoFiltro(falecido, "nec", "2026-10")).toBe(false);
    expect(passaNoFiltro(falecido, "falecido", "2026-10")).toBe(true);
    expect(passaNoFiltro(falecido, "fila", "2026-10")).toBe(false);
    expect(passaNoFiltro(falecido, "rua", "2026-07")).toBe(true);
  });

  it("castrado só conta a partir do mês da castração", () => {
    const pet = { entrou_em: "2026-01-01", lar_em: null, adotado_em: null, obito_em: null, castrado: "sim" as const, castrado_em: "2026-05-01" };
    expect(castradoNoMes(pet, "2026-04")).toBe(false);
    expect(castradoNoMes(pet, "2026-05")).toBe(true);
    expect(castradoNoMes({ ...pet, castrado_em: null }, "2026-01")).toBe(true);
    expect(castradoNoMes({ ...pet, castrado: "nao_sei" }, "2026-10")).toBe(false);
  });

  it("a situação escolhida vira datas, como o salvar do protótipo", () => {
    const atuais = { lar_em: "2026-03-01", adotado_em: "2026-06-01", obito_em: null };
    expect(datasDaSituacao("rua", "2026-10-01", atuais)).toEqual({ lar_em: null, adotado_em: null, obito_em: null });
    expect(datasDaSituacao("lar", "2026-09-01", atuais)).toEqual({ lar_em: "2026-09-01", adotado_em: null, obito_em: null });
    expect(datasDaSituacao("adotado", "2026-10-01", atuais)).toEqual({ lar_em: "2026-03-01", adotado_em: "2026-10-01", obito_em: null });
    expect(datasDaSituacao("falecido", "2026-10-01", atuais)).toEqual({ lar_em: "2026-03-01", adotado_em: "2026-06-01", obito_em: "2026-10-01" });
    // e a situação calculada pelas datas novas é a escolhida
    for (const s of ["rua", "lar", "adotado", "falecido"] as const) {
      const datas = datasDaSituacao(s, "2026-10-01", atuais);
      expect(situacaoPet({ entrou_em: "2026-01-01", ...datas }, "2026-10")).toBe(s);
    }
  });

  it("desde e castração ao abrir e salvar", () => {
    const pet = { entrou_em: "2026-01-01", lar_em: "2026-03-01", adotado_em: null, obito_em: null };
    expect(desdeDaSituacao(pet, "lar")).toBe("2026-03-01");
    expect(desdeDaSituacao(pet, "rua")).toBeNull();
    expect(dataDaCastracao("sim", null, false, "2026-10")).toBe("2026-10-01");
    expect(dataDaCastracao("sim", "2026-02-01", true, "2026-10")).toBe("2026-02-01");
    expect(dataDaCastracao("sim", null, true, "2026-10")).toBeNull();
    expect(dataDaCastracao("nao", "2026-02-01", true, "2026-10")).toBeNull();
  });

  it("tempo desde", () => {
    expect([0, 1, 4].map(tempoDesde)).toEqual(["desde este mês", "há 1 mês", "há 4 meses"]);
  });
});

describe("linkDoWhatsApp", () => {
  it("telefone com DDD ganha o 55 do Brasil", () => {
    expect(linkDoWhatsApp("(61) 99999-0000")).toBe("https://wa.me/5561999990000");
    expect(linkDoWhatsApp("61 3333-4444")).toBe("https://wa.me/556133334444");
  });
  it("com o 55 fica como está", () => {
    expect(linkDoWhatsApp("+55 61 99999-0000")).toBe("https://wa.me/5561999990000");
  });
  it("sem DDD, vazio ou estranho: sem link", () => {
    expect(linkDoWhatsApp("99999-0000")).toBeNull();
    expect(linkDoWhatsApp(null)).toBeNull();
    expect(linkDoWhatsApp("+1 555 123 4567 89")).toBeNull();
  });
});
