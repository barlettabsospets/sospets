"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { formatarBRL, formatarInteiro, MESES_CURTOS, nomeDoMes } from "@/lib/dominio/formatacao";
import { escalaDoGrafico, mesesVisiveis } from "@/lib/dominio/graficos";
import { type Mes, numeroDoMes } from "@/lib/dominio/meses";

export type MesDoFluxo = { mes: Mes; entrou: number; saiu: number };

type Medidas = { largura: number; fonte: number; celular: boolean };
type Dica = { mes: MesDoFluxo; x: number; y: number };

// Barras "Entrou e saiu, mês a mês" (drawMensal do index.html), com a tabela equivalente.
// Tocar num mês escolhe o mês na página inteira; tocar de novo volta para "Desde o início".
export function FluxoMensal({
  meses,
  escolhido,
  aoEscolher,
}: {
  meses: MesDoFluxo[];
  escolhido: Mes | null;
  aoEscolher: (mes: Mes | null) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [medidas, setMedidas] = useState<Medidas>({ largura: 700, fonte: 14, celular: false });
  const [parado, setParado] = useState(false);
  const [dica, setDica] = useState<Dica | null>(null);

  // o desenho acompanha a largura do cartão e o tamanho de letra da página
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const celular = matchMedia("(max-width: 599px)");
    const medir = () =>
      setMedidas({
        largura: Math.round(el.getBoundingClientRect().width) || 320,
        fonte: parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.875,
        celular: celular.matches,
      });
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    celular.addEventListener("change", medir);
    // as barras crescem só na primeira vez
    const t = setTimeout(() => setParado(true), 700);
    return () => {
      obs.disconnect();
      celular.removeEventListener("change", medir);
      clearTimeout(t);
    };
  }, []);

  const iEscolhido = escolhido === null ? null : meses.findIndex((m) => m.mes === escolhido);
  const visiveis = mesesVisiveis(meses.length, iEscolhido === -1 ? null : iEscolhido, medidas.celular ? 3 : 6)
    .map((i) => meses[i]);

  const fs = medidas.fonte;
  const W = Math.max(260, medidas.largura);
  const estreito = W < 480;
  const H = estreito ? 260 : Math.min(420, Math.round(W * 0.5));
  const L = Math.round(fs * (estreito ? 4.6 : 5.2));
  const T = 10;
  const R = 2;
  const longo = visiveis.length > 0 && (W - L - R) / visiveis.length >= fs * 4.8;
  const B = Math.round(longo ? fs + 22 : fs * 2 + 20);
  const ph = H - T - B;
  const base = T + ph;
  // escala pelos meses todos (não só os visíveis): não muda ao trocar de mês, como no protótipo
  const { topo, linhas } = escalaDoGrafico(Math.max(0, ...meses.flatMap((m) => [m.entrou, m.saiu])), estreito);
  const h = (v: number) => (v / topo) * ph;
  const gw = visiveis.length ? (W - L - R) / visiveis.length : W;
  const bw = Math.max(6, Math.min(28, Math.floor((gw - 8) / 2)));
  const rr = Math.min(4, bw / 2);

  // barra com o topo arredondado e a base presa na linha do zero
  const barra = (x: number, v: number, classe: string) => {
    const t = base - h(v);
    const r = Math.min(rr, h(v));
    return <path className={classe} d={`M${x},${base}V${t + r}Q${x},${t} ${x + r},${t}H${x + bw - r}Q${x + bw},${t} ${x + bw},${t + r}V${base}Z`} />;
  };

  const primeiro = visiveis[0];
  const ultimo = visiveis[visiveis.length - 1];
  const titulo = primeiro
    ? `Quanto entrou e quanto saiu de ${nomeDoMes(primeiro.mes)} a ${nomeDoMes(ultimo.mes)} de ${ultimo.mes.slice(0, 4)}`
    : "Nenhum mês registrado";

  const alternar = (m: MesDoFluxo) => {
    setDica(null);
    aoEscolher(escolhido === m.mes ? null : m.mes);
  };
  const tecla = (e: KeyboardEvent, m: MesDoFluxo) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      alternar(m);
    }
  };
  const mostrarDica = (m: MesDoFluxo, x: number, y: number) =>
    setDica({ mes: m, x: Math.max(8, Math.min(x - 60, innerWidth - 228)), y: Math.max(8, y - 110) });

  return (
    <>
      {/* role="group" (no protótipo, "img"): as barras dos meses são botões, e um "img" esconde
          do leitor de tela o que tem dentro (WCAG, nested-interactive) */}
      <svg id="mensal" ref={svg} viewBox={`0 0 ${W} ${H}`} role="group" aria-labelledby="mensal-t" className={parado ? "still" : undefined}>
        <title id="mensal-t">{titulo}</title>
        {linhas.map((g) => (
          <g key={g}>
            <line className="grid" x1={L} x2={W - R} y1={base - h(g)} y2={base - h(g)} />
            <text x={L - 8} y={base - h(g) + 4} textAnchor="end">R$ {formatarInteiro(g)}</text>
          </g>
        ))}
        <line className="zero" x1={L} x2={W - R} y1={base} y2={base} />
        {visiveis.map((m, k) => {
          const cx = L + gw * k + gw / 2;
          const marcado = escolhido === m.mes;
          const curto = MESES_CURTOS[numeroDoMes(m.mes) - 1];
          const ano = m.mes.slice(0, 4);
          const tw = Math.round(longo ? fs * 4.4 : fs * 2.2);
          return (
            <g
              key={m.mes}
              className={marcado ? "m sel" : "m"}
              tabIndex={0}
              role="button"
              aria-pressed={marcado}
              aria-label={`Ver ${nomeDoMes(m.mes)} de ${ano}: entrou ${formatarBRL(m.entrou)}, saiu ${formatarBRL(m.saiu)}`}
              onClick={() => alternar(m)}
              onKeyDown={(e) => tecla(e, m)}
              onPointerMove={(e) => e.pointerType === "mouse" && mostrarDica(m, e.clientX, e.clientY)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setDica(null)}
              onFocus={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                mostrarDica(m, r.left + r.width / 2, r.top + 40);
              }}
              onBlur={() => setDica(null)}
            >
              <rect className="hit" x={cx - gw / 2 + 2} y={T} width={gw - 4} height={ph + B - 4} rx="10" />
              {barra(cx - bw - 1, m.entrou, "bar-a")}
              {barra(cx + 1, m.saiu, "bar-g")}
              {/* "jan/2026" quando cabe; senão, o mês em cima e o ano embaixo */}
              {longo ? (
                <text x={cx} y={base + fs + 8} textAnchor="middle">{curto}/{ano}</text>
              ) : (
                <>
                  <text x={cx} y={base + fs + 6} textAnchor="middle">{curto}</text>
                  <text className="yr" x={cx} y={base + fs * 2 + 8} textAnchor="middle">{ano}</text>
                </>
              )}
              {marcado && <rect className="uline" x={cx - tw / 2} y={H - 5} width={tw} height="3" rx="1.5" />}
            </g>
          );
        })}
      </svg>
      <details className="alt foot">
        <summary className="tp-more">
          <span className="on">Ver como tabela</span>
          <span className="off">Esconder tabela</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </summary>
        <div className="tp-tablewrap">
          <table className="ct" id="mensal-tbl">
            <thead><tr><th>Mês</th><th>Entrou</th><th>Saiu</th></tr></thead>
            <tbody>
              {visiveis.map((m) => (
                <tr key={m.mes}><td>{nomeDoMes(m.mes)}</td><td>{formatarBRL(m.entrou)}</td><td>{formatarBRL(m.saiu)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <div className="tip" role="status" style={dica ? { display: "block", left: dica.x, top: dica.y } : undefined}>
        {dica && (
          <>
            <b>{nomeDoMes(dica.mes.mes)}</b><br />
            Entrou {formatarBRL(dica.mes.entrou)}<br />
            Saiu {formatarBRL(dica.mes.saiu)}<br />
            Sobrou {formatarBRL(dica.mes.entrou - dica.mes.saiu)}
          </>
        )}
      </div>
    </>
  );
}
