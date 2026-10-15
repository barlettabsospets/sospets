"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { Dialogo } from "@/components/ui/Dialogo";
import { GrupoDeBotoes } from "@/components/ui/GrupoDeBotoes";
import { Paginacao } from "@/components/ui/Paginacao";
import { paginar } from "@/components/ui/paginacao";
import { SeletorDePeriodo } from "@/components/ui/SeletorDePeriodo";
import { useToast } from "@/components/ui/Toast";
import { desfazerContribuicao, registrarAvulsa, registrarContribuicao } from "@/lib/admin/contribuicoes";
import type { Resultado } from "@/lib/admin/membros";
import type { CampanhaAberta } from "@/lib/dados/admin";
import { arrecadadoNoMes, type Contribuicao, diaEMes, type LinhaDoMes, linhasDoMes } from "@/lib/dominio/contribuicoes";
import { capitalizar, formatarBRL, lerReais, mesPorExtenso, porcentagem, reaisNoCampo, semAcento } from "@/lib/dominio/formatacao";
import type { Membro } from "@/lib/dominio/membros";
import { type Mes, listaDeMeses } from "@/lib/dominio/meses";

type Visao = "pend" | "paid" | "all";

// circunferência do anel (r = 44)
const C = 2 * Math.PI * 44;

const Mais = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const Lupa = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></svg>
);
const Certo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
);

// Uma linha da lista: quem já contribuiu (valor e "Desfazer") ou quem falta (campo de valor e "Contribuiu").
function Linha({
  linha, ocupado, aoContribuir, aoDesfazer,
}: {
  linha: LinhaDoMes;
  ocupado: boolean;
  aoContribuir: (valor: number) => void;
  aoDesfazer: () => void;
}) {
  const { membro: m, contribuicao: c } = linha;
  const campo = useRef<HTMLInputElement>(null);
  return (
    <div className={c ? "row paid" : "row"}>
      <div className="avatar" aria-hidden="true">{m.nome[0]}</div>
      <div className="who">
        <strong>{m.nome}</strong>
        {c ? (
          <span className="chip chip-ok" style={{ marginTop: 4 }}><Certo />Pago em {diaEMes(c.registradaEm)}</span>
        ) : (
          linha.alerta
            ? <span className="chip chip-warn" style={{ marginTop: 4 }}>{linha.nota}</span>
            : <small>{linha.nota}</small>
        )}
      </div>
      <div className="actions">
        {c ? (
          <>
            <b style={{ marginRight: "auto" }}>{formatarBRL(c.valor)}</b>
            <button className="btn btn-ghost btn-sm" type="button" disabled={ocupado} onClick={aoDesfazer}>Desfazer</button>
          </>
        ) : (
          <>
            <div className="money">
              <span>R$</span>
              <input ref={campo} aria-label={`Valor de ${m.nome}`} inputMode="decimal" defaultValue={reaisNoCampo(linha.sugerido)} />
            </div>
            <button
              className="btn btn-primary"
              type="button"
              disabled={ocupado}
              onClick={() => aoContribuir(lerReais(campo.current?.value ?? "") || linha.sugerido)}
            >
              Contribuiu
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Tela Contribuições (admin-contribuicoes.html): escolher o mês, marcar quem contribuiu
// (com "Desfazer"), resumo do mês e doação avulsa.
export function PainelContribuicoes({
  membros, contribuicoes, campanhas, mesAtual, dadosDesde, padrao, avisoMeses,
}: {
  membros: Membro[];
  contribuicoes: Contribuicao[];
  campanhas: CampanhaAberta[];
  mesAtual: Mes;
  dadosDesde: Mes;
  padrao: number;
  avisoMeses: number;
}) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [mes, setMes] = useState<Mes>(mesAtual);
  const [visao, setVisao] = useState<Visao>("pend");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  // membros com uma gravação em andamento (evita clique duplo)
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  // doação avulsa
  const [avulsaAberta, setAvulsaAberta] = useState(false);
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [valorAvulso, setValorAvulso] = useState("");
  const [campanhaId, setCampanhaId] = useState("");

  const gravar = <T,>(chave: string, acao: () => Promise<Resultado<T>>, aoGravar: (dados: T) => void) => {
    setOcupados((s) => new Set(s).add(chave));
    iniciar(async () => {
      const r = await acao();
      setOcupados((s) => {
        const n = new Set(s);
        n.delete(chave);
        return n;
      });
      if (r.ok) aoGravar(r.dados);
      else toast(r.erro);
    });
  };

  const meses = listaDeMeses(dadosDesde, mesAtual);
  const opcoes = [...meses].reverse().map((m) => ({
    valor: m,
    rotulo: capitalizar(mesPorExtenso(m)),
    etiqueta: m === mesAtual ? "mês atual" : undefined,
  }));

  const linhas = linhasDoMes(membros, contribuicoes, mes, padrao, avisoMeses);
  const total = linhas.length;
  const pagos = linhas.filter((l) => l.contribuicao).length;
  const falta = total - pagos;

  const termo = semAcento(busca.trim());
  const lista = linhas.filter(
    (l) => (visao === "all" || (visao === "paid") === Boolean(l.contribuicao)) && (!termo || semAcento(l.membro.nome).includes(termo)),
  );
  const pg = paginar(lista, pagina, ["membro", "membros"]);
  const vazio = termo
    ? "Ninguém encontrado com esse nome."
    : visao === "pend" ? "Todo mundo contribuiu neste mês. Obrigada pelo cuidado!" : "Ninguém contribuiu neste mês ainda.";

  const contribuir = (l: LinhaDoMes, valor: number) =>
    gravar(l.membro.id, () => registrarContribuicao({ membroId: l.membro.id, mes, valor }), (id) =>
      toast(`Contribuição de ${formatarBRL(valor)} registrada para ${l.membro.nome}.`, () =>
        gravar(l.membro.id, () => desfazerContribuicao({ id }), () => {}),
      ),
    );

  const desfazer = (l: LinhaDoMes) =>
    gravar(l.membro.id, () => desfazerContribuicao({ id: l.contribuicao!.id }), () =>
      toast(`Contribuição de ${l.membro.nome} desfeita.`),
    );

  const abrirAvulsa = () => {
    setNomeAvulso("");
    setValorAvulso("20,00");
    setCampanhaId("");
    setAvulsaAberta(true);
  };

  const salvarAvulsa = (e: FormEvent) => {
    e.preventDefault();
    setAvulsaAberta(false);
    const v = lerReais(valorAvulso) || 20;
    const n = nomeAvulso.trim();
    gravar("avulsa", () => registrarAvulsa({ mes, valor: v, nome: n, campanhaId: campanhaId || null }), () =>
      toast(`Doação avulsa de ${formatarBRL(v)} registrada (${n || "Anônimo"}).`),
    );
  };

  return (
    <>
      <div className="split ad-topo">
        <aside>
          <div className="ad-period">
            <span className="lab" id="periodo-lab">Selecione o mês</span>
            <SeletorDePeriodo
              id="periodo"
              idDoRotulo="periodo-lab"
              opcoes={opcoes}
              passos={meses}
              valor={mes}
              aoMudar={(v) => {
                setMes(v as Mes);
                setPagina(1);
              }}
            />
          </div>
          <article className="tile" aria-live="polite">
            <div className="summary">
              <div className="mini-ring" aria-hidden="true">
                <svg viewBox="0 0 104 104">
                  <circle className="t" cx="52" cy="52" r="44" fill="none" strokeWidth="11" />
                  <circle
                    className="a" cx="52" cy="52" r="44" fill="none" strokeWidth="11" strokeLinecap="round"
                    strokeDasharray={`${total ? (pagos / total) * C : 0} ${C}`}
                  />
                </svg>
                <b>{porcentagem(pagos, total)}%</b>
              </div>
              <div className="big">
                <span>{pagos}</span> de <span>{total}</span> membros
                <small>{falta ? `Faltam ${falta} ${falta === 1 ? "membro" : "membros"} contribuir` : "Todos contribuíram"}</small>
                <small>Arrecadado no mês: <b>{formatarBRL(arrecadadoNoMes(contribuicoes, mes))}</b></small>
              </div>
            </div>
          </article>
          <button className="btn btn-secondary" type="button" onClick={abrirAvulsa}>
            <Mais />
            Registrar doação avulsa
          </button>
        </aside>
        <section aria-label="Membros">
          <div className="ahead">
            <h1>Contribuições</h1>
            <p>Marque quem contribuiu no mês. Os nomes aparecem só aqui; o site público mostra apenas os totais.</p>
          </div>
          <div className="ad-tools">
            <label className="ad-busca">
              <Lupa />
              <span className="sr-only">Buscar membro</span>
              <input
                type="search"
                placeholder="Buscar membro…"
                autoComplete="off"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
              />
            </label>
            <GrupoDeBotoes
              className="ad-chips"
              rotulo="Mostrar"
              valor={visao}
              aoMudar={(v) => {
                setVisao(v as Visao);
                setPagina(1);
              }}
              opcoes={[
                { valor: "pend", rotulo: <>Faltam contribuir<b>{falta}</b></> },
                { valor: "paid", rotulo: <>Já contribuíram<b>{pagos}</b></> },
                { valor: "all", rotulo: <>Todos<b>{total}</b></> },
              ]}
            />
          </div>
          <p className="ad-count" aria-live="polite">{pg.contador}</p>
          <div className="glist" hidden={lista.length === 0}>
            {pg.itens.map((l) => (
              <Linha
                // a chave muda com o mês e com o estado: o campo volta ao valor sugerido
                key={`${mes}-${l.membro.id}-${l.contribuicao?.id ?? "falta"}`}
                linha={l}
                ocupado={ocupados.has(l.membro.id)}
                aoContribuir={(v) => contribuir(l, v)}
                aoDesfazer={() => desfazer(l)}
              />
            ))}
          </div>
          <div className="empty" hidden={lista.length > 0}>{vazio}</div>
          <Paginacao pagina={pg.pagina} paginas={pg.paginas} rotulo="Páginas da lista de membros" aoIr={setPagina} />
        </section>
      </div>

      <Dialogo aberto={avulsaAberta} aoFechar={() => setAvulsaAberta(false)} aria-labelledby="dlg-t">
        <form onSubmit={salvarAvulsa}>
          <h2 id="dlg-t">Doação avulsa</h2>
          <p className="muted" style={{ marginTop: -8 }}>
            Para quem não é membro, ou quando a pessoa prefere não ser identificada.
          </p>
          <div className="field">
            <label htmlFor="d-nome">Nome (opcional)</label>
            <input id="d-nome" placeholder="Anônimo" value={nomeAvulso} onChange={(e) => setNomeAvulso(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="d-val">Valor</label>
            <div className="money">
              <span>R$</span>
              <input id="d-val" inputMode="decimal" value={valorAvulso} onChange={(e) => setValorAvulso(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="d-camp">Campanha (opcional)</label>
            <select id="d-camp" value={campanhaId} onChange={(e) => setCampanhaId(e.target.value)}>
              <option value="">Nenhuma</option>
              {campanhas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="btns">
            <button className="btn btn-secondary" type="button" onClick={() => setAvulsaAberta(false)}>Cancelar</button>
            <button className="btn btn-primary" type="submit">Registrar</button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
