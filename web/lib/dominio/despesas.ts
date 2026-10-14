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
