"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { IconeCadeado, IconeVoltar } from "./icones";

// Botão do cabeçalho público. Quem está logado (ex.: veio de "Ver o site público", em Mais)
// vê "Voltar à área do administrador". O site público tem cache e não lê cookies no servidor,
// então a verificação é feita no navegador, só pela presença do cookie de sessão do Supabase.
// É só o texto: o admin confere a sessão de verdade, e /entrar já leva quem está logado ao admin.
const SESSAO = /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/;

const nada = () => () => {};
export const temSessao = () => SESSAO.test(document.cookie);

export function BotaoAdmin() {
  // no servidor e antes do JavaScript carregar: o botão de sempre
  const logado = useSyncExternalStore(nada, temSessao, () => false);
  return logado ? (
    <Link className="th-admin th-voltar" href="/admin/contribuicoes" aria-label="Voltar à área do administrador">
      <IconeVoltar />
      <span>Voltar à área do administrador</span>
      {/* no celular, onde o texto longo some, uma seta sozinha pareceria "voltar página" */}
      <span className="th-curto" aria-hidden="true">Admin</span>
    </Link>
  ) : (
    <Link className="th-admin" href="/entrar">
      <IconeCadeado />
      <span>Área do administrador</span>
    </Link>
  );
}
