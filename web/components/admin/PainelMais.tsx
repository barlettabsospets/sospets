"use client";

import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import { Dialogo } from "@/components/ui/Dialogo";
import { Dica } from "@/components/ui/Dica";
import { useToast } from "@/components/ui/Toast";
import { criarCategoria, mudarCategoriaAtiva, renomearCategoria, salvarConfiguracoes } from "@/lib/admin/mais";
import type { Resultado } from "@/lib/admin/membros";
import type { Categoria, PaginaDoHistorico } from "@/lib/dados/admin";
import type { CampanhaPublica } from "@/lib/dados/publico";
import { formatarBRL } from "@/lib/dominio/formatacao";
import { HistoricoDeAlteracoes } from "./HistoricoDeAlteracoes";

// Tela Mais (admin-mais.html): menu da página, exportar dados, categorias de despesa, campanhas,
// configurações e histórico de alterações.
// Renomear e desativar categoria não existem no protótipo: seguem os botões da tela Membros.
export function PainelMais({
  categorias, campanhas, dataDesde, avisoMeses, historico,
}: {
  categorias: Categoria[];
  campanhas: CampanhaPublica[];
  // "2026-01-01"
  dataDesde: string;
  avisoMeses: number;
  historico: PaginaDoHistorico;
}) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [novaCategoria, setNovaCategoria] = useState("");
  const [desde, setDesde] = useState(dataDesde);
  const [aviso, setAviso] = useState(String(avisoMeses));
  // janela "Renomear categoria"
  const [renomeando, setRenomeando] = useState<Categoria | null>(null);
  const [novoNome, setNovoNome] = useState("");

  const gravar = (acao: () => Promise<Resultado>, aoGravar: () => void) =>
    iniciar(async () => {
      const r = await acao();
      if (r.ok) aoGravar();
      else toast(r.erro);
    });

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    const v = novaCategoria.trim();
    if (!v) return;
    gravar(() => criarCategoria({ nome: v }), () => {
      setNovaCategoria("");
      toast(`Categoria "${v}" criada.`);
    });
  };

  const abrirRenomear = (c: Categoria) => {
    setRenomeando(c);
    setNovoNome(c.nome);
  };

  const renomear = (e: FormEvent) => {
    e.preventDefault();
    const c = renomeando;
    const v = novoNome.trim();
    setRenomeando(null);
    if (!c || !v || v === c.nome) return;
    gravar(() => renomearCategoria({ id: c.id, nome: v }), () =>
      toast(`Categoria renomeada para "${v}".`, () => gravar(() => renomearCategoria({ id: c.id, nome: c.nome }), () => {})),
    );
  };

  // desativada: some ao lançar despesa nova; as despesas antigas continuam com ela
  const alternarAtiva = (c: Categoria) =>
    gravar(() => mudarCategoriaAtiva({ id: c.id, ativa: !c.ativa }), () =>
      toast(
        c.ativa ? `Categoria "${c.nome}" desativada. As despesas antigas continuam com ela.` : `Categoria "${c.nome}" reativada.`,
        () => gravar(() => mudarCategoriaAtiva({ id: c.id, ativa: c.ativa }), () => {}),
      ),
    );

  const salvarConfig = (e: FormEvent) => {
    e.preventDefault();
    gravar(
      () => salvarConfiguracoes({ dadosDesde: desde, avisoMeses: Number(aviso) as 2 | 3 | 6 }),
      () => toast("Configurações salvas."),
    );
  };

  return (
    <>
      <div className="split">
        <aside>
          <nav className="glist menu-list" aria-label="Nesta página">
            <a href="#exportar"><span>Exportar dados<small>Baixar tudo em planilha</small></span></a>
            <a href="#categorias"><span>Categorias de despesa<small>Adicionar ou renomear</small></span></a>
            <Link href="/admin/campanhas"><span>Campanhas<small>Criar, editar, encerrar</small></span></Link>
            <a href="#config"><span>Configurações<small>Início dos dados e avisos</small></span></a>
            <a href="#auditoria"><span>Histórico de alterações<small>Quem mudou o quê</small></span></a>
            <Link href="/admin/conta"><span>Minha conta<small>Trocar a sua senha</small></span></Link>
            <Link href="/"><span>Ver o site público<small>Como os membros enxergam</small></span></Link>
          </nav>
        </aside>
        <div>
          <section className="sec tile" id="exportar">
            <h2>Exportar dados</h2>
            <p className="muted" style={{ marginBottom: 14 }}>Seus dados são da organização. Baixe quando quiser.</p>
            {/* links de download (planilha CSV que abre no Excel), no visual dos botões do protótipo */}
            <div className="two">
              <a className="btn btn-secondary" href="/admin/exportar/doacoes" download>Doações (planilha)</a>
              <a className="btn btn-secondary" href="/admin/exportar/despesas" download>Despesas (planilha)</a>
              <a className="btn btn-secondary" href="/admin/exportar/pets" download>Pets (planilha)</a>
              <a className="btn btn-secondary" href="/admin/exportar/membros" download>Membros (planilha)</a>
            </div>
          </section>
          <section className="sec tile" id="categorias">
            <h2>Categorias de despesa</h2>
            <div className="glist">
              {categorias.map((c) => (
                <div className="arow ad-cat" key={c.id}>
                  <span className="t1">{c.nome}</span>
                  <div className="acts">
                    {!c.ativa && <span className="chip chip-off">Desativada</span>}
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => alternarAtiva(c)}>
                      {c.ativa ? "Desativar" : "Reativar"}
                    </button>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => abrirRenomear(c)}>Renomear</button>
                  </div>
                </div>
              ))}
            </div>
            <form className="field" style={{ marginTop: 14 }} onSubmit={adicionar}>
              <label htmlFor="c-n">Nova categoria</label>
              <div style={{ display: "flex", gap: 10 }}>
                <input id="c-n" placeholder="Ex.: Taxas e cartório" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} />
                <button className="btn btn-primary" type="submit" style={{ flex: "none" }}>Adicionar</button>
              </div>
            </form>
          </section>

          <section className="sec tile" id="campanhas">
            <h2>Campanhas</h2>
            <div className="glist">
              {campanhas.map((c, i) => (
                <div className="arow" key={c.id}>
                  <div className={`thumb g${i % 4}`} aria-hidden="true">{c.nome[0]}</div>
                  <div>
                    <span className="t1">{c.nome}</span>
                    <span className="t2">{formatarBRL(c.arrecadado)} arrecadados · {formatarBRL(c.gasto)} gastos</span>
                  </div>
                  <span className={`chip ${c.aberta ? "chip-ok" : "chip-off"}`}>{c.aberta ? "Em andamento" : "Encerrada"}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 14 }}>
              <Link className="btn btn-secondary" href="/admin/campanhas">Gerenciar campanhas</Link>
            </p>
          </section>

          <section className="sec tile" id="config">
            <h2>Configurações</h2>
            <form className="ad-form" onSubmit={salvarConfig}>
              <p className="muted" style={{ margin: 0 }}>
                O valor padrão da contribuição mensal fica em <Link href="/admin/membros">Membros</Link>, junto de quem tem valor próprio.
              </p>
              <div className="field">
                <div className="com-dica">
                  <label htmlFor="s-i">Dados registrados desde</label>
                  <Dica sobre="Dados registrados desde">Aparece no site público, para ser transparente sobre o que existe.</Dica>
                </div>
                <input id="s-i" type="date" required value={desde} onChange={(e) => setDesde(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="s-a">Avisar quando alguém ficar sem contribuir por</label>
                <select id="s-a" value={aviso} onChange={(e) => setAviso(e.target.value)}>
                  <option value="2">2 meses</option>
                  <option value="3">3 meses</option>
                  <option value="6">6 meses</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit">Salvar configurações</button>
            </form>
          </section>
          <section className="sec tile" id="auditoria">
            <h2>Histórico de alterações</h2>
            <HistoricoDeAlteracoes primeira={historico} />
          </section>
        </div>
      </div>

      <Dialogo aberto={renomeando !== null} aoFechar={() => setRenomeando(null)} aria-labelledby="dlg-cat-t">
        <form onSubmit={renomear}>
          <h2 id="dlg-cat-t">Renomear categoria</h2>
          <div className="field">
            <div className="com-dica">
              <label htmlFor="cat-nome">Nome</label>
              <Dica sobre="o novo nome">O nome muda também nas despesas já lançadas e no site.</Dica>
            </div>
            <input id="cat-nome" required value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
          </div>
          <div className="btns">
            <button className="btn btn-secondary" type="button" onClick={() => setRenomeando(null)}>Cancelar</button>
            <button className="btn btn-primary" type="submit">Salvar nome</button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}