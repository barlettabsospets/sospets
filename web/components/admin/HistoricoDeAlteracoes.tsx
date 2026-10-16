"use client";

import { useState, useTransition } from "react";
import { Paginacao } from "@/components/ui/Paginacao";
import { contadorDaLista, POR_PAGINA } from "@/components/ui/paginacao";
import { useToast } from "@/components/ui/Toast";
import { paginaDoHistorico } from "@/lib/admin/historico";
import type { PaginaDoHistorico } from "@/lib/dados/admin";
import { formatarBRL } from "@/lib/dominio/formatacao";
import { quandoFoi, SINAL_DA_ACAO } from "@/lib/dominio/historico";

// "Histórico de alterações" (admin-mais.html): o que mudou, o valor, quem e quando, de 10 em 10.
// A primeira página vem com a tela (e se atualiza depois de cada mudança); as outras, pela Server Action.
export function HistoricoDeAlteracoes({ primeira }: { primeira: PaginaDoHistorico }) {
  const toast = useToast();
  const [carregando, iniciar] = useTransition();
  const [outra, setOutra] = useState<PaginaDoHistorico | null>(null);
  const atual = outra ?? primeira;
  const paginas = Math.max(1, Math.ceil(atual.total / POR_PAGINA));

  const ir = (pagina: number) => {
    if (pagina === 1) return setOutra(null);
    iniciar(async () => {
      const r = await paginaDoHistorico({ pagina });
      if (r.ok) setOutra(r.dados);
      else toast(r.erro);
    });
  };

  return (
    <>
      <p className="ad-count" aria-live="polite">{contadorDaLista(atual.total, atual.pagina, ["alteração", "alterações"])}</p>
      <div className="glist" hidden={atual.itens.length === 0} aria-busy={carregando}>
        {atual.itens.map((h) => (
          <div className="arow" key={h.id}>
            <div className="avatar" aria-hidden="true">{SINAL_DA_ACAO[h.acao]}</div>
            <div>
              <span className="t1">{h.resumo}</span>
              <span className="t2">{[h.valor !== null && formatarBRL(h.valor), h.quem, quandoFoi(h.quando)].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="empty" hidden={atual.itens.length > 0}>Nenhuma alteração registrada ainda.</div>
      <Paginacao pagina={atual.pagina} paginas={paginas} rotulo="Páginas do histórico de alterações" aoIr={ir} />
    </>
  );
}
