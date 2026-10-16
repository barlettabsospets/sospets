"use client";

import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import { Dialogo } from "@/components/ui/Dialogo";
import { GrupoDeBotoes } from "@/components/ui/GrupoDeBotoes";
import { CampoFoto, type FormatoDaFoto, type FotoEscolhida } from "./CampoFoto";
import { useToast } from "@/components/ui/Toast";
import { mudarSituacao, salvarCampanha } from "@/lib/admin/campanhas";
import type { Resultado } from "@/lib/admin/membros";
import type { CampanhaDoAdmin } from "@/lib/dados/admin";
import { dataPorExtenso, progressoDaMeta, saldoDaCampanha } from "@/lib/dominio/campanhas";
import { diaEmBrasilia } from "@/lib/dominio/contribuicoes";
import { formatarBRL, lerReais } from "@/lib/dominio/formatacao";
import { FOCO_CENTRO, urlDaFoto } from "@/lib/dominio/fotos";

type Filtro = "all" | "open" | "closed";
type Situacao = "em_andamento" | "encerrada";

const Mais = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// no site, a foto da campanha aparece quadrada (Prestação de contas)
const FORMATOS: FormatoDaFoto[] = [{ rotulo: "Campanha", proporcao: "1" }];

// meta no campo: 640 → "640", 12.5 → "12,5" (como o protótipo)
const metaNoCampo = (meta: number | null) => (meta ? String(meta).replace(".", ",") : "");

// Tela Campanhas (admin-campanhas.html): lista com filtro, nova/editar e encerrar/reabrir.
// O protótipo não tem foto no formulário; ela usa o bloco "Foto" do formulário de pet.
export function ListaCampanhas({ campanhas }: { campanhas: CampanhaDoAdmin[] }) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("all");

  // janela: undefined = fechada; null = nova
  const [editando, setEditando] = useState<CampanhaDoAdmin | null | undefined>(undefined);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [meta, setMeta] = useState("");
  const [inicio, setInicio] = useState("");
  const [situacao, setSituacao] = useState<Situacao>("em_andamento");
  const [foto, setFoto] = useState<FotoEscolhida>({ previa: null, foco: FOCO_CENTRO });

  const gravar = (acao: () => Promise<Resultado>, aoGravar: () => void) =>
    iniciar(async () => {
      const r = await acao();
      if (r.ok) aoGravar();
      else toast(r.erro);
    });

  const abertas = campanhas.filter((c) => c.aberta).length;
  const lista = campanhas.filter((c) => filtro === "all" || (filtro === "open") === c.aberta);

  const abrir = (c: CampanhaDoAdmin | null) => {
    setEditando(c);
    setNome(c?.nome ?? "");
    setDescricao(c?.descricao ?? "");
    setMeta(metaNoCampo(c?.meta ?? null));
    setInicio(c?.inicio ?? diaEmBrasilia(new Date().toISOString()));
    setSituacao(c && !c.aberta ? "encerrada" : "em_andamento");
    setFoto({
      previa: c?.fotoPath ? urlDaFoto(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", "campanhas", c.fotoPath) : null,
      foco: c?.fotoFoco ?? FOCO_CENTRO,
    });
  };

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    if (!n || foto.preparando) return;
    const c = editando;
    setEditando(undefined);
    const dados = { nome: n, descricao, meta: lerReais(meta) || null, inicio, situacao, foto: foto.envio, foco: foto.foco };
    gravar(
      () => salvarCampanha(c ? { id: c.id, ...dados } : dados),
      () => toast(c ? "Campanha atualizada." : `Campanha "${n}" criada. Ligue doações e despesas a ela ao lançar.`),
    );
  };

  const alternar = (c: CampanhaDoAdmin) => {
    const nova: Situacao = c.aberta ? "encerrada" : "em_andamento";
    gravar(
      () => mudarSituacao({ id: c.id, situacao: nova }),
      () =>
        toast(c.aberta ? `${c.nome} foi encerrada.` : `${c.nome} voltou a ficar em andamento.`, () =>
          gravar(() => mudarSituacao({ id: c.id, situacao: c.aberta ? "em_andamento" : "encerrada" }), () => {}),
        ),
    );
  };

  return (
    <>
      <div className="split">
        <aside>
          <button className="btn btn-primary" type="button" onClick={() => abrir(null)}>
            <Mais />
            Nova campanha
          </button>
          <Link className="tp-more" href="/admin/mais">
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: "rotate(180deg)" }}><path d="m9 5 7 7-7 7" /></svg>
            Voltar para Mais
          </Link>
        </aside>
        <section aria-label="Lista de campanhas">
          <div className="ad-tools">
            <GrupoDeBotoes
              className="ad-chips"
              rotulo="Mostrar"
              valor={filtro}
              aoMudar={(v) => setFiltro(v as Filtro)}
              opcoes={[
                { valor: "all", rotulo: <>Todas<b>{campanhas.length}</b></> },
                { valor: "open", rotulo: <>Em andamento<b>{abertas}</b></> },
                { valor: "closed", rotulo: <>Encerradas<b>{campanhas.length - abertas}</b></> },
              ]}
            />
          </div>
          <div className="camps">
            {lista.map((c) => {
              const p = progressoDaMeta(c.arrecadado, c.meta);
              return (
                <article className={`tile camp ${c.aberta ? "open" : "closed"}`} key={c.id}>
                  <div className="top">
                    <h3>{c.nome}</h3>
                    <span className={`chip ${c.aberta ? "chip-ok" : "chip-off"}`}>{c.aberta ? "Em andamento" : "Encerrada"}</span>
                  </div>
                  {c.descricao && <p className="desc">{c.descricao}</p>}
                  <p className="since">Desde {dataPorExtenso(c.inicio)}</p>
                  <div className="camp-big">
                    <b>{formatarBRL(c.arrecadado)}</b>
                    <span>arrecadado{c.meta ? ` de ${formatarBRL(c.meta)} (${p}% da meta)` : ""}</span>
                  </div>
                  {c.meta && (
                    <div className="prog" role="img" aria-label={`${p}% da meta`}><i style={{ width: `${p}%` }} /></div>
                  )}
                  <dl className="camp-rows">
                    <div><dt>Gasto</dt><dd>{formatarBRL(c.gasto)}</dd></div>
                    <div><dt>Saldo</dt><dd>{formatarBRL(saldoDaCampanha(c.arrecadado, c.gasto))}</dd></div>
                  </dl>
                  <div className="camp-actions">
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => abrir(c)}>Editar</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => alternar(c)}>
                      {c.aberta ? "Encerrar campanha" : "Reabrir campanha"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="empty" hidden={lista.length > 0}>Nenhuma campanha aqui ainda.</div>
        </section>
      </div>

      <Dialogo aberto={editando !== undefined} aoFechar={() => setEditando(undefined)} aria-labelledby="dlg-t">
        <form onSubmit={salvar}>
          <h2 id="dlg-t">{editando ? "Editar campanha" : "Nova campanha"}</h2>
          <CampoFoto id="c-foto" valor={foto} aoMudar={setFoto} formatos={FORMATOS} />
          <div className="field">
            <label htmlFor="c-n">Nome da campanha</label>
            <input id="c-n" placeholder="Ex.: Campanha da Mel" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="c-d">Descrição (aparece no site)</label>
            <input id="c-d" placeholder="Em uma frase, para que serve" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="c-meta">Meta (opcional)</label>
              <div className="money">
                <span>R$</span>
                <input id="c-meta" inputMode="decimal" placeholder="0,00" value={meta} onChange={(e) => setMeta(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-ini">Início</label>
              <input id="c-ini" type="date" required value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="c-st">Situação</label>
            <select id="c-st" value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao)}>
              <option value="em_andamento">Em andamento</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
          <div className="btns">
            <button className="btn btn-secondary" type="button" onClick={() => setEditando(undefined)}>Cancelar</button>
            <button className="btn btn-primary" type="submit" disabled={foto.preparando}>Salvar campanha</button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
