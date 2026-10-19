"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Dialogo } from "@/components/ui/Dialogo";
import { Dica } from "@/components/ui/Dica";
import { GrupoDeBotoes } from "@/components/ui/GrupoDeBotoes";
import { Paginacao } from "@/components/ui/Paginacao";
import { paginar } from "@/components/ui/paginacao";
import { useToast } from "@/components/ui/Toast";
import { alterarValorPadrao, mudarAtivo, type Resultado, salvarMembro } from "@/lib/admin/membros";
import { formatarBRL, lerReais, reaisNoCampo, semAcento } from "@/lib/dominio/formatacao";
import { type Membro, textoDoPadrao, valorDoMembro, valorProprio } from "@/lib/dominio/membros";

type Filtro = "ativo" | "inativo" | "";

const Mais = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const Lupa = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></svg>
);

// Tela Membros (admin-membros.html): lista com busca e filtro, novo/editar membro,
// inativar/reativar e valor padrão do grupo. Grava por Server Actions; a lista
// volta atualizada do servidor (refresh()).
export function ListaMembros({ membros, padrao }: { membros: Membro[]; padrao: number }) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("ativo");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  // janela "Novo membro" / "Editar membro" (undefined = fechada; null = novo)
  const [editando, setEditando] = useState<Membro | null | undefined>(undefined);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  // janela "Alterar valor padrão"
  const [padraoAberto, setPadraoAberto] = useState(false);
  const [novoPadrao, setNovoPadrao] = useState("");
  const [aplicarATodos, setAplicarATodos] = useState(true);

  // roda a ação e mostra o aviso (ou o erro) no toast
  const gravar = <T,>(acao: () => Promise<Resultado<T>>, aoGravar: (dados: T) => void) =>
    iniciar(async () => {
      const r = await acao();
      if (r.ok) aoGravar(r.dados);
      else toast(r.erro);
    });

  const total = membros.length;
  const ativos = membros.filter((m) => m.ativo).length;
  const seguem = membros.filter((m) => m.valorMensal === null).length;

  const termo = semAcento(busca.trim());
  const lista = membros.filter(
    (m) => (!filtro || (filtro === "ativo") === m.ativo) && (!termo || semAcento(m.nome).includes(termo)),
  );
  const pg = paginar(lista, pagina, ["membro", "membros"]);

  const abrirMembro = (m: Membro | null) => {
    setEditando(m);
    setNome(m ? m.nome : "");
    setValor(reaisNoCampo(m ? valorDoMembro(m, padrao) : padrao));
  };

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    if (!n) return;
    const v = lerReais(valor) || padrao;
    const m = editando;
    setEditando(undefined);
    if (m) {
      const antes = { id: m.id, nome: m.nome, valorMensal: m.valorMensal };
      gravar(
        () => salvarMembro({ id: m.id, nome: n, valorMensal: valorProprio(v, padrao) }),
        () => toast(`${n} foi atualizado: ${formatarBRL(v)} por mês.`, () => gravar(() => salvarMembro(antes), () => {})),
      );
    } else {
      gravar(
        () => salvarMembro({ nome: n, valorMensal: valorProprio(v, padrao) }),
        () => {
          setFiltro("ativo");
          setPagina(1);
          toast(`${n} foi adicionado aos membros.`);
        },
      );
    }
  };

  const alternar = (m: Membro) =>
    gravar(
      () => mudarAtivo({ id: m.id, ativo: !m.ativo }),
      () =>
        toast(
          m.ativo ? `${m.nome} foi inativado. O histórico fica guardado.` : `${m.nome} voltou a ser membro ativo.`,
          () => gravar(() => mudarAtivo({ id: m.id, ativo: m.ativo }), () => {}),
        ),
    );

  const abrirPadrao = () => {
    setNovoPadrao(reaisNoCampo(padrao));
    setAplicarATodos(true);
    setPadraoAberto(true);
  };

  // quem segue o padrão hoje: com a caixa desmarcada, fica com o valor antigo
  const salvarPadrao = (e: FormEvent) => {
    e.preventDefault();
    setPadraoAberto(false);
    const v = lerReais(novoPadrao);
    if (!v) return;
    const antigo = padrao;
    gravar(
      () => alterarValorPadrao({ valor: v, fixar: !aplicarATodos }),
      (fixados) =>
        toast(`Valor padrão alterado para ${formatarBRL(v)}.`, () =>
          gravar(() => alterarValorPadrao({ valor: antigo, fixar: false, liberar: fixados }), () => {}),
        ),
    );
  };

  return (
    <>
      <div className="split">
        <aside>
          <button className="btn btn-primary" type="button" onClick={() => abrirMembro(null)}>
            <Mais />
            Novo membro
          </button>
          <article className="tile" aria-live="polite">
            <h2>Membros ativos</h2>
            <span className="num">{ativos}</span>
            <p className="small">de {total} membros cadastrados. Quem fica inativo continua com o histórico guardado.</p>
          </article>
          <article className="tile ad-pad">
            <h2>Valor padrão do grupo</h2>
            <span className="num">{formatarBRL(padrao)}</span>
            <p className="small">{textoDoPadrao(membros)}</p>
            <button className="btn btn-secondary" type="button" onClick={abrirPadrao}>
              Alterar valor padrão
            </button>
          </article>
        </aside>
        <section aria-label="Lista de membros">
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
              valor={filtro}
              aoMudar={(v) => {
                setFiltro(v as Filtro);
                setPagina(1);
              }}
              opcoes={[
                { valor: "ativo", rotulo: <>Ativos<b>{ativos}</b></> },
                { valor: "inativo", rotulo: <>Inativos<b>{total - ativos}</b></> },
                { valor: "", rotulo: <>Todos<b>{total}</b></> },
              ]}
            />
          </div>
          <p className="ad-count" aria-live="polite">{pg.contador}</p>
          <div className="glist" hidden={lista.length === 0}>
            {pg.itens.map((m) => (
              <div className="arow" key={m.id}>
                <div className="avatar" aria-hidden="true">{m.nome[0]}</div>
                <div>
                  <span className="t1">{m.nome}</span>
                  <span className="t2">
                    {formatarBRL(valorDoMembro(m, padrao))} por mês · {m.valorMensal === null ? "valor padrão" : "valor próprio"}
                  </span>
                </div>
                <div className="acts">
                  <span className={`chip ${m.ativo ? "chip-ok" : "chip-off"}`}>{m.ativo ? "Ativo" : "Inativo"}</span>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => alternar(m)}>
                    {m.ativo ? "Inativar" : "Reativar"}
                  </button>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => abrirMembro(m)}>
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="empty" hidden={lista.length > 0}>
            Ninguém encontrado. Confira o nome ou o filtro.
          </div>
          <Paginacao pagina={pg.pagina} paginas={pg.paginas} rotulo="Páginas da lista de membros" aoIr={setPagina} />
        </section>
      </div>

      <Dialogo aberto={editando !== undefined} aoFechar={() => setEditando(undefined)} aria-labelledby="dlg-t">
        <form onSubmit={salvar}>
          <h2 id="dlg-t">{editando ? "Editar membro" : "Novo membro"}</h2>
          <div className="field">
            <label htmlFor="m-nome">Nome</label>
            <input id="m-nome" placeholder="Como aparece na lista" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="field">
            <div className="com-dica">
              <label htmlFor="m-val">Contribuição mensal</label>
              <Dica sobre="Contribuição mensal">
                O valor padrão do grupo é {formatarBRL(padrao)}. Se colocar outro valor, ele passa a ser o valor próprio deste membro.
              </Dica>
            </div>
            <div className="money">
              <span>R$</span>
              <input id="m-val" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
          </div>
          <div className="btns">
            <button className="btn btn-secondary" type="button" onClick={() => setEditando(undefined)}>
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              {editando ? "Salvar alterações" : "Salvar membro"}
            </button>
          </div>
        </form>
      </Dialogo>

      <Dialogo aberto={padraoAberto} aoFechar={() => setPadraoAberto(false)} aria-labelledby="pad-t">
        <form onSubmit={salvarPadrao}>
          <h2 id="pad-t">Alterar valor padrão</h2>
          <p className="muted" style={{ marginTop: -8 }}>
            É o valor sugerido em Contribuições para quem não tem um valor próprio, e o que entra para novos membros.
          </p>
          <div className="field">
            <label htmlFor="p-val">Novo valor padrão</label>
            <div className="money">
              <span>R$</span>
              <input id="p-val" inputMode="decimal" value={novoPadrao} onChange={(e) => setNovoPadrao(e.target.value)} />
            </div>
          </div>
          <label className="check">
            <input type="checkbox" checked={aplicarATodos} onChange={(e) => setAplicarATodos(e.target.checked)} />{" "}
            <span>
              Aplicar também aos {seguem} membros que seguem o padrão hoje (quem tem valor próprio não muda)
            </span>
          </label>
          <div className="btns">
            <button className="btn btn-secondary" type="button" onClick={() => setPadraoAberto(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              Salvar valor
            </button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
