"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

// Lista que abre embaixo de um botão (listbox), com o teclado do periodPicker (app.js)
// e do escolha (admin.js): setas, Home/End, Enter ou espaço escolhe, Esc fecha e volta
// o foco ao botão, Tab fecha, clique fora fecha.
export function useListaSuspensa<T extends string>({
  valores,
  valor,
  aoEscolher,
}: {
  valores: T[];
  valor: T;
  aoEscolher: (v: T) => void;
}) {
  const [aberta, setAberta] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const marcar = useCallback(
    (k: number) => setAtivo(((k % valores.length) + valores.length) % valores.length),
    [valores.length],
  );

  const abrir = () => {
    marcar(Math.max(0, valores.indexOf(valor)));
    setAberta(true);
  };
  const fechar = (devolverFoco: boolean) => {
    setAberta(false);
    if (devolverFoco) botao.current?.focus();
  };
  const escolher = (v: T) => {
    aoEscolher(v);
    fechar(true);
  };

  // ao abrir, o foco vai para a lista; a opção ativa fica visível
  useEffect(() => {
    if (aberta) lista.current?.focus();
  }, [aberta]);
  useEffect(() => {
    if (!aberta) return;
    lista.current?.children[ativo]?.scrollIntoView?.({ block: "nearest" });
  }, [aberta, ativo]);

  // clique fora fecha
  useEffect(() => {
    if (!aberta) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberta(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberta]);

  const teclaNoBotao = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      abrir();
    }
  };

  const teclaNaLista = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); marcar(ativo + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); marcar(ativo - 1); }
    else if (e.key === "Home") { e.preventDefault(); marcar(0); }
    else if (e.key === "End") { e.preventDefault(); marcar(valores.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); escolher(valores[ativo]); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(true); }
    else if (e.key === "Tab") fechar(false);
  };

  return {
    aberta,
    ativo,
    raiz,
    botao,
    lista,
    alternar: () => (aberta ? fechar(false) : abrir()),
    escolher,
    teclaNoBotao,
    teclaNaLista,
  };
}
