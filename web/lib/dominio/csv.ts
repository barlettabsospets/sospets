// Planilhas CSV do "Exportar dados" (Mais). Feitas para abrir direto no Excel em português:
// separador ";", vírgula nos decimais, datas dd/mm/aaaa e BOM UTF-8 (para os acentos).

export type Celula = string | number | boolean | null;

// Texto que começa com = + - @ vira fórmula no Excel; um apóstrofo na frente impede
// (uma descrição como "=HYPERLINK(...)" não pode virar link ao abrir a planilha).
const semFormula = (t: string) => (/^[=+\-@\t\r]/.test(t) ? `'${t}` : t);

function celula(v: Celula): string {
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "number") return v.toFixed(2).replace(".", ",");
  const t = semFormula(v);
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function gerarCsv(cabecalho: string[], linhas: Celula[][]): string {
  return "\uFEFF" + [cabecalho, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n") + "\r\n";
}

// "2026-10-03" → "03/10/2026"; "2026-10-01" como mês → "10/2026"
export const dataBR = (data: string | null) => (data ? data.slice(0, 10).split("-").reverse().join("/") : null);
export const mesBR = (data: string | null) => (data ? `${data.slice(5, 7)}/${data.slice(0, 4)}` : null);

// sospets-despesas-2026-10-15.csv
export const nomeDoArquivo = (tipo: string, hoje: string) => `sospets-${tipo}-${hoje}.csv`;
