"use client";

import Link from "next/link";
import { useState } from "react";
import { FluxoMensal } from "@/components/graficos/FluxoMensal";
import { Rosca } from "@/components/graficos/Rosca";
import { Foto } from "@/components/ui/Foto";
import { IconeEspecie } from "@/components/ui/IconeEspecie";
import { SeletorDePeriodo } from "@/components/ui/SeletorDePeriodo";
import type { CampanhaPublica, DespesaPublica, GastoDaCategoria } from "@/lib/dados/publico";
import { capitalizar, formatarBRL, formatarInteiro, mesPorExtenso, nomeDoMes, porcentagem } from "@/lib/dominio/formatacao";
import { fatiasDaRosca } from "@/lib/dominio/graficos";
import type { Mes } from "@/lib/dominio/meses";
import { type Contagem, contarGrupo, contarTopo, type GrupoDePets, type PetDoPainel } from "@/lib/dominio/pets";
import { type ResumoDoMes, resultadoDoPeriodo, saldoAte, somar } from "@/lib/dominio/saldo";

type Periodo = "todos" | Mes;

export type DadosDoPainel = {
  mesAtual: Mes;
  resumo: (ResumoDoMes & { mes: Mes })[];
  gastos: GastoDaCategoria[];
  ultimas: DespesaPublica[];
  pets: PetDoPainel[];
  campanhas: CampanhaPublica[];
};

const plural = (n: number, um: string, varios: string) => `${formatarInteiro(n)} ${n === 1 ? um : varios}`;

const Seta = ({ d = "m9 5 7 7-7 7" }: { d?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
);

const Pata = (props: { className?: string }) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="6" cy="11" r="2.2" /><circle cx="10" cy="6" r="2.2" /><circle cx="16" cy="6" r="2.2" /><circle cx="20" cy="11" r="2.2" />
    <path d="M12 12c-3 0-6 3-6 5.5 0 2 1.5 2.5 3 2.5 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.5 0 3-.5 3-2.5C18 15 15 12 12 12z" />
  </svg>
);

// Prestação de contas (index.html): o período escolhido muda todos os cartões.
export function PainelPrestacao({ dados }: { dados: DadosDoPainel }) {
  const { resumo, mesAtual } = dados;
  const meses = resumo.map((r) => r.mes);
  const primeiro = meses[0];
  const ultimo = meses[meses.length - 1];
  // abre no mês atual; se ele estiver fora dos dados, no último mês registrado
  const [periodo, setPeriodo] = useState<Periodo>(meses.includes(mesAtual) ? mesAtual : ultimo);

  const todos = periodo === "todos";
  const fim: Mes = todos ? ultimo : periodo;
  const inicio: Mes = todos ? primeiro : periodo;
  const atual = !todos && periodo === mesAtual;
  const doPeriodo = resumo.filter((r) => r.mes >= inicio && r.mes <= fim);

  const opcoes = [
    { valor: "todos", rotulo: "Desde o início" },
    ...[...meses].reverse().map((m) => ({
      valor: m,
      rotulo: capitalizar(mesPorExtenso(m)),
      etiqueta: m === mesAtual ? "mês atual" : undefined,
    })),
  ];

  return (
    <main id="main" className="wrap tp">
      {/* título e frase no mesmo tamanho da página Despesas; seletor de período à direita */}
      <header className="tp-head tp-head-min">
        <div className="tp-h">
          <h1>Prestação de contas</h1>
          <p>Veja quanto recebemos, como os recursos são utilizados e como estão os animais sob nossos cuidados.</p>
        </div>
        <div className="tp-period">
          <span className="lab" id="periodo-lab">Selecione o mês</span>
          <SeletorDePeriodo
            id="periodo"
            idDoRotulo="periodo-lab"
            opcoes={opcoes}
            passos={meses}
            valor={periodo}
            aoMudar={(v) => setPeriodo(v as Periodo)}
          />
        </div>
      </header>

      <div className="tp-grid">
        <CartaoSaldo resumo={resumo} fim={fim} todos={todos} atual={atual} primeiro={primeiro} />
        <CartaoResumo doPeriodo={doPeriodo} gastos={dados.gastos} inicio={inicio} fim={fim} todos={todos} />
        <section className="card c-fluxo" aria-labelledby="h-mes">
          <div className="card-h"><h2 id="h-mes">Entrou e saiu, mês a mês</h2></div>
          <div className="tp-legend" aria-hidden="true">
            <span><i />Entrou</span>
            <span className="o"><i />Saiu</span>
          </div>
          <FluxoMensal
            meses={resumo}
            escolhido={todos ? null : periodo}
            aoEscolher={(m) => setPeriodo(m ?? "todos")}
          />
        </section>
        <CartaoCategorias gastos={dados.gastos} inicio={inicio} fim={fim} />
        <CartaoUltimas despesas={dados.ultimas} />
        <CartaoPets pets={dados.pets} inicio={inicio} fim={fim} todos={todos} atual={atual} primeiro={primeiro} />
        <CartaoCampanhas campanhas={dados.campanhas} />
      </div>
    </main>
  );
}

// "Saldo acumulado de janeiro até o fim de março" (com o ano quando muda)
function deAte(primeiro: Mes, fim: Mes) {
  return primeiro.slice(0, 4) === fim.slice(0, 4)
    ? `de ${nomeDoMes(primeiro)} até o fim de ${nomeDoMes(fim)}`
    : `de ${mesPorExtenso(primeiro)} até o fim de ${mesPorExtenso(fim)}`;
}

function CartaoSaldo({ resumo, fim, todos, atual, primeiro }: { resumo: ResumoDoMes[]; fim: Mes; todos: boolean; atual: boolean; primeiro: Mes }) {
  const hoje = todos || atual;
  return (
    <section className="card c-saldo" aria-labelledby="cap" aria-live="polite">
      <span className="shape" aria-hidden="true" />
      <Pata className="paw" />
      <div className="card-h"><h2 id="cap">{hoje ? "Em caixa hoje" : `Em caixa no fim de ${nomeDoMes(fim)}`}</h2></div>
      <p className="big num">{formatarBRL(saldoAte(resumo, fim))}</p>
      <p className="note">
        {hoje
          ? `Tudo o que entrou menos tudo o que saiu desde ${mesPorExtenso(primeiro)}.`
          : `Saldo acumulado ${deAte(primeiro, fim)}.`}
      </p>
    </section>
  );
}

function categoriasComGasto(gastos: GastoDaCategoria[], inicio: Mes, fim: Mes) {
  const porCategoria = new Map<string, number>();
  for (const g of gastos.filter((g) => g.mes >= inicio && g.mes <= fim)) {
    porCategoria.set(g.categoria, somar([porCategoria.get(g.categoria) ?? 0, g.total]));
  }
  return porCategoria;
}

function CartaoResumo({
  doPeriodo, gastos, inicio, fim, todos,
}: { doPeriodo: ResumoDoMes[]; gastos: GastoDaCategoria[]; inicio: Mes; fim: Mes; todos: boolean }) {
  const entrou = somar(doPeriodo.map((r) => r.entrou));
  const saiu = somar(doPeriodo.map((r) => r.saiu));
  const contribuicoes = doPeriodo.reduce((t, r) => t + r.contribuicoes, 0);
  const categorias = [...categoriasComGasto(gastos, inicio, fim).values()].filter((v) => v > 0).length;
  const r = resultadoDoPeriodo(entrou, saiu);

  return (
    <section className="card c-resumo" aria-labelledby="h-res" aria-live="polite">
      <div className="card-h">
        <h2 id="h-res">{todos ? "Resumo desde o início do projeto" : `Resumo de ${nomeDoMes(fim)}`}</h2>
      </div>
      <dl className="tp-sum">
        <div className="i">
          <dt><i />Entrou</dt>
          <dd className="v num">{formatarBRL(entrou)}</dd>
          <dd className="d">{plural(contribuicoes, "contribuição", "contribuições")}</dd>
        </div>
        <div className="o">
          <dt><i />Saiu</dt>
          <dd className="v num">{formatarBRL(saiu)}</dd>
          <dd className="d">em {plural(categorias, "categoria", "categorias")}</dd>
        </div>
        <div className="s">
          <dt><i /><span>{r.rotulo}</span></dt>
          <dd className="v num">{formatarBRL(r.valor)}</dd>
          <dd className="d">{r.faltou ? "pago com o caixa" : "ficou em caixa"}</dd>
        </div>
      </dl>
      <div
        className="tp-usebar"
        role="img"
        aria-label={r.faltou ? "O gasto passou do que entrou" : `${r.usado}% do que entrou foi usado e ${100 - r.usado}% sobrou`}
      >
        <i style={{ width: `${r.usado}%` }} />
        {!r.faltou && <i style={{ width: `${100 - r.usado}%` }} />}
      </div>
      <p className="result">
        {r.faltou ? "Saiu mais do que entrou neste período." : <><b>{r.usado}%</b> do que entrou foi usado. O restante ficou em caixa.</>}
      </p>
    </section>
  );
}

function CartaoCategorias({ gastos, inicio, fim }: { gastos: GastoDaCategoria[]; inicio: Mes; fim: Mes }) {
  // as 5 maiores categorias de sempre, cada uma com a sua cor; o resto em "Outras"
  const deSempre = new Map<string, { nome: string; cor: string; ordem: number; total: number }>();
  for (const g of gastos) {
    const c = deSempre.get(g.categoria) ?? { nome: g.categoria, cor: g.cor, ordem: g.ordem, total: 0 };
    c.total = somar([c.total, g.total]);
    deSempre.set(g.categoria, c);
  }
  const ranking = [...deSempre.values()].sort((a, b) => b.total - a.total);
  const fatias = fatiasDaRosca(categoriasComGasto(gastos, inicio, fim), ranking);

  return (
    <section className="card c-cats" aria-labelledby="h-cats">
      <div className="card-h"><h2 id="h-cats">Para onde foi</h2></div>
      {/* key: trocar de período volta a rosca para o total */}
      <Rosca key={`${inicio}-${fim}`} fatias={fatias} />
    </section>
  );
}

// "2026-10-06" → "06/10"
const diaMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;

function CartaoUltimas({ despesas }: { despesas: DespesaPublica[] }) {
  return (
    <section className="card c-ult" aria-labelledby="h-ult">
      <div className="card-h"><h2 id="h-ult">Últimas despesas</h2></div>
      <div className="tp-rows">
        <div className="hd" aria-hidden="true">
          <span>Descrição</span><span>Pet</span><span>Categoria</span><span>Data</span><span>Valor</span>
        </div>
        {despesas.length === 0 && <p className="muted">Nenhuma despesa registrada ainda.</p>}
        {despesas.map((d) => (
          <div className="tp-row" key={d.id}>
            <span className="t1">{d.descricao}</span>
            {d.especie ? (
              <span className="ani">
                <IconeEspecie especie={d.especie} />
                {d.pet}
                <span className="sr-only"> ({d.especie})</span>
              </span>
            ) : (
              <span className="ani none">Vários pets</span>
            )}
            <span className="cat" data-d={diaMes(d.data)}>{d.categoria}</span>
            <span className="dt">{diaMes(d.data)}</span>
            <span className="amt">{formatarBRL(d.valor)}</span>
          </div>
        ))}
      </div>
      <div className="card-foot">
        <Link className="tp-more" href="/despesas">Ver todas as despesas<Seta /></Link>
      </div>
    </section>
  );
}

const NOMES_DOS_GRUPOS: Record<GrupoDePets, string> = {
  castrados: "castrados",
  adotados: "adotados",
  lar: "em lar temporário",
  rua: "em situação de rua",
};

function CartaoPets({
  pets, inicio, fim, todos, atual, primeiro,
}: { pets: PetDoPainel[]; inicio: Mes; fim: Mes; todos: boolean; atual: boolean; primeiro: Mes }) {
  const [grupo, setGrupo] = useState<GrupoDePets | null>(null);
  const mes = nomeDoMes(fim);
  const contagem = (g: GrupoDePets) => contarGrupo(pets, g, inicio, fim);

  // número grande: o grupo escolhido ou, sem escolha, o total do período
  let topo: Contagem;
  let texto: string;
  if (grupo) {
    topo = contagem(grupo);
    const evento = grupo === "castrados" || grupo === "adotados";
    const quando = evento ? (todos ? `desde ${nomeDoMes(primeiro)}` : `em ${mes}`) : (todos || atual ? "hoje" : `no fim de ${mes}`);
    texto = `${NOMES_DOS_GRUPOS[grupo]} ${quando}`;
  } else {
    topo = contarTopo(pets, todos, fim);
    texto = todos ? "pets já ajudados pelo grupo" : atual ? "acompanhados hoje" : `acompanhados no fim de ${mes}`;
  }

  const botao = (g: GrupoDePets, classe: "ev" | "sn", rotulo: string) => (
    <button
      type="button"
      className={grupo && grupo !== g ? `${classe} off` : classe}
      aria-pressed={grupo === g}
      onClick={() => setGrupo(grupo === g ? null : g)}
    >
      <b className="num">{formatarInteiro(contagem(g).total)}</b>
      <span>{rotulo}</span>
    </button>
  );

  const caes = plural(topo.caes, "cão", "cães");
  const gatos = plural(topo.gatos, "gato", "gatos");

  return (
    <section className="card c-ani" aria-labelledby="h-imp">
      <div className="card-h">
        <h2 id="h-imp">Pets</h2>
        <button type="button" className="tp-ani-clear" hidden={!grupo} onClick={() => setGrupo(null)}>Ver todos os pets</button>
      </div>
      <p className="tp-ani-lead" aria-live="polite">
        <b className="num">{formatarInteiro(topo.total)}</b>
        <span>{texto}</span>
      </p>
      <div className={topo.total ? "tp-split" : "tp-split empty"} role="img" aria-label={`${caes} e ${gatos}`}>
        {topo.total > 0 && (
          <>
            <i style={{ width: `${porcentagem(topo.caes, topo.total)}%` }} />
            <i style={{ flex: 1 }} />
          </>
        )}
      </div>
      <p className="tp-split-l"><span>{caes}</span><span>{gatos}</span></p>
      <div className="tp-ani-grp">
        <h3 className="tp-sub-h">{todos ? `Desde ${mesPorExtenso(primeiro)}` : `Em ${mes}`}</h3>
        <div className="tp-stats">
          {botao("castrados", "ev", "Castrados")}
          {botao("adotados", "ev", "Adotados")}
        </div>
      </div>
      <div className="tp-ani-grp">
        <h3 className="tp-sub-h">{todos || atual ? "Situação hoje" : `Situação no fim de ${mes}`}</h3>
        <div className="tp-stats">
          {botao("lar", "sn", "Em lar temporário")}
          {botao("rua", "sn", "Em situação de rua")}
        </div>
      </div>
      <div className="card-foot">
        <Link className="tp-more" href="/pets">Conhecer os pets<Seta /></Link>
      </div>
    </section>
  );
}

function Campanha({ c }: { c: CampanhaPublica }) {
  const p = c.meta ? Math.min(100, porcentagem(c.arrecadado, c.meta)) : null;
  return (
    <article className={`tp-camp ${c.aberta ? "open" : "closed"}`}>
      {/* foto da campanha; enquanto não houver foto enviada, um espaço reservado com a pata */}
      {c.fotoPath ? (
        <Foto className="ph" bucket="campanhas" caminho={c.fotoPath} foco={c.fotoFoco} alt={`Foto de ${c.nome}`} />
      ) : (
        <div className="ph" role="img" aria-label="Espaço para a foto (ainda não enviada)">
          <Pata />
          <span>Foto</span>
        </div>
      )}
      <div className="body">
        <div className="top">
          <h3>{c.nome}</h3>
          {!c.aberta && <span className="chip chip-off">Encerrada</span>}
        </div>
        {c.descricao && <p className="desc">{c.descricao}</p>}
        <p className="raised">
          <b className="num">{formatarBRL(c.arrecadado)}</b>arrecadados{c.meta ? ` de ${formatarBRL(c.meta)}` : ""}
        </p>
        {p !== null && (
          <div className="prog" role="img" aria-label={`${p}% da meta`}><i style={{ width: `${p}%` }} /></div>
        )}
        <p className="nums">
          Gasto <b>{formatarBRL(c.gasto)}</b> · Saldo <b>{formatarBRL(c.arrecadado - c.gasto)}</b>
        </p>
      </div>
    </article>
  );
}

function CartaoCampanhas({ campanhas }: { campanhas: CampanhaPublica[] }) {
  const [verHistorico, setVerHistorico] = useState(false);
  const abertas = campanhas.filter((c) => c.aberta);
  const encerradas = campanhas.filter((c) => !c.aberta);

  return (
    <section className="card c-camp" aria-labelledby="h-camp">
      <div className="card-h">
        <h2 id="h-camp">Campanhas em andamento</h2>
        <span className="meta">Arrecadações para casos específicos. Mostramos só os totais.</span>
      </div>
      <div className="tp-camps">
        {abertas.length ? abertas.map((c) => <Campanha key={c.id} c={c} />) : <p className="muted">Nenhuma campanha em andamento agora.</p>}
      </div>
      <div className="tp-camps" id="camps-old" hidden={!verHistorico}>
        {encerradas.map((c) => <Campanha key={c.id} c={c} />)}
      </div>
      <div className="card-foot">
        {encerradas.length > 0 && (
          <button
            className="tp-more tp-toggle"
            type="button"
            aria-expanded={verHistorico}
            aria-controls="camps-old"
            onClick={() => setVerHistorico(!verHistorico)}
          >
            {verHistorico ? "Esconder histórico" : `Ver histórico (${plural(encerradas.length, "encerrada", "encerradas")})`}
            <Seta d={verHistorico ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
          </button>
        )}
      </div>
    </section>
  );
}
