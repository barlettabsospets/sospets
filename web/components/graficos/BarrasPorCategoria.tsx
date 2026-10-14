"use client";

import { formatarBRL } from "@/lib/dominio/formatacao";
import type { Fatia } from "@/lib/dominio/graficos";

// Barras "Por categoria" da página Despesas (e do admin): cada barra é um botão que filtra
// a lista. O comprimento é relativo à maior categoria do mês.
export function BarrasPorCategoria({
  categorias,
  escolhida,
  aoAlternar,
}: {
  categorias: Fatia[];
  escolhida: string | null;
  aoAlternar: (nome: string) => void;
}) {
  const maior = Math.max(0, ...categorias.map((c) => c.valor));
  return (
    <ul className="dp-bars" id="dp-bars" aria-label="Categorias. Escolha uma para filtrar a lista.">
      {categorias.map((c) => (
        <li key={c.nome}>
          <button
            type="button"
            aria-pressed={escolhida === c.nome}
            className={escolhida && escolhida !== c.nome ? "off" : undefined}
            onClick={() => aoAlternar(c.nome)}
          >
            <span className="n">{c.nome}</span>
            <span className="v">{formatarBRL(c.valor)}</span>
            <span className="t" aria-hidden="true">
              <b style={{ width: `${maior ? (c.valor / maior) * 100 : 0}%`, background: c.cor }} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
