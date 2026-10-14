// Listas de 10 em 10, com o mesmo contador em todas (paginar() do admin.js).

export const POR_PAGINA = 10;

export function paginar<T>(itens: T[], pagina: number, rotulo: [singular: string, plural: string]) {
  const paginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
  const p = Math.min(Math.max(1, pagina), paginas);
  const daPagina = itens.slice((p - 1) * POR_PAGINA, p * POR_PAGINA);
  const n = itens.length;
  // "24 membros · mostrando 11–20"
  const contador = n
    ? `${n} ${n === 1 ? rotulo[0] : rotulo[1]}${n > POR_PAGINA ? ` · mostrando ${(p - 1) * POR_PAGINA + 1}–${(p - 1) * POR_PAGINA + daPagina.length}` : ""}`
    : "";
  return { itens: daPagina, pagina: p, paginas, contador };
}
