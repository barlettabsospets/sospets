// Listas de 10 em 10, com o mesmo contador em todas (paginar() do admin.js).

export const POR_PAGINA = 10;

export function paginar<T>(itens: T[], pagina: number, rotulo: [singular: string, plural: string]) {
  const paginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
  const p = Math.min(Math.max(1, pagina), paginas);
  const daPagina = itens.slice((p - 1) * POR_PAGINA, p * POR_PAGINA);
  return { itens: daPagina, pagina: p, paginas, contador: contadorDaLista(itens.length, p, rotulo) };
}

// "24 membros · mostrando 11–20" (também para listas paginadas no servidor, como o histórico)
export function contadorDaLista(total: number, pagina: number, rotulo: [singular: string, plural: string]) {
  if (!total) return "";
  const de = (pagina - 1) * POR_PAGINA + 1;
  const ate = Math.min(total, pagina * POR_PAGINA);
  return `${total} ${total === 1 ? rotulo[0] : rotulo[1]}${total > POR_PAGINA ? ` · mostrando ${de}–${ate}` : ""}`;
}

// Números que aparecem na paginação. Até 9 páginas, todos (como no protótipo); acima disso
// (o histórico de alterações cresce sem parar), a primeira, a última e as vizinhas da atual,
// com null no lugar do "…": 1 … 4 5 6 … 40.
export function paginasVisiveis(pagina: number, paginas: number): (number | null)[] {
  if (paginas <= 9) return Array.from({ length: paginas }, (_, k) => k + 1);
  // perto das pontas, cinco números; no meio, a atual e as duas vizinhas
  const de = pagina <= 4 ? 2 : pagina >= paginas - 3 ? paginas - 4 : pagina - 1;
  const ate = pagina <= 4 ? 5 : pagina >= paginas - 3 ? paginas - 1 : pagina + 1;
  const numeros = [1, ...Array.from({ length: ate - de + 1 }, (_, k) => de + k), paginas];
  // entre dois números, "…" quando falta mais de uma página; se falta só uma, ela aparece
  return numeros.flatMap((n, k) => {
    const antes = numeros[k - 1];
    if (k === 0 || n - antes === 1) return [n];
    return n - antes === 2 ? [n - 1, n] : [null, n];
  });
}
