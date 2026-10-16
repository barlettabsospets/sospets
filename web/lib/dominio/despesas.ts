import { somar } from "./saldo";

// Agrupamentos da página Despesas (despesas.html): por categoria e por pet.
// As despesas chegam na ordem da lista (mais recente primeiro); empates mantêm essa ordem.

export type DespesaParaSomar = {
  categoria: string;
  cor: string;
  valor: number;
  petId: string | null;
  pet: string;
  especie: "cachorro" | "gato" | null;
};

export const somarDespesas = (lista: { valor: number }[]) => lista.reduce((s, d) => s + d.valor, 0);

// pet da despesa: "" = vários pets
export const chaveDoPet = (d: { petId: string | null }) => d.petId ?? "";

// categorias com quantidade e total, da que mais gastou para a que menos
export function porCategoria(despesas: DespesaParaSomar[]) {
  return [...new Set(despesas.map((d) => d.categoria))]
    .map((c) => {
      const delas = despesas.filter((d) => d.categoria === c);
      return { categoria: c, cor: delas[0].cor, quantidade: delas.length, total: somarDespesas(delas) };
    })
    .sort((a, b) => b.total - a.total);
}

// pets com o total gasto: quem mais gastou primeiro, "Vários pets" (chave "") no fim
export function porPet(despesas: DespesaParaSomar[]) {
  return [...new Set(despesas.map(chaveDoPet))]
    .map((chave) => {
      const deles = despesas.filter((d) => chaveDoPet(d) === chave);
      return { chave, nome: deles[0].pet, especie: deles[0].especie, total: somarDespesas(deles) };
    })
    .sort((x, y) => Number(x.chave === "") - Number(y.chave === "") || y.total - x.total);
}

// --- tela Despesas do admin (admin-despesas.html) ---

type DespesaDoMes = { categoria: string; cor: string; valor: number };

// "Gasto em outubro": total e quantidade (as canceladas já vêm de fora)
export function resumoDoMes(doMes: DespesaDoMes[]) {
  return { total: somar(doMes.map((d) => d.valor)), quantidade: doMes.length };
}

// "4 despesas"
export function textoDaQuantidade({ quantidade }: { quantidade: number }) {
  return `${quantidade} ${quantidade === 1 ? "despesa" : "despesas"}`;
}

// "Por categoria": as categorias com despesa no mês, com o total, da que mais gastou para a que menos.
export function categoriasDoMes(doMes: DespesaDoMes[]) {
  return [...new Set(doMes.map((d) => d.categoria))]
    .map((c) => {
      const delas = doMes.filter((d) => d.categoria === c);
      return { categoria: c, cor: delas[0].cor, total: resumoDoMes(delas).total };
    })
    .sort((a, b) => b.total - a.total);
}

// Opções do formulário: as ativas e, ao editar, também a que a despesa já tem (mesmo desativada,
// a despesa antiga continua com ela).
export function opcoesDoFormulario<T extends { id: string }>(itens: T[], ativo: (i: T) => boolean, atual: string | null) {
  return itens.filter((i) => ativo(i) || i.id === atual);
}
