"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { Dialogo } from "@/components/ui/Dialogo";
import { Dica } from "@/components/ui/Dica";
import { Escolha } from "@/components/ui/Escolha";
import { IconeEspecie } from "@/components/ui/IconeEspecie";
import { Paginacao } from "@/components/ui/Paginacao";
import { paginar } from "@/components/ui/paginacao";
import { SeletorDePeriodo } from "@/components/ui/SeletorDePeriodo";
import { useToast } from "@/components/ui/Toast";
import { cancelarDespesa, salvarDespesa } from "@/lib/admin/despesas";
import type { Resultado } from "@/lib/admin/membros";
import type { CampanhaDoAdmin, Categoria, DespesaDoAdmin, PetParaEscolha } from "@/lib/dados/admin";
import { diaEMes, diaEmBrasilia } from "@/lib/dominio/contribuicoes";
import { categoriasDoMes, opcoesDoFormulario, resumoDoMes, textoDaQuantidade } from "@/lib/dominio/despesas";
import { capitalizar, formatarBRL, lerReais, mesPorExtenso, nomeDoMes, reaisNoCampo } from "@/lib/dominio/formatacao";
import { type Mes, listaDeMeses, paraMes } from "@/lib/dominio/meses";

const Mais = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const Seta = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>;

// Tela Despesas do admin (admin-despesas.html): escolher o mês, total e "Por categoria"
// (que filtra a lista), nova/editar despesa na mesma janela e cancelar com motivo.
export function PainelDespesas({
  despesas, categorias, pets, campanhas, mesAtual, dadosDesde,
}: {
  despesas: DespesaDoAdmin[];
  categorias: Categoria[];
  pets: PetParaEscolha[];
  campanhas: CampanhaDoAdmin[];
  mesAtual: Mes;
  dadosDesde: Mes;
}) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [mes, setMes] = useState<Mes>(mesAtual);
  const [filtro, setFiltro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  // janela da despesa: undefined = fechada; null = nova
  const [editando, setEditando] = useState<DespesaDoAdmin | null | undefined>(undefined);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [petId, setPetId] = useState("");
  const [campanhaId, setCampanhaId] = useState("");
  const campoDescricao = useRef<HTMLInputElement>(null);
  const campoValor = useRef<HTMLInputElement>(null);
  // janela "Cancelar despesa"
  const [cancelando, setCancelando] = useState<DespesaDoAdmin | null>(null);
  const [motivo, setMotivo] = useState("");

  const gravar = (acao: () => Promise<Resultado>, aoGravar: () => void) =>
    iniciar(async () => {
      const r = await acao();
      if (r.ok) aoGravar();
      else toast(r.erro);
    });

  // meses do seletor: do início dos dados (ou da despesa mais antiga) até hoje (ou a mais nova)
  const mesesComDespesa = despesas.map((d) => paraMes(d.data));
  const inicio = [dadosDesde, ...mesesComDespesa].reduce((a, b) => (b < a ? b : a));
  const fim = [mesAtual, ...mesesComDespesa].reduce((a, b) => (b > a ? b : a));
  const meses = listaDeMeses(inicio, fim);
  const opcoesDoMes = [...meses].reverse().map((m) => ({
    valor: m,
    rotulo: capitalizar(mesPorExtenso(m)),
    etiqueta: m === mesAtual ? "mês atual" : undefined,
  }));

  const doMes = despesas.filter((d) => paraMes(d.data) === mes);
  const resumo = resumoDoMes(doMes);
  const porCategoria = categoriasDoMes(doMes);
  const maior = Math.max(1, ...porCategoria.map((c) => c.total));
  // o filtro some quando a categoria não tem despesa no mês escolhido
  const fCat = filtro && porCategoria.some((c) => c.categoria === filtro) ? filtro : null;
  const lista = doMes.filter((d) => !fCat || d.categoria === fCat);
  const nomeMes = nomeDoMes(mes);
  const pg = paginar(
    lista,
    pagina,
    fCat
      ? [`despesa de ${fCat.toLowerCase()} em ${nomeMes}`, `despesas de ${fCat.toLowerCase()} em ${nomeMes}`]
      : [`despesa em ${nomeMes}`, `despesas em ${nomeMes}`],
  );

  const irParaMes = (m: Mes) => {
    setMes(m);
    setPagina(1);
  };

  const abrir = (d: DespesaDoAdmin | null) => {
    const primeira = categorias.find((c) => c.ativa);
    setEditando(d);
    setDescricao(d?.descricao ?? "");
    setValor(d ? reaisNoCampo(d.valor) : "");
    setData(d?.data ?? diaEmBrasilia(new Date().toISOString()));
    setCategoriaId(d?.categoriaId ?? primeira?.id ?? "");
    setPetId(d?.petId ?? "");
    setCampanhaId(d?.campanhaId ?? "");
    requestAnimationFrame(() => campoDescricao.current?.focus());
  };

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const t = descricao.trim();
    const v = lerReais(valor);
    if (!t || !v) {
      (!t ? campoDescricao : campoValor).current?.focus();
      return;
    }
    const d = editando;
    setEditando(undefined);
    const dados = { descricao: t, valor: v, data, categoriaId, petId: petId || null, campanhaId: campanhaId || null };
    gravar(
      () => salvarDespesa(d ? { id: d.id, ...dados } : dados),
      () => {
        irParaMes(paraMes(data));
        if (d) {
          const antes = {
            id: d.id, descricao: d.descricao, valor: d.valor, data: d.data,
            categoriaId: d.categoriaId, petId: d.petId, campanhaId: d.campanhaId,
          };
          toast("Despesa atualizada.", () => gravar(() => salvarDespesa(antes), () => irParaMes(paraMes(d.data))));
        } else {
          toast(`Despesa de ${formatarBRL(v)} registrada.`);
        }
      },
    );
  };

  const abrirCancelar = () => {
    setCancelando(editando ?? null);
    setEditando(undefined);
    setMotivo("");
  };

  const cancelar = (e: FormEvent) => {
    e.preventDefault();
    const d = cancelando;
    const m = motivo.trim();
    if (!d || !m) return;
    setCancelando(null);
    gravar(() => cancelarDespesa({ id: d.id, motivo: m }), () =>
      toast("Despesa cancelada. Ela saiu da lista e do total do mês.", () => gravar(() => cancelarDespesa({ id: d.id, motivo: null }), () => {})),
    );
  };

  const opcoesDeCategoria = opcoesDoFormulario(categorias, (c) => c.ativa, editando?.categoriaId ?? null)
    .map((c) => ({ valor: c.id, rotulo: c.nome, cor: c.cor }));
  const opcoesDeCampanha = opcoesDoFormulario(campanhas, (c) => c.aberta, editando?.campanhaId ?? null);

  return (
    <>
      <div className="split ad-topo">
        <aside>
          <div className="ad-period">
            <span className="lab" id="periodo-lab">Selecione o mês</span>
            <SeletorDePeriodo id="periodo" idDoRotulo="periodo-lab" opcoes={opcoesDoMes} passos={meses} valor={mes} aoMudar={(v) => irParaMes(v as Mes)} />
          </div>
          <button className="btn btn-primary" type="button" onClick={() => abrir(null)}>
            <Mais />
            Nova despesa
          </button>
          <article className="tile" aria-live="polite">
            <h2>Gasto em {nomeMes}</h2>
            <span className="num">{formatarBRL(resumo.total)}</span>
            <p className="small">{textoDaQuantidade(resumo)}</p>
            {porCategoria.length > 0 && (
              <>
                <h3 className="ad-sub" id="l-cats">Por categoria</h3>
                <ul className="ad-cats" aria-labelledby="l-cats">
                  {porCategoria.map((c) => (
                    <li key={c.categoria}>
                      <button
                        type="button"
                        aria-pressed={fCat === c.categoria}
                        className={fCat && fCat !== c.categoria ? "off" : undefined}
                        onClick={() => {
                          setFiltro(fCat === c.categoria ? null : c.categoria);
                          setPagina(1);
                        }}
                      >
                        <span className="n"><i style={{ background: c.cor }} aria-hidden="true" />{c.categoria}</span>
                        <span className="v">{formatarBRL(c.total)}</span>
                        <span className="t" aria-hidden="true"><b style={{ width: `${(c.total / maior) * 100}%`, background: c.cor }} /></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>
        </aside>
        <section aria-label="Lista de despesas">
          <div className="ahead">
            <div className="com-dica">
              <h1>Despesas</h1>
              <Dica sobre="a página Despesas">Lance o que foi pago e corrija quando precisar. Cada despesa aparece no site público na hora, sem nomes de pessoas.</Dica>
            </div>
          </div>
          <div className="ad-list-h">
            <p className="ad-count" aria-live="polite">{pg.contador}</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              hidden={!fCat}
              onClick={() => {
                setFiltro(null);
                setPagina(1);
              }}
            >
              Limpar filtro
            </button>
          </div>
          <div className="glist" hidden={lista.length === 0}>
            {pg.itens.map((d) => (
              <button
                type="button"
                key={d.id}
                className="arow ad-rowbtn sem-thumb"
                aria-label={`Editar ${d.descricao}`}
                onClick={() => abrir(d)}
              >
                <span className="txt">
                  <span className="t1">{d.descricao}</span>
                  <span className="t2">
                    <i className="cdot" style={{ background: d.cor }} aria-hidden="true" />
                    {d.categoria} · {diaEMes(d.data)} ·{" "}
                    <span className="pet">
                      {d.especie && <IconeEspecie especie={d.especie} />}
                      {d.pet ?? "Vários pets"}
                    </span>
                  </span>
                </span>
                <span className="acts">
                  <span className="amt">{formatarBRL(d.valor)}</span>
                  <span className="go">Editar<Seta /></span>
                </span>
              </button>
            ))}
          </div>
          <div className="empty" hidden={lista.length > 0}>
            {doMes.length ? "Nenhuma despesa nesta categoria." : `Nenhuma despesa lançada em ${nomeMes} ainda.`}
          </div>
          <Paginacao pagina={pg.pagina} paginas={pg.paginas} rotulo="Páginas da lista de despesas" aoIr={setPagina} />
        </section>
      </div>

      <Dialogo className="ad-dlg" aberto={editando !== undefined} aoFechar={() => setEditando(undefined)} aria-labelledby="dlg-t">
        <form onSubmit={salvar} noValidate>
          <header className="ad-dlg-h">
            <h2 id="dlg-t">{editando ? "Editar despesa" : "Nova despesa"}</h2>
            <button className="ad-x" type="button" aria-label="Fechar" onClick={() => setEditando(undefined)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </header>
          <div className="ad-dlg-b">
            <div className="ad-sec">
              <div className="field">
                <label htmlFor="f-desc">O que foi comprado ou pago?</label>
                <input
                  id="f-desc" ref={campoDescricao} placeholder="Ex.: Ração para gatos de rua" required autoComplete="off"
                  value={descricao} onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div className="ad-row2">
                <div className="field">
                  <label htmlFor="f-val">Valor</label>
                  <div className="money">
                    <span>R$</span>
                    <input
                      id="f-val" ref={campoValor} inputMode="decimal" placeholder="0,00" required
                      value={valor} onChange={(e) => setValor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="f-data">Data</label>
                  <input id="f-data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <span className="lbl" id="l-cat">Categoria</span>
                <Escolha id="f-cat" idDoRotulo="l-cat" opcoes={opcoesDeCategoria} valor={categoriaId} aoMudar={setCategoriaId} />
              </div>
              <div className="ad-row2">
                <div className="field">
                  <div className="com-dica">
                    <label htmlFor="f-ani">Pet (opcional)</label>
                    <Dica sobre="Pet (opcional)">Serve para saber, depois, quanto cada pet custou.</Dica>
                  </div>
                  <select id="f-ani" value={petId} onChange={(e) => setPetId(e.target.value)}>
                    <option value="">Nenhum (vários pets)</option>
                    {pets.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="f-camp">Campanha (opcional)</label>
                  <select id="f-camp" value={campanhaId} onChange={(e) => setCampanhaId(e.target.value)}>
                    <option value="">Nenhuma</option>
                    {opcoesDeCampanha.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <footer className="ad-dlg-f">
            <button className="btn ad-perigo" type="button" hidden={!editando} onClick={abrirCancelar}>
              Cancelar despesa
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setEditando(undefined)}>Fechar</button>
            <button className="btn btn-primary" type="submit">{editando ? "Salvar alterações" : "Salvar despesa"}</button>
          </footer>
        </form>
      </Dialogo>

      <Dialogo aberto={cancelando !== null} aoFechar={() => setCancelando(null)} aria-labelledby="v-t">
        <form onSubmit={cancelar}>
          <h2 id="v-t">Cancelar despesa</h2>
          <p className="muted" style={{ marginTop: -8 }}>
            {cancelando && `${cancelando.descricao} (${formatarBRL(cancelando.valor)})`}
          </p>
          <div className="field">
            <label htmlFor="v-m">Motivo</label>
            <input id="v-m" placeholder="Ex.: lançada em duplicidade" required value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <p className="hint muted">
            A despesa não é apagada: sai da lista e do total, e fica registrada no histórico de alterações (em Mais).
          </p>
          <div className="btns">
            <button className="btn btn-secondary" type="button" onClick={() => setCancelando(null)}>Voltar</button>
            <button className="btn ad-perigo-cheio" type="submit">Cancelar despesa</button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
