"use client";

import type { ReactNode } from "react";
import { useListaSuspensa } from "./useListaSuspensa";

// rótulo pode ter marcação, como a quantidade em negrito do filtro de Pets ("<b class=\"qt\">12</b>Na rua")
export type OpcaoDeEscolha = { valor: string; rotulo: ReactNode; cor?: string };

const Ponto = ({ cor }: { cor?: string }) => (cor ? <i style={{ background: cor }} aria-hidden="true" /> : null);

// Lista de escolha no visual do "Selecione o mês", sem as setas (escolha() do admin.js).
// A cor (de categoria, por exemplo) aparece como um ponto antes do rótulo.
export function Escolha({
  id,
  idDoRotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  id: string;
  idDoRotulo: string;
  opcoes: OpcaoDeEscolha[];
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  const { aberta, ativo, raiz, botao, lista, alternar, escolher, teclaNoBotao, teclaNaLista } = useListaSuspensa({ valores: opcoes.map((o) => o.valor), valor, aoEscolher: aoMudar });
  // como no protótipo: se o valor sumiu das opções, mostra a primeira
  const atual = opcoes.find((o) => o.valor === valor) ?? opcoes[0];
  const idTexto = `${id}-txt`;
  const idLista = `${id}-list`;
  const idOpcao = (v: string) => `${id}-op-${v || "todos"}`;

  return (
    <div id={id} className="ad-sel" ref={raiz}>
      <button
        ref={botao}
        className="pdrop-btn"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberta}
        aria-controls={idLista}
        aria-labelledby={`${idDoRotulo} ${idTexto}`}
        onClick={alternar}
        onKeyDown={teclaNoBotao}
      >
        <span id={idTexto}>
          <Ponto cor={atual?.cor} />
          {atual?.rotulo}
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <ul
        ref={lista}
        className="pdrop-list"
        id={idLista}
        role="listbox"
        tabIndex={-1}
        aria-labelledby={idDoRotulo}
        aria-activedescendant={aberta ? idOpcao(opcoes[ativo].valor) : undefined}
        hidden={!aberta}
        onKeyDown={teclaNaLista}
      >
        {opcoes.map((o, i) => (
          <li
            key={o.valor}
            role="option"
            id={idOpcao(o.valor)}
            aria-selected={o.valor === atual?.valor}
            className={aberta && i === ativo ? "act" : undefined}
            onClick={() => escolher(o.valor)}
          >
            <Ponto cor={o.cor} />
            <span>{o.rotulo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
