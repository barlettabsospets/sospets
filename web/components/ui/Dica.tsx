"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

// Dica "i" (não existe no protótipo; pedido da Barbara, 19/10): um botão que mostra e esconde uma
// explicação logo abaixo, no lugar de um texto sempre visível. Fica dentro de um .com-dica, ao lado do
// título ou do nome do campo; o balão ocupa a linha de baixo inteira, então não sai da tela no celular.
// Fecha com Esc (o foco volta ao botão), com outro toque no "i" ou com um toque fora.
export function Dica({ sobre, children }: { sobre: string; children: ReactNode }) {
  const [aberta, setAberta] = useState(false);
  const id = useId();
  const botao = useRef<HTMLButtonElement>(null);
  const balao = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!aberta) return;
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (!botao.current?.contains(alvo) && !balao.current?.contains(alvo)) setAberta(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberta]);

  const esc = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || !aberta) return;
    // não fecha o diálogo em volta
    e.preventDefault();
    e.stopPropagation();
    setAberta(false);
    botao.current?.focus();
  };

  return (
    <>
      <button
        ref={botao}
        type="button"
        className="dica-b"
        aria-label={`Sobre ${sobre}`}
        aria-expanded={aberta}
        aria-controls={id}
        onClick={() => setAberta((a) => !a)}
        onKeyDown={esc}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 11v6M12 7.5h.01" />
        </svg>
      </button>
      <span ref={balao} id={id} className="dica-t" hidden={!aberta} onKeyDown={esc}>
        {children}
      </span>
    </>
  );
}
