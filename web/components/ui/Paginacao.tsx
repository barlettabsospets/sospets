"use client";

import { useRef } from "react";

// Botões ‹ 1 2 3 › das listas do admin. Ao trocar de página, o foco vai para a página atual.
export function Paginacao({
  pagina,
  paginas,
  rotulo,
  aoIr,
}: {
  pagina: number;
  paginas: number;
  // ex.: "Páginas da lista de membros"
  rotulo: string;
  aoIr: (pagina: number) => void;
}) {
  const nav = useRef<HTMLElement>(null);
  const ir = (p: number) => {
    aoIr(p);
    requestAnimationFrame(() => nav.current?.querySelector<HTMLButtonElement>("button[aria-current]")?.focus());
  };

  return (
    <nav ref={nav} className="ad-pager" aria-label={rotulo} hidden={paginas < 2}>
      <button type="button" disabled={pagina === 1} aria-label="Página anterior" onClick={() => ir(pagina - 1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      {Array.from({ length: paginas }, (_, k) => k + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === pagina ? "page" : undefined}
          aria-label={`Página ${n} de ${paginas}`}
          onClick={() => ir(n)}
        >
          {n}
        </button>
      ))}
      <button type="button" disabled={pagina === paginas} aria-label="Próxima página" onClick={() => ir(pagina + 1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
      </button>
    </nav>
  );
}
