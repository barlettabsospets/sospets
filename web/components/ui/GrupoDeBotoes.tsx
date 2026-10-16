"use client";

import type { ReactNode } from "react";

export type OpcaoDoGrupo = { valor: string; rotulo: ReactNode };

// Botões de filtro em que um fica marcado (aria-pressed): .segmented, .pills ou .ad-chips.
export function GrupoDeBotoes({
  opcoes,
  valor,
  aoMudar,
  rotulo,
  className = "segmented",
}: {
  opcoes: OpcaoDoGrupo[];
  valor: string;
  aoMudar: (valor: string) => void;
  // nome do grupo para o leitor de tela
  rotulo: string;
  className?: string;
}) {
  return (
    <div className={className} role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button key={o.valor} type="button" aria-pressed={o.valor === valor} onClick={() => aoMudar(o.valor)}>
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
