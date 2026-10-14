const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Formata um valor em reais: 410 → "R$ 410,00".
export function formatarBRL(valor: number): string {
  return brl.format(valor);
}
