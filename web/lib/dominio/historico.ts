// Histórico de alterações (Mais): como cada linha aparece na tela.

export type AcaoDoHistorico = "criou" | "alterou" | "cancelou" | "apagou";

// sinal no círculo da linha, como no protótipo
export const SINAL_DA_ACAO: Record<AcaoDoHistorico, string> = { criou: "+", alterou: "~", cancelou: "×", apagou: "×" };

const emBrasilia = (instante: Date) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(instante).map((x) => [x.type, x.value]),
  );
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
};

// "hoje, 20:41", "ontem, 18:03", "12/10, 09:15" ou, de outro ano, "12/10/2025, 09:15" (horário de Brasília)
export function quandoFoi(instante: string, agora: Date = new Date()): string {
  const q = emBrasilia(new Date(instante));
  const hoje = emBrasilia(agora).dia;
  const ontem = emBrasilia(new Date(new Date(`${hoje}T12:00:00-03:00`).getTime() - 864e5)).dia;
  const [a, m, d] = q.dia.split("-");
  const dia = q.dia === hoje ? "hoje" : q.dia === ontem ? "ontem" : a === hoje.slice(0, 4) ? `${d}/${m}` : `${d}/${m}/${a}`;
  return `${dia}, ${q.hora}`;
}
