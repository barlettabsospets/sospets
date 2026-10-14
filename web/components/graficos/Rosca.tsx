"use client";

import { useEffect, useState } from "react";
import { formatarBRL, porcentagem } from "@/lib/dominio/formatacao";
import type { Fatia } from "@/lib/dominio/graficos";

// Rosca "Para onde foi o dinheiro" com a legenda (drawDonut do index.html).
// Tocar numa fatia ou na legenda destaca a categoria e mostra o valor dela no meio;
// tocar de novo volta ao total.
export function Rosca({ fatias }: { fatias: Fatia[] }) {
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [parada, setParada] = useState(false);
  const total = fatias.reduce((t, f) => t + f.valor, 0);

  // a animação de entrada roda só no primeiro desenho
  useEffect(() => {
    const t = setTimeout(() => setParada(true), 900);
    return () => clearTimeout(t);
  }, []);

  // se o período mudou e a categoria sumiu, volta ao total
  const selecionada = fatias.find((f) => f.nome === escolhida) ?? null;
  const alternar = (nome: string) => setEscolhida(selecionada?.nome === nome ? null : nome);

  const r = 80;
  const C = 2 * Math.PI * r;
  const vao = fatias.length > 1 ? 2 : 0;
  // onde cada fatia começa no círculo
  const comprimentos = fatias.map((f) => (f.valor / total) * C);
  const inicios = comprimentos.map((_, i) => comprimentos.slice(0, i).reduce((t, c) => t + c, 0));

  return (
    <>
      <div className={parada ? "tp-donut still" : "tp-donut"} id="donut">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--cream-2)" strokeWidth="28" />
          {fatias.map((f, i) => {
            const ligada = selecionada?.nome === f.nome;
            const apagada = selecionada !== null && !ligada;
            return (
              <circle
                key={f.nome}
                className={["seg", ligada && "on", apagada && "off"].filter(Boolean).join(" ")}
                cx="100" cy="100" r={r}
                fill="none"
                stroke={f.cor}
                strokeWidth={ligada ? 34 : 28}
                strokeDasharray={`${Math.max(0, comprimentos[i] - vao)} ${C}`}
                strokeDashoffset={-inicios[i]}
                onClick={() => alternar(f.nome)}
              />
            );
          })}
        </svg>
        <div className="mid">
          {selecionada ? (
            <>
              <span>{selecionada.nome.replace(/ \(.*\)$/, "")}</span>
              <b className="num">{formatarBRL(selecionada.valor)}</b>
              <span>{porcentagem(selecionada.valor, total)}% do total</span>
            </>
          ) : (
            <>
              <span>Total gasto</span>
              <b className="num">{formatarBRL(total)}</b>
            </>
          )}
        </div>
      </div>
      <ul className="tp-catlist" id="cats" aria-label="Categorias de gasto. Escolha uma para destacar.">
        {fatias.length ? (
          fatias.map((f) => (
            <li key={f.nome}>
              <button
                type="button"
                aria-pressed={selecionada?.nome === f.nome}
                className={selecionada !== null && selecionada.nome !== f.nome ? "off" : undefined}
                onClick={() => alternar(f.nome)}
              >
                <i style={{ background: f.cor }} aria-hidden="true" />
                <span className="n">{f.nome}</span>
                <span className="v">{formatarBRL(f.valor)}</span>
                <span className="p">{porcentagem(f.valor, total)}%</span>
              </button>
            </li>
          ))
        ) : (
          <li className="none">Nenhuma despesa registrada neste período.</li>
        )}
      </ul>
    </>
  );
}
