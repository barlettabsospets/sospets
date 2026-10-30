// T1.11: lê a planilha real e mostra um relatório antes de gravar qualquer coisa.
// Uso (dentro de web/): node scripts/importar-planilha.ts [dados-reais/importacao.json]
//
// O script é genérico e vai para o git. Tudo o que é da planilha real (colunas de cada mês,
// nomes de pets nos rótulos, quem fica anônimo) está na configuração em dados-reais/,
// fora do git. O relatório também é gravado lá, porque tem nomes de pessoas.
//
// Gravar (só num banco sem membros, contribuições, despesas nem campanhas):
//   node --env-file=.env.local scripts/importar-planilha.ts --gravar --projeto=<ref do projeto>
// O --projeto precisa ser o mesmo do NEXT_PUBLIC_SUPABASE_URL: evita gravar no banco errado.

import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// --- tipos -------------------------------------------------------------------------

type Colunas = { nome: string; valor: string; item: string; gasto: string };
type ConfigMes = Colunas & { mes: string; aba: string; rotuloInicial?: string };
type ConfigCampanha = Omit<Colunas, "nome"> & {
  nome: string;
  nome_col: string;
  mes: string;
  inicio: string;
  situacao: "em_andamento" | "encerrada";
  pet?: string;
  aba: string;
  // o saldo da campanha já entrou no caixa da planilha por uma linha de transferência
  saldoJaNoCaixaDaPlanilha: boolean;
};
type Rotulo = { pet: string } | { grupo: string | null };
// membro fixo: o nome que vai para o cadastro e as outras grafias usadas na planilha
export type ConfigMembro = { nome: string; grafias?: string[] };
type Config = {
  planilha: string;
  // aba "Membros" preenchida pela equipe: nome final, tipo, valor mensal e se está ativo
  cadastro?: { planilha: string; aba: string };
  // grafias da planilha que a aba "Membros" não tem → nome final
  grafias?: Record<string, string>;
  meses: ConfigMes[];
  campanhas: ConfigCampanha[];
  ignorarNomes: string[];
  anonimos: string[];
  membros?: ConfigMembro[];
  rotulos: Record<string, Rotulo>;
  conferenciaSaldo?: { aba: string; celula: string; ate: string };
};

export type Celula = string | number | null;

type Contribuicao = { competencia: string; valor: number; nome: string | null; campanha: string | null; origem: string };
type Despesa = {
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  petCitado: string | null;
  campanha: string | null;
  origem: string;
  // vários itens numa célula de valor mesclada
  juntaItens?: boolean;
};
type Bloco = {
  contribuicoes: Contribuicao[];
  despesas: Despesa[];
  totalEntrouPlanilha: number | null;
  totalSaiuPlanilha: number | null;
};

// --- regras puras (testadas em importar-planilha.test.ts) ------------------------------------

const semAcento = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Membro a que um nome da planilha se refere, pelo nome ou por uma das grafias
// (sem acento, maiúsculas nem espaços sobrando). null = não é membro: doação avulsa.
export function membroDoNome(nome: string, membros: ConfigMembro[]): string | null {
  const t = semAcento(nome).replace(/\s+/g, " ");
  const m = membros.find((m) => [m.nome, ...(m.grafias ?? [])].some((g) => semAcento(g).replace(/\s+/g, " ") === t));
  return m?.nome ?? null;
}

// Categoria pelo texto do item. A ordem importa: "Cx transporte" é equipamento, não transporte.
const REGRAS_CATEGORIA: [RegExp, string][] = [
  [/castra/, "Castração"],
  [/\bfiv\b|hemograma|exame|ultrassom|raio-?x/, "Exames"],
  [/vacina/, "Vacinas"],
  [/consulta|internac|veterin/, "Veterinário e consultas"],
  [/vermifugo|antipulga|nexgard|remedio|medica|pomada|antibiotico/, "Medicamentos"],
  [/cx transporte|caixa de transporte|gatoeira/, "Outros"],
  [/uber|transporte/, "Transporte"],
  [/areia|tapete|pa higienica|lar temporario/, "Lar temporário"],
  [/racao|sache|petisco/, "Ração"],
];

export function categoriaDoItem(item: string): { categoria: string; reconhecida: boolean } {
  const t = semAcento(item);
  for (const [regra, categoria] of REGRAS_CATEGORIA) {
    if (regra.test(t)) return { categoria, reconhecida: true };
  }
  return { categoria: "Outros", reconhecida: false };
}

// Valor de uma célula do exceljs: número, texto, fórmula (usa o resultado) ou texto rico.
export function valorDaCelula(v: ExcelJS.CellValue): Celula {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  if (typeof v === "object" && "result" in v) return valorDaCelula(v.result as ExcelJS.CellValue);
  if (typeof v === "object" && "richText" in v) return v.richText.map((p) => p.text).join("").trim() || null;
  return String(v);
}

// --- cadastro de membros (aba "Membros") ---------------------------------------------------

// Uma linha da aba: uma grafia da planilha, com os meses em que aparece e o que fazer com ela
export type LinhaCadastro = {
  nome: string;
  meses: string;
  nomeFinal: string | null;
  fixo: boolean;
  valorMensal: number | null;
  ativo: boolean;
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "jan, fev (campanha Stuart)" → ["2026-01", "2026-02 Stuart"]: mês, e a campanha quando houver
export function mesesDoCadastro(texto: string, ano: number): string[] {
  return texto.split(",").map((t) => t.trim()).filter(Boolean).flatMap((t) => {
    const m = /^([a-zç]{3})\b(?:\s*\(campanha\s+(.+)\))?/i.exec(semAcento(t));
    const i = m ? MESES.indexOf(m[1]) : -1;
    if (i < 0) return [];
    const mes = `${ano}-${String(i + 1).padStart(2, "0")}`;
    return [m![2] ? `${mes} ${m![2].trim()}` : mes];
  });
}

// Quem é a pessoa de uma contribuição. A mesma grafia pode ser duas pessoas em meses
// diferentes ("Bruno" em maio e em julho): aí decide o mês.
export function linhaDoCadastro(
  nome: string,
  competencia: string,
  campanha: string | null,
  cadastro: LinhaCadastro[],
): LinhaCadastro | null {
  const t = semAcento(nome).replace(/\s+/g, " ");
  const ano = Number(competencia.slice(0, 4));
  const mes = competencia.slice(0, 7);
  const noMes = (l: LinhaCadastro) =>
    mesesDoCadastro(l.meses, ano).some((m) => {
      const [mm, ...camp] = m.split(" ");
      return mm === mes && (campanha ? semAcento(campanha).includes(semAcento(camp.join(" ")) || "\0") : camp.length === 0);
    });
  const igual = (a: string) => semAcento(a).replace(/\s+/g, " ") === t;
  const candidatas = cadastro.filter((l) => igual(l.nome));
  if (candidatas.length === 1) return candidatas[0];
  if (candidatas.length > 1) {
    const doMes = candidatas.filter(noMes);
    return doMes.length === 1 ? doMes[0] : null;
  }
  // grafia já traduzida para o nome final (configuração "grafias")
  const finais = cadastro.filter((l) => l.nomeFinal && igual(l.nomeFinal));
  return new Set(finais.map((l) => l.nomeFinal)).size === 1 ? finais[0] : null;
}

export type ContribuicaoGravar = {
  competencia: string;
  valor: number; // centavos
  membro: string | null; // nome final do membro fixo
  nomeAvulso: string | null; // doação avulsa; null = "Anônimo"
  campanha: string | null;
};

// Contribuições da planilha → linhas do banco. Membro fixo só fora de campanha (no admin,
// doação para campanha é sempre avulsa); o mesmo membro duas vezes no mês vira uma só.
export function contribuicoesParaGravar(
  lidas: { competencia: string; valor: number; nome: string | null; campanha: string | null; origem: string }[],
  cadastro: LinhaCadastro[],
  // grafia da planilha que a aba "Membros" não tem → nome final ("Beto" → "Roberto Exemplo")
  grafias: Record<string, string> = {},
): { linhas: ContribuicaoGravar[]; avisos: string[] } {
  const avisos: string[] = [];
  const traduzir = new Map(Object.entries(grafias).map(([g, n]) => [semAcento(g), n]));
  const porMembroMes = new Map<string, ContribuicaoGravar>();
  const linhas: ContribuicaoGravar[] = [];
  for (const c of lidas) {
    if (c.nome === null) {
      linhas.push({ competencia: c.competencia, valor: c.valor, membro: null, nomeAvulso: null, campanha: c.campanha });
      continue;
    }
    const l = linhaDoCadastro(c.nome, c.competencia, c.campanha, cadastro)
      ?? linhaDoCadastro(traduzir.get(semAcento(c.nome)) ?? "", c.competencia, c.campanha, cadastro);
    if (!l?.nomeFinal) avisos.push(`${c.origem}: "${c.nome}" sem nome final no cadastro; entra como avulsa com o nome da planilha`);
    const nomeFinal = l?.nomeFinal ?? c.nome.trim();
    if (l?.fixo && l.nomeFinal && !c.campanha) {
      const chave = `${l.nomeFinal}|${c.competencia}`;
      const ja = porMembroMes.get(chave);
      if (ja) ja.valor += c.valor;
      else {
        const nova = { competencia: c.competencia, valor: c.valor, membro: l.nomeFinal, nomeAvulso: null, campanha: null };
        porMembroMes.set(chave, nova);
        linhas.push(nova);
      }
      continue;
    }
    linhas.push({ competencia: c.competencia, valor: c.valor, membro: null, nomeAvulso: nomeFinal, campanha: c.campanha });
  }
  return { linhas, avisos };
}

// Membros fixos do cadastro (um por nome final). Se as linhas divergirem, vale a primeira com valor.
export function membrosDoCadastro(cadastro: LinhaCadastro[]): { nome: string; valorMensal: number | null; ativo: boolean }[] {
  const porNome = new Map<string, { nome: string; valorMensal: number | null; ativo: boolean }>();
  for (const l of cadastro.filter((l) => l.fixo && l.nomeFinal)) {
    const m = porNome.get(l.nomeFinal!) ?? { nome: l.nomeFinal!, valorMensal: null, ativo: l.ativo };
    m.valorMensal ??= l.valorMensal;
    porNome.set(m.nome, m);
  }
  return [...porNome.values()];
}

// Pet citado na planilha → id no banco, pelo nome (sem acento; "Mortícia e Ophelia" e
// "Banguela/Heitor" valem por cada nome). Só pets visíveis e sem nome repetido.
export function petDoNome(nome: string, pets: { id: string; nome: string; oculto: boolean }[]): string | null {
  const t = semAcento(nome);
  const achados = pets.filter((p) => !p.oculto && p.nome.split(/\s+e\s+|\//).some((n) => semAcento(n) === t));
  return achados.length === 1 ? achados[0].id : null;
}

export const centavos = (v: number) => Math.round(v * 100);
export const reais = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// --- leitura ------------------------------------------------------------------------

type Problema = { origem: string; texto: string };

function lerBloco(
  ws: ExcelJS.Worksheet,
  cols: Colunas,
  contexto: { mes: string; campanha: string | null; rotuloInicial?: string; pet?: string },
  cfg: Config,
  problemas: Problema[],
): Bloco {
  const cel = (col: string, linha: number) => valorDaCelula(ws.getCell(`${col}${linha}`).value);
  const bloco: Bloco = { contribuicoes: [], despesas: [], totalEntrouPlanilha: null, totalSaiuPlanilha: null };
  const ignorar = new Set(cfg.ignorarNomes.map(semAcento));
  const anonimos = new Set(cfg.anonimos.map(semAcento));
  const ultima = ws.rowCount;

  // contribuições: da linha 3 até "Total"
  for (let l = 3; l <= ultima; l++) {
    const nome = cel(cols.nome, l);
    const valor = cel(cols.valor, l);
    const origem = `${ws.name}!${cols.nome}${l}`;
    if (typeof nome === "string" && semAcento(nome).startsWith("total")) {
      bloco.totalEntrouPlanilha = typeof valor === "number" ? centavos(valor) : null;
      break;
    }
    if (nome === null && valor === null) continue;
    if (typeof nome === "string" && ignorar.has(semAcento(nome))) {
      problemas.push({ origem, texto: `Ignorada (configuração): "${nome}" ${typeof valor === "number" ? reais(centavos(valor)) : ""}` });
      continue;
    }
    if (typeof valor !== "number" || valor <= 0) {
      problemas.push({ origem, texto: `Contribuição sem valor válido: "${nome ?? ""}" = ${JSON.stringify(valor)}` });
      continue;
    }
    const anonimo = nome === null || anonimos.has(semAcento(String(nome)));
    bloco.contribuicoes.push({
      competencia: `${contexto.mes}-01`,
      valor: centavos(valor),
      nome: anonimo ? null : String(nome),
      campanha: contexto.campanha,
      origem,
    });
  }

  // despesas: rótulos (pet ou grupo) marcam os itens abaixo deles
  let rotulo: string | null = contexto.rotuloInicial ?? null;
  // célula de valor mesclada: os itens dividem um valor só e viram uma despesa
  const porCelulaMestre = new Map<string, Despesa>();
  for (let l = 3; l <= ultima; l++) {
    const item = cel(cols.item, l);
    const celulaValor = ws.getCell(`${cols.gasto}${l}`);
    const mestre = celulaValor.isMerged ? celulaValor.master.address : celulaValor.address;
    const valor = mestre === celulaValor.address ? cel(cols.gasto, l) : null;
    const origem = `${ws.name}!${cols.item}${l}`;
    const junto = porCelulaMestre.get(mestre);
    if (junto && typeof item === "string") {
      const partes = [...junto.descricao.split(/, | e /), item];
      junto.descricao = `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`;
      junto.origem += `+${l}`;
      junto.juntaItens = true;
      continue;
    }
    if (typeof item === "string" && semAcento(item).startsWith("total")) {
      bloco.totalSaiuPlanilha = typeof valor === "number" ? centavos(valor) : null;
      break;
    }
    if (item === null && valor === null) continue;
    if (item === null) {
      problemas.push({ origem, texto: `Valor de despesa sem descrição: ${JSON.stringify(valor)}` });
      continue;
    }
    const texto = String(item);
    if (valor === null) {
      if (cfg.rotulos[texto]) rotulo = texto;
      else if (categoriaDoItem(texto).reconhecida) problemas.push({ origem, texto: `Item sem valor: "${texto}"` });
      else problemas.push({ origem, texto: `Rótulo desconhecido (configure em "rotulos"): "${texto}"` });
      continue;
    }
    if (typeof valor !== "number" || valor <= 0) {
      problemas.push({ origem, texto: `Despesa com valor inválido: "${texto}" = ${JSON.stringify(valor)}` });
      continue;
    }
    const r = rotulo ? cfg.rotulos[rotulo] : null;
    const grupo = r && "grupo" in r ? r.grupo : null;
    const despesa: Despesa = {
      data: `${contexto.mes}-01`,
      descricao: grupo ? `${texto} (${grupo})` : texto,
      valor: centavos(valor),
      categoria: categoriaDoItem(texto).categoria,
      petCitado: r && "pet" in r ? r.pet : (contexto.pet ?? null),
      campanha: contexto.campanha,
      origem,
    };
    bloco.despesas.push(despesa);
    if (celulaValor.isMerged) porCelulaMestre.set(mestre, despesa);
  }
  return bloco;
}

// --- relatório -------------------------------------------------------------------------

const soma = (a: { valor: number }[]) => a.reduce((s, x) => s + x.valor, 0);
const confere = (a: number, b: number | null) => (b === null ? "sem total na planilha" : a === b ? "✅" : `❌ diferença ${reais(a - b)}`);

async function main() {
  const raiz = join(dirname(new URL(import.meta.url).pathname), "..");
  const args = process.argv.slice(2);
  const gravar = args.includes("--gravar");
  const projeto = args.find((a) => a.startsWith("--projeto="))?.split("=")[1];
  const caminhoConfig = args.find((a) => !a.startsWith("--")) ?? join(raiz, "dados-reais", "importacao.json");
  const pasta = dirname(caminhoConfig);
  const cfg: Config = JSON.parse(readFileSync(caminhoConfig, "utf8"));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(join(pasta, cfg.planilha));
  const aba = (nome: string) => {
    const ws = wb.getWorksheet(nome);
    if (!ws) throw new Error(`Aba não encontrada: ${nome}`);
    return ws;
  };

  const problemas: Problema[] = [];
  const meses = cfg.meses.map((m) => ({
    cfg: m,
    bloco: lerBloco(aba(m.aba), m, { mes: m.mes, campanha: null, rotuloInicial: m.rotuloInicial }, cfg, problemas),
  }));
  const campanhas = cfg.campanhas.map((c) => ({
    cfg: c,
    bloco: lerBloco(aba(c.aba), { nome: c.nome_col, valor: c.valor, item: c.item, gasto: c.gasto },
      { mes: c.mes, campanha: c.nome, pet: c.pet }, cfg, problemas),
  }));

  const contribuicoes = [...meses, ...campanhas].flatMap((x) => x.bloco.contribuicoes);
  const despesas = [...meses, ...campanhas].flatMap((x) => x.bloco.despesas);

  const membros = cfg.membros ?? [];
  const pessoa = (nome: string) => membroDoNome(nome, membros) ?? nome;

  // mesma pessoa duas vezes no mesmo mês (sem contar campanhas)
  const vistos = new Map<string, Contribuicao[]>();
  for (const c of contribuicoes.filter((c) => c.nome && !c.campanha)) {
    const chave = `${c.competencia}|${semAcento(pessoa(c.nome!))}`;
    vistos.set(chave, [...(vistos.get(chave) ?? []), c]);
  }
  const repetidos = [...vistos.values()].filter((v) => v.length > 1);

  const L: string[] = [];
  L.push("# Relatório da importação (nada foi gravado)", "");
  L.push(`Planilha: ${cfg.planilha}. Gerado em ${new Date().toLocaleString("pt-BR")}.`, "");

  L.push("## Totais por mês (caixa geral)", "");
  L.push("| Mês | Entrou (lido) | Entrou (planilha) | | Saiu (lido) | Saiu (planilha) | |", "|---|---|---|---|---|---|---|");
  for (const { cfg: m, bloco: b } of meses) {
    const e = soma(b.contribuicoes), s = soma(b.despesas);
    const ignorado = problemas
      .filter((p) => p.origem.startsWith(`${m.aba}!${m.nome}`) && p.texto.startsWith("Ignorada"))
      .reduce((t, p) => t + centavos(Number(p.texto.replace(/.*R\$\s*/, "").replace(/\./g, "").replace(",", ".")) || 0), 0);
    const esperadoEntrou = b.totalEntrouPlanilha === null ? null : b.totalEntrouPlanilha - ignorado;
    L.push(`| ${m.mes} | ${reais(e)} | ${b.totalEntrouPlanilha === null ? "—" : reais(b.totalEntrouPlanilha)}${ignorado ? ` (− ${reais(ignorado)} ignorados)` : ""} | ${confere(e, esperadoEntrou)} | ${reais(s)} | ${b.totalSaiuPlanilha === null ? "—" : reais(b.totalSaiuPlanilha)} | ${confere(s, b.totalSaiuPlanilha)} |`);
  }

  L.push("", "## Campanhas", "");
  L.push("| Campanha | Mês | Arrecadado (lido) | Planilha | | Gasto (lido) | Planilha | |", "|---|---|---|---|---|---|---|---|");
  for (const { cfg: c, bloco: b } of campanhas) {
    const e = soma(b.contribuicoes), s = soma(b.despesas);
    L.push(`| ${c.nome} (${c.situacao}) | ${c.mes} | ${reais(e)} | ${b.totalEntrouPlanilha === null ? "—" : reais(b.totalEntrouPlanilha)} | ${confere(e, b.totalEntrouPlanilha)} | ${reais(s)} | ${b.totalSaiuPlanilha === null ? "—" : reais(b.totalSaiuPlanilha)} | ${confere(s, b.totalSaiuPlanilha)} |`);
  }

  // saldo: o que o site vai mostrar × o caixa da planilha (+ campanhas que ficam fora dele)
  if (cfg.conferenciaSaldo) {
    const { aba: a, celula, ate } = cfg.conferenciaSaldo;
    const ate1 = `${ate}-01`;
    const nossoSaldo = soma(contribuicoes.filter((c) => c.competencia <= ate1)) - soma(despesas.filter((d) => d.data <= ate1));
    const caixa = valorDaCelula(aba(a).getCell(celula).value);
    const fora = campanhas.filter((c) => !c.cfg.saldoJaNoCaixaDaPlanilha)
      .reduce((t, c) => t + soma(c.bloco.contribuicoes) - soma(c.bloco.despesas), 0);
    const esperado = typeof caixa === "number" ? centavos(caixa) + fora : null;
    L.push("", "## Saldo", "");
    L.push(`- Saldo até ${ate} pelo que foi lido: **${reais(nossoSaldo)}**`);
    L.push(`- Caixa da planilha (${a}!${celula}): ${typeof caixa === "number" ? reais(centavos(caixa)) : "—"}, mais ${reais(fora)} de campanhas fora do caixa = ${esperado === null ? "—" : reais(esperado)}`);
    L.push(`- Conferência: ${confere(nossoSaldo, esperado)}`);
  }

  L.push("", "## Despesas por categoria", "");
  const porCat = new Map<string, number>();
  for (const d of despesas) porCat.set(d.categoria, (porCat.get(d.categoria) ?? 0) + d.valor);
  for (const [c, v] of [...porCat].sort((a, b) => b[1] - a[1])) L.push(`- ${c}: ${reais(v)}`);

  L.push("", "## Confira a categoria", "", "Itens que caíram em \"Outros\" e despesas que juntam vários itens num valor só:", "");
  for (const d of despesas.filter((d) => d.juntaItens || !categoriaDoItem(d.descricao).reconhecida)) {
    L.push(`- ${d.data.slice(0, 7)} · ${d.descricao} · ${d.categoria} · ${reais(d.valor)} (${d.origem})`);
  }

  L.push("", "## Todas as despesas", "");
  L.push("| Data | Descrição | Categoria | Valor | Pet citado | Campanha | Célula |", "|---|---|---|---|---|---|---|");
  for (const d of despesas) {
    L.push(`| ${d.data} | ${d.descricao} | ${d.categoria} | ${reais(d.valor)} | ${d.petCitado ?? "—"} | ${d.campanha ?? "—"} | ${d.origem} |`);
  }

  L.push("", "## Contribuições", "");
  L.push(`${contribuicoes.length} contribuições, ${contribuicoes.filter((c) => !c.nome).length} sem nome (anônimas).`);
  L.push("");
  if (repetidos.length) {
    L.push("Mesma pessoa duas vezes no mesmo mês (serão somadas se forem a mesma pessoa):", "");
    for (const r of repetidos) {
      L.push(`- ${r[0].competencia.slice(0, 7)} · ${r.map((c) => `${c.nome} ${reais(c.valor)}`).join(" + ")}`);
    }
  }

  // cada grafia da planilha: de qual membro é, ou se fica como doação avulsa
  L.push("", `### Nomes da planilha × membros (${membros.length} membros na configuração)`, "");
  L.push("| Nome na planilha | Membro | Contribuições | Meses |", "|---|---|---|---|");
  const porNome = new Map<string, Contribuicao[]>();
  for (const c of contribuicoes.filter((c) => c.nome)) porNome.set(c.nome!.trim(), [...(porNome.get(c.nome!.trim()) ?? []), c]);
  const linhas = [...porNome].map(([nome, cs]) => ({ nome, membro: membroDoNome(nome, membros), cs }))
    .sort((a, b) => Number(Boolean(a.membro)) - Number(Boolean(b.membro)) || (a.membro ?? a.nome).localeCompare(b.membro ?? b.nome));
  for (const { nome, membro, cs } of linhas) {
    const meses = [...new Set(cs.map((c) => c.competencia.slice(0, 7) + (c.campanha ? " (campanha)" : "")))].sort();
    L.push(`| ${nome} | ${membro ?? "— (doação avulsa)"} | ${cs.length} | ${meses.join(", ")} |`);
  }
  const usados = new Set(linhas.map((l) => l.membro));
  const semNada = membros.filter((m) => !usados.has(m.nome)).map((m) => m.nome);
  if (semNada.length) L.push("", `Membros sem nenhuma contribuição na planilha: ${semNada.join(", ")}.`);

  L.push("", "## Problemas e linhas ignoradas", "");
  for (const p of problemas) L.push(`- ${p.origem}: ${p.texto}`);

  const pets = [...new Set(despesas.map((d) => d.petCitado).filter(Boolean))].sort();
  L.push("", "## Pets citados nas despesas (para ligar depois no admin)", "", pets.join(", "));

  // o que vai para o banco, pelo cadastro da equipe
  const cadastro = cfg.cadastro ? await lerCadastro(join(pasta, cfg.cadastro.planilha), cfg.cadastro.aba) : [];
  const plano = contribuicoesParaGravar(contribuicoes, cadastro, cfg.grafias);
  const novosMembros = membrosDoCadastro(cadastro);
  L.push("", "## O que será gravado", "");
  if (!cfg.cadastro) L.push("Sem `cadastro` na configuração: não dá para gravar.");
  else {
    const fixas = plano.linhas.filter((c) => c.membro);
    L.push(`- ${novosMembros.length} membros fixos (${novosMembros.filter((m) => m.ativo).length} ativos): ${novosMembros.map((m) => m.nome + (m.valorMensal ? ` (${reais(centavos(m.valorMensal))})` : "") + (m.ativo ? "" : " (inativo)")).join(", ")}`);
    L.push(`- ${plano.linhas.length} contribuições: ${fixas.length} de membros, ${plano.linhas.length - fixas.length} avulsas (${plano.linhas.filter((c) => !c.membro && !c.nomeAvulso).length} anônimas)`);
    L.push(`- Total: ${reais(soma(plano.linhas))} (lido: ${reais(soma(contribuicoes))})`);
    L.push(`- ${despesas.length} despesas, ${reais(soma(despesas))}; ${campanhas.length} campanhas`);
    for (const a of plano.avisos) L.push(`- Aviso: ${a}`);
  }

  const destino = join(pasta, "relatorio-importacao.md");
  writeFileSync(destino, L.join("\n") + "\n");

  // no terminal, só o resumo (o relatório completo tem nomes de pessoas)
  const conf = L.filter((l) => /^\| \d{4}-\d{2} \|/.test(l) || l.startsWith("| Resgate") || l.startsWith("- Conferência"));
  console.log(conf.join("\n"));
  console.log(`\n${despesas.length} despesas, ${contribuicoes.length} contribuições, ${problemas.length} avisos.`);
  console.log(`Relatório completo: ${destino}`);
  if (cfg.cadastro) {
    console.log(`A gravar: ${novosMembros.length} membros, ${plano.linhas.length} contribuições (${reais(soma(plano.linhas))}), ${despesas.length} despesas, ${campanhas.length} campanhas; ${plano.avisos.length} avisos do cadastro.`);
  }

  if (!gravar) return;
  if (!cfg.cadastro) throw new Error("Falta `cadastro` na configuração.");
  await gravarNoBanco({ projeto, campanhas: campanhas.map((c) => c.cfg), membros: novosMembros, contribuicoes: plano.linhas, despesas });
}

// Lê a aba "Membros": Nome na planilha | Meses | Valores | Nome final | Tipo | Valor mensal | Ativo
async function lerCadastro(caminho: string, nomeAba: string): Promise<LinhaCadastro[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(caminho);
  const ws = wb.getWorksheet(nomeAba);
  if (!ws) throw new Error(`Aba não encontrada: ${nomeAba}`);
  const linhas: LinhaCadastro[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const c = (i: number) => valorDaCelula(row.getCell(i).value);
    const nome = c(1);
    if (typeof nome !== "string") return;
    const valor = c(6);
    linhas.push({
      nome,
      meses: String(c(2) ?? ""),
      nomeFinal: typeof c(4) === "string" ? (c(4) as string) : null,
      fixo: c(5) === "Membro fixo",
      valorMensal: typeof valor === "number" ? valor : typeof valor === "string" ? Number(valor.replace(/\./g, "").replace(",", ".")) || null : null,
      ativo: c(7) !== "Não",
    });
  });
  return linhas;
}

// --- gravação ------------------------------------------------------------------------

async function gravarNoBanco(p: {
  projeto: string | undefined;
  campanhas: ConfigCampanha[];
  membros: { nome: string; valorMensal: number | null; ativo: boolean }[];
  contribuicoes: ContribuicaoGravar[];
  despesas: Despesa[];
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Rode com --env-file=<arquivo .env> do banco de destino.");
  const ref = new URL(url).hostname.split(".")[0];
  if (p.projeto !== ref) throw new Error(`O destino é ${ref}. Para gravar nele, passe --projeto=${ref}.`);
  const db = createClient(url, chave, { auth: { persistSession: false } });

  // só num banco sem dados financeiros: rodar duas vezes duplicaria tudo
  for (const t of ["membros", "contribuicoes", "despesas", "campanhas"] as const) {
    const { count, error } = await db.from(t).select("id", { count: "exact", head: true });
    if (error) throw error;
    if (count) throw new Error(`${ref}: a tabela ${t} já tem ${count} linhas. A importação só grava num banco sem dados financeiros.`);
  }

  const { data: categorias, error: e1 } = await db.from("categorias").select("id, nome");
  if (e1) throw e1;
  const categoria = new Map(categorias.map((c) => [c.nome, c.id]));
  const faltam = [...new Set(p.despesas.map((d) => d.categoria))].filter((c) => !categoria.has(c));
  if (faltam.length) throw new Error(`Categorias que não existem em ${ref}: ${faltam.join(", ")}`);

  const { data: pets, error: e2 } = await db.from("pets").select("id, nome, oculto");
  if (e2) throw e2;
  const semPet = [...new Set(p.despesas.map((d) => d.petCitado).filter((n): n is string => !!n && !petDoNome(n, pets)))];

  const inserir = async <T extends { id: string }>(tabela: string, linhas: object[], campos = "id") => {
    if (!linhas.length) return [] as T[];
    const { data, error } = await db.from(tabela).insert(linhas).select(campos);
    if (error) throw new Error(`Falhou ao gravar ${tabela} (o que veio antes já foi gravado): ${error.message}`);
    return data as unknown as T[];
  };
  const reaisDe = (c: number) => c / 100;

  const camp = await inserir<{ id: string; nome: string }>("campanhas", p.campanhas.map((c) => ({
    nome: c.nome, inicio: c.inicio, situacao: c.situacao,
  })), "id, nome");
  const campanhaId = new Map(camp.map((c) => [c.nome, c.id]));

  const mem = await inserir<{ id: string; nome: string }>("membros", p.membros.map((m) => ({
    nome: m.nome, valor_mensal: m.valorMensal, ativo: m.ativo,
  })), "id, nome");
  const membroId = new Map(mem.map((m) => [m.nome, m.id]));

  const contr = await inserir("contribuicoes", p.contribuicoes.map((c) => ({
    competencia: c.competencia,
    valor: reaisDe(c.valor),
    membro_id: c.membro ? membroId.get(c.membro) : null,
    nome_avulso: c.nomeAvulso,
    campanha_id: c.campanha ? campanhaId.get(c.campanha) : null,
  })));

  const desp = await inserir("despesas", p.despesas.map((d) => ({
    data: d.data,
    descricao: d.descricao,
    valor: reaisDe(d.valor),
    categoria_id: categoria.get(d.categoria),
    pet_id: d.petCitado ? petDoNome(d.petCitado, pets) : null,
    campanha_id: d.campanha ? campanhaId.get(d.campanha) : null,
  })));

  console.log(`\nGravado em ${ref}: ${camp.length} campanhas, ${mem.length} membros, ${contr.length} contribuições, ${desp.length} despesas.`);
  if (semPet.length) console.log(`Despesas que ficaram como "Vários pets" (pet não encontrado): ${semPet.join(", ")}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop()!)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
