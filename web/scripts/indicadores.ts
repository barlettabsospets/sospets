// Indicadores do plano de implantação (seção 8) a partir do banco: relatório de um mês.
// Uso (dentro de web/): node --env-file=.env.producao scripts/indicadores.ts 2026-11 [--sem-pagespeed]
//
// Só números: nenhum nome de pessoa sai daqui. O relatório é gravado em dados-reais/indicadores/.
// Lançamentos sem autor (criado_por vazio, como os importados da planilha em 30/10/2026) não entram
// nos indicadores de adesão e agilidade: eles não mostram como a equipe usa o portal.
// Os indicadores 2, 3, 5, 8, 12 e 13 vêm de fora do banco: o relatório lembra onde olhar.

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// --- dias úteis ------------------------------------------------------------------------

const iso = (d: Date) => d.toISOString().slice(0, 10);

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher)
function pascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

// Feriados nacionais (fixos e Sexta-feira Santa). Pontos facultativos (Carnaval, Corpus Christi) contam como dia útil.
export function feriados(ano: number): Set<string> {
  const fixos = ["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"].map((d) => `${ano}-${d}`);
  const sexta = pascoa(ano);
  sexta.setUTCDate(sexta.getUTCDate() - 2);
  return new Set([...fixos, iso(sexta)]);
}

// Prazo da rotina mensal: 5º dia útil do mês seguinte ("2026-10" → "2026-11-09", com Finados em 2/11)
export function prazoDoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, m, 1)); // dia 1 do mês seguinte
  const fer = feriados(d.getUTCFullYear());
  let uteis = 0;
  for (;;) {
    const dia = d.getUTCDay();
    if (dia !== 0 && dia !== 6 && !fer.has(iso(d)) && ++uteis === 5) return iso(d);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

// Data no horário de Brasília ("2026-11-03T01:30:00Z" → "2026-11-02")
export const dataEmBrasilia = (instante: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(instante));

const diasEntre = (de: string, ate: string) => Math.round((Date.parse(ate) - Date.parse(de)) / 86_400_000);

// --- cálculo (puro, testado em indicadores.test.ts) -----------------------------------------

export type Lancamento = { criado_em: string; criado_por: string | null; cancelada_em: string | null };
export type DadosDoMes = {
  mes: string; // "2026-11"
  despesas: (Lancamento & { data: string })[];
  contribuicoes: (Lancamento & { membro_id: string | null })[];
  autoresNoHistorico: (string | null)[]; // user_id de cada mudança feita do início do mês até o prazo
  administradoresAtivos: number;
  membrosAtivos: number;
  entrou: number;
  entrouMesAnterior: number | null;
};

export type Indicadores = {
  prazo: string;
  adminsAtivos: { lancando: number; total: number };
  prazoDespesa: { ate7dias: number; total: number; percentual: number | null };
  fechamento: { ultimoLancamento: string | null; noPrazo: boolean | null };
  correcoes: { canceladas: number; total: number; percentual: number | null };
  membrosEmDia: { contribuiram: number; ativos: number; percentual: number | null };
  arrecadacao: { entrou: number; variacao: number | null };
};

const pct = (parte: number, todo: number) => (todo ? Math.round((parte / todo) * 1000) / 10 : null);

export function calcularIndicadores(d: DadosDoMes): Indicadores {
  const prazo = prazoDoMes(d.mes);
  // só o que a equipe lançou pelo portal (com autor)
  const despesas = d.despesas.filter((x) => x.criado_por);
  const contribuicoes = d.contribuicoes.filter((x) => x.criado_por);
  const todos = [...despesas, ...contribuicoes];

  const ate7 = despesas.filter((x) => diasEntre(x.data, dataEmBrasilia(x.criado_em)) <= 7).length;
  const ultimo = todos.map((x) => x.criado_em).sort().at(-1) ?? null;
  const canceladas = todos.filter((x) => x.cancelada_em).length;
  const membros = new Set(d.contribuicoes.filter((x) => x.membro_id && !x.cancelada_em).map((x) => x.membro_id)).size;

  return {
    prazo,
    adminsAtivos: { lancando: new Set(d.autoresNoHistorico.filter(Boolean)).size, total: d.administradoresAtivos },
    prazoDespesa: { ate7dias: ate7, total: despesas.length, percentual: pct(ate7, despesas.length) },
    fechamento: { ultimoLancamento: ultimo ? dataEmBrasilia(ultimo) : null, noPrazo: ultimo ? dataEmBrasilia(ultimo) <= prazo : null },
    correcoes: { canceladas, total: todos.length, percentual: pct(canceladas, todos.length) },
    membrosEmDia: { contribuiram: membros, ativos: d.membrosAtivos, percentual: pct(membros, d.membrosAtivos) },
    arrecadacao: {
      entrou: d.entrou,
      variacao: d.entrouMesAnterior ? Math.round(((d.entrou - d.entrouMesAnterior) / d.entrouMesAnterior) * 1000) / 10 : null,
    },
  };
}

// --- leitura e relatório ------------------------------------------------------------------

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const nomeDoMes = (mes: string) =>
  new Date(`${mes}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const br = (data: string) => data.split("-").reverse().join("/");
const proximoMes = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
};
const mesAnterior = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
};

async function lcp(url: string): Promise<number | null> {
  const chave = process.env.PAGESPEED_KEY ? `&key=${process.env.PAGESPEED_KEY}` : "";
  try {
    const r = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${chave}`,
      { signal: AbortSignal.timeout(120_000) },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { lighthouseResult?: { audits?: Record<string, { numericValue?: number }> } };
    const ms = j.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue;
    return typeof ms === "number" ? Math.round(ms / 100) / 10 : null;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mes = args.find((a) => /^\d{4}-\d{2}$/.test(a));
  if (!mes) throw new Error("Informe o mês: node --env-file=.env.producao scripts/indicadores.ts 2026-11");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Rode com --env-file=<arquivo .env> do banco.");
  const db = createClient(url, chave, { auth: { persistSession: false } });

  const inicio = `${mes}-01`;
  const fim = `${proximoMes(mes)}-01`;
  const prazo = prazoDoMes(mes);
  const ate = `${prazo}T23:59:59-03:00`;
  const ler = async <T>(q: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) => {
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  };

  const [despesas, contribuicoes, historico, admins, membros, resumo] = await Promise.all([
    ler(db.from("despesas").select("data, criado_em, criado_por, cancelada_em").gte("data", inicio).lt("data", fim)),
    ler(db.from("contribuicoes").select("criado_em, criado_por, cancelada_em, membro_id").eq("competencia", inicio)),
    ler(db.from("historico").select("user_id").gte("quando", `${inicio}T00:00:00-03:00`).lte("quando", ate)),
    ler(db.from("administradores").select("user_id").eq("ativo", true)),
    ler(db.from("membros").select("id").eq("ativo", true)),
    ler(db.from("pub_resumo_mensal").select("mes, entrou").in("mes", [inicio, `${mesAnterior(mes)}-01`])),
  ]);
  const entrouDe = (m: string) => {
    const r = resumo.find((x) => x.mes === `${m}-01`);
    return r ? Number(r.entrou) : null;
  };

  const k = calcularIndicadores({
    mes,
    despesas,
    contribuicoes,
    autoresNoHistorico: historico.map((h) => h.user_id),
    administradoresAtivos: admins.length,
    membrosAtivos: membros.length,
    entrou: entrouDe(mes) ?? 0,
    entrouMesAnterior: entrouDe(mesAnterior(mes)),
  });

  const site = "https://sospets-aguasclaras.vercel.app";
  const paginas = ["/", "/pets", "/despesas"];
  const tempos = args.includes("--sem-pagespeed") ? paginas.map(() => null) : await Promise.all(paginas.map((p) => lcp(site + p)));

  const ok = (v: boolean | null) => (v === null ? "—" : v ? "✅" : "⚠️");
  const n = (p: number | null) => (p === null ? "—" : `${p.toLocaleString("pt-BR")}%`);
  const fechou = k.fechamento.noPrazo;
  const L = [
    `# Indicadores de ${nomeDoMes(mes)}`,
    "",
    `Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Prazo do mês (5º dia útil): **${br(prazo)}**.`,
    "",
    "| Indicador | Meta | Resultado | |",
    "|---|---|---|---|",
    `| 1 · Tempo de carregamento (LCP, celular) | < 2,5 s | ${paginas.map((p, i) => `${p} ${tempos[i] === null ? "—" : `${tempos[i]!.toLocaleString("pt-BR")} s`}`).join(" · ")} | ${tempos.every((t) => t === null) ? "—" : ok(tempos.every((t) => t !== null && t < 2.5))} |`,
    `| 4 · Administradores ativos | os 2 lançando | ${k.adminsAtivos.lancando} de ${k.adminsAtivos.total} | ${ok(k.adminsAtivos.lancando >= Math.min(2, k.adminsAtivos.total))} |`,
    `| 6 · Despesas lançadas em até 7 dias | 90% | ${n(k.prazoDespesa.percentual)} (${k.prazoDespesa.ate7dias} de ${k.prazoDespesa.total}) | ${k.prazoDespesa.percentual === null ? "—" : ok(k.prazoDespesa.percentual >= 90)} |`,
    `| 7 · Fechamento até o 5º dia útil | até ${br(prazo)} | ${k.fechamento.ultimoLancamento ? `último lançamento em ${br(k.fechamento.ultimoLancamento)}` : "sem lançamentos"} | ${ok(fechou)} |`,
    `| 9 · Correções (cancelados) | < 5% | ${n(k.correcoes.percentual)} (${k.correcoes.canceladas} de ${k.correcoes.total}) | ${k.correcoes.percentual === null ? "—" : ok(k.correcoes.percentual < 5)} |`,
    `| 10 · Membros com a contribuição em dia | +10 p.p. em 6 meses | ${n(k.membrosEmDia.percentual)} (${k.membrosEmDia.contribuiram} de ${k.membrosEmDia.ativos}) | |`,
    `| 11 · Arrecadação mensal | +15% em 6 meses | ${reais(k.arrecadacao.entrou)}${k.arrecadacao.variacao === null ? "" : ` (${k.arrecadacao.variacao > 0 ? "+" : ""}${k.arrecadacao.variacao.toLocaleString("pt-BR")}% sobre o mês anterior)`} | |`,
    "",
    "Só contam lançamentos feitos por administradores no portal (os importados da planilha ficam de fora).",
    ...(tempos.every((t) => t === null) && !args.includes("--sem-pagespeed")
      ? ["", "O PageSpeed não respondeu (sem a chave PAGESPEED_KEY, a cota gratuita compartilhada acaba). Meça à mão em https://pagespeed.web.dev, aba Celular, campo “Largest Contentful Paint”."]
      : []),
    "",
    "## Fora do banco (preencher à mão)",
    "",
    "- **2 · Disponibilidade:** painel do UptimeRobot, % do mês no ar (meta: 99,5%).",
    "- **3 · Lançamentos no portal:** no piloto, comparar os totais com a planilha; depois do rollout, 100%.",
    "- **5 · Visitantes:** Vercel › sospets-aguasclaras › Analytics, visitantes do mês (meta: +20% em 3 meses após o rollout).",
    "- **8 · Tempo da coordenação:** minutos anotados por quem fechou o mês (trimestral).",
    "- **12 · Satisfação:** respostas do formulário (trimestral).",
    "- **13 · Custo:** uso da Vercel e do Supabase no mês (meta: R$ 0).",
  ];
  const texto = L.join("\n") + "\n";
  const pasta = join(dirname(new URL(import.meta.url).pathname), "..", "dados-reais", "indicadores");
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, `${mes}.md`), texto);
  console.log(texto);
  console.log(`Gravado em ${join(pasta, `${mes}.md`)}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop()!)) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
