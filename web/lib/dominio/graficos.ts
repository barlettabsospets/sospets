// Contas dos gráficos da Prestação de contas e de Despesas (o desenho fica em components/graficos).

// Escala do gráfico mensal: topo "redondo" com 3 linhas de grade (2 no celular).
// O protótipo fixa o topo em R$ 1.200; aqui ele sai dos dados, e com o seed dá o mesmo
// (maior valor R$ 1.040 → linhas 400, 800 e 1.200).
const PASSOS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

export function escalaDoGrafico(maior: number, estreito = false) {
  const bruto = Math.max(maior, 1) / 3;
  const ordem = 10 ** Math.floor(Math.log10(bruto));
  const passo = PASSOS.map((p) => p * ordem).find((p) => p >= bruto)!;
  const topo = passo * 3;
  return { topo, linhas: estreito ? [topo / 2, topo] : [passo, passo * 2, topo] };
}

// Quais meses aparecem no gráfico: os últimos 6 (3 no celular); se o escolhido for
// mais antigo, a janela começa nele (mesmo comportamento do protótipo).
export function mesesVisiveis(total: number, escolhido: number | null, quantos: number): number[] {
  const n = Math.min(total, quantos);
  let inicio = total - n;
  if (escolhido !== null && escolhido < inicio) inicio = escolhido;
  return Array.from({ length: n }, (_, k) => inicio + k);
}

export type Fatia = { nome: string; valor: number; cor: string };

export const COR_OUTRAS = "#CFC3B4";

// Rosca: as `quantas` maiores categorias de sempre, cada uma com a sua cor, e o resto
// somado em "Outras (vacinas, lar temporário)". Só entram fatias com valor.
// ranking: categorias da maior para a menor, considerando todo o período;
// ordem: a coluna categorias.ordem, que define a ordem dentro de "Outras (...)".
export function fatiasDaRosca(
  doPeriodo: Map<string, number>,
  ranking: { nome: string; cor: string; ordem?: number }[],
  quantas = 5,
): Fatia[] {
  const principais = ranking.slice(0, quantas);
  const nomesPrincipais = new Set(principais.map((c) => c.nome));
  const resto = [...doPeriodo].filter(([nome, v]) => !nomesPrincipais.has(nome) && v > 0);
  const ordem = new Map(ranking.map((c, i) => [c.nome, c.ordem ?? i]));
  resto.sort((a, b) => (ordem.get(a[0]) ?? 99) - (ordem.get(b[0]) ?? 99));

  const fatias: Fatia[] = principais.map((c) => ({ nome: c.nome, valor: doPeriodo.get(c.nome) ?? 0, cor: c.cor }));
  const somaResto = Math.round(resto.reduce((t, [, v]) => t + v * 100, 0)) / 100;
  fatias.push({
    nome: resto.length ? `Outras (${resto.map(([n]) => n).join(", ").toLowerCase()})` : "Outras",
    valor: somaResto,
    cor: COR_OUTRAS,
  });
  return fatias.filter((f) => f.valor > 0);
}
