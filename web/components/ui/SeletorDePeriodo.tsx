"use client";

import { Fragment } from "react";
import { useListaSuspensa } from "./useListaSuspensa";

export type OpcaoDePeriodo = {
  valor: string;
  rotulo: string;
  // texto na lista, quando diferente do rótulo do botão
  rotuloNaLista?: string;
  // ex.: "mês atual"
  etiqueta?: string;
  // título de grupo antes desta opção
  grupo?: string;
};

// Seletor de período das páginas públicas e do admin (periodPicker do app.js):
// setas de mês anterior e próximo + botão que abre a lista.
// passos: valores em ordem cronológica, para as setas; fora deles (ex.: "Desde o início"),
// a seta da esquerda volta para o último passo.
export function SeletorDePeriodo({
  id,
  idDoRotulo,
  opcoes,
  passos,
  valor,
  aoMudar,
}: {
  id: string;
  idDoRotulo: string;
  opcoes: OpcaoDePeriodo[];
  passos: string[];
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  const { aberta, ativo, raiz, botao, lista, alternar, escolher, teclaNoBotao, teclaNaLista } = useListaSuspensa({ valores: opcoes.map((o) => o.valor), valor, aoEscolher: aoMudar });
  const atual = opcoes.find((o) => o.valor === valor);
  const k = passos.indexOf(valor);
  const andar = (d: number) => aoMudar(k === -1 ? passos[passos.length - 1] : passos[k + d]);
  const idTexto = `${id}-txt`;
  const idLista = `${id}-list`;
  const idOpcao = (v: string) => `${id}-op-${v}`;

  return (
    <div id={id} className="pbar" ref={raiz}>
      <button className="pbtn" type="button" aria-label="Mês anterior" disabled={k === 0} onClick={() => andar(-1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <div className="pdrop">
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
          <span id={idTexto}>{atual?.rotulo}</span>
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
            <Fragment key={o.valor}>
              {o.grupo && <li className="grp" role="presentation">{o.grupo}</li>}
              <li
                role="option"
                id={idOpcao(o.valor)}
                aria-selected={o.valor === valor}
                className={aberta && i === ativo ? "act" : undefined}
                onClick={() => escolher(o.valor)}
              >
                {o.rotuloNaLista ?? o.rotulo}
                {/* o espaço não aparece (o li é flex), mas evita o leitor de tela ler "2026mês atual" */}
                {o.etiqueta && <> <small>{o.etiqueta}</small></>}
              </li>
            </Fragment>
          ))}
        </ul>
      </div>
      <button
        className="pbtn"
        type="button"
        aria-label="Próximo mês"
        disabled={k === -1 || k === passos.length - 1}
        onClick={() => andar(1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
      </button>
    </div>
  );
}
