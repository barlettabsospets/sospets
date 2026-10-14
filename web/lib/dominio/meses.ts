// Meses no formato "AAAA-MM". No banco são date com dia 1 ("2026-10-01").

export type Mes = `${number}-${number}`;

const FORMATO = /^(\d{4})-(\d{2})/;

// "2026-10-01", "2026-10-15" ou "2026-10" → "2026-10"
export function paraMes(data: string): Mes {
  const m = FORMATO.exec(data);
  if (!m) throw new Error(`Data inválida: ${data}`);
  return `${m[1]}-${m[2]}` as Mes;
}

// "2026-10" → "2026-10-01" (formato das colunas de mês no banco)
export const inicioDoMes = (mes: Mes) => `${mes}-01`;

export const numeroDoMes = (mes: Mes) => Number(mes.slice(5, 7));

// meses entre a e b ("2026-01" → "2026-10" = 9), como mesesEntre() do protótipo
export function mesesEntre(a: Mes, b: Mes): number {
  return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + (numeroDoMes(b) - numeroDoMes(a));
}

export function somarMeses(mes: Mes, n: number): Mes {
  const total = Number(mes.slice(0, 4)) * 12 + numeroDoMes(mes) - 1 + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}` as Mes;
}

// todos os meses de inicio a fim, inclusive
export function listaDeMeses(inicio: Mes, fim: Mes): Mes[] {
  const n = mesesEntre(inicio, fim);
  return n < 0 ? [] : Array.from({ length: n + 1 }, (_, i) => somarMeses(inicio, i));
}

// Mês de hoje no horário de Brasília (o servidor roda em UTC).
export function mesAtual(agora: Date = new Date()): Mes {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" })
    .formatToParts(agora);
  const ano = partes.find((p) => p.type === "year")!.value;
  const mes = partes.find((p) => p.type === "month")!.value;
  return `${ano}-${mes}` as Mes;
}
