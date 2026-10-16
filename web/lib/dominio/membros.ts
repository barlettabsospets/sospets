// Membros (admin-membros.html): valor próprio ou valor padrão do grupo.

export type Membro = { id: string; nome: string; valorMensal: number | null; ativo: boolean };

// quanto o membro contribui por mês: o valor próprio ou, se não tiver, o padrão
export const valorDoMembro = (m: Pick<Membro, "valorMensal">, padrao: number) => m.valorMensal ?? padrao;

// O que se grava ao salvar o formulário: vazio vira o padrão, e o padrão vira null
// (quem fica com o mesmo valor do padrão passa a segui-lo).
export function valorProprio(digitado: number, padrao: number): number | null {
  const v = digitado || padrao;
  return v === padrao ? null : v;
}

// "21 membros seguem o padrão. 3 têm valor próprio."
export function textoDoPadrao(membros: Pick<Membro, "valorMensal">[]): string {
  const seguem = membros.filter((m) => m.valorMensal === null).length;
  const proprios = membros.length - seguem;
  return `${seguem} ${seguem === 1 ? "membro segue" : "membros seguem"} o padrão. ${proprios} ${proprios === 1 ? "tem" : "têm"} valor próprio.`;
}
