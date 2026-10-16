// Gera supabase/seed.sql a partir do protótipo (dados fictícios).
// Uso: node scripts/gerar-seed.mjs
//
// Fontes: dados.js (pets, despesas de ago a out, cores), index.html (IN, OUT, CNT,
// totais por categoria), admin-contribuicoes.html e admin-membros.html (24 membros),
// app.js (CAMP_DEFAULT). Despesas e contribuições de jan a jul são inventadas, mas
// somam exatamente os totais do protótipo. Tudo é determinístico.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const prototipo = join(raiz, "..", "sospets-design", "sospets-kit", "design");

// --- leitura do protótipo ----------------------------------------------------

const dados = vm.runInNewContext(
  readFileSync(join(prototipo, "dados.js"), "utf8") +
    "\n;({ PETS, DESPESAS, COR_CAT, COR_OUTRAS })",
);
const indexHtml = readFileSync(join(prototipo, "index.html"), "utf8");
const lerArray = (nome) =>
  JSON.parse(
    indexHtml
      .match(new RegExp(`const ${nome}\\s*=\\s*(\\[[^\\]]*\\])`))[1]
      .replace(/'/g, '"'),
  );
const IN = lerArray("IN");
const OUT = lerArray("OUT");
const CNT = lerArray("CNT");
const CATS = lerArray("CATS");
const BY_SET = lerArray("BY_SET");
const BY_OUT = lerArray("BY_OUT");

const NOMES_MEMBROS = [
  "Ana Exemplo", "Bruno Teste", "Carla Modelo", "Diego Amostra", "Elisa Fictícia", "Fábio Demo",
  "Gisele Piloto", "Hugo Exemplo", "Irene Teste", "João Modelo", "Karina Amostra", "Lucas Fictício",
  "Marta Demo", "Nelson Piloto", "Olívia Exemplo", "Paulo Teste", "Quésia Modelo", "Rafael Amostra",
  "Sofia Fictícia", "Tiago Demo", "Úrsula Piloto", "Vera Exemplo", "Wagner Teste", "Yara Modelo",
];
// admin-membros.html: Carla e Karina pagam R$ 30, Elisa R$ 50; Yara está inativa
const VALOR_PROPRIO = { 2: 30, 10: 30, 4: 50 };
const INATIVO = 23;

const NOMES_AVULSOS = [null, "Beatriz Exemplo", null, "Carlos Teste", null, "Daniela Modelo", null, "Eduardo Amostra"];

// --- utilidades ---------------------------------------------------------------

// uuid determinístico a partir de um rótulo
const uuid = (rotulo) => {
  const h = createHash("sha1").update("sospets:" + rotulo).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
// gerador pseudoaleatório determinístico (mulberry32)
let semente = 20261014;
const aleatorio = () => {
  semente = (semente + 0x6d2b79f5) | 0;
  let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const escolher = (lista) => lista[Math.floor(aleatorio() * lista.length)];
const centavos = (v) => Math.round(v * 100);
const reais = (c) => (c / 100).toFixed(2);
const soma = (a) => a.reduce((x, y) => x + y, 0);
const mesDe = (i) => `2026-${String(i + 1).padStart(2, "0")}`;
const sql = (v) =>
  v === null || v === undefined ? "null" : typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const confere = (cond, msg) => {
  if (!cond) throw new Error("Seed inconsistente: " + msg);
};

// --- categorias, campanhas, membros, pets --------------------------------------

const categorias = CATS.map((nome, ordem) => ({
  id: uuid("categoria:" + nome),
  nome,
  cor: dados.COR_CAT[nome] || dados.COR_OUTRAS,
  ordem,
}));
const idCategoria = Object.fromEntries(categorias.map((c) => [c.nome, c.id]));

const campanhas = {
  stuart: {
    id: uuid("campanha:stuart"),
    nome: "Campanha Stuart (exemplo)",
    descricao: "Tratamento e cirurgia do Stuart, resgatado na quadra 105.",
    meta: 2000,
    inicio: "2026-08-10",
    situacao: "em_andamento",
  },
  nelson: {
    id: uuid("campanha:nelson"),
    nome: "Campanha Nelson (exemplo)",
    descricao: "Resgate e recuperação do Nelson.",
    meta: 640,
    inicio: "2026-03-02",
    situacao: "encerrada",
  },
};

const membros = NOMES_MEMBROS.map((nome, i) => ({
  id: uuid("membro:" + nome),
  nome,
  valor_mensal: VALOR_PROPRIO[i] ?? null,
  ativo: i !== INATIVO,
}));
const valorMembro = (i) => VALOR_PROPRIO[i] ?? 20;

// locais fictícios, só para os testes conferirem que nunca aparecem no site
const LOCAIS = ["Perto da padaria, quadra 105 (exemplo)", "Praça da quadra 104 (exemplo)", "Estacionamento do parque (exemplo)"];
const pets = dados.PETS.map((p, i) => ({
  id: uuid("pet:" + p.n),
  nome: p.n,
  especie: p.e,
  sexo: p.sx,
  faixa_idade: p.id,
  pelagem: p.pel,
  entrou_em: p.ent + "-01",
  lar_em: p.lar ? p.lar + "-01" : null,
  adotado_em: p.ado ? p.ado + "-01" : null,
  obito_em: p.obito ? p.obito + "-01" : null,
  castrado: p.cast ? "sim" : "nao_sei",
  castrado_em: p.cast ? p.cast + "-01" : null,
  vacinado: !!p.vac,
  vermifugado: !!p.verm,
  fiv_felv_testado: !!p.fiv,
  precisa_lar: !!p.precisaLar,
  necessidade: p.nec || null,
  local: i % 4 === 0 ? LOCAIS[(i / 4) % LOCAIS.length] : null,
  // o catálogo mostra o cadastro mais recente primeiro: o primeiro de dados.js é o mais novo
  criado_em: new Date(Date.UTC(2026, 9, 1, 15) - i * 60_000).toISOString(),
  _orig: p,
}));
const petPorNome = Object.fromEntries(pets.map((p) => [p.nome, p]));

// mesma regra de situacaoPet() do protótipo
const situacao = (p, ym) => {
  const o = p._orig;
  if (o.ent > ym) return null;
  if (o.obito && o.obito <= ym) return "falecido";
  if (o.ado && o.ado <= ym) return "adotado";
  if (o.lar && o.lar <= ym) return "lar";
  return "rua";
};

// --- despesas ------------------------------------------------------------------

const despesas = [];
const novaDespesa = (d) => despesas.push({ id: uuid(`despesa:${despesas.length}:${d.data}:${d.descricao}`), ...d });

// agosto a outubro: exatamente como em dados.js
for (const d of dados.DESPESAS) {
  novaDespesa({
    data: d.d,
    descricao: d.t,
    valor: centavos(d.v),
    categoria: d.c,
    pet: d.a ? petPorNome[d.a] : null,
    campanha: null,
  });
}

// janeiro a julho: tabela mês × categoria que soma OUT de cada mês e, com ago, set e o Nelson,
// os totais por categoria de BY_SET (ajuste proporcional iterativo a partir dos pesos do protótipo)
const MESES_GERADOS = 7;
// despesas da Campanha Nelson (encerrada; R$ 640 gastos com o Nelson em março e abril)
const despesasNelson = [
  { mes: 2, categoria: "Castração", descricao: "Castração", valor: 25000 },
  { mes: 2, categoria: "Veterinário e consultas", descricao: "Consulta e vermífugo", valor: 15000 },
  { mes: 2, categoria: "Medicamentos", descricao: "Medicação pós-cirúrgica", valor: 9000 },
  { mes: 2, categoria: "Exames", descricao: "Exame de sangue", valor: 8000 },
  { mes: 3, categoria: "Veterinário e consultas", descricao: "Consulta de retorno", valor: 7000 },
];
confere(soma(despesasNelson.map((d) => d.valor)) === 64000, "Nelson deve somar R$ 640");

const restantePorCategoria = CATS.map((c, k) => {
  const agoSet = soma(dados.DESPESAS.filter((d) => d.c === c && d.d < "2026-10").map((d) => centavos(d.v)));
  const nelson = soma(despesasNelson.filter((d) => d.categoria === c).map((d) => d.valor));
  return centavos(BY_SET[k]) - agoSet - nelson;
});
// o Nelson já está reservado; a tabela distribui o resto
const alvoMes = OUT.slice(0, MESES_GERADOS).map(
  (v, i) => centavos(v) - soma(despesasNelson.filter((d) => d.mes === i).map((d) => d.valor)),
);
confere(soma(alvoMes) === soma(restantePorCategoria), "jan a jul não fecha com BY_SET");

const peso = (i) => BY_SET.map((v, k) => v * (1 + 0.35 * Math.sin((i + 1) * (k + 2)))); // WEIGHT() do index.html
let tabela = alvoMes.map((_, i) => peso(i));
for (let rodada = 0; rodada < 500; rodada++) {
  tabela = tabela.map((linha, i) => linha.map((v) => (v * alvoMes[i]) / soma(linha)));
  const colunas = CATS.map((_, k) => soma(tabela.map((l) => l[k])));
  tabela = tabela.map((linha) => linha.map((v, k) => (colunas[k] ? (v * restantePorCategoria[k]) / colunas[k] : 0)));
}
// arredonda para R$ 5; o maior mês e a maior categoria absorvem as sobras,
// para que linhas e colunas fechem no centavo
tabela = tabela.map((l) => l.map((v) => Math.round(v / 500) * 500));
const mesAbsorve = alvoMes.indexOf(Math.max(...alvoMes));
const catAbsorve = restantePorCategoria.indexOf(Math.max(...restantePorCategoria));
tabela.forEach((l, i) => {
  if (i !== mesAbsorve) l[catAbsorve] = alvoMes[i] - soma(l.filter((_, k) => k !== catAbsorve));
});
CATS.forEach((_, k) => {
  if (k === catAbsorve) return;
  tabela[mesAbsorve][k] = restantePorCategoria[k] - soma(tabela.filter((_, i) => i !== mesAbsorve).map((l) => l[k]));
});
tabela[mesAbsorve][catAbsorve] =
  alvoMes[mesAbsorve] - soma(tabela[mesAbsorve].filter((_, k) => k !== catAbsorve));
tabela.forEach((l, i) => l.forEach((v, k) => confere(v >= 0, `valor negativo em ${CATS[k]}/${mesDe(i)}`)));
tabela.forEach((l, i) => confere(soma(l) === alvoMes[i], `mês ${i + 1} não fecha`));
CATS.forEach((_, k) => confere(soma(tabela.map((l) => l[k])) === restantePorCategoria[k], `categoria ${CATS[k]} não fecha`));

const DESCRICOES = {
  "Veterinário e consultas": ["Consulta", "Consulta e vermífugo", "Consulta de retorno", "Consulta e antibiótico"],
  Medicamentos: ["Antipulgas", "Medicação pós-cirúrgica", "Vermífugo", "Antibiótico"],
  Exames: ["Exame de sangue", "Hemograma", "Raio-X"],
  Transporte: ["Transporte até a clínica", "Transporte de animal resgatado"],
  Outros: ["Coleiras e guias", "Caixa de transporte"],
};
const acompanhados = (ym) => pets.filter((p) => ["rua", "lar"].includes(situacao(p, ym)));
const dia = () => String(2 + Math.floor(aleatorio() * 26)).padStart(2, "0");

// divide um valor (centavos) em n partes, múltiplos de R$ 5 quando possível
const dividir = (total, n) => {
  if (n <= 1) return [total];
  const partes = [];
  let resto = total;
  for (let j = 0; j < n - 1; j++) {
    const parte = Math.max(500, Math.round(((resto / (n - j)) * (0.7 + aleatorio() * 0.6)) / 500) * 500);
    partes.push(parte);
    resto -= parte;
  }
  partes.push(resto);
  return partes.every((p) => p > 0) ? partes : [total];
};

for (let i = 0; i < MESES_GERADOS; i++) {
  const ym = mesDe(i);
  CATS.forEach((cat, k) => {
    const valor = tabela[i][k];
    for (const n of despesasNelson.filter((d) => d.mes === i && d.categoria === cat)) {
      novaDespesa({ data: `${ym}-${dia()}`, descricao: n.descricao, valor: n.valor, categoria: cat, pet: petPorNome.Nelson, campanha: campanhas.nelson });
    }
    if (valor <= 0) return;

    if (cat === "Castração") {
      // castrações do mês, uma por pet castrado nele (sem os do Nelson, já lançados)
      const castrados = pets.filter((p) => p._orig.cast === ym && p.nome !== "Nelson");
      const alvos = castrados.length ? castrados : [escolher(acompanhados(ym))];
      dividir(valor, alvos.length).forEach((v, j) =>
        novaDespesa({ data: `${ym}-${dia()}`, descricao: "Castração", valor: v, categoria: cat, pet: alvos[j] ?? null, campanha: null }),
      );
      return;
    }
    const n = valor < 8000 ? 1 : valor < 25000 ? 2 : 3;
    dividir(valor, n).forEach((v) => {
      let pet = null;
      let descricao;
      if (cat === "Ração") {
        descricao = escolher(["Ração para gatos de rua", "Ração para cães de rua"]);
      } else if (cat === "Lar temporário") {
        const emLar = pets.filter((p) => situacao(p, ym) === "lar");
        pet = emLar.length ? escolher(emLar) : null;
        descricao = escolher(["Areia higiênica no lar temporário", "Ração no lar temporário"]);
      } else if (cat === "Vacinas") {
        pet = escolher(acompanhados(ym));
        descricao = pet.especie === "gato" ? "Vacina V4" : "Vacina V10";
      } else {
        pet = cat === "Outros" ? null : escolher(acompanhados(ym));
        descricao = escolher(DESCRICOES[cat]);
      }
      novaDespesa({ data: `${ym}-${dia()}`, descricao, valor: v, categoria: cat, pet, campanha: null });
    });
  });
}

// conferência final das despesas contra o protótipo
OUT.forEach((v, i) =>
  confere(soma(despesas.filter((d) => d.data.startsWith(mesDe(i))).map((d) => d.valor)) === centavos(v), `OUT de ${mesDe(i)}`),
);
CATS.forEach((c, k) =>
  confere(
    soma(despesas.filter((d) => d.categoria === c).map((d) => d.valor)) === centavos(BY_SET[k] + BY_OUT[k]),
    `total de ${c}`,
  ),
);

// uma despesa cancelada (lançada em duplicidade), que não pode entrar em nenhuma soma
const duplicada = {
  id: uuid("despesa:duplicada"),
  data: "2026-10-06",
  descricao: "Ração para gatos de rua",
  valor: 12000,
  categoria: "Ração",
  pet: null,
  campanha: null,
  cancelada_em: "2026-10-06 18:40:00-03",
  motivo: "lançada em duplicidade",
};

// --- contribuições ---------------------------------------------------------------

// quantos membros pagaram em cada mês (jan a set); o resto de CNT são doações avulsas.
// Ago e set têm poucos membros para a Campanha Stuart chegar a R$ 1.200 só com avulsas.
const MEMBROS_POR_MES = [10, 13, 17, 16, 19, 21, 17, 10, 10];
// último mês em que cada um contribuiu (o aviso "sem contribuir há X meses" do admin)
const ULTIMO_MES = { 20: 6, 21: 7, [INATIVO]: 2 }; // Úrsula: jul; Vera: ago; Yara: mar
// precisam aparecer no mês: o último mês de quem parou e "contribuiu no mês anterior" em out
const OBRIGATORIOS = { 2: [INATIVO], 6: [20], 7: [21], 8: [18, 19, 22] };

const contribuicoes = [];
const novaContribuicao = (c) =>
  contribuicoes.push({ id: uuid(`contribuicao:${contribuicoes.length}:${c.competencia}`), ...c });

for (let i = 0; i < 10; i++) {
  const ym = mesDe(i);
  let pagantes;
  if (i === 9) {
    // outubro: os 18 primeiros, R$ 410,00 (igual à Área do administrador)
    pagantes = [...Array(18).keys()];
  } else {
    const pode = (m) => (ULTIMO_MES[m] ?? 99) >= i;
    // ago e set: só quem paga R$ 20, para sobrar espaço às avulsas da campanha
    const cabe = (m) => (i >= 7 ? valorMembro(m) === 20 : true);
    pagantes = [...(OBRIGATORIOS[i] ?? [])];
    for (let j = 0; pagantes.length < MEMBROS_POR_MES[i]; j++) {
      const m = (i * 5 + j) % 24;
      if (pode(m) && cabe(m) && !pagantes.includes(m)) pagantes.push(m);
    }
  }
  for (const m of pagantes) {
    novaContribuicao({
      competencia: `${ym}-01`,
      valor: valorMembro(m) * 100,
      membro: membros[m],
      nome_avulso: null,
      campanha: null,
      criado_em: `${ym}-0${1 + (m % 7)} 12:00:00-03`,
    });
  }

  // avulsas: completam CNT e IN do mês
  const qtd = CNT[i] - pagantes.length;
  const totalAvulsas = centavos(IN[i]) - soma(pagantes.map((m) => valorMembro(m) * 100));
  confere(qtd >= 0 && (qtd > 0 || totalAvulsas === 0), `avulsas de ${ym}`);
  if (qtd === 0) continue;

  // as primeiras avulsas do mês vão para a campanha do momento, com valores fixos
  const daCampanha =
    i === 2 ? { campanha: campanhas.nelson, valores: [10000, 8000, 6000, 5000, 5000, 2000] } :
    i === 3 ? { campanha: campanhas.nelson, valores: [10000, 8000, 5000, 3000, 2000] } :
    i === 7 ? { campanha: campanhas.stuart, valores: [10000, 8000, 6000, 6000, 5000, 5000, 4000, 3000, 3000, 2000, 2000, 1000] } :
    i === 8 ? { campanha: campanhas.stuart, valores: null } : // completa R$ 1.200
    null;
  let valores = [];
  let campanhaDe = () => null;
  if (daCampanha) {
    let deCampanha = daCampanha.valores;
    if (!deCampanha) {
      const jaTem = soma(contribuicoes.filter((c) => c.campanha === campanhas.stuart).map((c) => c.valor));
      deCampanha = dividir(120000 - jaTem, qtd - 1);
    }
    const resto = totalAvulsas - soma(deCampanha);
    const outras = qtd - deCampanha.length;
    confere(resto > 0 && outras > 0, `avulsas fora da campanha em ${ym}`);
    valores = [...deCampanha, ...dividir(resto, outras)];
    campanhaDe = (j) => (j < deCampanha.length ? daCampanha.campanha : null);
  } else {
    valores = dividir(totalAvulsas, qtd);
  }
  confere(valores.length === qtd && valores.every((v) => v > 0), `valores das avulsas de ${ym}`);
  valores.forEach((v, j) =>
    novaContribuicao({
      competencia: `${ym}-01`,
      valor: v,
      membro: null,
      nome_avulso: NOMES_AVULSOS[(i + j) % NOMES_AVULSOS.length],
      campanha: campanhaDe(j),
      // avulsas da campanha Stuart só a partir de 10/08
      criado_em: `${ym}-${String(i === 7 ? 10 + (j % 18) : 1 + (j % 27)).padStart(2, "0")} 12:00:00-03`,
    }),
  );
}

IN.forEach((v, i) => {
  const doMes = contribuicoes.filter((c) => c.competencia.startsWith(mesDe(i)));
  confere(soma(doMes.map((c) => c.valor)) === centavos(v), `IN de ${mesDe(i)}`);
  confere(doMes.length === CNT[i], `CNT de ${mesDe(i)}`);
});
confere(soma(contribuicoes.filter((c) => c.campanha === campanhas.stuart).map((c) => c.valor)) === 120000, "Stuart arrecadou R$ 1.200");
confere(soma(contribuicoes.filter((c) => c.campanha === campanhas.nelson).map((c) => c.valor)) === 64000, "Nelson arrecadou R$ 640");

// contribuição de Sofia em outubro desfeita pelo admin: cancelada, não soma
const desfeita = {
  id: uuid("contribuicao:desfeita"),
  competencia: "2026-10-01",
  valor: 2000,
  membro: membros[18],
  criado_em: "2026-10-07 20:30:00-03",
  cancelada_em: "2026-10-07 20:31:00-03",
  motivo: "Desfeita no painel",
};

// --- SQL ------------------------------------------------------------------------

const linhas = (itens, f) => itens.map((x) => `  (${f(x).join(", ")})`).join(",\n");

const saida = `-- Dados fictícios do protótipo, para desenvolvimento local e homologação.
-- NUNCA rodar em produção. Gerado por scripts/gerar-seed.mjs: não edite à mão.
--
-- Conferência rápida: outubro de 2026 → entrou R$ 410,00, saiu R$ 354,00,
-- 18 contribuições, 4 despesas.

-- o seed não aparece no histórico de alterações (só os exemplos do fim)
alter table public.contribuicoes disable trigger registrar_historico;
alter table public.despesas disable trigger registrar_historico;
alter table public.pets disable trigger registrar_historico;
alter table public.membros disable trigger registrar_historico;
alter table public.campanhas disable trigger registrar_historico;
alter table public.categorias disable trigger registrar_historico;

insert into public.configuracoes (dados_desde, valor_padrao, aviso_meses)
values ('2026-01-01', 20, 3);

insert into public.categorias (id, nome, cor, ordem) values
${linhas(categorias, (c) => [sql(c.id), sql(c.nome), sql(c.cor), c.ordem])};

insert into public.campanhas (id, nome, descricao, meta, inicio, situacao) values
${linhas(Object.values(campanhas), (c) => [sql(c.id), sql(c.nome), sql(c.descricao), c.meta, sql(c.inicio), sql(c.situacao)])};

insert into public.membros (id, nome, valor_mensal, ativo) values
${linhas(membros, (m) => [sql(m.id), sql(m.nome), m.valor_mensal ?? "null", m.ativo])};

insert into public.pets (id, nome, especie, sexo, faixa_idade, pelagem, entrou_em, lar_em, adotado_em, obito_em,
  castrado, castrado_em, vacinado, vermifugado, fiv_felv_testado, precisa_lar, necessidade, local, criado_em) values
${linhas(pets, (p) => [
  sql(p.id), sql(p.nome), sql(p.especie), sql(p.sexo), sql(p.faixa_idade), sql(p.pelagem),
  sql(p.entrou_em), sql(p.lar_em), sql(p.adotado_em), sql(p.obito_em),
  sql(p.castrado), sql(p.castrado_em), p.vacinado, p.vermifugado, p.fiv_felv_testado, p.precisa_lar,
  sql(p.necessidade), sql(p.local), sql(p.criado_em),
])};

insert into public.despesas (id, data, descricao, valor, categoria_id, pet_id, campanha_id, cancelada_em, motivo_cancelamento, criado_em) values
${linhas([...despesas, duplicada], (d) => [
  sql(d.id), sql(d.data), sql(d.descricao), reais(d.valor), sql(idCategoria[d.categoria]),
  sql(d.pet?.id), sql(d.campanha?.id), sql(d.cancelada_em), sql(d.motivo), sql(`${d.data} 12:00:00-03`),
])};

insert into public.contribuicoes (id, competencia, valor, membro_id, nome_avulso, campanha_id, cancelada_em, motivo_cancelamento, criado_em) values
${linhas([...contribuicoes, desfeita], (c) => [
  sql(c.id), sql(c.competencia), reais(c.valor), sql(c.membro?.id), sql(c.nome_avulso), sql(c.campanha?.id),
  sql(c.cancelada_em), sql(c.motivo), sql(c.criado_em),
])};

alter table public.contribuicoes enable trigger registrar_historico;
alter table public.despesas enable trigger registrar_historico;
alter table public.pets enable trigger registrar_historico;
alter table public.membros enable trigger registrar_historico;
alter table public.campanhas enable trigger registrar_historico;
alter table public.categorias enable trigger registrar_historico;

-- exemplos da tela "Histórico de alterações" (admin-mais.html)
insert into public.historico (quando, tabela, registro_id, acao, resumo, depois) values
  (now() - interval '5 minutes', 'contribuicoes', ${sql(contribuicoes.find((c) => c.competencia === "2026-10-01").id)}, 'criou', 'Contribuição registrada', '{"valor": 20}'),
  (now() - interval '35 minutes', 'despesas', ${sql(despesas.find((d) => d.data === "2026-10-06").id)}, 'criou', 'Despesa criada: Ração para gatos de rua', '{"valor": 120}'),
  (now() - interval '1 day 2 hours', 'pets', ${sql(petPorNome.Luna.id)}, 'alterou', 'Pet alterado: Luna passou para lar temporário', null),
  (now() - interval '1 day 2 hours 30 minutes', 'despesas', ${sql(duplicada.id)}, 'cancelou', 'Despesa cancelada: lançada em duplicidade', '{"valor": 120}');
`;

writeFileSync(join(raiz, "supabase", "seed.sql"), saida);
console.log(
  `seed.sql gerado: ${pets.length} pets, ${membros.length} membros, ${despesas.length + 1} despesas, ` +
    `${contribuicoes.length + 1} contribuições (1 despesa e 1 contribuição canceladas).`,
);
