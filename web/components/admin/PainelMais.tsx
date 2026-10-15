"use client";

import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { criarCategoria, salvarConfiguracoes } from "@/lib/admin/mais";
import type { Resultado } from "@/lib/admin/membros";
import type { Categoria } from "@/lib/dados/admin";
import type { CampanhaPublica } from "@/lib/dados/publico";
import { formatarBRL } from "@/lib/dominio/formatacao";

// Tela Mais (admin-mais.html): menu da página, categorias de despesa, campanhas e configurações.
// Exportar dados e Histórico de alterações entram na T5.8.
export function PainelMais({
  categorias, campanhas, dataDesde, avisoMeses,
}: {
  categorias: Categoria[];
  campanhas: CampanhaPublica[];
  // "2026-01-01"
  dataDesde: string;
  avisoMeses: number;
}) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [novaCategoria, setNovaCategoria] = useState("");
  const [desde, setDesde] = useState(dataDesde);
  const [aviso, setAviso] = useState(String(avisoMeses));

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

  const salvarConfig = (e: FormEvent) => {
    e.preventDefault();
    gravar(
      () => salvarConfiguracoes({ dadosDesde: desde, avisoMeses: Number(aviso) as 2 | 3 | 6 }),
      () => toast("Configurações salvas."),
    );
  };

  return (
    <div className="split">
      <aside>
        <nav className="glist menu-list" aria-label="Nesta página">
          <a href="#categorias"><span>Categorias de despesa<small>Adicionar ou renomear</small></span></a>
          <Link href="/admin/campanhas"><span>Campanhas<small>Criar, editar, encerrar</small></span></Link>
          <a href="#config"><span>Configurações<small>Início dos dados e avisos</small></span></a>
          <Link href="/"><span>Ver o site público<small>Como os membros enxergam</small></span></Link>
        </nav>
      </aside>
      <div>
        <section className="sec tile" id="categorias">
          <h2>Categorias de despesa</h2>
          <div className="glist">
            {categorias.map((c) => (
              <div className="arow" key={c.id} style={{ gridTemplateColumns: "1fr auto" }}>
                <span className="t1">{c.nome}</span>
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
              <label htmlFor="s-i">Dados registrados desde</label>
              <input id="s-i" type="date" required value={desde} onChange={(e) => setDesde(e.target.value)} />
              <span className="hint">Aparece no site público, para ser transparente sobre o que existe.</span>
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
      </div>
    </div>
  );
}
